// ==============================================================================
// CODE GRAND PRIX 2026 — PHASE 3 INTEGRATION TEST SUITE
// ==============================================================================

import http from "http";
import { assertIsolatedDatabase } from "./isolation.js";
import { prisma } from "../src/config/database.js";
import { createApp } from "../src/app.js";
import { AddressInfo } from "net";

interface HttpResponse {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: any;
}

function makeRequest(
  server: http.Server,
  method: string,
  path: string,
  body?: any,
  token?: string
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const address = server.address() as AddressInfo;
    const postData = body ? JSON.stringify(body) : undefined;

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (postData) {
      headers["Content-Length"] = Buffer.byteLength(postData).toString();
    }

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: address.port,
        path,
        method,
        headers
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          let parsed: any;
          try {
            parsed = JSON.parse(rawData);
          } catch {
            parsed = rawData;
          }
          resolve({
            status: res.statusCode || 500,
            headers: res.headers,
            body: parsed
          });
        });
      }
    );

    req.on("error", (err) => reject(err));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  assertIsolatedDatabase();
  console.log("====================================================");
  console.log("🧪 STARTING PHASE 3 CORE BACKEND TEST SUITE");
  console.log("====================================================\n");

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });

  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    testsTotal++;
    if (condition) {
      testsPassed++;
      console.log(`  ✅ PASS: ${testName}`);
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      process.exitCode = 1;
      if (details) console.error(`     Details: ${details}`);
    }
  }

  try {
    // --------------------------------------------------------------------------
    // TEST GROUP 1: Health Check & Diagnostics
    // --------------------------------------------------------------------------
    console.log("📋 Test Group 1: Health & Diagnostics");
    const healthRes = await makeRequest(server, "GET", "/api/health");
    assert(
      healthRes.status === 200 && healthRes.body.database === "connected",
      "Health check confirms PostgreSQL connectivity",
      `Got status: ${healthRes.status}`
    );
    assert(
      healthRes.body.status !== undefined && healthRes.body.contestStatus === "LIVE",
      "Health payload contains server time, contest status and diagnostics"
    );

    // --------------------------------------------------------------------------
    // TEST GROUP 2: Authentication & Rate Limiting
    // --------------------------------------------------------------------------
    console.log("\n📋 Test Group 2: Authentication & Identity");

    // Invalid Login
    const invalidLogin = await makeRequest(server, "POST", "/api/auth/login", {
      driverId: "CGP_045",
      password: "incorrect_password"
    });
    assert(
      invalidLogin.status === 401 && invalidLogin.body.error.code === "INVALID_CREDENTIALS",
      "Invalid login credentials returns 401 INVALID_CREDENTIALS",
      JSON.stringify(invalidLogin.body)
    );

    // Valid Participant Login
    const participantLogin = await makeRequest(server, "POST", "/api/auth/login", {
      driverId: "CGP_045",
      password: "driver123"
    });
    assert(
      participantLogin.status === 200 && participantLogin.body.token !== undefined,
      "Valid participant login returns 200 with JWT token and profile",
      JSON.stringify(participantLogin.body)
    );
    const participantToken = participantLogin.body.token;
    assert(
      participantLogin.body.user.driverId === "CGP_045" &&
        participantLogin.body.user.role === "CANDIDATE",
      "Participant role is accurately assigned"
    );
    assert(
      participantLogin.body.contest.status === "LIVE" &&
        participantLogin.body.remainingMs > 0,
      "Login response includes authoritative contest status and time remaining"
    );

    // Valid Volunteer Login
    const volunteerLogin = await makeRequest(server, "POST", "/api/auth/login", {
      driverId: "VOL_RACE_CONTROL",
      password: "racecontrol2026"
    });
    assert(
      volunteerLogin.status === 200 && volunteerLogin.body.user.role === "VOLUNTEER",
      "Volunteer login returns role 'VOLUNTEER'",
      JSON.stringify(volunteerLogin.body)
    );

    // --------------------------------------------------------------------------
    // TEST GROUP 3: Protected Routes & User Profile
    // --------------------------------------------------------------------------
    console.log("\n📋 Test Group 3: Protected Profile & Session");

    // Unauthenticated GET /api/auth/me
    const unauthMe = await makeRequest(server, "GET", "/api/auth/me");
    assert(
      unauthMe.status === 401 && unauthMe.body.error.code === "UNAUTHENTICATED",
      "Unauthenticated access to /api/auth/me is blocked with 401 UNAUTHENTICATED"
    );

    // Authenticated GET /api/auth/me
    const authMe = await makeRequest(server, "GET", "/api/auth/me", undefined, participantToken);
    assert(
      authMe.status === 200 && authMe.body.driverId === "CGP_045",
      "Authenticated /api/auth/me returns participant identity on refresh"
    );

    // --------------------------------------------------------------------------
    // TEST GROUP 4: Pre-Race Check-in Lifecycle
    // --------------------------------------------------------------------------
    console.log("\n📋 Test Group 4: Pre-Race Check-in State Machine");

    // Checkin with missing rules
    const blockedCheckin = await makeRequest(
      server,
      "POST",
      "/api/checkin",
      {
        rulesAccepted: false,
        cameraPermission: true,
        fullscreenRequested: true
      },
      participantToken
    );
    assert(
      blockedCheckin.status === 200 &&
        blockedCheckin.body.status === "blocked" &&
        blockedCheckin.body.checkinStatus === "BLOCKED",
      "Incomplete check-in moves participant to BLOCKED with explicit reasons",
      JSON.stringify(blockedCheckin.body)
    );

    // Checkin with all criteria accepted
    const successfulCheckin = await makeRequest(
      server,
      "POST",
      "/api/checkin",
      {
        rulesAccepted: true,
        cameraPermission: true,
        fullscreenRequested: true
      },
      participantToken
    );
    assert(
      successfulCheckin.status === 200 &&
        successfulCheckin.body.status === "ready" &&
        successfulCheckin.body.checkinStatus === "READY" &&
        successfulCheckin.body.sessionStatus === "ACTIVE",
      "Complete check-in transitions participant to READY and session to ACTIVE"
    );

    // Retrieve session after page reload
    const sessionRes = await makeRequest(server, "GET", "/api/session", undefined, participantToken);
    assert(
      sessionRes.status === 200 &&
        sessionRes.body.sessionStatus === "ACTIVE" &&
        sessionRes.body.checkinStatus === "READY",
      "GET /api/session preserves rehydrated session state across page reload"
    );

    // --------------------------------------------------------------------------
    // TEST GROUP 5: Authoritative Contest Clock
    // --------------------------------------------------------------------------
    console.log("\n📋 Test Group 5: Contest Clock & Source of Truth");
    const contestClock = await makeRequest(server, "GET", "/api/contest");
    assert(
      contestClock.status === 200 &&
        contestClock.body.status === "LIVE" &&
        typeof contestClock.body.serverTime === "string" &&
        typeof contestClock.body.remainingMs === "number",
      "GET /api/contest returns authoritative server time and countdown milliseconds"
    );
    assert(
      contestClock.body.timerPolicy.type === "GLOBAL_AUTHORITATIVE",
      "Contest timer policy is configured as authoritative global clock"
    );

    // --------------------------------------------------------------------------
    // TEST GROUP 6: Problems & Security (Hidden Test Isolation)
    // --------------------------------------------------------------------------
    console.log("\n📋 Test Group 6: Problems & Security Safeguards");

    const problemsRes = await makeRequest(
      server,
      "GET",
      "/api/problems",
      undefined,
      participantToken
    );
    assert(
      problemsRes.status === 200 && Array.isArray(problemsRes.body) && problemsRes.body.length >= 3,
      "GET /api/problems returns seeded problems (Easy, Medium, Hard)",
      `Count: ${problemsRes.body?.length}`
    );

    // Problem details check
    const problemDetail = await makeRequest(
      server,
      "GET",
      "/api/problems/speed-trap-detection",
      undefined,
      participantToken
    );
    assert(
      problemDetail.status === 200 && problemDetail.body.title === "Speed Trap Detection",
      "GET /api/problems/:id returns problem statement, constraints, and time limits"
    );

    // SECURITY VERIFICATION: Hidden tests must NEVER be returned!
    const sampleExamples = problemDetail.body.samples || [];
    assert(
      sampleExamples.length > 0,
      "Sample test cases are present for participant reference"
    );
    const seeded = await prisma.problem.findUniqueOrThrow({
      where: { slug: "speed-trap-detection" },
      include: { testCases: true }
    });
    const publicIds = seeded.testCases.filter(test => test.isPublic).map(test => test.id).sort();
    const receivedIds = sampleExamples.map((test: { id: string }) => test.id).sort();
    assert(
      seeded.testCases.some(test => !test.isPublic) &&
        JSON.stringify(receivedIds) === JSON.stringify(publicIds) &&
        !("testCases" in problemDetail.body),
      "Public problem detail includes exactly the public cases and omits private case records"
    );

    // Languages API
    const languagesRes = await makeRequest(server, "GET", "/api/languages");
    assert(
      languagesRes.status === 200 && Array.isArray(languagesRes.body) && languagesRes.body.length === 4,
      "GET /api/languages returns Python 3, JavaScript, C++, and Java with starters"
    );

    // --------------------------------------------------------------------------
    // TEST GROUP 7: JWT Logout & Revocation Verification
    // --------------------------------------------------------------------------
    console.log("\n📋 Test Group 7: Logout & Token Revocation Security");

    // Perform logout
    const logoutRes = await makeRequest(
      server,
      "POST",
      "/api/auth/logout",
      {},
      participantToken
    );
    assert(
      logoutRes.status === 200 && logoutRes.body.success === true,
      "POST /api/auth/logout succeeds and invalidates token"
    );

    // Attempt to use the old token after logout on a protected endpoint
    const postLogoutAccess = await makeRequest(
      server,
      "GET",
      "/api/auth/me",
      undefined,
      participantToken
    );
    assert(
      postLogoutAccess.status === 401 &&
        postLogoutAccess.body.error.code === "UNAUTHENTICATED",
      "SECURITY PASS: Revoked JWT is strictly rejected on protected endpoints with 401 UNAUTHENTICATED",
      JSON.stringify(postLogoutAccess.body)
    );

    // Attempt to access session with revoked token
    const postLogoutSession = await makeRequest(
      server,
      "GET",
      "/api/session",
      undefined,
      participantToken
    );
    assert(
      postLogoutSession.status === 401,
      "SECURITY PASS: Accessing session with revoked token is rejected"
    );

    console.log("\n====================================================");
    console.log(`🏁 TEST RESULTS: ${testsPassed} / ${testsTotal} PASSED`);
    console.log("====================================================\n");
  } catch (error) {
    process.exitCode = 1;
    console.error("❌ Unexpected test execution error:", error);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await prisma.$disconnect();
  }
}

runTests();
