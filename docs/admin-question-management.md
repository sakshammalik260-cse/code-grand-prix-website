> Phase 4.1 adds hints and standings. Backend transport now requires an explicit VITE_ARENA_MODE=api; unconfigured production requests are blocked. See [current enhancements and contracts](phase-4-1-enhancements.md).

# Administration and custom questions (Phase 4)

Phase 4 extends the existing React/TypeScript app. The backend is not implemented. All endpoints below are proposed contracts and must be agreed with the backend team.

## Roles and authentication

| Area | CANDIDATE | VOLUNTEER | ADMIN |
| --- | --- | --- | --- |
| Public landing and login | Yes | Yes | Yes |
| Check-in, lobby, coding arena | Yes | No | No |
| Candidate results | Only when the contest permits | No | Yes |
| Volunteer incidents and participant monitoring | No | Yes | Yes |
| Admin overview, questions, cases, rounds, participants and results visibility | No | No | Yes |

`SessionProvider` uses `authService.me()` during initialization. In API mode, this calls GET `/auth/me`; the response is the only source for the current role. Shared Axios sends the server's authentication cookies using withCredentials. No role header, browser-stored role, password or bearer token authorizes production requests. The server must protect cookies, validate CSRF for mutations, configure credentialed CORS if needed, and enforce authorization independently of the frontend.

`RequireRole` redirects unauthenticated users to `/login`, waits for account verification, and renders the racing-themed 403 page for a signed-in account with the wrong role. ADMIN and VOLUNTEER are distinct. Candidate routes and staff route modules are separated; staff navigation is never rendered in the candidate workspace.

POST `/auth/login` is an additional proposed endpoint: `{ driverId, password }` returns the verified identity `{ id, name, team, role }` and establishes a server session. GET `/auth/me` returns the same identity or 401. POST `/auth/logout` invalidates the server session. Passwords are not persisted. Sign-out failures are surfaced rather than claiming the server session was terminated.

### Development accounts

Run `npm.cmd run dev` with `VITE_ARENA_MODE=mock` (the default). Expand Preview access on login:

| Role | ID | Password |
| --- | --- | --- |
| CANDIDATE | CGP2026 | Race2026! |
| VOLUNTEER | VOLUNTEER2026 | Marshal2026! |
| ADMIN | ADMIN2026 | Control2026! |

These are public testing credentials, loaded only in Vite DEV mode. SessionStorage stores the mock account ID; the mock authentication adapter maps it to a known test account and ignores stored role values. This is editable demo state, not security. LocalStorage role values are never read. The candidate can no longer grant a volunteer preview role or self-approve a lock. Sign in separately as VOLUNTEER or ADMIN to review incidents.

**Production always uses API adapters**, even if VITE_ARENA_MODE is accidentally left as mock. Development account controls, demo account credentials, seed question statements and mock administrative services are excluded from the production bundle. The real administration UI remains in production behind role guards. API failures never fall back to mock data or mock mutations. `npm run preview` therefore requires the proposed backend; use the dev server to test mock workflows.

## Admin workflows

- `/admin`: six service-derived metrics: total, draft and published questions, competition status, participants and active rounds.
- `/admin/questions`: title/ID search, difficulty/status filters, add/view/edit, draft deletion with confirmation, round assignment, draft save, scheduled publication, publish and unpublish/cancel schedule.
- The editor supports multiline descriptions, formats, constraints, structured public examples, difficulty, points, expected complexity, time/memory limits, language allowlist and round assignment. IDs and sequence numbers are service-assigned. Published/scheduled questions are read-only until unpublished; test-case changes follow the same policy. Revision checks reject conflicting edits.
- Test-case management supports public and hidden case forms, edit, confirmed removal and optional positive weights. Public cases join public samples. Hidden content is write-only, never included in question drafts or candidate DTOs, and is cleared from the form after submission.
- `/admin/contests`: create/update round identity, title, official state, start/end times and result visibility. Datetime inputs use the browser timezone and APIs receive UTC ISO timestamps.
- `/admin/participants`: service-derived monitoring sessions, with refresh.
- `/admin/results`: controls candidate results visibility. Official standings/scoring remain the existing later-phase results placeholder; no standings are invented. The Results page is gated by a visibility endpoint.
- `/volunteer`: ADMIN and VOLUNTEER may review incidents, keep a session locked, escalate or authorize resume. Monitoring receipt roles now use VOLUNTEER and ADMIN consistently with authentication. The older PARTICIPANT/ORGANIZER API vocabulary is superseded by CANDIDATE/ADMIN.

## Question and test-case contracts

All paths are relative to `VITE_API_BASE_URL` (default `/api`). Use HTTPS for deployed authentication and hidden-test form submissions. Sensitive payloads must never be logged or echoed in errors.

`ProblemInput`:

```ts
{
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  statement: string[];
  inputFormat: string[];
  outputFormat: string;
  constraints: string[];
  samples: { id: string; input: string; output: string; explanation: string }[];
  expectedTimeComplexity?: string;
  expectedSpaceComplexity?: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  allowedLanguages: ('python' | 'java' | 'cpp' | 'javascript')[];
  roundId: string | null;
}
```

`AdminProblem` adds `{ id, number, revision, status: 'DRAFT'|'SCHEDULED'|'PUBLISHED', publishAt: string|null }`. Dates are ISO UTC. A scheduled release must be future-dated. Publishing requires valid fields, complete public samples, permitted languages and an existing assigned round. The backend validates all of these, uses monotonic revisions and must atomically enforce publication/assignment eligibility.

| Endpoint | ADMIN request | Response |
| --- | --- | --- |
| POST `/admin/problems` | ProblemInput; creates DRAFT | AdminProblem |
| GET `/admin/problems` | Optional AbortSignal client-side; backend scopes authorized contest | AdminProblem[] |
| GET `/admin/problems/:id` | Server verifies question ownership/scope | AdminProblem |
| PATCH `/admin/problems/:id` | ProblemInput plus expectedRevision | Updated AdminProblem |
| DELETE `/admin/problems/:id` | `{ expectedRevision }`; draft only | 204 |
| POST `/admin/problems/:id/publish` | `{ expectedRevision, publishAt: null }` for now, or future UTC date to schedule | Updated AdminProblem |
| POST `/admin/problems/:id/unpublish` | `{ expectedRevision }`; also cancels scheduled release | Updated DRAFT AdminProblem |
| POST `/admin/rounds/:id/problems` | `{ problemId, expectedRevision }`; assign an existing draft to this round | Updated AdminProblem |
| POST `/admin/problems/:id/testcases` | TestCaseInput below | AdminTestCase metadata/public data |
| GET `/admin/problems/:id/testcases` | Server-verified ADMIN | AdminTestCase[] |
| PATCH `/admin/testcases/:id` | Replacement TestCaseInput | Updated AdminTestCase |
| DELETE `/admin/testcases/:id` | Server verifies case/question/contest scope | 204 |

`TestCaseInput = { input: string, expectedOutput: string, visibility: 'PUBLIC'|'HIDDEN', weight: number|null }`.

`AdminTestCase = { id, problemId, visibility, weight, input?: string, expectedOutput?: string }`. Hidden entries return metadata only: omit input and expectedOutput. Editing a hidden entry requires replacement content; the old contents are never fetched into the browser. Persist hidden content only on the authenticated backend. No reference-solution field or retrieval endpoint is provided.

The DEV mock persists only public question data, public test cases and hidden metadata under `cgp-development-question-catalog-v1`. **Hidden input and expected output are discarded immediately**, rather than stored in frontend files, LocalStorage, SessionStorage or the mock ledger. Thus hidden-case forms can be reviewed, but actual hidden-case storage/evaluation requires the backend. The public DEV catalog (including draft descriptions) is editable browser data and is never used in production.

## Candidate problem contracts

| Endpoint | Authorized scope | Response |
| --- | --- | --- |
| GET `/contest/problems` | CANDIDATE; server derives participant's contest/round and release eligibility | ProblemSummary[] |
| GET `/contest/problems/:id` | Same; reject unpublished, scheduled-before-release, wrong-round, removed or inaccessible IDs | Public Problem |
| GET `/auth/me` | Authenticated account | Verified identity described above |

ProblemSummary contains `{ id, number, title, difficulty, points, allowedLanguages }`. Public Problem adds the public fields in ProblemInput (without roundId) and never contains administration metadata, private cases or reference solutions. Candidate listing and detail endpoints must not send unpublished questions. Eligibility and language allowlists must also be rechecked by the backend on every Run/Submit request, along with the Phase 3 session lock and official contest clock.

`candidateProblemService` now owns listing and details. The existing arena service delegates to it; CodeMirror, scoped draft keys and Run/Submit integration are retained. On initial load and race refresh, the arena fetches available problems, loads selected details and handles no questions, invalid IDs and unavailable details. It refreshes contest/list/detail state every 15 seconds. Published questions can appear without rebuilding. Supported languages are narrowed to each question's allowlist; an explicit invalid language does not overwrite the old draft and cannot execute. A question removed/unpublished while open becomes unavailable; local drafts are retained. The official timer still gates execution and is not paused by monitoring incidents.

The mock allows released questions after contest start and keeps them readable after the finish; Run/Submit closes at finish. WAITING and future start windows expose no statements. Publication scheduling is evaluated by the DEV mock using browser time; real release timing must be server-controlled. Only the current event round is a playable demo; additional rounds can be managed and assigned, with real participant-round allocation requiring the backend.

## Additional proposed endpoints

| Endpoint | Role | Contract |
| --- | --- | --- |
| GET `/admin/overview` | ADMIN | `{ totalQuestions, draftQuestions, publishedQuestions, competitionStatus, participants, activeRounds }` |
| GET `/admin/rounds` | ADMIN | ContestRound[] |
| PUT `/admin/rounds/:id` | ADMIN | ContestRound in and out; validate timing, authorization and concurrent modifications server-side |
| GET `/contest/results/visibility` | CANDIDATE or ADMIN | `{ visible: boolean }`; server scopes participant's round and must protect actual standings too |

ContestRound is `{ id, title, status: 'WAITING'|'LIVE'|'PAUSED_BY_ORGANIZER'|'FINISHED', startsAt, endsAt, resultsVisible }`. Round mutations must not implicitly grant extra time or rescore entrants. The mock shares current-event round settings with the existing mock arena clock; it is only a development fixture.

Phase 3 monitoring endpoints remain: GET `/session`, POST `/violations`, GET `/volunteer/incidents`, GET `/volunteer/participants`, POST `/volunteer/incidents/:id/resolve`. Staff endpoints require VOLUNTEER or ADMIN. The session envelope's viewer uses the three current roles. Server-derived identity and authorization are mandatory on every endpoint. Use 401 for missing/expired authentication, 403 for role/scope denial, 404 for unavailable question details without leaking restricted content, 409 for stale revisions and 422 for invalid form data. Proposed pagination/filter server contracts can be added later; this frontend currently filters the authorized admin list locally.

## Testing and handoff

Run:

```sh
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
node scripts/verify-monitoring.mjs
node scripts/verify-drafts.mjs
```

1. Sign in as CANDIDATE. `/admin` and `/volunteer` must show 403; an unauthenticated direct visit redirects to login. Candidate results remain withheld until enabled by ADMIN.
2. Sign in as VOLUNTEER. Review incidents and participant sessions. Administrative routes and mock question mutations must reject the role.
3. Sign in as ADMIN. Create a draft with public examples, validate missing fields, edit it, add public/hidden cases, adjust weights, assign a round and publish/schedule. Unpublish to edit or delete drafts. Check search/difficulty/status filters.
4. Configure the current event round as LIVE with valid start/end times. Candidate check-in retains the local camera stream through lobby and arena. The published question should appear, with only its permitted languages and public examples. Direct unpublished IDs must be unavailable.
5. Write a draft, Run and Submit in mock mode. Trigger a development monitoring incident; code stays saved and readonly under the lock. Sign in separately as VOLUNTEER to authorize, then return as CANDIDATE and restore the monitoring setup. The draft survives. Review the detailed Phase 3 recovery procedure in `phase-3-monitoring.md`, with the role-preview/self-approval mechanism superseded as described above.
6. Build production: test credentials, seed statements and development simulation controls must be absent. Production API failures must show errors and never fabricate data or succeed through mock operations.

Remaining backend work: authenticated sessions/CSRF, role and contest-scope authorization, transactional question/test/round storage, private test ingestion and judging, publication scheduler, revision conflicts/audit records, participant-round allocation, official standings/scoring and all Phase 3 enforcement/notifications. Physical camera and lab-browser checks are still required. Frontend role guards provide navigation UX; they do not provide production security.
## Files created or modified

| Group | Files |
| --- | --- |
| Authentication and roles | `src/types/index.ts`, `src/context/session.ts`, `src/context/SessionProvider.tsx`, `src/services/auth.ts`, `authMock.ts`, `access.ts`, `mode.ts`, `api.ts`, `src/pages/LoginPage.tsx`, `src/components/DevelopmentAccounts.tsx`, `RequireRole.tsx`, `ResultsAccess.tsx`, `Layout.tsx`, `src/App.tsx` |
| Administration UI | `src/pages/admin/AdminPage.tsx`, `AdminSections.tsx`, `QuestionManagement.tsx`, `src/components/admin/QuestionEditor.tsx`, `TestCaseManager.tsx`, `src/styles/admin.css`, `src/hooks/useRemoteResource.ts`, `src/index.css` |
| Question contracts and adapters | `src/types/problems.ts`, `src/services/problems/index.ts`, `backend.ts`, `mock.ts`, `contracts.ts`, `validation.ts` |
| Existing arena integration | `src/types/arena.ts`, `src/services/arena/index.ts`, `mock.ts`, `backend.ts`, `mockState.ts`, `execution.ts`, `submission.ts`, `src/pages/ArenaPage.tsx`, `LobbyPage.tsx`, `src/components/Countdown.tsx`, `src/components/arena/CodeEditor.tsx`, `ProblemStatement.tsx`, `src/data/problems.ts` |
| Monitoring role migration | `src/types/monitoring.ts`, `src/services/monitoring/index.ts`, `backend.ts`, `mock.ts`, `client.ts`, `sessionRules.ts`, `src/components/monitoring/MonitoringDevPanel.tsx`, `MonitoringStatus.tsx`, `src/pages/VolunteerPage.tsx` |
| Verification and handoff | `scripts/verify-questions.mjs`, `scripts/verify-monitoring.mjs`, `.env.example`, `README.md`, `docs/phase-3-monitoring.md`, this document |

## Verification evidence

Build and lint pass. Native Node checks cover question/test/round validation, DTO field whitelists, invalid or private candidate response rejection, session revisions/approval receipts and existing draft isolation/recovery. Use `node scripts/verify-questions.mjs` for the added question checks.

Isolated Chrome browser checks cover all three logins, unauthenticated redirects, candidate/staff 403s, administrative service role rejection, draft creation/editing, public/hidden test forms, assignment, scheduling/cancellation, publish/unpublish, dynamic arena loading, permitted languages, Run/Submit, autosave, a monitoring lock, separate volunteer authorization and draft restoration. Additional UI checks cover public-case edits/weights, write-only hidden replacement, case removal, draft deletion, search/difficulty/status filters and enabling candidate result visibility.

Production-preview checks use **intercepted API responses**, not a real backend: forged browser roles still redirect to login; a server-reported volunteer receives 403 on administrative routes; a server-reported admin receives API-derived metrics; an administrative API failure displays an error without using a locally seeded mock catalog. No client role header is sent. Production JavaScript is scanned for development credentials, seed statements, mock role controls and simulators.

Reviewed screenshots include `.qa/phase4-admin-1440x900.png`, `.qa/phase4-admin-1366x768.png`, `.qa/phase4-questions-1440x900.png`, `.qa/phase4-testcases-1440x900.png`, `.qa/phase4-candidate-403-1440x900.png`, `.qa/phase4-lock-1440x900.png` and `.qa/phase4-production-login-1440x900.png`. Screenshots/browser scripts are local ignored QA artifacts. Media hardware is simulated; the browser uses actual fullscreen activation. Backend authorization itself cannot be verified until its implementation is available.
