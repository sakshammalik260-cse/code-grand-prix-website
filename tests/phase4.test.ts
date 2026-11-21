// ==============================================================================
// CODE GRAND PRIX 2026 — PHASE 4 JUDGING & EXECUTION TEST SUITE
// ==============================================================================

import http from "http";
import { assertIsolatedDatabase } from "./isolation.js";
import { prisma } from "../src/config/database.js";
import { SEED_DATA } from "../src/data/seed-data.js";
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
  assertIsolatedDatabase();
  console.log("====================================================");
  console.log("🏎️  STARTING PHASE 4 JUDGE & SUBMISSION TEST SUITE");
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
    // 1. Authenticate Participant
    const loginRes = await makeRequest(server, "POST", "/api/auth/login", {
      driverId: "CGP_045",
      password: "driver123"
    });
    const token = loginRes.body.token;

    // 2. Perform Pre-Race Check-in
    await makeRequest(
      server,
      "POST",
      "/api/checkin",
      {
        rulesAccepted: true,
        cameraPermission: true,
        fullscreenRequested: true
      },
      token
    );

    // --------------------------------------------------------------------------
    // TEST GROUP 1: Code Run (Sample & Custom Input)
    // --------------------------------------------------------------------------
    console.log("📋 Test Group 1: Sandboxed Code Run (/api/code/run)");

    // Test 1.1: JavaScript with Custom Input
    const jsCustomRun = await makeRequest(
      server,
      "POST",
      "/api/code/run",
      {
        problemId: "speed-trap-detection",
        language: "javascript",
        sourceCode: `
          const fs = require('fs');
          const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);
          const [n, s, ...v] = input;
          let count = 0, maxV = 0;
          for(const x of v){
            if(x > s) count++;
            if(x > maxV) maxV = x;
          }
          console.log(count + ' ' + maxV);
        `,
        customInput: "5 320\n310 325 330 315 340"
      },
      token
    );

    assert(
      jsCustomRun.status === 200 &&
        jsCustomRun.body.status === "ACCEPTED" &&
        jsCustomRun.body.stdout.trim() === "3 340",
      "JavaScript execution with custom input runs in the trusted local judge and outputs correct result",
      JSON.stringify(jsCustomRun.body)
    );
    assert(
      jsCustomRun.body.expectedOutput === null,
      "Expected output is strictly null for custom input (matches contract)"
    );

    // Test 1.2: Python against Sample Test Cases
    const pySampleRun = await makeRequest(
      server,
      "POST",
      "/api/code/run",
      {
        problemId: "speed-trap-detection",
        language: "python",
        sourceCode: `
import sys
data = sys.stdin.read().split()
if data:
    n, s = int(data[0]), int(data[1])
    v = [int(x) for x in data[2:]]
    violations = sum(1 for x in v if x > s)
    max_speed = max(v)
    print(f"{violations} {max_speed}")
        `
      },
      token
    );

    assert(
      pySampleRun.status === 200 &&
        pySampleRun.body.status === "ACCEPTED" &&
        Array.isArray(pySampleRun.body.cases) &&
        pySampleRun.body.cases.length === 2,
      "Python execution runs against public sample test cases with ACCEPTED verdict",
      JSON.stringify(pySampleRun.body)
    );

    // Test 1.3: Runtime Error handling
    const pyErrorRun = await makeRequest(
      server,
      "POST",
      "/api/code/run",
      {
        problemId: "speed-trap-detection",
        language: "python",
        sourceCode: `raise ValueError("Intentional engine simulation error")`,
        customInput: "1 2\n3"
      },
      token
    );

    assert(
      pyErrorRun.status === 200 && pyErrorRun.body.status === "RUNTIME_ERROR",
      "Process exception is captured and reported as RUNTIME_ERROR with stderr"
    );

    // --------------------------------------------------------------------------
    // TEST GROUP 2: Code Submission & Hidden Tests Judging
    // --------------------------------------------------------------------------
    console.log("\n📋 Test Group 2: Code Submission & Scoring (/api/code/submit)");

    // Test 2.1: Full Accepted Submission on Speed Trap Detection
    const acceptedSubmit = await makeRequest(
      server,
      "POST",
      "/api/code/submit",
      {
        problemId: "speed-trap-detection",
        language: "javascript",
        sourceCode: `
          const fs = require('fs');
          const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);
          const [n, s, ...v] = input;
          let count = 0, maxV = 0;
          for(const x of v){
            if(x > s) count++;
            if(x > maxV) maxV = x;
          }
          console.log(count + ' ' + maxV);
        `
      },
      token
    );

    assert(
      acceptedSubmit.status === 200 &&
        acceptedSubmit.body.status === "ACCEPTED" &&
        acceptedSubmit.body.score === 100 &&
        acceptedSubmit.body.passedTests === acceptedSubmit.body.totalTests &&
        acceptedSubmit.body.totalTests === 4,
      "Accepted submission passes all 4 test cases (including hidden tests) and awards 100 points",
      JSON.stringify(acceptedSubmit.body)
    );

    // Test 2.2: Wrong Answer Submission
    const wrongSubmit = await makeRequest(
      server,
      "POST",
      "/api/code/submit",
      {
        problemId: "speed-trap-detection",
        language: "javascript",
        sourceCode: `console.log("0 0");`
      },
      token
    );

    assert(
      wrongSubmit.status === 200 &&
        wrongSubmit.body.status === "WRONG_ANSWER" &&
        wrongSubmit.body.score === 0,
      "Incorrect submission is evaluated and receives WRONG_ANSWER with 0 score",
      JSON.stringify(wrongSubmit.body)
    );

    // --------------------------------------------------------------------------
    // TEST GROUP 3: Submission Polling & Integrity Guards
    // --------------------------------------------------------------------------
    console.log("\n📋 Test Group 3: Submission Retrieval & Gatekeeping");

    // Test 3.1: Retrieve submission by ID
    const submissionId = acceptedSubmit.body.id;
    const getSubRes = await makeRequest(
      server,
      "GET",
      `/api/submissions/${submissionId}`,
      undefined,
      token
    );

    assert(
      getSubRes.status === 200 &&
        getSubRes.body.verdict === "ACCEPTED" &&
        getSubRes.body.score === 100,
      "GET /api/submissions/:id retrieves persisted terminal verdict and score"
    );

    // Test 3.2: Locked Session Blocks Submissions
    const violation = await makeRequest(server, "POST", "/api/violations", {
      clientEventId: "phase4-tab-hidden",
      type: "TAB_HIDDEN",
      observedAt: new Date().toISOString()
    }, token);
    assert(violation.status === 200 && violation.body.sessionStatus === "LOCKED",
      "A monitoring incident locks the checked-in session");

    const lockedSubmit = await makeRequest(
      server,
      "POST",
      "/api/code/submit",
      {
        problemId: "speed-trap-detection",
        language: "javascript",
        sourceCode: `console.log("test");`
      },
      token
    );

    assert(
      lockedSubmit.status === 403 && lockedSubmit.body.error.code === "SESSION_LOCKED",
      "INTEGRITY PASS: Submissions are strictly BLOCKED when session is LOCKED",
      JSON.stringify(lockedSubmit.body)
    );

    // Test 3.3: Incomplete Check-in Blocks Submissions
    const unchecked = SEED_DATA.users.find(user => user.driverId === "CGP_016")!;
    const uncheckedLogin = await makeRequest(server, "POST", "/api/auth/login", {
      driverId: unchecked.driverId,
      password: unchecked.password
    });
    assert(uncheckedLogin.status === 200, "A separate candidate signs in without checking in");

    const uncheckedSubmit = await makeRequest(
      server,
      "POST",
      "/api/code/submit",
      {
        problemId: "speed-trap-detection",
        language: "javascript",
        sourceCode: `console.log("test");`
      },
      uncheckedLogin.body.token
    );

    assert(
      uncheckedSubmit.status === 403 &&
        uncheckedSubmit.body.error.code === "CHECKIN_INCOMPLETE",
      "INTEGRITY PASS: Submissions are strictly BLOCKED when pre-race check-in is incomplete",
      JSON.stringify(uncheckedSubmit.body)
    );

    console.log("\n====================================================");
    console.log(`🏁 PHASE 4 TEST RESULTS: ${testsPassed} / ${testsTotal} PASSED`);
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
