# Phase 2 — Coding Arena

The existing protected arena route now implements the three-pane IDE from reference 05. Landing, login, inspection and lobby designs are preserved. References 06–08 remain later-phase work.

## Try it

Run `npm run dev` (`npm.cmd run dev` in restricted PowerShell). Sign in with **CGP2026 / Race2026!**, complete camera/fullscreen/rules inspection, select **Live race** in the lobby, then **ENTER CODING ARENA**.

Choose among four public demonstration problems and Python 3, Java, C++ or JavaScript. The statement includes points, limits, constraints, input/output formats, public samples, explanations and complexity targets. Each problem and language has an independent draft.

Run and Submit are explicitly simulated. Mock controls in the bottom status bar choose verdict fixtures and request failures. No source is compiled, executed or judged in this preview. No hidden test data or reference solutions are included.

## Editor and layout

- CodeMirror 6 provides syntax highlighting, line numbers, indentation, matching brackets, completion and code scrolling. Each language loads on demand.
- Preferences control font size and long-line wrapping.
- Ctrl/Cmd+Enter runs; Ctrl/Cmd+Shift+Enter submits; Ctrl/Cmd+S saves immediately. Escape returns focus to the language selector.
- Drag the editor/results separator, or focus it and press Up/Down, to resize.
- Desktop panes scroll independently. Tablet/mobile uses Problem / Code editor / Results views while keeping the editor mounted.

## Draft persistence

`src/services/draftStore.ts` uses keys of the form `cgp:draft:v1:<contest>:<driver>:<problem>:<language>`. Every field is URI-encoded. Values contain a version, source text and update time.

`useDraft` debounces writes for 600 ms and flushes on problem/language switches, page hiding/leaving and unmount. Templates never replace an existing saved draft, including an empty one. Storage failures retain a scoped in-memory copy and show a retry warning. Switching away and back preserves that unsaved copy. Retrying after storage recovers saves it. Corrupt records are reported without automatically overwriting them with starter text.

When storage remains unavailable, drafts cannot survive tab closure/reload; the interface advises keeping a backup. Local drafts intentionally remain after sign-out for recovery under the same scoped identity.

## Requests and results

Run displays public-sample or custom-input feedback: status, standard output/error, public expected output, time and memory. No expected output is assumed for custom input. All mock output, timing and memory values are illustrative.

Submit transitions through Submitting → Queued → Running → a final verdict. Accepted and Wrong Answer use the requested lap banners with explicit simulation copy. Compilation Error, Runtime Error, Time Limit Exceeded and Memory Limit Exceeded are supported. Mock progress updates only from service outcomes and never represents an official ranking.

Polling is bounded and aborted when leaving a document. Navigation/language selection is disabled while a request is active. Editing remains available; each request uses a captured source snapshot. If status retrieval fails after a submission was queued, **Check result** retrieves the existing ID instead of submitting a duplicate job.

Empty source, oversized source, request failures and invalid problem IDs produce recoverable messages. Unrecognized language URL values fall back to C++. Selection is retained in URLs such as `/arena?problem=p2&lang=python`.

## API handoff

Full contracts are in `src/types/arena.ts`. `src/services/arena/index.ts` selects mock mode by default. `.env.example` documents:

```dotenv
VITE_ARENA_MODE=mock
VITE_API_BASE_URL=/api
```

Explicit `VITE_ARENA_MODE=api` uses `src/services/arena/backend.ts` and the existing Axios client. It switches arena requests, not the existing mock login. Configure real authentication transport with the backend team before using it. Vite environment values are public and must contain no secrets.

These paths, relative to the configured base, are proposed contracts requiring backend confirmation:

| Endpoint | Contract |
| --- | --- |
| `GET /contest` | `ContestState` |
| `GET /problems` | `ProblemSummary[]` |
| `GET /problems/:id` | `Problem`, public samples only |
| `POST /code/run` | `CodeExecutionRequest` → `CodeExecutionResult` |
| `POST /code/submit` | `SubmissionRequest` → `SubmissionResult` |
| `GET /submissions/:id` | Updated `SubmissionResult` |
| `GET /session` | `ArenaSession` |
| `GET /contest/progress?contestId=…` | `DriverProgress`, additional proposed contract |

Times use ISO strings, limits use milliseconds/megabytes, and execution memory uses kilobytes. `simulation` distinguishes fixtures from backend results. Identity must be derived and checked from the backend session; client-supplied driver/contest IDs are not authorization.

The backend owns code execution, hidden tests, official timing, authentication, role access, scoring and rankings. No backend was implemented here.

## Timer and monitoring

`RaceTimer` accepts start time, end time, server time, contest status and optional pause time. Display time advances from a server snapshot using monotonic elapsed time. Contest snapshots refresh every 15 seconds; the driver menu also offers manual refresh.

Waiting counts toward start, Live toward end, organizer pause freezes, and Finished/local display expiry disables execution controls while preserving editable drafts. The backend must independently reject unauthorized/late requests. On resume it should return updated timing. Mock-only controls supply controlled state and five-second expiry fixtures; they are absent in API mode.

The original camera lifecycle remains: a local preview during inspection, then stopped tracks on leaving. The arena therefore reports **Camera: OFF** and never requests another stream. The driver menu links back to camera inspection. Real fullscreen state is monitored and can be reactivated; no Phase 3 violation lock was added.

A validated mock check-in receipt is retained in sessionStorage for the active driver/contest. It allows an arena refresh without another camera request. It does not claim that camera or fullscreen is still active, and must eventually be replaced or validated by the backend. Sign-out clears both identity and receipt.

Drafts use localStorage. Mock identity, receipt, contest schedule and demo progress use sessionStorage where available. Submission jobs/history, custom input and editor preferences remain in memory; mock job history is not restored after reload. Durable submission history belongs on the backend.

## Source mapping

- `src/pages/ArenaPage.tsx`: boot loading, selection, document scope, state and layout orchestration.
- `src/components/ArenaWorkspace.tsx`, `src/components/arena/`: layout, header/timer, navigation/progress, statement, editor, results and mock controls.
- `src/styles/arena-foundation.css`: actual arena styling and responsive behavior.
- `src/data/problems.ts`, `starterCode.ts`, `arenaUi.ts`: public demonstration data, templates and labels.
- `src/types/arena.ts`, `src/types/index.ts`: typed contracts; the former lowercase lobby type is now `LobbyState`.
- `src/services/arena/`: adapter, proposed backend requests, separate run/submit services and mock state/progress.
- `src/services/draftStore.ts`, `src/hooks/useDraft.ts`: persistence and failure recovery.
- `useArenaBoot.ts`, `useArenaExecution.ts`, `useRaceClock.ts`, `useFullscreenStatus.ts`: loading/polling, clock and monitoring.
- `src/context/SessionProvider.tsx`: scoped mock receipt restoration and sign-out cleanup.
- `src/pages/LobbyPage.tsx`, `src/data/event.ts`: existing lobby controls feed the mock arena schedule; shared contest ID.
- `src/App.tsx`, `src/components/Layout.tsx`, `src/pages/PlaceholderPages.tsx`: original route/guards retained; lazy arena replaces only its former stub and uses a compact arena shell.
- `.env.example`, `src/services/api.ts`: configuration and shared client.
- `scripts/verify-drafts.mjs`: executable persistence invariants.

No dependencies were added. The arena, individual language modules and backend adapter are loaded on demand.

## Verification

Required checks: `npm run build` and `npm run lint`. Draft invariants: `node scripts/verify-drafts.mjs`, using Node with native TypeScript support (this workspace uses Node 26).

Browser QA uses isolated headless Chrome with simulated camera hardware. It covers all four languages/problems, rapid switching before debounce, refresh restoration, empty source/drafts, all Run and Submit verdicts, custom input, failed requests, progress, timer pause/expiry, route guards, media cleanup and storage failure/retry. Additional checks cover queued-result recovery, shortcuts, preferences, resizing and fullscreen-denial retry.

Screenshots at **1440×900**, **1366×768** and **1920×1080** are retained in ignored `.qa/arena-phase2-{width}x{height}.png` and compared visually with reference 05. Responsive checks include 768, 390 and 360 pixel widths. Results are in `.qa/arena-results.json` and `.qa/arena-recovery-results.json`. Physical camera hardware and other browsers still need on-device verification.

Manual smoke test: enter through the existing flow, edit and switch every problem/language, refresh, run public/custom input, submit each fixture, exercise storage/request failures, pause/finish the mock race, test shortcuts/resizing, then sign out and confirm protected access.

Final verification: production build, ESLint, draft persistence invariants, the main arena browser checks and additional recovery/shortcut checks all passed. The final build emitted no oversized-chunk warning. Browser checks reported no application runtime exceptions.
