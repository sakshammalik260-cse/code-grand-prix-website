# Monitoring lock and session authorization fix

Implemented in the existing frontend. Backend integration remains paused. Development uses the existing IndexedDB mock ledger; production uses the typed adapter only when explicitly configured for API mode.

## Root cause and monitoring changes

The DOM listeners armed once and did not disarm after a lock. `MonitoringClient.report` accepted events in any unfinished session. Every later browser transition could therefore create another blocking incident with a fresh event ID. Individual approval correctly left other blocking records unresolved, which exposed the repeated-lock cycle.

`canReportIncident` now permits creation only in ACTIVE or RESUME_AUTHORIZED with execution policy enabled, no locally pending blocking event and no expired authentication. Both the hook and client enforce this guard. The hook also cancels deferred events and disarms on lock/pending states. The client requires the hook to arm it explicitly. Offline capture from an already armed active session still works.

Re-arming waits for confirmed authorization, an empty local queue, a visible arena, an active camera and fullscreen. Restoration establishes fresh camera/fullscreen/visibility baselines, so missing requirements during recovery do not become new violations. Permission requests remain explicit. A genuine violation after re-arming creates a new incident.

This guard applies to **new event creation**, never to the retry loop. Existing queued requests are delivered unchanged, including their original clientEventId, until an exact session/scoped acknowledgment arrives. No queue is cleared on approval, return-to-tab, permission recovery or connection failure. An unseen report that reaches the authority later must still be reviewed if it creates a new confirmed lock; it is never silently approved based on client timestamps. Restore connectivity and let pending delivery synchronize before final staff review.

## Volunteer workflow

Race Control defaults to one row per session: driver, current status, latest violation/time, unresolved blocking count and Review session. Incident history retains all rows and individual incident review actions.

1. Open Review session for the locked driver.
2. Read all outstanding blocking incidents, types, timestamps and identifiers. OPEN, KEPT_LOCKED and ESCALATED historical blocking records are included.
3. Choose AUTHORIZE & RESUME SESSION, then confirm the displayed count and session revision.
4. One request resolves the entire confirmed set. One ledger transaction stores the incident updates, session revision/policy and one privileged session authorization receipt.
5. The candidate receives the authoritative session through existing polling. The overlay remains until authorization is confirmed, **all** local reports are acknowledged, connectivity is verified and camera/fullscreen/visibility requirements are restored.

KEEP SESSION LOCKED closes review without changing the existing lock or manufacturing an approval. Existing individual KEEP LOCKED / ESCALATE decisions remain available in history. VIEW INCIDENT HISTORY opens the driver's audit rows. No added time, editor remount, draft deletion, database reset or candidate approval control is involved.

Confirmation freezes the expected revision, incident IDs and idempotency key. A changed revision/set disables confirmation until staff review again. Network errors preserve the request key for retry and do not report success. Already-authorized/no-outstanding states display service state and disable a new bulk decision. Confirmed responses update the dashboard immediately; older polled session revisions cannot overwrite newer state.

## Typed future API contract

POST `/api/volunteer/sessions/:sessionId/authorize-resume` (base URL remains configurable).

Header: `Idempotency-Key: <idempotencyKey>`.

```ts
interface SessionAuthorizationRequest {
  contestId: string
  driverId: string
  decision: 'AUTHORIZE_RESUME'
  expectedSessionRevision: number
  expectedIncidentIds: string[]
  note: string
  idempotencyKey: string
}
interface SessionAuthorizationResponse {
  session: CompetitionSession
  incidents: Incident[] // exact covered records, now AUTHORIZED
  authorization: SessionAuthorization
}
```

The receipt includes an ID, sessionId, coveredIncidentIds, incidentId (legacy receipt compatibility), decision, actorId, actorRole, decidedAt and simulation flag. The session's resumeAuthorization contains that same receipt. The mock stores the request/audit note, its fingerprint and confirmed response per actor/session/idempotency key. Identical retries return the original receipt, even after the expected revision has advanced; reusing a key with changed input conflicts. A different concurrent request with an old revision conflicts. UI consumers must retain newer authoritative snapshots if a replayed receipt describes an earlier revision.

Driver ID identifies the participant; session ID identifies one competition session; incident ID identifies an authoritative audit record; client event ID identifies a report and remains stable across retries. Bulk operations target the **session ID**, with contest/driver scope verified independently. Coverage lists **incident IDs**, not driver IDs or client event IDs.

## Ledger compatibility and atomicity

The database remains `cgp-monitoring-demo-v1`, version 1, with the same ledger store and state key. `sessionAuthorizations` is optional and initialized lazily. Existing sessions, incident IDs/event IDs/timestamps, drafts, hint unlocks and scores are retained. No migration or reset is needed.

`authorizeSessionInLedger` validates staff role, scope, current locked state, expected revision and exact outstanding incident set before mutation. It runs synchronously within one existing `ledgerTransaction(true, ...)`. All covered statuses and the new session receipt commit together; transaction failure aborts them together. History is retained. Individual resolution also rejects already-authorized incidents, avoiding a later stale audit action changing an approved record.

## Security boundary and remaining backend requirements

Only authenticated VOLUNTEER or ADMIN accounts can invoke mock authorization. Candidate routing and service checks reject access. Development instructions point to a separate staff login/tab; no self-approval shortcut was added. Simulator modules, mock credentials and mock ledger authority are excluded from production output.

The real backend must derive identity/role, enforce contest assignment and target-session scope, serialize revision/set validation and authorization in a database transaction, persist idempotency results/audit notes, issue trustworthy timestamps/receipts, and reject unauthorized or stale requests (401/403/409). It must deduplicate violation event IDs and independently enforce session locks on run/submit. Client timestamps, browser storage, the DOM guard and the editable development ledger are not security authorities. No backend endpoints, notifications, camera upload or DevTools restrictions were implemented.

## Changed files

- `src/hooks/useContestMonitoring.ts`, `src/services/monitoring/client.ts`, `sessionRules.ts`: creation guards, disarming/re-arming, pending synchronization and approval validation.
- `src/types/monitoring.ts`, `src/services/monitoring/{index,backend,mock,ledger,sessionAuthorization}.ts`: typed bulk adapter and atomic development authority.
- `src/pages/VolunteerPage.tsx`, `src/components/monitoring/SessionReviewPanel.tsx`, `src/styles/monitoring.css`: session view, confirmation, conflicts and retained incident history.
- `src/pages/ArenaPage.tsx`, `src/components/monitoring/ViolationLockOverlay.tsx`: keep recovery overlay until requirements and queue are ready; display approval coverage.
- `src/components/monitoring/MonitoringDevPanel.tsx`: separate-account bulk testing instructions.
- `scripts/browser-qa.mjs`, `scripts/verify-monitoring.mjs`, `scripts/verify-monitoring-browser.mjs`: multi-tab regression coverage.

## Verification

Run `npm.cmd run build`, `npm.cmd run lint`, `node scripts/verify-monitoring.mjs`, `node scripts/verify-drafts.mjs`, `node scripts/verify-questions.mjs`, and `node scripts/verify-assist.mjs`.

Browser regression: start Vite at localhost:5173 and an **isolated fresh Chrome profile** with remote debugging at localhost:9225, fake video device/permission flags, then run `node scripts/verify-monitoring-browser.mjs`. Never use a personal or live competition browser profile. The script uses development-only fixture imports and asserts mock login is available through the normal flow. It preserves the test profile's resulting audit data rather than resetting the database. Use a fresh isolated profile for each full run because the main scenario expects a new competition session.

Browser coverage includes real candidate/staff tab switching, repeated events while locked, candidate service/route denial, explicit session confirmation, four historical blocking incidents, camera-ended recovery, fullscreen restoration, editor/selection/language/history preservation, run/submit after resumption, unchanged official end time, genuine new violations, original queued-event retry after restart/reconnect, concurrent IndexedDB approvals and same-key replay, full incident history and draft persistence after refresh. Additional confirmation checks cover stale revisions, disconnected retry and responsive review at 1440x900, 1366x768 and 390x844.

Local screenshots: `.qa/monitoring-session-review-1440x900.png`, `.qa/monitoring-session-review-1366x768.png`, `.qa/monitoring-session-review-390x844.png`, `.qa/monitoring-historical-session-review.png`, `.qa/monitoring-bulk-authorized.png`, `.qa/monitoring-restored-arena.png`. QA artifacts remain ignored by Git.

Completed on November 18, 2026:

- `npm.cmd run build`: passed (TypeScript and Vite production build).
- `npm.cmd run lint`: passed.
- Monitoring, draft, question and assist native verification scripts: passed.
- `node scripts/verify-monitoring-browser.mjs`: passed all lock/review/restore regressions in isolated headless Chrome with two real tabs and fake video hardware, including a pending nonblocking focus report immediately followed by a real tab switch. No application runtime exceptions.
- Existing production access matrix: passed using controlled local API response fixtures (unauthenticated, CANDIDATE, VOLUNTEER, ADMIN and invalid role). Forged browser role values did not grant access. This is fixture testing, not a connected backend.
- Unconfigured production access checks: passed; no backend requests or development authentication fallback.
- Default and API-mode production asset scans: passed; development simulator labels, mock passwords, mock database name and mock authorization authority absent; typed session endpoint retained.
- Review screenshots inspected at desktop and mobile sizes. No horizontal panel overflow.
- `git diff --check`: passed.

Remaining operational verification: physical camera removal/permission revocation and fullscreen behavior in the competition lab browsers. Automated camera tests use fake video hardware and a real track-ended event handler. Actual server authorization, contest staff assignment, durable audit/idempotency records and enforcement remain future backend work.
