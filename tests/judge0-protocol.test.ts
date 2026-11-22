import assert from "node:assert/strict";
import { createServer } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import { randomUUID } from "node:crypto";
import { close, harness, listen } from "./judge-http.js";
import { assertIsolatedDatabase } from "./isolation.js";

async function main() {
  assertIsolatedDatabase();
  const hosted = process.env.CGP_JUDGE0_PROTOCOL_AUTH_MODE === "rapidapi";
  const gateway = "https://judge0-ce.p.rapidapi.com";
  const nativeHeader = "X-CGP-Judge-Auth";
  const key = randomUUID().replace(/-/g, "");
  const languages = [
    { id: 151, name: "Python (3.8.1)" },
    { id: 152, name: "Java (OpenJDK 13.0.1)" },
    { id: 153, name: "C++ (GCC 9.2.0)" },
    { id: 154, name: "JavaScript (Node.js 12.14.0)" }
  ];
  const token = randomUUID();
  const modes = { status: 3, pending: false, internal: false, malformed: false, slow: false, redirects: false, wrongVersion: false };
  let submissions = 0;
  let polls = 0;
  let requests = 0;
  let postError = 0;
  let pollError = 0;
  let advertiseExhaustion = false;
  let mockResponse = false;
  let sent: Record<string, unknown> = {};
  let currentInput = "";
  let postSignal: (() => void) | undefined;
  const remote = createServer(async (req, res) => {
    requests++;
    const send = (body: unknown, status = 200, headers: Record<string, string> = {}) => {
      res.writeHead(status, { "Content-Type": "application/json", ...headers });
      res.end(JSON.stringify(body));
    };
    const authenticated = hosted ?
      req.headers["x-rapidapi-key"] === key && req.headers["x-rapidapi-host"] === new URL(gateway).host &&
        req.headers[nativeHeader.toLowerCase()] === undefined && req.headers["x-auth-token"] === undefined :
      req.headers[nativeHeader.toLowerCase()] === key && req.headers["x-rapidapi-key"] === undefined &&
        req.headers["x-rapidapi-host"] === undefined;
    if (!authenticated) return send({}, 401);
    if (req.url === "/about") return send({ version: modes.wrongVersion ? "1.13.0" : hosted ? "1.14.0" : "1.13.1" });
    if (req.url === "/languages") return send(languages);
    if (req.method === "POST" && req.url?.startsWith("/submissions?")) {
      assert.equal(new URL(req.url, "http://localhost").searchParams.get("wait"), "false");
      let raw = "";
      for await (const chunk of req) raw += chunk;
      sent = JSON.parse(raw);
      submissions++;
      polls = 0;
      postSignal?.();
      currentInput = Buffer.from(String(sent.stdin), "base64").toString("utf8");
      if (modes.redirects) { res.writeHead(307, { Location: "/about" }); return res.end(); }
      if (postError) return send({ message: "private gateway diagnostic" }, postError, { "Retry-After": "1" });
      return send({ token }, 201, advertiseExhaustion ?
        { "x-ratelimit-submissions-remaining": "0", "x-ratelimit-submissions-reset": "1" } : {});
    }
    if (req.url?.startsWith("/submissions/" + token)) {
      polls++;
      if (pollError) return send({ message: "private gateway diagnostic" }, pollError, { "Retry-After": "1" });
      if (modes.slow) return;
      if (modes.pending || polls === 1) return send({ status: { id: 1 } });
      if (modes.internal) return send({ status: { id: 13 }, message: "private worker diagnostic" });
      if (modes.malformed) return send({ status: { id: 3 } });
      const id = modes.status;
      return send({
        status: { id }, stdout: id === 3 ? Buffer.from(currentInput + "\n").toString("base64") + "\n" : null,
        stderr: id === 11 ? "ZXJyb3I=\n" : null, compile_output: id === 6 ? "c3ludGF4\n" : null,
        time: "0.017", memory: id === 11 ? sent.memory_limit : 4096
      }, 200, mockResponse ? { "x-rapidapi-mock-response": "true" } : {});
    }
    send({}, 404);
  });
  process.env.JUDGE_PROVIDER = "judge0";
  const fixtureUrl = await listen(remote);
  const originalFetch = globalThis.fetch;
  if (hosted) {
    // Keep the production endpoint allowlist intact. Only this fixture process reroutes the I/O.
    globalThis.fetch = async (input, init) => {
      if (typeof input === "string" && input.startsWith(gateway + "/")) {
        return originalFetch(fixtureUrl + input.slice(gateway.length), init);
      }
      return originalFetch(input, init);
    };
  }
  process.env.JUDGE0_AUTH_MODE = hosted ? "rapidapi" : "self-hosted";
  process.env.JUDGE0_API_URL = hosted ? gateway : fixtureUrl;
  process.env.JUDGE0_API_KEY = hosted ? "native-fixture-token-must-not-be-sent" : key;
  process.env.JUDGE0_AUTH_HEADER = nativeHeader;
  process.env.JUDGE0_RAPIDAPI_HOST = new URL(gateway).host;
  process.env.JUDGE0_RAPIDAPI_KEY = hosted ? key : "rapid-fixture-token-must-not-be-sent";
  process.env.JUDGE0_LANGUAGE_PYTHON = languages[0].name;
  process.env.JUDGE0_LANGUAGE_JAVA = languages[1].name;
  process.env.JUDGE0_LANGUAGE_CPP = languages[2].name;
  process.env.JUDGE0_LANGUAGE_JAVASCRIPT = languages[3].name;
  process.env.JUDGE0_HTTP_TIMEOUT_MS = "500";
  process.env.JUDGE0_JOB_TIMEOUT_MS = "850";
  process.env.JUDGE0_POLL_INTERVAL_MS = "50";
  process.env.JUDGE_MAX_CONCURRENT_REQUESTS = "1";
  const { Judge0Adapter } = await import("../src/judge/judge0.adapter.js");
  const app = await harness();
  try {
    if (hosted) {
      const { env } = await import("../src/config/env.js");
      try {
        for (const invalidUrl of [fixtureUrl, "http://judge0-ce.p.rapidapi.com", gateway + ":444", gateway + "/other"]) {
          env.JUDGE0_API_URL = invalidUrl;
          assert.throws(() => new Judge0Adapter(), { stage: "configuration" });
        }
        env.JUDGE0_API_URL = gateway;
        env.JUDGE0_RAPIDAPI_HOST = "example.test";
        assert.throws(() => new Judge0Adapter(), { stage: "configuration" });
        env.JUDGE0_RAPIDAPI_HOST = new URL(gateway).host;
        env.JUDGE0_RAPIDAPI_KEY = "";
        assert.throws(() => new Judge0Adapter(), { stage: "configuration" });
        assert.equal(requests, 0);
      } finally {
        env.JUDGE0_API_URL = gateway;
        env.JUDGE0_RAPIDAPI_HOST = new URL(gateway).host;
        env.JUDGE0_RAPIDAPI_KEY = key;
      }
    }
    modes.wrongVersion = true;
    await assert.rejects(() => new Judge0Adapter().getLanguages(), { stage: "unsupported-version" });
    modes.wrongVersion = false;
    const [first, second] = await Promise.all([app.login("CGP2026"), app.login("CGP_016")]);
    await app.checkin(first);
    await app.checkin(second);
    const problem = await app.fixture();
    const base = { problemId: problem.slug, language: "javascript", sourceCode: "throw new Error('never executed on this host');" };
    const run = await app.request("/code/run", 200, first, { ...base, customInput: "2" });
    assert.equal(run.stdout.trim(), "2");
    assert.equal(run.status, "ACCEPTED");
    assert.equal(sent.language_id, 154);
    assert.equal(sent.enable_network, false);
    assert.equal(sent.max_processes_and_or_threads, 32);
    assert.equal(sent.cpu_time_limit, 1);
    assert.equal(sent.enable_per_process_and_thread_memory_limit, false);
    for (const field of ["expected_output", "additional_files", "callback_url", "compiler_options", "command_line_arguments"]) {
      assert.equal(Object.hasOwn(sent, field), false);
    }
    assert.equal(await app.prisma.submission.count({ where: { problemId: problem.id } }), 0);
    const accepted = await app.request("/code/submit", 200, first, base);
    assert.equal(accepted.verdict, "ACCEPTED");
    assert.equal(accepted.score, 80);
    assert.equal(Object.hasOwn(accepted, "stdout"), false);
    await app.request("/submissions/" + accepted.id, 403, second);

    if (hosted) {
      const sources = {
        python: "print(input())",
        java: "public class Main { public static void main(String[] args) { System.out.println(new java.util.Scanner(System.in).nextInt()); } }",
        cpp: "#include <iostream>\nint main() { int n; std::cin >> n; std::cout << n; }",
      };
      for (const [index, [language, sourceCode]] of Object.entries(sources).entries()) {
        const input = { ...base, language, sourceCode };
        const run = await app.request("/code/run", 200, first, { ...input, customInput: "2" });
        assert.equal(run.status, "ACCEPTED");
        assert.equal(sent.language_id, languages[index].id);
        assert.equal(Buffer.from(String(sent.source_code), "base64").toString("utf8"), sourceCode);
        const result = await app.request("/code/submit", 200, first, input);
        assert.equal(result.verdict, "ACCEPTED");
        assert.equal(result.score, 80);
        assert.equal(Object.hasOwn(result, "cases"), false);
        const stored = await app.prisma.submission.findUniqueOrThrow({ where: { id: result.id }, include: { user: true } });
        assert.equal(stored.user.driverId, "CGP2026");
        assert.equal(stored.score, 80);
      }
      assert.equal((await app.request("/contest/progress", 200, first)).currentScore, 80);
    }

    for (const [id, verdict] of [[4, "WRONG_ANSWER"], [5, "TIME_LIMIT_EXCEEDED"],
      [6, "COMPILATION_ERROR"], [7, "RUNTIME_ERROR"], [8, "RUNTIME_ERROR"]] as const) {
      modes.status = id;
      const outcome = await app.request("/code/run", 200, first, { ...base, customInput: "2" });
      assert.equal(outcome.status, verdict);
      if (id === 6) assert.equal(outcome.stderr, "syntax");
      if (id === 8) assert.equal(outcome.stderr, "Output limit exceeded.");
    }
    modes.status = 11;
    // Even an empty expected output cannot make a failed worker result score points.
    await app.prisma.testCase.updateMany({ where: { problemId: problem.id }, data: { expectedOutput: "" } });
    const memory = await app.request("/code/submit", 200, first, base);
    assert.equal(memory.verdict, "MEMORY_LIMIT_EXCEEDED");
    assert.equal(memory.score, 0);
    modes.status = 3;
    modes.internal = true;
    const unavailable = await app.request("/code/submit", 503, first, base);
    assert.equal(unavailable.error.code, "JUDGE_UNAVAILABLE");
    assert.doesNotMatch(JSON.stringify(unavailable), /private worker diagnostic|never executed/);
    const failed = await app.prisma.submission.findFirstOrThrow({ where: { problemId: problem.id, status: "FAILED" } });
    assert.equal(failed.verdict, "INTERNAL_ERROR");
    assert.equal(failed.score, 0);
    modes.internal = false;
    modes.malformed = true;
    await app.request("/code/submit", 503, first, base);
    modes.malformed = false;
    modes.redirects = true;
    await app.request("/code/run", 503, first, { ...base, customInput: "3" });
    modes.redirects = false;
    modes.slow = true;
    await app.request("/code/run", 503, first, { ...base, customInput: "3" });
    modes.slow = false;
    modes.pending = true;
    const started = new Promise<void>(resolve => { postSignal = resolve; });
    const blocked = app.request("/code/run", 503, first, { ...base, customInput: "4" });
    await started;
    assert.equal((await app.request("/code/run", 429, first, base)).error.code, "JUDGE_BUSY");
    assert.equal((await app.request("/code/run", 503, second, base)).error.code, "JUDGE_BUSY");
    await blocked;
    modes.pending = false;
    postSignal = undefined;
    assert.equal((await app.request("/code/run", 200, second, { ...base, customInput: "6" })).stdout.trim(), "6");
    const before = submissions;
    await app.request("/code/run", 400, first, { ...base, sourceCode: "x".repeat(65537) });
    await app.request("/code/run", 400, first, { ...base, customInput: "x".repeat(65537) });
    await app.request("/code/run", 400, first, { ...base, language: "ruby" });
    assert.equal(submissions, before);
    if (hosted) {
      const beforeThrottle = submissions;
      postError = 429;
      const throttled = await app.request("/code/submit", 503, first, base);
      assert.equal(throttled.error.code, "JUDGE_UNAVAILABLE");
      assert.doesNotMatch(JSON.stringify(throttled), /private gateway diagnostic/);
      assert.equal(submissions, beforeThrottle + 1);
      const afterThrottle = requests;
      postError = 0;
      await app.request("/code/run", 503, first, { ...base, customInput: "2" });
      assert.equal(requests, afterThrottle);
      await delay(1100);

      pollError = 402;
      const beforeQuota = submissions;
      await app.request("/code/submit", 503, first, base);
      assert.equal(submissions, beforeQuota + 1);
      assert.equal(polls, 1);
      await delay(1100);
      pollError = 0;

      mockResponse = true;
      await app.request("/code/submit", 503, first, base);
      mockResponse = false;
      advertiseExhaustion = true;
      assert.equal((await app.request("/code/run", 200, first, { ...base, customInput: "2" })).status, "ACCEPTED");
      const afterQuota = requests;
      await app.request("/code/run", 503, first, { ...base, customInput: "2" });
      assert.equal(requests, afterQuota);
      const failures = await app.prisma.submission.findMany({ where: { problemId: problem.id, status: "FAILED" } });
      assert.equal(failures.length, 5);
      assert.ok(failures.every(row => row.score === 0 && row.verdict === "INTERNAL_ERROR"));
      assert.equal((await app.request("/contest/progress", 200, first)).currentScore, 80);
    }
    assert.equal(await app.prisma.submission.count({ where: { problemId: problem.id, status: "QUEUED" } }), 0);
    assert.equal(await app.prisma.submission.count({ where: { problemId: problem.id, verdict: "ACCEPTED" } }), hosted ? 4 : 1);
    console.log((hosted ? "RapidAPI Judge0" : "Native Judge0") + " protocol mock passed " + app.checkCount() + " HTTP checks plus persistence and adapter assertions.");
  } finally {
    await app.dispose();
    remote.closeAllConnections();
    await close(remote);
    globalThis.fetch = originalFetch;
  }
}

void main().catch(error => { console.error(error); process.exitCode = 1; });
