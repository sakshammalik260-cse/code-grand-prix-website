import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { createApp } from "../src/app.js";
import { prisma } from "../src/config/database.js";
import { SEED_DATA } from "../src/data/seed-data.js";
import { assertIsolatedDatabase } from "./isolation.js";

async function main() {
  assertIsolatedDatabase();
  const server = createApp().listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const origin = "http://127.0.0.1:" + address.port + "/api";
  let checked = 0;
  async function request(method: string, path: string, status: number, token?: string, body?: unknown) {
    const response = await fetch(origin + path, { method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
    const data = response.status === 204 ? null : await response.json();
    assert.equal(response.status, status, method + " " + path + " (" + (data?.error?.code ?? "no error") + ")");
    checked++;
    return data;
  }
  async function login(driverId: string) {
    const user = SEED_DATA.users.find(user => user.driverId === driverId)!;
    return (await request("POST", "/auth/login", 200, undefined, { driverId, password: user.password })).token as string;
  }
  const read = (path: string, status: number, token?: string) => request("GET", path, status, token);
  const write = (path: string, status: number, token: string, body: unknown = {}) => request("POST", path, status, token, body);
  const edit = (path: string, status: number, token: string, body: unknown) => request("PATCH", path, status, token, body);
  const remove = (path: string, status: number, token: string, body?: unknown) => request("DELETE", path, status, token, body);
  const saveRound = (round: any, status: number, token: string) => request("PUT", "/admin/rounds/" + round.id, status, token, round);

  try {
    const [admin, volunteer, candidate] = await Promise.all([login("ADMIN2026"), login("VOLUNTEER2026"), login("CGP2026")]);
    await read("/admin/problems", 401);
    await read("/admin/problems", 403, candidate);
    await read("/admin/rounds", 403, candidate);
    await write("/admin/problems", 403, volunteer);
    const legacy = (await read("/admin/rounds", 200, admin)).find((row: any) => row.id === "cgp_2026");
    assert.equal(legacy.status, "LIVE");
    const now = Date.now();
    const scheduled = { id: "future", title: "Final lap", status: "WAITING",
      startsAt: new Date(now + 60000).toISOString(), endsAt: new Date(now + 120000).toISOString(),
      resultsVisible: false, questionsVisible: true };
    await write("/admin/rounds", 403, volunteer, scheduled);
    await write("/admin/rounds", 400, admin, { ...scheduled, endsAt: scheduled.startsAt });
    await write("/admin/rounds", 201, admin, scheduled);
    await write("/admin/rounds", 409, admin, scheduled);
    const adjusted = { ...scheduled, startsAt: new Date(now + 30000).toISOString() };
    assert.equal((await saveRound(adjusted, 200, admin)).startsAt, adjusted.startsAt);
    await saveRound({ ...adjusted, status: "LIVE" }, 409, admin);

    const create = {
      title: "Admin fixture", statement: ["Read a number and print it."], inputFormat: ["One integer."],
      outputFormat: "The integer.", constraints: ["0 through 10."], points: 120, difficulty: "Easy",
      timeLimitMs: 2000, memoryLimitMb: 128, allowedLanguages: ["javascript"],
      samples: [{ input: "2", output: "2", explanation: "Echo the input." }]
    };
    await write("/admin/problems", 400, admin, { ...create, allowedLanguages: ["unsupported"] });
    let question = await write("/admin/problems", 201, admin, create);
    const path = "/admin/problems/" + question.id;
    const publicPath = "/contest/problems/" + question.slug;
    assert.equal(question.status, "DRAFT");
    assert.equal(question.samples.length, 1);
    await read(publicPath, 404, candidate);
    await edit(path, 403, volunteer, { title: "Forbidden", expectedRevision: question.revision });
    await write(path + "/publish", 400, admin, { expectedRevision: question.revision });
    question = await edit(path, 200, admin, { title: "Edited fixture", expectedRevision: question.revision,
      expectedTimeComplexity: "O(1)", points: 140, difficulty: "Medium", timeLimitMs: 2200, memoryLimitMb: 256 });
    assert.equal(question.title, "Edited fixture");
    assert.equal(question.slug, "admin-fixture");
    assert.equal(question.expectedTimeComplexity, "O(1)");
    await edit(path, 409, admin, { title: "Stale", expectedRevision: question.revision - 1 });

    const added = await write(path + "/testcases", 201, admin, { visibility: "PUBLIC", input: "3", expectedOutput: "3", weight: 1 });
    await edit("/admin/testcases/" + added.id, 200, admin, { visibility: "PUBLIC", input: "4", expectedOutput: "4" });
    const hidden = await write(path + "/testcases", 201, admin,
      { visibility: "HIDDEN", input: "7", expectedOutput: "7", weight: 1.5 });
    const disposable = await write(path + "/testcases", 201, admin, { visibility: "HIDDEN", input: "5", expectedOutput: "5" });
    await remove("/admin/testcases/" + disposable.id, 204, admin);
    assert.equal(hidden.input, undefined);
    const tests = await read(path + "/testcases", 200, admin);
    assert.equal(tests.length, 3);
    assert.equal(tests.find((row: any) => row.id === hidden.id).expectedOutput, undefined);
    assert.equal((await prisma.testCase.findUniqueOrThrow({ where: { id: hidden.id } })).weight, 1.5);
    await read(path + "/testcases", 403, candidate);

    question = await read(path, 200, admin);
    question = await edit(path, 200, admin, { expectedRevision: question.revision,
      samples: question.samples.map((sample: any) => sample.id === added.id ? { ...sample, explanation: "Updated sample" } : sample) });
    assert.equal(question.samples.find((sample: any) => sample.id === added.id).explanation, "Updated sample");
    assert.equal((await prisma.testCase.findUniqueOrThrow({ where: { id: added.id } })).weight, 1);
    assert.equal(await prisma.testCase.count({ where: { id: hidden.id, isPublic: false } }), 1);
    const [hint] = await write(path + "/hints", 201, admin,
      { expectedRevision: question.revision, hint: { order: 1, deductionPoints: 12, content: "Print the value from input." } });
    question = await read(path, 200, admin);
    await edit("/admin/hints/" + hint.id, 200, admin,
      { expectedRevision: question.revision, hint: { order: 1, deductionPoints: 15, content: "Echo the input once." } });
    question = await read(path, 200, admin);
    question = await write("/admin/rounds/future/problems", 200, admin,
      { problemId: question.id, expectedRevision: question.revision, order: 5 });
    assert.equal(question.roundId, "future");
    assert.equal(question.number, 5);
    question = await write(path + "/publish", 200, admin, { expectedRevision: question.revision });
    await read(publicPath, 404, candidate);
    await read("/problems/" + question.id, 404, candidate);
    await read(publicPath + "/hints", 404, candidate);
    const list = await read("/contest/problems", 200, candidate);
    assert.equal(list.some((row: any) => row.id === question.slug), false);
    await write("/checkin", 200, candidate, { rulesAccepted: true, cameraPermission: true, fullscreenRequested: true });
    const code = { problemId: question.slug, language: "javascript",
      sourceCode: 'console.log(require("node:fs").readFileSync(0, "utf8").trim())' };
    await write("/code/run", 404, candidate, code);
    await write("/code/submit", 404, candidate, code);

    const upcoming = { ...adjusted, startsAt: new Date(Date.now() - 1000).toISOString(),
      endsAt: new Date(Date.now() + 60000).toISOString() };
    await saveRound(upcoming, 200, admin);
    await saveRound({ ...upcoming, status: "LIVE" }, 409, admin);
    await saveRound({ ...legacy, status: "FINISHED" }, 200, admin);
    assert.equal((await read("/contest", 200, candidate)).status, "WAITING");
    const waitingDriver = await login("CGP_016");
    const ready = await write("/checkin", 200, waitingDriver,
      { rulesAccepted: true, cameraPermission: true, fullscreenRequested: true });
    assert.equal(ready.session.status, "WAITING");
    await saveRound({ ...upcoming, status: "LIVE" }, 200, admin);
    assert.equal((await read("/session", 200, waitingDriver)).session.status, "ACTIVE");
    assert.equal((await read("/contest", 200, candidate)).roundId, "future");
    const publicQuestion = await read(publicPath, 200, candidate);
    assert.equal(publicQuestion.samples.length, 2);
    assert.equal(publicQuestion.samples.some((row: any) => row.id === hidden.id), false);
    for (const field of ["testCases", "hints", "revision", "publishAt", "roundId"]) assert.equal(publicQuestion[field], undefined);
    await read("/contest/problems/speed-trap-detection", 404, candidate);
    await saveRound({ ...upcoming, status: "PAUSED_BY_ORGANIZER" }, 200, admin);
    await read(publicPath, 404, candidate);
    assert.equal((await read("/contest", 200, candidate)).status, "PAUSED_BY_ORGANIZER");
    await saveRound({ ...upcoming, status: "LIVE", questionsVisible: false }, 200, admin);
    await read(publicPath, 404, candidate);
    await write("/code/run", 404, candidate, code);
    await saveRound({ ...upcoming, status: "LIVE", questionsVisible: true, resultsVisible: true }, 200, admin);
    assert.equal((await read("/contest/results/visibility", 200, candidate)).visible, true);

    const receipt = await write(publicPath + "/hints/" + hint.id + "/unlock", 200, candidate, { operationId: randomUUID() });
    assert.equal(receipt.deductionApplied, 15);
    const submission = await write("/code/submit", 200, candidate, code);
    assert.equal(submission.verdict, "ACCEPTED");
    assert.equal(submission.score, 140);
    question = await write(path + "/unpublish", 200, admin, { expectedRevision: question.revision });
    await read(publicPath, 404, candidate);
    await edit(path, 409, admin, { expectedRevision: question.revision, points: 150 });
    await remove(path, 409, admin, { expectedRevision: question.revision });
    await remove("/admin/hints/" + hint.id, 409, admin, { expectedRevision: question.revision });
    await write(path + "/testcases", 409, admin, { visibility: "HIDDEN", input: "9", expectedOutput: "9" });
    question = await edit(path, 200, admin, { expectedRevision: question.revision, title: "Clarified fixture" });
    const history = await read("/submissions/" + submission.id, 200, candidate);
    assert.equal(history.score, 140);
    const board = await read("/leaderboard", 200, candidate);
    assert.equal(board.rows.find((row: any) => row.driverId === "CGP2026").totalScore, 125);
    assert.equal(await prisma.hintReceipt.count({ where: { problemId: question.id } }), 1);

    const release = Date.now() + 1500;
    question = await write(path + "/publish", 200, admin,
      { expectedRevision: question.revision, publishAt: new Date(release).toISOString() });
    assert.equal(question.status, "SCHEDULED");
    await read(publicPath, 404, candidate);
    await new Promise(resolve => setTimeout(resolve, Math.max(0, release - Date.now()) + 50));
    await read(publicPath, 200, candidate);
    assert.equal((await read(path, 200, admin)).status, "PUBLISHED");
    question = await write(path + "/unpublish", 200, admin, { expectedRevision: question.revision });
    await write(path + "/publish", 200, admin, { expectedRevision: question.revision });
    await saveRound({ ...upcoming, status: "FINISHED" }, 200, admin);
    await read(publicPath, 404, candidate);
    await write("/code/run", 409, candidate, code);
    await saveRound({ ...upcoming, status: "LIVE" }, 409, admin);
    const scratch = await write("/admin/problems", 201, admin, { ...create, title: "Disposable draft" });
    await remove("/admin/problems/" + scratch.id, 204, admin, { expectedRevision: scratch.revision });
    await read("/admin/problems/" + scratch.id, 404, admin);
    const expiry = Date.now() + 3000;
    await write("/admin/rounds", 201, admin, { id: "expiry", title: "Timed finish", status: "LIVE",
      startsAt: new Date(Date.now() - 100).toISOString(), endsAt: new Date(expiry).toISOString(),
      resultsVisible: true });
    const timed = await write("/admin/problems", 201, admin, { ...create, title: "Timed fixture", roundId: "expiry" });
    const timedPath = "/admin/problems/" + timed.id;
    await write(timedPath + "/testcases", 201, admin, { visibility: "HIDDEN", input: "6", expectedOutput: "6" });
    await write(timedPath + "/publish", 200, admin);
    await read("/contest/problems/" + timed.slug, 200, candidate);
    await new Promise(resolve => setTimeout(resolve, Math.max(0, expiry - Date.now()) + 50));
    await read("/contest/problems/" + timed.slug, 404, candidate);
    await write("/code/submit", 409, candidate, { ...code, problemId: timed.slug });
    assert.equal((await read("/admin/rounds", 200, admin)).find((round: any) => round.id === "expiry").status, "FINISHED");
    console.log("Admin and round integration passed " + checked + " HTTP checks plus DTO and database assertions.");
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await prisma.$disconnect();
  }
}

void main().catch(error => { console.error(error); process.exitCode = 1; });
