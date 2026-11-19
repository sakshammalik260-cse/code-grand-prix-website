// ==============================================================================
// CODE GRAND PRIX 2026 — PHASE 5 INTEGRATION TEST SUITE
// ==============================================================================

import http from "http";
import { createApp } from "../src/app.js";
import { AddressInfo } from "net";

interface HttpResponse {
  status: number;
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
  console.log("====================================================");
  console.log("🛡️  STARTING PHASE 5 INCIDENTS, RACE CONTROL & HINTS TEST SUITE");
  console.log("====================================================\n");

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
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
      if (details) console.error(`     Details: ${details}`);
    }
  }

  try {
    // 1. Authenticate Candidate
    const candidateLogin = await makeRequest(server, "POST", "/api/auth/login", {
      driverId: "CGP2026",
      password: "Race2026!"
    });
    const candidateToken = candidateLogin.body.token;

    // 2. Authenticate Volunteer
    const volunteerLogin = await makeRequest(server, "POST", "/api/auth/login", {
      driverId: "VOLUNTEER2026",
      password: "Marshal2026!"
    });
    const volunteerToken = volunteerLogin.body.token;

    // 3. Authenticate Admin
    const adminLogin = await makeRequest(server, "POST", "/api/auth/login", {
      driverId: "ADMIN2026",
      password: "Control2026!"
    });
    const adminToken = adminLogin.body.token;

    // Checkin Candidate
    await makeRequest(
      server,
      "POST",
      "/api/checkin",
      { rulesAccepted: true, cameraPermission: true, fullscreenRequested: true },
      candidateToken
    );

    // --------------------------------------------------------------------------
    // TEST GROUP 1: Violations & Deduplication
    // --------------------------------------------------------------------------
    console.log("📋 Test Group 1: Anti-Cheat Violation Intake (/api/violations)");

    // Test 1.1: Non-critical event (WINDOW_FOCUS_LOST) -> LOG_ONLY
    const blurEvent = await makeRequest(
      server,
      "POST",
      "/api/violations",
      {
        clientEventId: "evt_focus_001",
        type: "WINDOW_FOCUS_LOST",
        observedAt: new Date().toISOString()
      },
      candidateToken
    );
    assert(
      blurEvent.status === 200 && blurEvent.body.action === "LOG_ONLY",
      "WINDOW_FOCUS_LOST is logged without locking the candidate session",
      JSON.stringify(blurEvent.body)
    );

    // Test 1.2: Critical event (TAB_HIDDEN) -> LOCK
    const tabEvent = await makeRequest(
      server,
      "POST",
      "/api/violations",
      {
        clientEventId: "evt_tab_001",
        type: "TAB_HIDDEN",
        observedAt: new Date().toISOString()
      },
      candidateToken
    );
    assert(
      tabEvent.status === 200 &&
        tabEvent.body.action === "LOCK" &&
        tabEvent.body.sessionStatus === "LOCKED",
      "TAB_HIDDEN immediately locks the candidate session",
      JSON.stringify(tabEvent.body)
    );

    // Test 1.3: Deduplication of same clientEventId
    const duplicateEvent = await makeRequest(
      server,
      "POST",
      "/api/violations",
      {
        clientEventId: "evt_tab_001",
        type: "TAB_HIDDEN",
        observedAt: new Date().toISOString()
      },
      candidateToken
    );
    assert(
      duplicateEvent.status === 200 && duplicateEvent.body.duplicate === true,
      "Duplicate clientEventId is recognized and safely deduplicated",
      JSON.stringify(duplicateEvent.body)
    );

    // --------------------------------------------------------------------------
    // TEST GROUP 2: Volunteer Race Control & One-Click Bulk Resume
    // --------------------------------------------------------------------------
    console.log("\n📋 Test Group 2: Volunteer Controls & Bulk Resume");

    // Test 2.1: Candidate blocked from volunteer endpoints
    const forbiddenAccess = await makeRequest(
      server,
      "GET",
      "/api/volunteer/incidents",
      undefined,
      candidateToken
    );
    assert(
      forbiddenAccess.status === 403 &&
        forbiddenAccess.body.error.code === "FORBIDDEN_ROLE",
      "Candidate calling volunteer endpoint strictly receives 403 FORBIDDEN_ROLE"
    );

    // Test 2.2: Volunteer retrieves participant list
    const participantsRes = await makeRequest(
      server,
      "GET",
      "/api/volunteer/participants",
      undefined,
      volunteerToken
    );
    assert(
      participantsRes.status === 200 &&
        Array.isArray(participantsRes.body) &&
        participantsRes.body.length > 0,
      "Volunteer retrieves participant statuses, lock counts, and scores"
    );

    // Test 2.3: Volunteer retrieves incidents list
    const incidentsRes = await makeRequest(
      server,
      "GET",
      "/api/volunteer/incidents",
      undefined,
      volunteerToken
    );
    assert(
      incidentsRes.status === 200 &&
        Array.isArray(incidentsRes.body) &&
        incidentsRes.body.length >= 2,
      "Volunteer retrieves open violation incidents"
    );

    // Test 2.4: Atomic One-Action Bulk Session Resume
    const candidateSession = participantsRes.body.find((p: any) => p.driverId === "CGP2026");
    const sessionId = candidateSession?.id || "sess_u_cgp2026_cgp_2026";

    const bulkResumeRes = await makeRequest(
      server,
      "POST",
      `/api/volunteer/sessions/${sessionId}/authorize-resume`,
      {
        decision: "AUTHORIZE_RESUME",
        note: "Volunteer inspected video stream and confirmed innocent tab switch.",
        idempotencyKey: "approval-test-001"
      },
      volunteerToken
    );

    assert(
      bulkResumeRes.status === 200 &&
        bulkResumeRes.body.session.status === "ACTIVE" &&
        bulkResumeRes.body.authorization !== undefined,
      "POST /api/volunteer/sessions/:id/authorize-resume resolves incidents and unlocks candidate in one atomic action",
      JSON.stringify(bulkResumeRes.body)
    );

    // --------------------------------------------------------------------------
    // TEST GROUP 3: Race Assist Hints (Deductions & Idempotency)
    // --------------------------------------------------------------------------
    console.log("\n📋 Test Group 3: Race Assist Hints & Score Deductions");

    // Test 3.1: Get problem hints (locked hint content is hidden)
    const hintsRes = await makeRequest(
      server,
      "GET",
      "/api/contest/problems/speed-trap-detection/hints",
      undefined,
      candidateToken
    );
    assert(
      hintsRes.status === 200 &&
        Array.isArray(hintsRes.body.hints) &&
        hintsRes.body.hints[0].status === "LOCKED" &&
        hintsRes.body.hints[0].content === undefined,
      "GET /contest/problems/:id/hints conceals hint content for locked hints",
      JSON.stringify(hintsRes.body)
    );

    // Test 3.2: Unlock hint
    const unlockRes = await makeRequest(
      server,
      "POST",
      "/api/contest/problems/speed-trap-detection/hints/hint-speed-1/unlock",
      {
        operationId: "op-hint-001"
      },
      candidateToken
    );
    assert(
      unlockRes.status === 200 &&
        unlockRes.body.hint.status === "UNLOCKED" &&
        unlockRes.body.deductionApplied === 10 &&
        unlockRes.body.replayed === false &&
        typeof unlockRes.body.hint.content === "string",
      "Unlocking hint reveals hint text and applies 10 points deduction",
      JSON.stringify(unlockRes.body)
    );

    // Test 3.3: Replay hint unlock (no double penalty)
    const replayRes = await makeRequest(
      server,
      "POST",
      "/api/contest/problems/speed-trap-detection/hints/hint-speed-1/unlock",
      {
        operationId: "op-hint-001"
      },
      candidateToken
    );
    assert(
      replayRes.status === 200 &&
        replayRes.body.deductionApplied === 0 &&
        replayRes.body.replayed === true,
      "Replaying hint unlock charges exactly 0 penalty (idempotent receipt protection)"
    );

    // --------------------------------------------------------------------------
    // TEST GROUP 4: Authoritative Leaderboard & Candidate Progress
    // --------------------------------------------------------------------------
    console.log("\n📋 Test Group 4: Standings, Visibility & Candidate Progress");

    // Test 4.1: Candidate Progress
    const progressRes = await makeRequest(
      server,
      "GET",
      "/api/contest/progress?contestId=cgp_2026",
      undefined,
      candidateToken
    );
    assert(
      progressRes.status === 200 &&
        progressRes.body.driverId === "CGP2026" &&
        progressRes.body.totalProblems >= 3,
      "GET /api/contest/progress returns candidate-specific progress overview"
    );

    // Test 4.2: Public Leaderboard
    const leaderboardRes = await makeRequest(server, "GET", "/api/leaderboard");
    assert(
      leaderboardRes.status === 200 &&
        leaderboardRes.body.visible === true &&
        Array.isArray(leaderboardRes.body.rows),
      "GET /api/leaderboard returns ranked candidate standings"
    );

    // Test 4.3: Admin Visibility Gating
    await makeRequest(
      server,
      "POST",
      "/api/admin/results/visibility",
      { visible: false },
      adminToken
    );

    const hiddenLeaderboard = await makeRequest(
      server,
      "GET",
      "/api/leaderboard",
      undefined,
      candidateToken
    );
    assert(
      hiddenLeaderboard.status === 200 &&
        hiddenLeaderboard.body.visible === false &&
        hiddenLeaderboard.body.rows.length === 0,
      "When admin hides standings, candidate receives visible: false with empty rows"
    );

    // Restore visibility
    await makeRequest(
      server,
      "POST",
      "/api/admin/results/visibility",
      { visible: true },
      adminToken
    );

    // --------------------------------------------------------------------------
    // TEST GROUP 5: Admin Question Management
    // --------------------------------------------------------------------------
    console.log("\n📋 Test Group 5: Admin Question Management");

    // Test 5.1: Admin overview
    const overviewRes = await makeRequest(server, "GET", "/api/admin/overview", undefined, adminToken);
    assert(
      overviewRes.status === 200 && overviewRes.body.totalProblems >= 3,
      "GET /api/admin/overview returns counts of problems, participants, and incidents"
    );

    // Test 5.2: Admin creates problem
    const createProblemRes = await makeRequest(
      server,
      "POST",
      "/api/admin/problems",
      {
        title: "DRS Activation Sector",
        difficulty: "Easy",
        points: 100,
        statement: ["Calculate whether car is within 1.0 second DRS window."],
        inputFormat: ["timeGap"],
        outputFormat: "YES or NO",
        constraints: ["0.0 <= timeGap <= 10.0"]
      },
      adminToken
    );
    assert(
      createProblemRes.status === 201 && createProblemRes.body.title === "DRS Activation Sector",
      "Admin creates a new custom CPC problem draft"
    );

    console.log("\n====================================================");
    console.log(`🏁 PHASE 5 TEST RESULTS: ${testsPassed} / ${testsTotal} PASSED`);
    console.log("====================================================\n");
  } catch (error) {
    console.error("❌ Unexpected test execution error:", error);
  } finally {
    server.close();
  }
}

runTests();
