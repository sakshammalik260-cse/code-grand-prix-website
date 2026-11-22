import "dotenv/config";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";
import express from "express";
import { assertIsolatedDatabase } from "./isolation.js";

const trustedSource = [
  "const [n, limit, ...speeds] = require('node:fs').readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);",
  "let count = 0, max = 0;",
  "for (const speed of speeds.slice(0, n)) {",
  "  if (speed > limit) count++;",
  "  max = Math.max(max, speed);",
  "}",
  "console.log(count, max);"
].join("\n");

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Use a local development environment.");
  const url = new URL(process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? "");
  const schema = `cgp_test_${randomBytes(12).toString("hex")}`;
  url.searchParams.set("schema", schema);
  url.searchParams.set("connect_timeout", "5");
  assertIsolatedDatabase(url.href);
  const trustedJudge = process.env.CGP_BROWSER_TRUSTED_JUDGE === "true";
  Object.assign(process.env, {
    DATABASE_URL: url.href,
    NODE_ENV: "test",
    ALLOW_DEV_FALLBACK: "false",
    JUDGE_PROVIDER: trustedJudge ? "local" : "judge0",
    JUDGE0_AUTH_MODE: "self-hosted",
    JUDGE0_API_URL: "http://127.0.0.1:1",
    JUDGE0_API_KEY: "browser-fixture-key-for-closed-local-port",
    CONTEST_ID: "cgp_2026",
    PORT: process.env.CGP_BROWSER_API_PORT || "4010",
    COOKIE_SECURE: "false",
    COOKIE_SAME_SITE: "lax",
    ALLOWED_ORIGINS: process.env.CGP_BROWSER_ORIGIN || "http://127.0.0.1:5173"
  });
  const db = new PrismaClient({ datasourceUrl: url.href });
  let created = false;
  try {
    await db.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    created = true;
    const prismaCli = createRequire(import.meta.url).resolve("prisma/build/index.js");
    execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], { stdio: "ignore" });
    execFileSync(process.execPath, ["--import", "tsx", "prisma/seed.ts"], { stdio: "inherit" });
    const { createApp } = await import("../src/app.js");
    const { disconnectDatabase } = await import("../src/config/database.js");
    try {
      const fixture = express();
      fixture.get("/api/__browser_fixture", (_req, res) => res.type("text").send("cgp-isolated-browser-fixture"));
      if (trustedJudge) {
        fixture.get("/api/__browser_source", (_req, res) => res.type("text").send(trustedSource));
        // The test-only local runner may execute only this repository-owned program.
        fixture.use("/api/code", express.json({ limit: "64kb" }), (req, res, next) => {
          const body = req.body;
          if (req.method === "POST" && body?.language === "javascript" &&
              body.problemId === "speed-trap-detection" && body.sourceCode === trustedSource) return next();
          res.status(400).json({ error: { message: "Only the trusted browser test program may run." } });
        });
      }
      fixture.use(createApp());
      const server = createServer(fixture).listen(Number(process.env.PORT), "127.0.0.1");
      await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.once("listening", () => console.log(`Isolated browser API ready on port ${process.env.PORT}.`));
        process.once("SIGINT", resolve);
        process.once("SIGTERM", resolve);
        process.stdin.resume();
        process.stdin.once("data", resolve);
      }).finally(() => {
        process.stdin.pause();
        return new Promise<void>(resolve => server.close(() => resolve()));
      });
    } finally {
      await disconnectDatabase();
    }
  } finally {
    try { if (created) await db.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`); }
    finally { await db.$disconnect(); }
  }
}
void main().catch(() => {
  console.error("Could not start the isolated browser API. Check local PostgreSQL, port and migration permissions.");
  process.exitCode = 1;
});
