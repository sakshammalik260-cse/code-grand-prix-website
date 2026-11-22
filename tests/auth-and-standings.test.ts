import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { createApp } from "../src/app.js";
import { prisma } from "../src/config/database.js";
import { env } from "../src/config/env.js";
import { SEED_DATA } from "../src/data/seed-data.js";
import { authCookie } from "./http-auth.js";
import { assertIsolatedDatabase } from "./isolation.js";
import { close, listen } from "./judge-http.js";

async function main() {
  assertIsolatedDatabase();
  const directServer = createServer(createApp());
  const proxyApp = createApp();
  proxyApp.set("trust proxy", ["127.0.0.1"]);
  const proxyServer = createServer(proxyApp);
  const [direct, proxy] = await Promise.all([listen(directServer), listen(proxyServer)]);
  let checks = 0;

  async function http(path: string, status: number, options: {
    base?: string; cookie?: string; body?: unknown; headers?: Record<string, string>; method?: string
  } = {}) {
    const response = await fetch((options.base ?? direct) + "/api" + path, {
      method: options.method ?? (options.body === undefined ? "GET" : "POST"),
      headers: {
        "Content-Type": "application/json",
        ...(options.cookie ? { Cookie: options.cookie } : {}),
        ...options.headers
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
    const data = response.status === 204 ? null : await response.json();
    assert.equal(response.status, status, path + ": " + (data?.error?.code ?? "response"));
    checks++;
    return { data, response };
  }

  async function login(id: string) {
    const account = SEED_DATA.users.find(user => user.driverId === id)!;
    const { data, response } = await http("/auth/login", 200, { body: { driverId: id, password: account.password } });
    assert.equal(data.id, id);
    assert.equal(data.role, account.role);
    assert.equal("token" in data, false);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    assert.match(response.headers.getSetCookie().join(";"), /SameSite=Lax/i);
    return authCookie(response.headers.getSetCookie());
  }

  const invalid = (driverId: string, status = 401, headers?: Record<string, string>, base?: string) =>
    http("/auth/login", status, { body: { driverId, password: "incorrect fixture password" }, headers, base });

  try {
    const candidate = await login("CGP2026");
    const volunteer = await login("VOLUNTEER2026");
    const admin = await login("ADMIN2026");
    const allowedOrigin = "http://127.0.0.1:5173";
    const inspection = { rulesAccepted: true, cameraPermission: true, fullscreenRequested: true };

    await http("/auth/login", 403, { body: { driverId: "CGP2026", password: "invalid" },
      headers: { Origin: "https://unapproved.example" } });
    await http("/auth/login", 403, { body: {}, headers: { "Sec-Fetch-Site": "cross-site" } });
    assert.equal((await http("/auth/login", 204, { method: "OPTIONS", headers: {
      Origin: allowedOrigin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type"
    } })).response.headers.get("access-control-allow-origin"), allowedOrigin);
    assert.equal((await http("/auth/me", 200, { cookie: candidate, headers: { Origin: allowedOrigin } })).data.id, "CGP2026");
    assert.equal((await http("/session", 200, { cookie: candidate })).data.checkinStatus, "NOT_STARTED");
    await http("/checkin", 403, { cookie: admin, body: inspection });
    await http("/checkin", 403, { cookie: volunteer, body: inspection });
    assert.equal((await http("/checkin", 200, { cookie: candidate, body: inspection })).data.session.driverId, "CGP2026");
    assert.equal((await http("/session", 200, { cookie: candidate })).data.checkinStatus, "READY");
    for (const cookie of [admin, volunteer]) {
      await http("/code/run", 403, { cookie, body: {} });
      await http("/code/submit", 403, { cookie, body: {} });
      await http("/contest/progress", 403, { cookie });
    }

    await http("/leaderboard", 401, { headers: { "x-role": "ADMIN" } });
    await http("/leaderboard", 401, { headers: { Authorization: "Bearer invalid" } });
    await http("/volunteer/participants", 403, { cookie: candidate });
    await http("/admin/overview", 403, { cookie: candidate });
    await http("/admin/results/visibility", 403, { cookie: volunteer });
    await http("/admin/results/visibility", 403, { cookie: admin, body: { visible: false },
      headers: { Origin: "https://unapproved.example" } });
    for (const cookie of [candidate, volunteer, admin]) {
      const { data } = await http("/leaderboard", 200, { cookie });
      assert.equal(data.visible, true);
      assert.ok(data.rows.some((row: { driverId: string }) => row.driverId === "CGP2026"));
    }
    const user = await prisma.user.findUniqueOrThrow({ where: { driverId: "CGP2026" } });
    const problem = await prisma.problem.findUniqueOrThrow({ where: { slug: "speed-trap-detection" } });
    const overlapping = await prisma.problem.create({ data: {
      ...problem, id: "prob_" + problem.slug, slug: problem.id,
      title: "Overlapping identifiers fixture", allowedLanguages: ["java"]
    } });
    const bySlug = await http("/problems/" + overlapping.slug, 200, { cookie: candidate });
    assert.equal(bySlug.data.title, overlapping.title);
    const disallowed = await http("/code/run", 400, { cookie: candidate, body: {
      problemId: overlapping.slug, language: "python", sourceCode: "print(0)"
    } });
    assert.match(disallowed.data.error.message, /Overlapping identifiers fixture/);
    const emptyHints = await http("/contest/problems/" + overlapping.slug + "/hints", 200, { cookie: candidate });
    assert.deepEqual(emptyHints.data.hints, []);
    const hint = await prisma.hint.create({ data: {
      problemId: overlapping.id, deductionPoints: 4, content: "Fixture hint"
    } });
    await prisma.hintReceipt.create({ data: {
      operationId: randomUUID(), contestId: env.CONTEST_ID, userId: user.id, problemId: overlapping.id,
      hintId: hint.id, deductionApplied: hint.deductionPoints
    } });
    const submission = await prisma.submission.create({ data: {
      userId: user.id, problemId: overlapping.id, languageId: "java", sourceCode: "fixture",
      status: "COMPLETED", verdict: "ACCEPTED", score: 15, passedTests: 1, totalTests: 1
    } });
    await http("/admin/results/visibility", 200, { cookie: admin, body: { visible: false } });
    assert.deepEqual((await http("/contest/results/visibility", 200)).data, { visible: false });
    for (const cookie of [candidate, volunteer]) {
      const { data } = await http("/leaderboard?role=ADMIN", 200, { cookie, headers: { "x-role": "ADMIN" } });
      assert.equal(data.visible, false);
      assert.deepEqual(data.rows, []);
    }
    const withheld = await http("/leaderboard", 200, { cookie: admin });
    assert.equal(withheld.data.visible, true);
    const standing = withheld.data.rows.find((row: { driverId: string }) => row.driverId === "CGP2026");
    assert.equal(standing.totalScore, 11);
    assert.equal(standing.problemsSolved, 1);
    assert.equal(standing.totalHintPenalties, 4);
    const participants = await http("/volunteer/participants", 200, { cookie: volunteer });
    assert.ok(participants.data.some((row: { driverId: string }) => row.driverId === "CGP2026"));
    assert.ok(participants.data.every((row: object) => !("score" in row)));
    await http("/submissions/" + submission.id, 403, { cookie: volunteer });
    await http("/submissions/" + submission.id, 200, { cookie: candidate });
    await http("/submissions/" + submission.id, 200, { cookie: admin });
    const { data: progress } = await http("/contest/progress?driverId=ADMIN2026", 200, { cookie: candidate });
    assert.equal(progress.driverId, "CGP2026");
    assert.deepEqual(progress.attemptedProblemIds, [overlapping.slug]);
    assert.deepEqual(progress.solvedProblemIds, [overlapping.slug]);
    assert.equal(progress.currentScore, 11);
    await prisma.competitionRound.update({ where: { id: env.CONTEST_ID }, data: { status: "FINISHED" } });
    const finalBoard = await http("/leaderboard", 200, { cookie: admin });
    assert.ok(finalBoard.data.rows.every((row: { totalProblems: number }) => row.totalProblems === 4));

    const expired = jwt.sign({ userId: user.id, contestId: env.CONTEST_ID }, env.JWT_SECRET, { expiresIn: -1 });
    await http("/session", 401, { cookie: "auth_token=" + expired });
    const bearer = { Authorization: "Bearer " + candidate.slice("auth_token=".length) };
    await http("/auth/me", 200, { headers: bearer });
    const logout = await http("/auth/logout", 200, { cookie: candidate, method: "POST" });
    assert.match(logout.response.headers.getSetCookie().join(";"), /^auth_token=;/);
    await http("/auth/me", 401, { cookie: candidate });
    await http("/auth/me", 401, { headers: bearer });
    await http("/auth/me", 200, { cookie: await login("CGP2026") });

    const password = "lab-fixture-2026";
    const passwordHash = await bcrypt.hash(password, 10);
    const lab = Array.from({ length: 36 }, (_, i) => ({
      driverId: "LAB-" + i, displayName: "Lab driver " + i, passwordHash, role: Role.CANDIDATE
    }));
    await prisma.user.createMany({ data: lab });
    for (let start = 0; start < lab.length; start += 6) {
      await Promise.all(lab.slice(start, start + 6).map(({ driverId }) =>
        http("/auth/login", 200, { body: { driverId, password } })));
    }

    const wrongExisting = await invalid("LAB-1");
    const wrongUnknown = await invalid("UNKNOWN-DRIVER");
    assert.deepEqual(wrongExisting.data.error, wrongUnknown.data.error);
    for (let i = 0; i < 7; i++) {
      await invalid("  lab-1  ", 401, { "X-Forwarded-For": "192.0.2." + (i + 2) });
      await invalid("unknown-driver");
    }
    for (const driverId of ["LAB-1", "UNKNOWN-DRIVER"]) {
      const throttled = await invalid(driverId, 429, { "X-Forwarded-For": "192.0.2.50" });
      assert.equal(throttled.data.error.code, "RATE_LIMIT_EXCEEDED");
      assert.ok(Number(throttled.response.headers.get("retry-after")) > 0);
    }
    await http("/auth/login", 200, { body: { driverId: "LAB-2", password } });

    for (let i = 1; i <= 20; i++) {
      await invalid("LAB-3", 401, { "X-Forwarded-For": "198.51.100." + i }, proxy);
    }
    await invalid("lab-3", 429, { "X-Forwarded-For": "203.0.113.1" }, proxy);
    await http("/auth/login", 200, { base: proxy, body: { driverId: "LAB-2", password },
      headers: { "X-Forwarded-For": "203.0.113.1" } });

    const source = { "X-Forwarded-For": "2001:db8:10:20::10" };
    for (let i = 0; i < env.LOGIN_SOURCE_LIMIT; i++) await invalid("rotating-" + i, 401, source, proxy);
    await invalid("new-identity", 429, { "X-Forwarded-For": "2001:db8:10:20::30" }, proxy);
    assert.ok((await prisma.loginRateBucket.count({ where: { attempts: { gt: 0 } } })) > 0);
    await prisma.$executeRaw`UPDATE "login_rate_buckets" SET "expiresAt" = CURRENT_TIMESTAMP - INTERVAL '1 second'`;
    await http("/auth/login", 200, { base: proxy, body: { driverId: "LAB-1", password }, headers: source });
    console.log(`Authentication and standings passed ${checks} HTTP checks, including 36 successful logins from one source.`);
  } finally {
    await Promise.all([close(directServer), close(proxyServer)]);
    await prisma.$disconnect();
  }
}

void main().catch(error => { console.error(error); process.exitCode = 1; });
