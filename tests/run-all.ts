import "dotenv/config";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { assertIsolatedDatabase } from "./isolation.js";

const requireFromProject = createRequire(resolve("package.json"));
const prismaCli = requireFromProject.resolve("prisma/build/index.js");
const liveJudge = process.argv.includes("--judge0");
const suites = liveJudge ? ["judge0-live"] : ["phase3", "phase4", "phase5", "remediation", "admin-rounds", "judge0-protocol"];

function runChild(args: string[], env: NodeJS.ProcessEnv, quiet = false): Promise<void> {
  return new Promise((complete, reject) => {
    const child = spawn(process.execPath, args, { env, stdio: quiet ? "ignore" : "inherit" });
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (code === 0 && !signal) complete();
      else reject(new Error(signal ? `Terminated by ${signal}` : `Exited with status ${code}`));
    });
  });
}

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Tests cannot run in production mode.");
  if (liveJudge) {
    process.env.NODE_ENV = "test";
    const { Judge0Adapter, JudgeUnavailable } = await import("../src/judge/judge0.adapter.js");
    try { await new Judge0Adapter().getLanguages(); }
    catch (error) {
      console.error("Judge0 live integration unavailable (" + (error instanceof JudgeUnavailable ? error.stage : "configuration") + ").");
      process.exitCode = 1;
      return;
    }
  }
  const base = new URL(process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? "");
  let failed = false;
  for (const suite of suites) {
    const schema = `cgp_test_${randomBytes(12).toString("hex")}`;
    const url = new URL(base);
    url.searchParams.set("schema", schema);
    url.searchParams.set("connect_timeout", "5");
    assertIsolatedDatabase(url.href);
    const env = {
      ...process.env,
      DATABASE_URL: url.href,
      NODE_ENV: "test",
      ALLOW_DEV_FALLBACK: "false",
      JUDGE_PROVIDER: liveJudge ? "judge0" : "local",
      CONTEST_ID: "cgp_2026",
      CONTEST_STATUS: "LIVE"
    };
    const db = new PrismaClient({ datasourceUrl: url.href });
    let created = false;
    let step = "Connect to PostgreSQL and create isolated schema";
    try {
      await db.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
      created = true;
      step = "Apply migrations in the isolated schema";
      await runChild([prismaCli, "migrate", "deploy"], env, true);
      step = "Seed the isolated test schema";
      await runChild(["--import", "tsx", "prisma/seed.ts"], env);
      step = `Run ${suite}`;
      await runChild(["--import", "tsx", `tests/${suite}.test.ts`], env);
      console.log(`PASS ${suite}`);
    } catch {
      failed = true;
      console.error(`FAIL ${suite}: ${step}. Check local PostgreSQL availability, migration permissions, and suite output above.`);
    } finally {
      try {
        if (created) await db.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
      } catch {
        failed = true;
        console.error(`Failed to clean up disposable schema ${schema}.`);
      } finally {
        await db.$disconnect();
      }
    }
  }
  if (failed) process.exitCode = 1;
}

void main().catch(() => {
  console.error("Backend tests could not start. Configure a local PostgreSQL URL, install dependencies, and use a non-production environment.");
  process.exitCode = 1;
});
