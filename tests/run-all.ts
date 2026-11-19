// ==============================================================================
// CODE GRAND PRIX 2026 — MASTER TEST RUNNER
// ==============================================================================

import { spawn } from "child_process";

async function runCommand(cmd: string, args: string[]): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, {
      stdio: "inherit",
      env: {
        ...process.env,
        PATH: `/usr/local/bin:${process.env.PATH}`
      }
    });

    proc.on("close", (code) => {
      resolve(code === 0);
    });
  });
}

async function main() {
  console.log("🏁 RUNNING FULL CODE GRAND PRIX TEST SUITE (PHASES 3, 4, 5)\n");

  console.log("▶️ Running Phase 3 Tests...");
  const p3 = await runCommand("npx", ["tsx", "tests/phase3.test.ts"]);

  console.log("\n▶️ Running Phase 4 Tests...");
  const p4 = await runCommand("npx", ["tsx", "tests/phase4.test.ts"]);

  console.log("\n▶️ Running Phase 5 Tests...");
  const p5 = await runCommand("npx", ["tsx", "tests/phase5.test.ts"]);

  console.log("\n▶️ Running Remediation Audit (C01–C17) Tests...");
  const pRemediation = await runCommand("npx", ["tsx", "tests/remediation.test.ts"]);

  if (p3 && p4 && p5 && pRemediation) {
    console.log("\n🎉 ALL TESTS (PHASES 3, 4, 5 & REMEDIATION) PASSED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.error("\n❌ Some tests failed.");
    process.exit(1);
  }
}

main();
