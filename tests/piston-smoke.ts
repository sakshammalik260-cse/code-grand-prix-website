import assert from "node:assert/strict";
import { env } from "../src/config/env.js";
import { PistonAdapter } from "../src/judge/piston.adapter.js";
import { JudgeUnavailable } from "../src/judge/judge-transport.js";
import { programs } from "./piston-programs.js";

async function main() {
  assert.equal(env.JUDGE_PROVIDER, "piston", "Select the isolated Piston provider for this check.");
  const adapter = new PistonAdapter();
  const runtimes = await adapter.getRuntimes();
  async function run(language: keyof typeof programs) {
    const result = await adapter.execute({
      language,
      sourceCode: programs[language].correct,
      stdin: "2",
      timeLimitMs: 1000,
      memoryLimitMb: 128
    });
    assert.equal(result.status, "ACCEPTED", `${language} smoke verdict`);
    assert.equal(result.stdout.trim(), "2", `${language} smoke output`);
    console.log(`PASS ${language} ${runtimes[language].version} (${result.runtimeMs} ms CPU, ${result.memoryKb} KiB)`);
  }

  if (process.argv.includes("--pair")) {
    await Promise.all([run("python"), run("javascript")]);
    return;
  }
  for (const language of Object.keys(programs) as (keyof typeof programs)[]) await run(language);
}

void main().catch(error => {
  console.error("Piston smoke failed", error instanceof JudgeUnavailable ? error.stage : error.message);
  process.exitCode = 1;
});
