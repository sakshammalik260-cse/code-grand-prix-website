# Code Grand Prix Phase 9 integration

Frontend branch `feat/premium-homepage-motion`. Backend branch `backend-hardening-cgp`. The projects run from separate checkouts.

## Run the frontend and backend locally

From the backend directory, install dependencies and generate the Prisma client. Use the existing local configuration for PostgreSQL and JWT signing. Apply pending migrations to the local schema before starting the regular server.

```powershell
Set-Location C:\Users\Saksham\code-grand-prix-backend
npm.cmd ci
npm.cmd run prisma:generate
npm.cmd exec -- prisma migrate deploy
$env:PORT = '4000'
$env:JUDGE_PROVIDER = 'judge0'
$env:ALLOW_DEV_FALLBACK = 'false'
npm.cmd run dev
```

The regular server uses your configured database and contest schedule. For an isolated test with demo accounts, use `node --import tsx tests/browser-server.ts` in place of the migration and server commands. It creates, migrates, and seeds a temporary schema, starts the API on port 4010, and removes the schema when stopped with Enter or Ctrl+C. Use a local PostgreSQL account with permission to create schemas. The existing test fixture creates a currently live round. Use a fresh fixture for each full browser run because the admin journey deliberately closes its rounds.

In a second terminal, start Vite. Use port 4010 as the proxy target for the isolated browser fixture.

```powershell
Set-Location C:\Users\Saksham\code-grand-prix-website
npm.cmd ci
$env:VITE_ARENA_MODE = 'api'
$env:VITE_API_BASE_URL = '/api'
$env:CGP_API_PROXY_TARGET = 'http://127.0.0.1:4000'
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open `http://127.0.0.1:5173`. The development proxy keeps the browser and API on the same origin, including the HttpOnly authentication cookie. For mock frontend development, set `VITE_ARENA_MODE` to `mock`. A production build requires `VITE_ARENA_MODE=api` and an upstream that serves or proxies `/api`. Use HTTPS and the backend's secure cookie configuration for a deployed environment.

## API contracts

| Flow | Contract |
| --- | --- |
| Authentication | `POST /api/auth/login`, `GET /api/auth/me`, and `POST /api/auth/logout` use server-issued cookies. Route access follows the server-reported role. |
| Check-in | `POST /api/checkin` sends rules acceptance and device readiness flags. `GET /api/session` restores the saved check-in and session status. Video stays in the browser. |
| Contest and arena | `GET /api/contest` supplies the current round and server clock. `GET /api/contest/problems` and `GET /api/contest/problems/:id` supply eligible questions and public samples. `GET /api/contest/progress` supplies authoritative progress. |
| Execution | `POST /api/code/run`, `POST /api/code/submit`, and `GET /api/submissions/:id` supply execution and submission results. Java uses `Main.java` and `public class Main`. |
| Race Assist and standings | `GET /api/contest/problems/:id/hints` and `POST /api/contest/problems/:id/hints/:hintId/unlock` use server-scoped, idempotent hint receipts. `GET /api/leaderboard` and `GET /api/contest/results/visibility` enforce publication rules. |
| Race Control | `POST /api/violations` reports idempotent events. Staff read `/api/volunteer/participants` and `/api/volunteer/incidents`. Incident review records a decision. Session authorization checks the revision and exact blocking incident set before recovery and returns a persisted receipt. |
| Administration | `/api/admin/overview` supplies `activeRoundCount`. `/api/admin/problems`, its publication and test-case routes, `/api/admin/rounds`, and `/api/admin/results/visibility` support the existing organizer workflow and enforce backend permissions. |

## Reproduce browser checks

Start the isolated API fixture on port 4010 and Vite in API mode as above. Start three Chrome test profiles on DevTools ports 9225, 9226, and 9227. Use distinct temporary `--user-data-dir` values and the `--use-fake-ui-for-media-stream` and `--use-fake-device-for-media-stream` flags for the candidate fixture. Run `node scripts/verify-backend-browser.mjs` in the frontend checkout. The script checks the isolated backend marker before making any admin edits.

Backend tests run with `npm.cmd test` from their checkout. They apply migrations to generated PostgreSQL schemas. Frontend checks run with `npm.cmd run lint`, `npm.cmd exec -- tsc -b`, and `npm.cmd run build`. The draft, monitoring, questions and assist checks can be run with `node --experimental-strip-types scripts/verify-NAME.mjs`.

## Judge0 availability

This Windows host's Docker engine uses cgroup v2, which prevented starting the provided Judge0 CE environment. The API returns HTTP 503 for Run and Submit and the arena displays “Code execution is temporarily unavailable. Please contact Race Control.” No real execution, live verdicts, execution performance, or accepted-submission scoring can be validated until a supported isolated judge is available. The protocol fixture covers result and outage handling separately.

## Phase 9 file changes

- **Frontend configuration and session** — `.env.example`, `vite.config.ts`, `src/services/{api,auth,checkIn}.ts`, `src/context/{SessionProvider.tsx,session.ts}`, and `src/pages/{LoginPage,CheckInPage}.tsx`.
- **Frontend candidate flow** — `src/pages/{LobbyPage,ArenaPage}.tsx`, `src/components/arena/{ArenaHeader,ProblemNavigation}.tsx`, `src/hooks/useArenaExecution.ts`, `src/services/arena/backend.ts`, `src/data/arenaUi.ts`, `src/types/{arena,index}.ts`, and `src/styles/arena-foundation.css`.
- **Frontend Race Control** — `src/pages/VolunteerPage.tsx`, `src/components/monitoring/{SessionReviewPanel,ViolationLockOverlay}.tsx`, `src/services/monitoring/{backend,sessionRules}.ts`, and `src/types/monitoring.ts`.
- **Frontend administration** — `src/pages/admin/{AdminSections,QuestionManagement}.tsx`, `src/components/admin/{QuestionEditor,TestCaseManager}.tsx`, `src/services/problems/{backend,contracts,index,validation}.ts`, and `src/types/problems.ts`.
- **Frontend verification** — `scripts/{verify-backend-browser,verify-production-access}.mjs` and this report.
- **Backend** — `src/controllers/{leaderboard,volunteer}.controller.ts`, `src/routes/leaderboard.routes.ts`, `src/services/{checkin,leaderboard,round,volunteer}.service.ts`, and `tests/{browser-server,remediation.test}.ts`.

## Verification results

- Three separate Chrome sessions verified backend login, role redirects, authorization failures for candidate requests to staff endpoints, candidate profile/check-in restoration, and logout.
- The candidate completed check-in, entered the arena, opened a published question, and saw the required message for actual HTTP 503 responses from Run and Submit. Chrome verified the Java entry point. Disconnecting the browser gated execution and reconnecting restored access according to the server.
- The volunteer received a fullscreen-exit event, reviewed the blocked session, and approved it. The candidate restored fullscreen and continued with the editor draft intact.
- The organizer saved a draft, added a public sample, hidden case and hint, assigned the question to a round, and published it. The candidate saw the question and purchased the hint with a server-confirmed deduction. The public response excluded the hidden case and locked hint content.
- Pausing and closing the first round cleared the candidate's selected question. Opening the second round refreshed the title, question list, and progress. The contest-wide leaderboard switch withheld candidate standings.
- Chrome ran at 1440 × 900 and 390 × 844 without uncaught application exceptions. Captures are in `.qa/phase9-desktop-arena.png`, `.qa/phase9-mobile-arena.png`, and `.qa/phase9-mobile-lobby.png`.
- Frontend TypeScript, ESLint, API-mode production build, draft/monitoring/question/assist scripts, mock monitoring browser regression, and production role-access browser checks passed. The backend build and all six backend suites passed, including 94 admin/round HTTP checks and 24 Judge0 protocol-fixture HTTP checks.
