import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PistonAdapter } from "../src/judge/piston.adapter.js";
import { env } from "../src/config/env.js";
import { harness } from "./judge-http.js";
import { assertIsolatedDatabase } from "./isolation.js";
import { programs } from "./piston-programs.js";

async function main() {
  assertIsolatedDatabase();
  assert.equal(env.JUDGE_PROVIDER, "piston");
  const adapter = new PistonAdapter();
  const runtimes = await adapter.getRuntimes();
  const app = await harness();
  try {
    const candidate = await app.login("CGP2026");
    const other = await app.login("CGP_016");
    const problem = await app.fixture();
    await app.checkin(candidate);
    const languageFailures: Error[] = [];
    for (const [language, source] of Object.entries(programs)) {
      const runtime = runtimes[language as keyof typeof runtimes];
      console.log(`Live Piston checking ${language} ${runtime.version}`);
      try {
        const base = { problemId: problem.slug, language, sourceCode: source.correct };
        const sample = await app.request("/code/run", 200, candidate, base);
        assert.equal(sample.status, "ACCEPTED", language + " sample");
        assert.equal(sample.cases.length, 1);
        const custom = await app.request("/code/run", 200, candidate, { ...base, customInput: "11" });
        assert.equal(custom.status, "ACCEPTED");
        assert.equal(custom.stdout.trim(), "11");
        const accepted = await app.request("/code/submit", 200, candidate, base);
        assert.equal(accepted.verdict, "ACCEPTED", language + " Submit");
        assert.equal(accepted.passedTests, 2);
        assert.equal(accepted.score, 80);
        for (const field of ["stdout", "stderr", "expectedOutput", "cases"]) assert.ok(!Object.hasOwn(accepted, field));
        const stored = await app.prisma.submission.findUniqueOrThrow({ where: { id: accepted.id }, include: { user: true } });
        assert.equal(stored.user.driverId, "CGP2026");
        assert.equal(stored.score, 80);
        await app.request("/submissions/" + accepted.id, 403, other);

        const negatives = [
          [source.wrong, "WRONG_ANSWER"], [source.runtime, "RUNTIME_ERROR"],
          [source.timeout, "TIME_LIMIT_EXCEEDED"], [source.output, "RUNTIME_ERROR"]
        ];
        if ("compilation" in source && source.compilation) negatives.push([source.compilation, "COMPILATION_ERROR"]);
        for (const [sourceCode, verdict] of negatives) {
          const run = await app.request("/code/run", 200, candidate, { ...base, sourceCode });
          assert.equal(run.status, verdict, language + " Run " + verdict);
          assert.ok(Buffer.byteLength(run.stdout) + Buffer.byteLength(run.stderr) <= env.MAX_OUTPUT_BYTES);
          const rejected = await app.request("/code/submit", 200, candidate, { ...base, sourceCode });
          assert.equal(rejected.verdict, verdict, language + " Submit " + verdict);
          assert.equal(rejected.score, 0);
        }

        const memoryRequest = { language, stdin: "2", memoryLimitMb: 128, timeLimitMs: 3000 };
        const baseline = await adapter.execute({ ...memoryRequest, sourceCode: source.correct });
        assert.equal(baseline.status, "ACCEPTED", `${language} memory baseline (${baseline.runtimeMs} ms CPU, ${baseline.memoryKb} KiB)`);
        assert.equal(baseline.stdout.trim(), "2");
        const excessive = await adapter.execute({ ...memoryRequest, sourceCode: source.memory });
        assert.ok(["MEMORY_LIMIT_EXCEEDED", "RUNTIME_ERROR"].includes(excessive.status),
          `${language} memory overrun returned ${excessive.status} (${excessive.runtimeMs} ms CPU, ${excessive.memoryKb} KiB)`);
        assert.equal(excessive.stdout.trim(), "", language + " must stop before printing the oversized allocation");
        console.log(`Live Piston verified ${language} ${runtime.version} including limit outcomes (${excessive.status}).`);
      } catch (error) {
        const failure = new Error(`${language} ${runtime.version} live check failed`, { cause: error });
        console.error(failure);
        languageFailures.push(failure);
      }
    }
    if (languageFailures.length) throw new AggregateError(languageFailures, "Live Piston language checks failed.");

    const file = "cgp-live-" + randomUUID() + ".txt";
    const smoke = { language: "python", stdin: "", memoryLimitMb: 128, timeLimitMs: 2000 };
    const write = await adapter.execute({ ...smoke, sourceCode: "open(" + JSON.stringify(file) + ', "w").write("fixture")' });
    assert.equal(write.status, "ACCEPTED");
    const read = await adapter.execute({ ...smoke, sourceCode: "import os; print(os.path.exists(" + JSON.stringify(file) + "))" });
    assert.equal(read.status, "ACCEPTED");
    assert.equal(read.stdout.trim(), "False");
    const address = process.env.PISTON_TEST_NETWORK_CANARY;
    if (address) {
      const target = new URL(address);
      assert.equal(target.protocol, "http:");
      assert.match(target.hostname, /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/);
      assert.match(target.hostname, /^\d+\.\d+\.\d+\.\d+$/);
      assert.ok(target.port && target.pathname === "/" && !target.search && !target.hash && !target.username && !target.password);
      const result = await adapter.execute({ ...smoke, sourceCode: [
        "import socket",
        "try:",
        "    with socket.create_connection((" + JSON.stringify(target.hostname) + ", " + Number(target.port) + "), timeout=0.5):",
        "        print('reachable')",
        "except OSError:",
        "    print('blocked')"
      ].join("\n") });
      assert.equal(result.status, "ACCEPTED");
      assert.equal(result.stdout.trim(), "blocked");
    } else {
      console.log("Private network isolation check skipped; no operator-controlled canary was configured.");
    }
    assert.equal((await app.request("/contest/progress", 200, candidate)).currentScore, 80);
    const leaderboard = await app.request("/leaderboard", 200, candidate);
    assert.equal(leaderboard.rows.find((row: { driverId: string }) => row.driverId === "CGP2026").totalScore, 80);
    console.log("Live Piston passed " + app.checkCount() + " HTTP checks plus resource and PostgreSQL assertions.");
  } finally {
    await app.dispose();
  }
}

void main().catch(error => { console.error(error); process.exitCode = 1; });
