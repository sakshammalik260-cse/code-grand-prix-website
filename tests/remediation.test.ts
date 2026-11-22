// ==============================================================================
// CODE GRAND PRIX 2026 — REMEDIATION AUDIT VERIFICATION TEST SUITE (C01–C17)
// ==============================================================================

import http from "http";
import { authCookie } from "./http-auth.js";
import { assertIsolatedDatabase } from "./isolation.js";
import { prisma } from "../src/config/database.js";
import { createApp } from "../src/app.js";
import { AddressInfo } from "net";
import { v4 as uuidv4 } from "uuid";

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
      headers["Cookie"] = token;
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

    req.on("error", (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

let passedTests = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  passedTests++;
  console.log(`  ✅ PASS: ${message}`);
}

async function runRemediationTests() {
  assertIsolatedDatabase();
  console.log("====================================================");
  console.log("🔍 STARTING CODE REVIEW REMEDIATION (C01–C17) TESTS");
  console.log("====================================================\n");

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });



  try {
    // 1. Authenticate candidate & volunteer & admin
    console.log("📋 1. Authentication & Role Extraction");
    const driverRes = await makeRequest(server, "POST", "/api/auth/login", {
      driverId: "CGP2026",
      password: "Race2026!"
    });
    const driverToken = authCookie(driverRes.headers["set-cookie"]);
    assert(driverRes.status === 200, "Driver CGP2026 logged in");
    assert(driverRes.body.user.role === "CANDIDATE", "User has role CANDIDATE");

    const volRes = await makeRequest(server, "POST", "/api/auth/login", {
      driverId: "VOLUNTEER2026",
      password: "Marshal2026!"
    });
    const volToken = authCookie(volRes.headers["set-cookie"]);
    assert(volRes.status === 200, "Volunteer VOLUNTEER2026 logged in");

    const adminRes = await makeRequest(server, "POST", "/api/auth/login", {
      driverId: "ADMIN2026",
      password: "Control2026!"
    });
    const adminToken = authCookie(adminRes.headers["set-cookie"]);
    assert(adminRes.status === 200, "Admin ADMIN2026 logged in");

    // 2. C06: Contest Clock Contract
    console.log("\n📋 2. C06: Contest Clock Derivation & Frontend DTO");
    const contestRes = await makeRequest(server, "GET", "/api/contest");
    assert(contestRes.body.round !== undefined, "Contest DTO includes round");
    assert(typeof contestRes.body.contestStartTime === "string", "Contest DTO includes contestStartTime");
    assert(typeof contestRes.body.contestEndTime === "string", "Contest DTO includes contestEndTime");
    assert(
      ["WAITING", "LIVE", "FINISHED"].includes(contestRes.body.status),
      "Contest status derived correctly (WAITING / LIVE / FINISHED)"
    );

    // 3. C07 & C08: Public Problem DTOs
    console.log("\n📋 3. C07 & C08: Problem DTOs & Public Data Integrity");
    const problemsRes = await makeRequest(server, "GET", "/api/contest/problems", undefined, driverToken);
    assert(problemsRes.status === 200, "GET /api/contest/problems returns 200");
    assert(Array.isArray(problemsRes.body), "Problems list is an array");
    const firstProb = problemsRes.body.find((problem: { id: string }) => problem.id === "speed-trap-detection");
    assert(firstProb !== undefined, "Speed Trap fixture is published");
    assert(typeof firstProb.number === "number", "Problem summary has number");
    assert(["Easy", "Medium", "Hard"].includes(firstProb.difficulty), "Problem difficulty is formatted (Easy/Medium/Hard)");

    const probDetailRes = await makeRequest(
      server,
      "GET",
      `/api/contest/problems/${firstProb.id}`,
      undefined,
      driverToken
    );
    assert(probDetailRes.status === 200, "GET /api/contest/problems/:id returns 200");
    assert(Array.isArray(probDetailRes.body.statement), "Statement is string array");
    assert(Array.isArray(probDetailRes.body.inputFormat), "inputFormat is string array");
    assert(Array.isArray(probDetailRes.body.constraints), "constraints is string array");
    assert(Array.isArray(probDetailRes.body.samples), "samples is array");
    assert(probDetailRes.body.samples[0].output !== undefined, "sample has output field");

    // 4. Pre-race check-in
    console.log("\n📋 4. Pre-Race Check-in & Session Envelope");
    const checkinRes = await makeRequest(
      server,
      "POST",
      "/api/checkin",
      {
        rulesAccepted: true,
        cameraPermission: true,
        fullscreenRequested: true
      },
      driverToken
    );
    assert(checkinRes.status === 200, "Check-in succeeded");
    assert(checkinRes.body.checkinStatus === "READY", "Checkin status is READY");
    assert(checkinRes.body.viewer !== undefined, "SessionEnvelope includes viewer");

    // 5. C01 / C02: Execute code with allowed language
    console.log("\n📋 5. C01 & C02: Code Execution Gates");
    const runRes = await makeRequest(
      server,
      "POST",
      "/api/code/run",
      {
        problemId: firstProb.id,
        languageId: "python",
        sourceCode: "import sys\nline = sys.stdin.read().strip()\nif line: print(line.split()[0])\nelse: print(0)"
      },
      driverToken
    );
    assert(runRes.status === 200, "POST /api/code/run succeeded with READY session");
    assert(runRes.body.status !== undefined, "Code execution returned verdict");

    // Submit solution for Problem 1
    const subRes1 = await makeRequest(
      server,
      "POST",
      "/api/code/submit",
      {
        problemId: firstProb.id,
        languageId: "python",
        sourceCode: "import sys\ndata = sys.stdin.read().split()\nif data:\n    n, s = int(data[0]), int(data[1])\n    v = [int(x) for x in data[2:2+n]]\n    violations = sum(1 for x in v if x > s)\n    max_speed = max(v) if v else 0\n    print(f\"{violations} {max_speed}\")"
      },
      driverToken
    );
    assert(subRes1.status === 200, "POST /api/code/submit succeeded");

    // 6. C03: Cross-user submission access control
    console.log("\n📋 6. C03: Submission Ownership Security (Role.CANDIDATE)");
    const subId = subRes1.body.submissionId;
    // Log in second driver
    const driver2Res = await makeRequest(server, "POST", "/api/auth/login", {
      driverId: "CGP_045",
      password: "driver123"
    });
    const driver2Token = authCookie(driver2Res.headers["set-cookie"]);
    const crossAccessRes = await makeRequest(
      server,
      "GET",
      `/api/submissions/${subId}`,
      undefined,
      driver2Token
    );
    assert(crossAccessRes.status === 403, "Driver cannot access another driver's submission (403 Forbidden)");

    // 7. C14: Hint Problem Validation & Idempotency
    console.log("\n📋 7. C14: Hint Problem Validation & Complete Frontend DTO");
    // Attempt to unlock non-existent hint or hint on wrong problem
    const badHintRes = await makeRequest(
      server,
      "POST",
      `/api/contest/problems/${firstProb.id}/hints/hint_invalid_123/unlock`,
      { operationId: `op_${uuidv4()}` },
      driverToken
    );
    assert(badHintRes.status === 404, "Invalid hint on problem returns 404");

    // Fetch valid hints for problem 1
    const hintsRes = await makeRequest(
      server,
      "GET",
      `/api/contest/problems/${firstProb.id}/hints`,
      undefined,
      driverToken
    );
    assert(hintsRes.status === 200 && hintsRes.body.hints.length > 0 &&
      hintsRes.body.hints.every((row: { status: string; content?: string }) => row.status === "LOCKED" && !("content" in row)),
      "Locked hints omit content");
    const validHint = hintsRes.body.hints[0];

    const opId = `op_idempotency_${uuidv4()}`;
    const unlockRes1 = await makeRequest(
      server,
      "POST",
      `/api/contest/problems/${firstProb.id}/hints/${validHint.id}/unlock`,
      { operationId: opId },
      driverToken
    );
    assert(unlockRes1.status === 200, "Hint unlocked successfully");
    assert(unlockRes1.body.replayed === false, "First unlock is not replayed");
    assert(unlockRes1.body.deductionApplied > 0, "Deduction applied on first unlock");
    assert(unlockRes1.body.contestId !== undefined, "Hint DTO includes contestId");
    assert(unlockRes1.body.maximumPoints !== undefined, "Hint DTO includes maximumPoints");
    assert(unlockRes1.body.remainingPotentialScore !== undefined, "Hint DTO includes remainingPotentialScore");

    // Replay with exact same operationId
    const unlockRes2 = await makeRequest(
      server,
      "POST",
      `/api/contest/problems/${firstProb.id}/hints/${validHint.id}/unlock`,
      { operationId: opId },
      driverToken
    );
    assert(unlockRes2.status === 200, "Replayed hint unlock returns 200");
    assert(unlockRes2.body.replayed === true, "Replayed is true");
    assert(unlockRes2.body.deductionApplied === 0, "Deduction is 0 on idempotent replay");

    // 8. C12 & C13: Scoring, Duplicate Submissions & Hint Isolation
    console.log("\n📋 8. C12 & C13: Per-Problem Scoring & Hint Penalty Isolation");
    // Submit second accepted solution for Problem 1
    const subRes2 = await makeRequest(
      server,
      "POST",
      `/api/code/submit`,
      {
        problemId: firstProb.id,
        languageId: "python",
        sourceCode: "import sys\ndata = sys.stdin.read().split()\nif data:\n    n, s = int(data[0]), int(data[1])\n    v = [int(x) for x in data[2:2+n]]\n    violations = sum(1 for x in v if x > s)\n    max_speed = max(v) if v else 0\n    print(f\"{violations} {max_speed}\")"
      },
      driverToken
    );
    assert(subRes2.status === 200 && subRes2.body.verdict === "ACCEPTED", "Second accepted submission created");

    const receipts = await prisma.hintReceipt.findMany({ where: { hintId: validHint.id } });
    const problem = await prisma.problem.findUniqueOrThrow({ where: { slug: firstProb.id } });
    assert(receipts.length === 1 && receipts[0].problemId === problem.id &&
      receipts[0].operationId === opId && receipts[0].deductionApplied === unlockRes1.body.deductionApplied,
      "PostgreSQL stores one hint receipt using the problem UUID");
    const refreshedHints = await makeRequest(server, "GET", `/api/contest/problems/${firstProb.id}/hints`, undefined, driverToken);
    assert(refreshedHints.status === 200 && refreshedHints.body.hints.some(
      (row: { id: string; status: string; content?: string }) => row.id === validHint.id && row.status === "UNLOCKED" && !!row.content),
      "Purchased hint content remains visible on retrieval");

    const other = await prisma.problem.findUniqueOrThrow({ where: { slug: "pit-stop-optimization" } });
    const otherSubmission = await makeRequest(server, "POST", "/api/code/submit", {
      problemId: other.slug,
      language: "javascript",
      sourceCode: `const [n, penalty, gain, ...laps] = require("node:fs").readFileSync(0, "utf8").trim().split(/\\s+/).map(Number);
        const baseline = laps.reduce((sum, lap) => sum + lap, 0);
        console.log(baseline - Math.max(0, (n - 1) * gain - penalty));`
    }, driverToken);
    assert(otherSubmission.status === 200 && otherSubmission.body.verdict === "ACCEPTED" &&
      otherSubmission.body.score === other.points, "Unrelated problem earns its full submission score");

    // Check progress
    const progressRes = await makeRequest(
      server,
      "GET",
      "/api/contest/progress",
      undefined,
      driverToken
    );
    assert(progressRes.status === 200, "GET /api/contest/progress returns 200");
    // Sum the adjusted first problem and the full value of the unrelated problem.
    const expectedScore = Math.max(0, firstProb.points - unlockRes1.body.deductionApplied) + other.points;
    assert(
      progressRes.body.currentScore === expectedScore,
      `Score is ${expectedScore} (counted once, with hint deduction subtracted)`
    );

    // Leaderboard check
    const lbRes = await makeRequest(server, "GET", "/api/leaderboard", undefined, driverToken);
    assert(lbRes.status === 200, "GET /api/leaderboard returns 200");
    const driverRow = lbRes.body.rows.find((r: any) => r.driverId === "CGP2026");
    assert(driverRow !== undefined, "Driver CGP2026 is in leaderboard rows");
    assert(
      driverRow.totalScore === expectedScore,
      `Leaderboard score reflects per-problem hint formula (${driverRow.totalScore} === ${expectedScore})`
    );
    assert(driverRow.problemsSolved === 2, "Duplicate submissions on one problem do not inflate the solved count");

    // 9. C04 & C17: Anti-cheat Violations, Lock loop prevention & Lock preservation
    console.log("\n📋 9. C04 & C17: Incident Locking & Check-in Lock Preservation");
    const eventId1 = `evt_tab_${uuidv4()}`;
    const violRes1 = await makeRequest(
      server,
      "POST",
      "/api/violations",
      {
        eventId: eventId1,
        type: "TAB_HIDDEN",
        occurredAt: new Date().toISOString(),
        details: "User switched tab"
      },
      driverToken
    );
    assert(violRes1.status === 200, "Tab hidden violation reported");
    assert(violRes1.body.incident.status === "OPEN", "Incident status is OPEN");

    // Session is now LOCKED
    const sessionRes = await makeRequest(server, "GET", "/api/session", undefined, driverToken);
    assert(sessionRes.body.session.status === "LOCKED", "Session is now LOCKED");
    const initialLockCount = sessionRes.body.session.lockCount;

    // Report second critical violation while ALREADY locked (C17 test)
    const eventId2 = `evt_fullscreen_${uuidv4()}`;
    const violRes2 = await makeRequest(
      server,
      "POST",
      "/api/violations",
      {
        eventId: eventId2,
        type: "FULLSCREEN_EXIT",
        occurredAt: new Date().toISOString(),
        details: "User exited fullscreen"
      },
      driverToken
    );
    assert(violRes2.status === 200, "Second violation recorded");
    const sessionRes2 = await makeRequest(server, "GET", "/api/session", undefined, driverToken);
    assert(
      sessionRes2.body.session.lockCount === initialLockCount,
      "C17: Redundant violation does not increment lockCount when already locked"
    );

    // C04 Test: Re-running check-in while locked must be REJECTED!
    const recheckinRes = await makeRequest(
      server,
      "POST",
      "/api/checkin",
      {
        rulesAccepted: true,
        cameraPermission: true,
        fullscreenRequested: true
      },
      driverToken
    );
    assert(
      recheckinRes.status === 403,
      "C04: Re-running /checkin while session is LOCKED is rejected (403 Forbidden)"
    );

    // 10. C15 & C16: Race Control Authorize Resume (Strict Revision & Idempotency)
    console.log("\n📋 10. C15 & C16: Volunteer Bulk Resume (Strict Revision & Idempotency)");
    const lockedSessionId = sessionRes.body.session.id;
    const participants = await makeRequest(server, "GET", "/api/volunteer/participants", undefined, volToken);
    const current = participants.status === 200 && participants.body.find((row: { id: string }) => row.id === lockedSessionId);
    assert(current?.status === "LOCKED" && Number.isInteger(current.revision),
      "Volunteer retrieves the locked session and its revision");
    const currentRevision = current.revision;

    // Stale revision test (expectedRevision != currentRevision)
    const staleRes = await makeRequest(
      server,
      "POST",
      `/api/volunteer/sessions/${lockedSessionId}/authorize-resume`,
      {
        decision: "APPROVE_RESUME",
        expectedSessionRevision: currentRevision - 1,
        note: "Stale approval test",
        idempotencyKey: `stale_${uuidv4()}`
      },
      volToken
    );
    assert(staleRes.status === 409, "C15: Authorize resume with mismatched revision returns 409 Conflict");

    const history = await makeRequest(server, "GET", "/api/volunteer/incidents", undefined, volToken);
    const blockingIds: string[] = history.body
      .filter((row: { sessionId: string; blocking: boolean }) => row.sessionId === lockedSessionId && row.blocking)
      .map((row: { id: string }) => row.id);
    assert(blockingIds.length === 1 && current.contestId === "cgp_2026" && current.driverId === "CGP2026",
      "Race Control receives scoped session records and the blocking incident set");
    const mismatchedSet = await makeRequest(server, "POST", `/api/volunteer/sessions/${lockedSessionId}/authorize-resume`, {
      contestId: current.contestId, driverId: current.driverId, decision: "AUTHORIZE_RESUME",
      expectedSessionRevision: currentRevision, expectedIncidentIds: ["unrelated-incident"],
      note: "Mismatched incident set", idempotencyKey: uuidv4()
    }, volToken);
    assert(mismatchedSet.status === 409, "A stale blocking incident set cannot unlock the session");

    // Valid authorize-resume with idempotencyKey
    const resumeIdempotencyKey = `resume_key_${uuidv4()}`;
    const resumeRes1 = await makeRequest(
      server,
      "POST",
      `/api/volunteer/sessions/${lockedSessionId}/authorize-resume`,
      {
        decision: "AUTHORIZE_RESUME",
        contestId: current.contestId,
        driverId: current.driverId,
        expectedIncidentIds: blockingIds,
        expectedSessionRevision: currentRevision,
        note: "Verified clear screen - authorized",
        idempotencyKey: resumeIdempotencyKey
      },
      volToken
    );
    assert(resumeRes1.status === 200, "Volunteer authorized resume successfully");
    assert(resumeRes1.body.session.status === "ACTIVE", "Session is now ACTIVE");
    const newRevision = resumeRes1.body.session.revision;
    assert(resumeRes1.body.authorization.sessionId === lockedSessionId &&
      resumeRes1.body.authorization.coveredIncidentIds[0] === blockingIds[0] &&
      resumeRes1.body.incidents[0].reviewStatus === "AUTHORIZED", "Authorization returns verified review coverage");
    const restored = await makeRequest(server, "GET", "/api/session", undefined, driverToken);
    assert(restored.body.session.resumeAuthorization?.id === resumeRes1.body.authorization.id &&
      restored.body.session.resumeAuthorization?.coveredIncidentIds?.[0] === blockingIds[0],
      "Candidate snapshot rehydrates the persisted authorization coverage");

    // Replay authorize-resume with same idempotencyKey (C16 test)
    const resumeRes2 = await makeRequest(
      server,
      "POST",
      `/api/volunteer/sessions/${lockedSessionId}/authorize-resume`,
      {
        decision: "AUTHORIZE_RESUME",
        contestId: current.contestId,
        driverId: current.driverId,
        expectedIncidentIds: blockingIds,
        expectedSessionRevision: currentRevision,
        note: "Verified clear screen - authorized",
        idempotencyKey: resumeIdempotencyKey
      },
      volToken
    );
    assert(resumeRes2.status === 200, "C16: Replayed authorize-resume returns 200");
    assert(
      resumeRes2.body.session.revision === newRevision,
      "C16: Idempotent replay does not increment session revision"
    );

    const decisions = await prisma.auditLog.findMany({ where: { sessionId: lockedSessionId, action: "AUTHORIZE_RESUME" } });
    assert(decisions.length === 1 && decisions[0].id === resumeRes1.body.authorization.id &&
      decisions[0].idempotencyKey === resumeIdempotencyKey &&
      resumeRes2.body.authorization.id === decisions[0].id,
      "PostgreSQL stores one authorization receipt across retries");
    const unresolved = await prisma.incident.count({ where: { sessionId: lockedSessionId, blocking: true, status: "OPEN" } });
    assert(unresolved === 0, "Atomic authorization resolves every open blocking incident");

    // 11. Admin Overview DTO Contract
    console.log("\n📋 11. Admin Overview Frontend DTO (Page 10)");
    const adminOverviewRes = await makeRequest(server, "GET", "/api/admin/overview", undefined, adminToken);
    assert(adminOverviewRes.status === 200, "GET /api/admin/overview returns 200");
    assert(typeof adminOverviewRes.body.totalQuestions === "number", "DTO has totalQuestions");
    assert(typeof adminOverviewRes.body.draftQuestions === "number", "DTO has draftQuestions");
    assert(typeof adminOverviewRes.body.publishedQuestions === "number", "DTO has publishedQuestions");
    assert(typeof adminOverviewRes.body.competitionStatus === "string", "DTO has competitionStatus");
    assert(typeof adminOverviewRes.body.participants === "number", "DTO has participants");
    assert(Array.isArray(adminOverviewRes.body.activeRounds), "DTO has activeRounds array");

    console.log("\n====================================================");
    console.log(`🏁 REMEDIATION TEST RESULTS: ${passedTests} assertions passed`);
    console.log("====================================================\n");
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await prisma.$disconnect();
  }
}

runRemediationTests()
  .catch((err) => {
    console.error("❌ Remediation Test Failure:", err);
    process.exitCode = 1;
  });
