import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { assertIsolatedDatabase } from "./isolation.js";
import { close, harness, listen } from "./judge-http.js";
import { programs } from "./piston-programs.js";

async function main() {
  assertIsolatedDatabase();
  const runtimes = [
    { language: "python", version: "3.12.1", aliases: ["py"] },
    { language: "java", version: "15.0.2", aliases: [] },
    { language: "c++", version: "10.2.0", aliases: ["g++"] },
    { language: "javascript", version: "20.11.1", aliases: ["node"] }
  ];
  const token = randomUUID();
  const stage = { stdout: "", stderr: "", status: null, code: 0, signal: null, cpu_time: 4.2, wall_time: 10, memory: 8192000 };
  const javaDiagnostic = "Main.java.java:1: error: not a statement\n" +
    "public class Main { invalid }\n                   ^\n1 error\nerror: compilation failed\n";
  let mode = "success";
  let catalogReads = 0;
  let inputs: { language: string; version: string; stdin: string; [key: string]: unknown }[] = [];
  let pending: (() => void) | undefined;
  let release: (() => void) | undefined;
  const remote = createServer(async (req, res) => {
    function send(body: unknown, status = 200) {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    }
    if (req.headers.authorization !== "Bearer " + token) return send({}, 401);
    if (req.url === "/api/v2/runtimes" && req.method === "GET") {
      catalogReads++;
      if (mode === "ambiguous") return send([...runtimes, { ...runtimes[0], version: "3.11.5" }]);
      return send(runtimes);
    }
    if (req.url !== "/api/v2/execute" || req.method !== "POST") return send({}, 404);
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const input = JSON.parse(raw);
    inputs.push(input);
    if (mode === "busy") await new Promise<void>(resolve => { release = resolve; pending?.(); });
    if (mode === "network") return req.socket.destroy();
    if (mode === "unavailable" && input.stdin === "7") return send({ message: "private worker diagnostic" }, 500);
    const envelope = { language: input.language, version: input.version };
    if (mode === "compile") return send({ ...envelope, compile: { ...stage, code: 1, status: "RE", stderr: "syntax error" } });
    const compile = (input.language === "c++" && mode !== "cpp-missing-compile") ||
      mode === "java-split" || mode === "unexpected-compile" ? stage : undefined;
    const run = { ...stage, stdout: mode === "wrong" ? "99" : input.stdin };
    if (mode === "java-compile") Object.assign(run, { status: "RE", code: 1, stdout: "", stderr: javaDiagnostic });
    if (mode === "java-runtime") Object.assign(run, {
      status: "RE", code: 1, stdout: "", stderr: 'Exception in thread "main" java.lang.IllegalStateException: error: compilation failed\n'
    });
    if (mode === "java-timeout" || mode === "java-timeout-output") Object.assign(run, {
      stdout: mode === "java-timeout-output" ? "x".repeat(65537) : "2\n",
      status: "TO", code: null, signal: "SIGKILL", cpu_time: 3147, wall_time: 1806, message: "Time limit exceeded"
    });
    if (mode === "timeout") Object.assign(run, { status: "TO", code: null, signal: "SIGKILL" });
    if (mode === "runtime") Object.assign(run, { status: "SG", code: null, signal: "SIGSEGV" });
    if (mode === "memory") Object.assign(run, { status: "SG", code: null, signal: "SIGKILL", memory: input.run_memory_limit });
    if (mode === "memory-rounded" || mode === "exit-137") Object.assign(run, {
      status: "RE", code: 137,
      memory: mode === "memory-rounded" ? Math.floor(input.run_memory_limit / 1000) * 1000 - 1000 : stage.memory
    });
    if (mode === "output") Object.assign(run, { status: "OL", code: null, signal: "SIGKILL" });
    if (mode === "oversized") run.stdout = "x".repeat(65537);
    if (mode === "bad-result") Object.assign(run, { memory: null });
    if (mode === "worker") Object.assign(run, { status: "XX", stderr: "private worker diagnostic" });
    send({ ...envelope, compile, run });
  });
  process.env.JUDGE_PROVIDER = "piston";
  process.env.PISTON_API_URL = await listen(remote);
  process.env.PISTON_API_TOKEN = token;
  process.env.PISTON_COMPILE_MEMORY_MB = "512";
  process.env.PISTON_MAX_RUN_MEMORY_MB = "1024";
  process.env.PISTON_JAVA_SOURCE_CPU_ALLOWANCE_MS = "0";
  process.env.MAX_OUTPUT_BYTES = "65536";
  process.env.JUDGE_MAX_CONCURRENT_REQUESTS = "1";
  for (const language of Object.keys(programs)) process.env["PISTON_" + language.toUpperCase() + "_VERSION"] = "";
  const { PistonAdapter } = await import("../src/judge/piston.adapter.js");
  const { env } = await import("../src/config/env.js");
  const app = await harness();
  try {
    mode = "ambiguous";
    await assert.rejects(() => new PistonAdapter().getRuntimes(), { stage: "piston-runtime-python" });
    mode = "success";
    const candidate = await app.login("CGP2026");
    const other = await app.login("CGP_016");
    const problem = await app.fixture();
    const base = { problemId: problem.slug, language: "python", sourceCode: programs.python.correct };
    await app.request("/code/run", 403, candidate, base);
    await app.checkin(candidate);
    await app.checkin(other);
    for (const [index, [language, source]] of Object.entries(programs).entries()) {
      inputs = [];
      const payload = { ...base, language, sourceCode: source.correct };
      const run = await app.request("/code/run", 200, candidate, payload);
      assert.equal(run.status, "ACCEPTED");
      assert.deepEqual(inputs.map(input => input.stdin), ["2"]);
      assert.equal(run.cases.length, 1);
      const custom = await app.request("/code/run", 200, candidate, { ...payload, customInput: "9" });
      assert.equal(custom.stdout, "9");
      const submit = await app.request("/code/submit", 200, candidate, payload);
      assert.equal(submit.verdict, "ACCEPTED");
      assert.equal(submit.score, 80);
      assert.deepEqual(inputs.map(input => input.stdin), ["2", "9", "2", "7"]);
      for (const input of inputs) {
        assert.equal(input.language, runtimes[index].language);
        assert.equal(input.version, runtimes[index].version);
        assert.deepEqual(input.files, [{ name: ["main.py", "Main.java", "main.cpp", "main.js"][index], content: source.correct }]);
        assert.equal(input.run_cpu_time, 1000);
        assert.equal(input.run_timeout, 2000);
        assert.equal(input.run_memory_limit, 512 * 1024 * 1024);
        assert.equal(input.compile_memory_limit, 512 * 1024 * 1024);
        assert.equal(input.compile_cpu_time, 10000);
        assert.equal(input.compile_timeout, 10000);
        assert.ok(!Object.hasOwn(input, "expectedOutput"));
      }
      for (const field of ["stdout", "stderr", "cases", "expectedOutput"]) assert.ok(!Object.hasOwn(submit, field));
      const row = await app.prisma.submission.findUniqueOrThrow({ where: { id: submit.id }, include: { user: true } });
      assert.equal(row.user.driverId, "CGP2026");
      assert.equal(row.score, 80);
      await app.request("/submissions/" + submit.id, 403, other);
    }
    assert.equal(catalogReads, 2);
    for (const [scenario, verdict] of [
      ["wrong", "WRONG_ANSWER"], ["timeout", "TIME_LIMIT_EXCEEDED"], ["runtime", "RUNTIME_ERROR"],
      ["memory", "MEMORY_LIMIT_EXCEEDED"], ["memory-rounded", "MEMORY_LIMIT_EXCEEDED"], ["exit-137", "RUNTIME_ERROR"],
      ["output", "RUNTIME_ERROR"], ["oversized", "RUNTIME_ERROR"]
    ]) {
      mode = scenario;
      const run = await app.request("/code/run", 200, candidate, base);
      assert.equal(run.status, verdict);
      if (scenario === "output" || scenario === "oversized") assert.equal(run.stdout, "");
    }
    const java = { ...base, language: "java", sourceCode: programs.java.correct };
    const cpp = { ...base, language: "cpp", sourceCode: programs.cpp.correct };
    for (const language of ["java", "cpp"]) {
      mode = "compile";
      const failed = await app.request("/code/run", 200, candidate, { ...base, language });
      assert.equal(failed.status, "COMPILATION_ERROR");
      assert.equal(failed.stdout, "");
      assert.equal(failed.stderr, "syntax error");
    }
    mode = "java-compile";
    const sourceError = await app.request("/code/run", 200, candidate, java);
    assert.equal(sourceError.status, "COMPILATION_ERROR");
    assert.equal(sourceError.stdout, "");
    assert.equal(sourceError.stderr, javaDiagnostic);
    mode = "java-runtime";
    assert.equal((await app.request("/code/run", 200, candidate, java)).status, "RUNTIME_ERROR");
    mode = "java-timeout";
    const timeout = await app.request("/code/run", 200, candidate, java);
    assert.equal(timeout.status, "TIME_LIMIT_EXCEEDED");
    assert.equal(timeout.stdout, "2\n");
    mode = "java-timeout-output";
    const oversizedTimeout = await app.request("/code/run", 200, candidate, java);
    assert.equal(oversizedTimeout.status, "TIME_LIMIT_EXCEEDED");
    assert.equal(oversizedTimeout.stdout, "");
    mode = "java-split";
    assert.equal((await app.request("/code/run", 200, candidate, java)).status, "ACCEPTED");
    mode = "cpp-missing-compile";
    await app.request("/code/run", 503, candidate, cpp);
    mode = "unexpected-compile";
    await app.request("/code/run", 503, candidate, base);

    const request = { language: "java", sourceCode: programs.java.correct, stdin: "2", timeLimitMs: 3000, memoryLimitMb: 128 };
    env.PISTON_JAVA_VERSION = "15.0.2";
    env.PISTON_JAVA_SOURCE_CPU_ALLOWANCE_MS = 4000;
    try {
      const adapter = new PistonAdapter();
      mode = "success";
      assert.equal((await adapter.execute(request)).status, "ACCEPTED");
      assert.equal(inputs.at(-1)?.run_cpu_time, 7000);
      assert.equal(inputs.at(-1)?.run_timeout, 14000);
      assert.equal(inputs.at(-1)?.run_memory_limit, 134217728);
      assert.equal(inputs.at(-1)?.compile_cpu_time, 10000);
      await adapter.execute({ ...request, timeLimitMs: 60000 });
      assert.equal(inputs.at(-1)?.run_cpu_time, 60000);
      assert.equal(inputs.at(-1)?.run_timeout, 120000);
      mode = "java-split";
      await assert.rejects(() => adapter.execute(request), { stage: "piston-java-source-policy" });
    } finally {
      env.PISTON_JAVA_VERSION = "";
      env.PISTON_JAVA_SOURCE_CPU_ALLOWANCE_MS = 0;
    }
    for (const scenario of ["unavailable", "worker", "bad-result", "network"]) {
      mode = scenario;
      const before = inputs.length;
      const response = await app.request("/code/submit", 503, candidate, base);
      assert.equal(response.error.code, "JUDGE_UNAVAILABLE");
      assert.doesNotMatch(JSON.stringify(response), /private worker diagnostic/);
      assert.equal(inputs.length - before, scenario === "unavailable" ? 2 : 1);
    }
    // A replacement worker can advertise a new version when no exact version is configured.
    mode = "success";
    const readsBeforeReconnect = catalogReads;
    runtimes[0].version = "3.12.2";
    const recovered = await app.request("/code/run", 200, candidate, base);
    assert.equal(recovered.status, "ACCEPTED");
    assert.equal(catalogReads, readsBeforeReconnect + 1);
    assert.equal(inputs.at(-1)?.version, "3.12.2");
    const scores = await app.prisma.submission.findMany({ where: { problemId: problem.id }, orderBy: { createdAt: "asc" } });
    assert.equal(scores.length, 8);
    assert.ok(scores.slice(4).every(row => row.score === 0 && row.status === "FAILED" && row.verdict === "INTERNAL_ERROR"));
    const progress = await app.request("/contest/progress", 200, candidate);
    assert.equal(progress.currentScore, 80);
    const standings = await app.request("/leaderboard", 200, candidate);
    assert.equal(standings.rows.find((row: { driverId: string }) => row.driverId === "CGP2026").totalScore, 80);
    mode = "busy";
    const started = new Promise<void>(resolve => { pending = resolve; });
    const queued = app.request("/code/run", 200, candidate, base);
    try {
      await started;
      await app.request("/code/run", 429, candidate, base);
      const busy = await app.request("/code/run", 503, other, base);
      assert.equal(busy.error.code, "JUDGE_BUSY");
    } finally {
      release?.();
      await queued;
    }
    await app.request("/violations", 200, candidate,
      { type: "FULLSCREEN_EXIT", clientEventId: randomUUID(), observedAt: new Date().toISOString() });
    await app.request("/code/submit", 403, candidate, base);

    const judge = new PistonAdapter();
    const beforeOversizedMemory = inputs.length;
    await assert.rejects(() => judge.execute({ ...request, memoryLimitMb: 1025 }), { stage: "piston-execution-limits" });
    assert.equal(inputs.length, beforeOversizedMemory);

    mode = "busy";
    const controller = new AbortController();
    const executing = new Promise<void>(resolve => { pending = resolve; });
    const rejected = assert.rejects(() => judge.execute({ ...request, signal: controller.signal }), { stage: "piston-deadline" });
    await executing;
    try {
      controller.abort();
      await rejected;
      const requestCount = inputs.length;
      await assert.rejects(() => judge.execute(request), { stage: "piston-execution-cooldown" });
      assert.equal(inputs.length, requestCount);
    } finally {
      release?.();
    }
    console.log("Piston protocol mock passed " + app.checkCount() + " HTTP checks plus persistence and leaderboard assertions.");
  } finally {
    await app.dispose();
    remote.closeAllConnections();
    await close(remote);
  }
}

void main().catch(error => { console.error(error); process.exitCode = 1; });
