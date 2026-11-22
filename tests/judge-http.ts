import assert from "node:assert/strict";
import { authCookie } from "./http-auth.js";
import { createServer, type Server } from "node:http";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";
import { assertIsolatedDatabase } from "./isolation.js";

export async function listen(server: Server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return "http://127.0.0.1:" + (server.address() as AddressInfo).port;
}

export function close(server: Server) {
  return new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

export async function harness() {
  assertIsolatedDatabase();
  const { createApp } = await import("../src/app.js");
  const { prisma } = await import("../src/config/database.js");
  const { SEED_DATA } = await import("../src/data/seed-data.js");
  const server = createServer(createApp());
  const base = await listen(server);
  let checks = 0;
  async function request(path: string, status: number, token?: string, body?: unknown, cookie = false) {
    const response = await fetch(base + "/api" + path, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Cookie: token } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(200000)
    });
    const result = await response.json();
    assert.equal(response.status, status, path + ": " + (result?.error?.code ?? "response"));
    checks++;
    return cookie ? authCookie(response.headers.getSetCookie()) : result;
  }
  const login = async (driverId: string) =>
    (await request("/auth/login", 200, undefined, {
      driverId, password: SEED_DATA.users.find(user => user.driverId === driverId)!.password
    }, true)) as string;
  const checkin = (token: string) => request("/checkin", 200, token, {
    rulesAccepted: true, cameraPermission: true, fullscreenRequested: true
  });
  const fixture = async () => {
    const slug = "judge-fixture-" + randomUUID();
    return prisma.problem.create({ data: {
      slug, title: "Judge test fixture", contestId: "cgp_2026", roundId: "cgp_2026", status: "PUBLISHED",
      difficulty: "EASY", points: 80, timeLimitMs: 1000, memoryLimitMb: 512,
      statement: "Print the integer.", inputFormat: "An integer.", outputFormat: "An integer.", constraints: "0 to 10.",
      testCases: { create: [
        { input: "2", expectedOutput: "2", isPublic: true, order: 1 },
        { input: "7", expectedOutput: "7", isPublic: false, order: 2 }
      ] }
    } });
  };
  return { prisma, request, login, checkin, fixture, checkCount: () => checks,
    dispose: async () => { try { await close(server); } finally { await prisma.$disconnect(); } } };
}
