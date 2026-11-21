import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Judge0Adapter } from "../src/judge/judge0.adapter.js";
import { env } from "../src/config/env.js";
import { harness } from "./judge-http.js";
import { assertIsolatedDatabase } from "./isolation.js";

const programs = {
  python: "print(input())",
  java: "public class Main { public static void main(String[] args) { System.out.println(new java.util.Scanner(System.in).nextInt()); } }",
  cpp: "#include <iostream>\nint main() { int n; std::cin >> n; std::cout << n << '\\n'; }",
  javascript: 'console.log(require("fs").readFileSync(0, "utf8").trim())'
};

async function main() {
  assertIsolatedDatabase();
  assert.equal(env.JUDGE_PROVIDER, "judge0");
  const adapter = new Judge0Adapter();
  const languages = await adapter.getLanguages();
  const app = await harness();
  try {
    const [candidate, other, admin] = await Promise.all([
      app.login("CGP2026"), app.login("CGP_016"), app.login("ADMIN2026")
    ]);
    const problem = await app.fixture();
    await app.request("/code/submit", 401, undefined, { problemId: problem.slug, language: "python", sourceCode: programs.python });
    await app.request("/code/submit", 403, admin, { problemId: problem.slug, language: "python", sourceCode: programs.python });
    await app.request("/code/submit", 403, candidate, { problemId: problem.slug, language: "python", sourceCode: programs.python });
    await app.checkin(candidate);
    await app.checkin(other);

    for (const [language, sourceCode] of Object.entries(programs)) {
      const input = { problemId: problem.slug, language, sourceCode };
      const sample = await app.request("/code/run", 200, candidate, input);
      assert.equal(sample.status, "ACCEPTED", language + " public sample");
      assert.equal(sample.cases.length, 1);
      const custom = await app.request("/code/run", 200, candidate, { ...input, customInput: "3" });
      assert.equal(custom.status, "ACCEPTED", language + " custom verdict");
      assert.equal(custom.stdout.trim(), "3", language + " custom output");
      assert.equal(custom.expectedOutput, null);
      const submit = await app.request("/code/submit", 200, candidate, input);
      assert.equal(submit.verdict, "ACCEPTED", language + " private judging");
      assert.equal(submit.passedTests, 2);
      assert.equal(submit.score, 80);
      for (const field of ["stdout", "stderr", "expectedOutput", "cases"]) assert.equal(Object.hasOwn(submit, field), false);
      const stored = await app.prisma.submission.findUniqueOrThrow({ where: { id: submit.id }, include: { problem: true, user: true } });
      assert.equal(stored.verdict, "ACCEPTED");
      assert.equal(stored.score, 80);
      assert.equal(stored.user.driverId, "CGP2026");
      assert.equal(stored.problem.id, problem.id);
      assert.equal(stored.problem.contestId, "cgp_2026");
      assert.equal(stored.problem.roundId, "cgp_2026");
      await app.request("/submissions/" + submit.id, 200, candidate);
      await app.request("/submissions/" + submit.id, 403, other);
      const discovered = languages[language as keyof typeof programs];
      console.log("Live Judge0 verified " + language + " (" + discovered.name + ", ID " + discovered.id + ")");
    }

    const base = { problemId: problem.slug, language: "python" };
    const cases = [
      { name: "wrong answer", sourceCode: "print(0)", verdict: "WRONG_ANSWER" },
      { name: "empty output", sourceCode: "pass", verdict: "WRONG_ANSWER" },
      { name: "runtime error", sourceCode: 'raise ValueError("fixture")', verdict: "RUNTIME_ERROR" },
      { name: "CPU timeout", sourceCode: "while True: pass", verdict: "TIME_LIMIT_EXCEEDED" },
      { name: "large output", sourceCode: 'print("x" * 300000)', verdict: "RUNTIME_ERROR" }
    ];
    for (const test of cases) {
      const run = await app.request("/code/run", 200, candidate, { ...base, sourceCode: test.sourceCode });
      assert.equal(run.status, test.verdict, test.name + " run verdict");
      assert.ok(Buffer.byteLength(run.stdout) + Buffer.byteLength(run.stderr) <= env.MAX_OUTPUT_BYTES);
      const submit = await app.request("/code/submit", 200, candidate, { ...base, sourceCode: test.sourceCode });
      assert.equal(submit.verdict, test.verdict, test.name + " submit verdict");
      assert.equal(submit.score, 0);
    }
    const invalid = { problemId: problem.slug, language: "cpp", sourceCode: "int main( {" };
    assert.equal((await app.request("/code/run", 200, candidate, invalid)).status, "COMPILATION_ERROR");
    assert.equal((await app.request("/code/submit", 200, candidate, invalid)).verdict, "COMPILATION_ERROR");
    await app.request("/code/run", 400, candidate, { ...base, language: "ruby", sourceCode: "puts 1" });

    const memory = await adapter.execute({ language: "python", sourceCode: "x = bytearray(128 * 1024 * 1024); print(len(x))",
      stdin: "", memoryLimitMb: 32, timeLimitMs: 3000 });
    assert.ok(["MEMORY_LIMIT_EXCEEDED", "RUNTIME_ERROR"].includes(memory.status), "Memory-heavy program must fail under the memory budget");
    console.log("Live memory ceiling verified. Judge0 verdict: " + memory.status);

    const writeMarker = await adapter.execute({ language: "python", sourceCode: 'open("cgp-fixture.txt", "w").write("demo"); print("ok")',
      stdin: "", memoryLimitMb: 128, timeLimitMs: 2000 });
    assert.equal(writeMarker.status, "ACCEPTED");
    const readMarker = await adapter.execute({ language: "python", sourceCode: 'import os; print(os.path.exists("cgp-fixture.txt"))',
      stdin: "", memoryLimitMb: 128, timeLimitMs: 2000 });
    assert.equal(readMarker.stdout.trim(), "False", "A separate sandbox cannot read the previous job's fixture file");

    const environment = await adapter.execute({
      language: "python", stdin: "", memoryLimitMb: 128, timeLimitMs: 2000,
      sourceCode: 'import os; print(any(k in os.environ for k in ("AUTHN_TOKEN","POSTGRES_PASSWORD","REDIS_PASSWORD","DATABASE_URL","JWT_SECRET")))'
    });
    assert.equal(environment.stdout.trim(), "False", "Sandbox environment omits service credentials");

    const threads = await adapter.execute({
      language: "python", stdin: "", memoryLimitMb: 512, timeLimitMs: 3000,
      sourceCode: [
        "import threading", "threading.stack_size(65536)", "hold = threading.Event()", "count = 0",
        "for _ in range(40):", "    try:", "        threading.Thread(target=hold.wait, daemon=True).start()",
        "        count += 1", "    except RuntimeError:", "        break", "print(count)"
      ].join("\n")
    });
    assert.equal(threads.status, "ACCEPTED");
    assert.ok(Number(threads.stdout.trim()) >= 1 && Number(threads.stdout.trim()) < 40,
      "Aggregate process/thread cap rejects additional threads");

    const canary = process.env.JUDGE0_TEST_NETWORK_CANARY;
    if (canary) {
      const target = new URL("http://" + canary);
      assert.match(target.hostname, /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/);
      assert.match(target.hostname, /^\d+\.\d+\.\d+\.\d+$/);
      assert.ok(target.port && target.pathname === "/" && !target.search && !target.hash && !target.username && !target.password);
      const network = await adapter.execute({
        language: "python", stdin: "", memoryLimitMb: 128, timeLimitMs: 2500,
        sourceCode: ["import socket", "try:",
          "    with socket.create_connection((" + JSON.stringify(target.hostname) + ", " + Number(target.port) + "), 1):",
          '        print("reachable")', "except OSError:", '    print("blocked")'].join("\n")
      });
      assert.equal(network.status, "ACCEPTED");
      assert.equal(network.stdout.trim(), "blocked", "Sandbox cannot reach the verified private network canary");
    } else {
      console.log("Live network probe skipped. Set JUDGE0_TEST_NETWORK_CANARY to a private endpoint verified reachable outside Isolate.");
    }

    const [left, right] = await Promise.all([
      app.request("/code/run", 200, candidate, { ...base, sourceCode: programs.python, customInput: "10" }),
      app.request("/code/run", 200, other, { ...base, sourceCode: programs.python, customInput: "11" })
    ]);
    assert.equal(left.stdout.trim(), "10");
    assert.equal(right.stdout.trim(), "11");
    const progress = await app.request("/contest/progress", 200, candidate);
    assert.equal(progress.currentScore, 80, "Multiple accepted submissions award the problem once");
    const locked = await app.request("/violations", 200, candidate,
      { clientEventId: randomUUID(), type: "TAB_HIDDEN", observedAt: new Date().toISOString() });
    assert.equal(locked.sessionStatus, "LOCKED");
    await app.request("/code/submit", 403, candidate, { ...base, sourceCode: programs.python });
    console.log("Live Judge0 passed " + app.checkCount() + " API checks plus resource and persistence assertions.");
  } finally {
    await app.dispose();
  }
}

void main().catch(error => { console.error(error); process.exitCode = 1; });
