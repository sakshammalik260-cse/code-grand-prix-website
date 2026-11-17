# Phase 3: session monitoring and volunteer review

Implemented in the existing React application; no backend or dependencies added. The arena remains mounted under the Race Control overlay. CodeMirror 6, selected problem/language, results, drafts and the official countdown are preserved. A lock never grants time or independently pauses the clock. Existing server-authorized contest pause handling remains in the arena clock.

## Features and structure

| Files | Responsibility |
| --- | --- |
| `src/types/monitoring.ts` | Typed incidents, sessions, permissions, approvals, viewer roles and service contracts. |
| `src/services/cameraStore.ts`, `src/hooks/useCamera.ts`, `src/components/CameraLifecycle.tsx` | One shared local video stream, permission/interruption handling and intentional cleanup. |
| `src/hooks/useContestMonitoring.ts` | Active-arena-only visibility, separate focus, fullscreen and camera monitoring; transition deduplication and permission-dialog suppression. |
| `src/services/monitoring/client.ts`, `sessionRules.ts` | Configurable polling, queued idempotent reports, stale revision rejection, scope checks and verified authorization handling. |
| `src/services/monitoring/index.ts`, `backend.ts`, `mock.ts`, `ledger.ts` | Replaceable API adapter and explicitly labeled IndexedDB demo authority. |
| `src/components/monitoring/MonitoringStatus.tsx`, `ViolationLockOverlay.tsx` | Accurate header status, accessible blocking Race Control dialog, recovery and draft-save actions. |
| `src/components/monitoring/MonitoringDevPanel.tsx` | Lazy development-only mock simulator, excluded from production JavaScript. |
| `src/pages/VolunteerPage.tsx`, `src/styles/monitoring.css` | Role-gated review dashboard, participant/session summary, search, review notes and three resolution decisions. |
| `src/pages/ArenaPage.tsx`, `components/arena/ArenaHeader.tsx`, `CodeEditor.tsx` | Integration, policy-driven readonly/navigation/execution gating, mounted workspace preservation. |
| `src/hooks/useArenaExecution.ts`, `useDraft.ts`, `src/types/arena.ts`, `src/services/arena/{backend,execution,submission}.ts` | Session IDs in execution requests, independent mock-service lock checks and save-draft action. |
| `src/App.tsx`, `components/Layout.tsx`, `pages/CheckInPage.tsx`, `LobbyPage.tsx`, `PlaceholderPages.tsx`, `src/index.css` | Existing route integration, camera lifecycle copy and stylesheet wiring. |
| `scripts/verify-monitoring.mjs` | Session identity, revisions, approval receipts, relocking and execution policy checks. |

Camera access uses video only. The same stream survives check-in, lobby and arena navigation. It is stopped on sign-out, app teardown or leaving those routes. Track end, sustained mute, stream inactivity, permission revocation and periodic video-track health checks detect interruptions where browser support permits. No footage is recorded or uploaded. Camera and fullscreen restoration require explicit user interaction. Escape and browser emergency controls remain available.

A confirmed hidden transition reports TAB_HIDDEN; window blur alone reports nonblocking WINDOW_FOCUS_LOST. Normal unload/navigation cancels deferred visibility reports; initial rendering and the application's camera/fullscreen dialogs do not cause violations. Browser focus signals are evidence for review, not proof of cheating.

The client immediately blocks on queued blocking incidents, retries them with stable IDs and retains confirmed locks across refresh. ACTIVE cannot clear an existing lock without a newer privileged approval receipt. Returning to the tab, restoring fullscreen/camera, route changes and localStorage clearing do not approve a session. The mock execution and submission adapters independently check the demo ledger before and after processing.

## Configuration

- `VITE_ARENA_MODE=mock` selects demo arena and monitoring services. Use `api` only after the backend contracts are implemented.
- `VITE_API_BASE_URL=/api` centrally configures the existing Axios client.
- `VITE_MONITORING_POLL_MS=2000` controls polling (clamped to 1000-30000 ms). No WebSocket infrastructure was added because none is provided.
- Open the **Monitoring simulator - DEV** disclosure in the arena/overlay for simulated incidents, approval, refresh, disconnect and reconnect. It requires both Vite DEV mode and mock mode. Restoration refreshes service state; it does not manufacture approval.
- `/volunteer` offers **ENTER MOCK VOLUNTEER PREVIEW** only in mock mode. It is explicitly a demo role selector, not authentication. API mode requires a server-reported VOLUNTEER or ORGANIZER role.

## Proposed backend contracts

All paths below are relative to VITE_API_BASE_URL. They do not yet exist in this project. Exact TypeScript interfaces are in `src/types/monitoring.ts`.

| Endpoint | Request | Response |
| --- | --- | --- |
| GET `/session` | Participant query `contestId`; identity comes from server authentication. Volunteer viewers may omit the query. | `SessionEnvelope`: `{ viewer, session, serverTime }`; session may be null for a volunteer viewer. |
| POST `/violations` | `IncidentRequest`: `{ clientEventId, contestId, driverId, sessionId, type, observedAt, problemId }`; `Idempotency-Key` header equals clientEventId. | `{ incident, session }` with authoritative incident ID/time, policy and revision. |
| GET `/volunteer/incidents` | Authenticated privileged viewer; backend scopes accessible contest. | `Incident[]`. |
| GET `/volunteer/participants` | Same privileged scope. | `CompetitionSession[]`. |
| POST `/volunteer/incidents/:id/resolve` | `{ decision, expectedSessionRevision, note }`. Decisions: AUTHORIZE_RESUME, KEEP_LOCKED, ESCALATE. | `{ incident, session, authorization }`. Reject stale revisions (409); validate role and incident scope. |

CompetitionSession contains `id`, `contestId`, `driverId`, `status`, monotonic `revision`, `updatedAt`, `serverTime`, `policy: { allowExecution, allowEditing, allowNavigation }`, `latestIncident`, `resumeAuthorization`, `volunteerNotified` and `simulation`. Status supports ACTIVE, LOCK_PENDING, LOCKED, UNDER_REVIEW, RESUME_AUTHORIZED and FINISHED.

Incident extends the request with `id`, authoritative `timestamp`, `reviewStatus`, `blocking` and `simulation`. Authorization contains `id`, `incidentId`, `decision`, `actorId`, privileged `actorRole`, authoritative `decidedAt` and `simulation`. Viewer contains `id`, `role` and `simulation`.

The server must derive identity/roles, validate every scope and session ID, assign timestamps/revisions, deduplicate event IDs, reject expired authentication with 401/403 and enforce locks on every run/submission endpoint. New run/submit requests include sessionId. Never trust the supplied driver ID, observed time, browser policy or approval data as authority. Real notifications should set volunteerNotified only after notification succeeds. The UI otherwise says acknowledgment/review is pending; mock mode never claims a real volunteer was notified.

## Recovery procedure

1. Keep the participant at their station. Use Save draft now; do not clear browser storage. The clock continues unless the backend explicitly authorizes a pause.
2. Restore connectivity and select Refresh status. Queued incidents retry with the same IDs. An existing lock stays visible during failure. An unknown/disconnected session cannot execute code.
3. An authenticated organizer or volunteer reviews incidents and notes in the dashboard. KEEP LOCKED retains the lock; ESCALATE puts it under review. AUTHORIZE RESUME records a privileged receipt. All outstanding blocking incidents must be resolved in the mock implementation.
4. After the confirmed approval reaches the participant through polling, explicitly restore camera/fullscreen if needed. Only then can Run/Submit resume. Expired authentication offers Sign in again; drafts remain scoped in localStorage and the service retains the lock.
5. If the API remains unavailable, organizers must restore the service or use an authenticated server-side recovery procedure with audit records. This frontend intentionally has no offline participant bypass. Any extra time requires an official backend contest adjustment.

## Verification and remaining work

Automated browser checks in isolated headless Chrome use fake media hardware, actual Fullscreen API transitions, simulated visibility/focus events, track-ended interruption and denied camera recovery. They cover normal login/check-in/lobby/arena, stream reuse, locked readonly state, autosaving/results preservation, duplicate IDs, service-side demo rejection, refresh/localStorage clearing, permission recovery, approval, disconnect/reconnect and volunteer decisions. Screenshots are retained locally in `.qa/phase3-lock-1440x900.png`, `.qa/phase3-lock-1366x768.png`, `.qa/phase3-arena-active-1440x900.png` and `.qa/phase3-volunteer-1440x900.png`. The lock layout was visually reviewed against reference 06. Browser scripts/screenshots are local QA artifacts, ignored by Git.

Run `npm.cmd run build`, `npm.cmd run lint`, `node scripts/verify-monitoring.mjs` and `node scripts/verify-drafts.mjs` for repository checks.

Remaining: implement the proposed authenticated backend, server-side run/submit enforcement, audit/notification infrastructure, organizer recovery policy and retention policy; confirm contest timing/pause semantics; test physical camera removal/revocation, actual tab switching and fullscreen behavior on the competition lab browsers. Browser JavaScript cannot guarantee cheating prevention. The IndexedDB mock ledger and browser caches are editable demo persistence, not security. No secrets, hidden tests, correct solutions, audio recording or DevTools detection are included. Results remains the existing placeholder for a later phase.
Validation completed: production build, ESLint, session-policy checks and existing draft checks passed. The full browser workflow passed with no application runtime exceptions. Additional browser service tests confirmed offline restoration of a known lock with no pending reports, 401 authentication expiry and retention of a queued incident after an invalid acknowledgment. Production JavaScript was checked to exclude development simulation labels and the simulator component.
