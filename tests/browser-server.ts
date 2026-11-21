import "dotenv/config";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { PrismaClient } from "@prisma/client";
import { assertIsolatedDatabase } from "./isolation.js";

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Use a local development environment.");
  const url = new URL(process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? "");
  const schema = `cgp_test_${randomBytes(12).toString("hex")}`;
  url.searchParams.set("schema", schema);
  url.searchParams.set("connect_timeout", "5");
  assertIsolatedDatabase(url.href);
  Object.assign(process.env, {
    DATABASE_URL: url.href,
    NODE_ENV: "test",
    ALLOW_DEV_FALLBACK: "false",
    JUDGE_PROVIDER: "judge0",
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
      const app = createApp();
      const server = createServer((req, res) => {
        if (req.method === "GET" && req.url === "/api/__browser_fixture") {
          res.writeHead(200, { "Content-Type": "text/plain" }).end("cgp-isolated-browser-fixture");
        } else {
          app(req, res);
        }
      }).listen(Number(process.env.PORT), "127.0.0.1");
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
