# Phase 4.1 enhancements

The existing Code Grand Prix 2026 frontend now includes Race Assist hints, administrator hint configuration, an in-arena Syntax Guide, Driver Standings in the existing `/results` route, official CPC assets and a focused homepage readability correction. No backend, dependencies, editor replacement or second site was added.

## Configuration and boundaries

- `npm.cmd run dev` with `VITE_ARENA_MODE=mock` uses the existing development-only adapters and accounts. CANDIDATE: CGP2026 / Race2026!; VOLUNTEER: VOLUNTEER2026 / Marshal2026!; ADMIN: ADMIN2026 / Control2026!.
- Backend integration remains paused. **Only `VITE_ARENA_MODE=api` explicitly enables backend requests.** `VITE_API_BASE_URL` configures the existing Axios client. The request interceptor rejects calls before transport when API mode is not configured, including in a production build. No API failure falls back to mock data.
- Production contains no demo accounts, seed questions, mock hints, mock administration or simulation controls. The real forms, typed adapters and role guards remain. An unconfigured production preview can render public pages and explain that backend access is paused; it cannot manufacture authentication or scoring.
- Roles remain CANDIDATE, VOLUNTEER and ADMIN. Candidate routes cannot access staff dashboards. Admin-only hint APIs require server-verified ADMIN; volunteer access never grants question/hint administration.

## Hint configuration and lifecycle

`AdminProblem` / `ProblemInput` now have an optional `hints: AdminHint[]`. Missing hints in existing records are treated as an empty list. The existing question editor adds **HINT CONFIGURATION** with add, edit, remove, move up/down, preview and point deduction controls. Hints are saved atomically with the existing question draft rather than maintained by a separate UI store.

```ts
interface AdminHint {
  id: string;
  order: number;
  deductionPoints: number;
  content: string;
}
```

IDs and order must be unique within the problem. Order is a positive integer, deduction is a non-negative integer, and content cannot be blank. Invalid hints cannot be saved or published. A warning appears when deductions exceed the question value. Existing drafts, round assignment, schedules, publication and public/hidden case management remain available. Published and scheduled questions remain read-only until unpublished.

Editing hints on an existing question assigned to a live round requires an explicit confirmation before saving the draft. The backend must independently verify live-round change policy and audit scoring changes; the dialog alone does not enforce that policy. Reusing a paid hint ID preserves its original content and cost in the mock receipt. Its displayed order follows the current configuration; removed paid hints remain accessible after configured hints with unique display numbers. Removing a configured hint does not erase an existing paid receipt. Changing costs never retroactively charges or refunds a candidate in the mock. Real refund/amendment rules require organizer/backend agreement.

Fresh development catalogs configure two hints on the public p2 demonstration question; the other seed questions have no hints. Existing organizer catalogs are preserved and are not silently seeded with new hints. Admins can configure any number of hints.

## Candidate Race Assist

The existing problem-description pane contains a collapsible **RACE ASSIST / HINTS** section. It shows available/unlocked counts, maximum problem points, total penalties and remaining potential points. Questions without hints show an explicit empty state.

A locked hint exposes only metadata. Selecting it opens a racing confirmation dialog with current and estimated post-unlock potential points. Cancel does not call the service. Confirm disables the action, sends a stable request ID and waits for a verified acknowledgment. Only a successful response reveals content and changes displayed penalties. Failures show an error and preserve the locked state; retries can safely reuse the operation ID. Refresh status reconciles an uncertain response with the service.

```ts
interface HintMetadata {
  id: string;
  problemId: string;
  order: number;
  deductionPoints: number;
  status: 'LOCKED' | 'UNLOCKED';
}
interface UnlockedHint extends HintMetadata {
  status: 'UNLOCKED';
  content: string;
}
interface HintState {
  contestId: string;
  problemId: string;
  configurationRevision: number;
  maximumPoints: number;
  hints: (LockedHint | UnlockedHint)[];
  totalHintPenalty: number;
  remainingPotentialScore: number;
}
interface HintUnlockRequest {
  operationId: string;
  sessionId: string;
  configurationRevision: number;
  expectedDeductionPoints: number;
}
interface HintUnlockResult extends HintState {
  hint: UnlockedHint;
  deductionApplied: number;
  replayed: boolean;
}
```

LockedHint has status LOCKED and no content field. Candidate public question/list DTOs never include the administrator's hint array; hints use their dedicated endpoint. The candidate response parser rejects a locked hint containing content, invalid scope/problem metadata or an invalid unlock acknowledgment. Server correctness is still essential: JavaScript cannot prevent a misconfigured server from transmitting private data, so candidate DTO construction must exclude it on the backend.

Unlocks are available only during a live contest with an authorized monitoring session. The mock rechecks official mock contest state, session ID/policy, question eligibility, configuration revision and confirmed cost inside the transaction before writing a receipt. A changed cost/configuration requires a fresh confirmation. Locked, finished, unpublished or unreleased sessions/questions cannot purchase hints.

## Persistence and mock scoring

The existing IndexedDB monitoring demo ledger now also holds optional hint receipts and judged mock score records. This reuses its atomic transaction helper, preserving existing sessions/incidents. No new competing authentication/contest store was introduced. Receipt identity is scoped by contest, candidate, problem and hint. Concurrent requests for the same hint return the existing receipt with deductionApplied 0 and replayed true. Language is deliberately absent from the scope. Switching language/problem, reloading, signing out or reconnecting cannot buy the same hint twice. Original paid content/cost is retained in the receipt.

Remaining potential points follow the requested demonstration formula:

```text
potential = max(0, problem maximum - all paid hint deductions for that problem)
```

Unlocking alone earns **zero** points. Existing mock judging marks a problem solved only after its simulated ACCEPTED submission result. Its demonstration earned score is the accepted problem value minus that problem's paid hint deductions, clamped to zero. Penalties on an unsolved problem do not deduct earned points from unrelated solved problems. Run Code does not award points. Duplicate accepted submissions do not award the same problem twice. This is a labeled mock model, not an official scoring policy.

The former in-session demo progress now uses the shared persistent ledger so the arena and standings agree across refreshes and staff/candidate sessions. Source drafts retain their existing contest/driver/problem/language keys and are unchanged. Historical pre-4.1 sessionStorage-only mock progress is not an official score and is not promoted into the new judged ledger. Real official progress/scoring remains backend-provided.

Development catalogs and the IndexedDB demo ledger are inspectable browser data. They provide realistic service behavior, not secrecy or production security. Mock hint definitions are loaded only in DEV. Hidden test inputs/outputs remain excluded from candidate responses; the existing mock hidden-case form still discards private content and stores metadata only.

## Driver Standings

The existing ResultsPage now renders Driver Standings using reference 08: dark table, red current-driver row, gold/silver/bronze podium indicators, checkered decoration and race status. There is no new leaderboard route. The existing visibility gate is preserved, and every leaderboard snapshot also carries a visibility decision. Withheld, invalid or failed service responses do not display standings rows.

Columns: rank, driver ID, solved/available problems, total judged score, total hint penalties and session/competition status. Polling every five seconds and manual refresh update the snapshot. Production preserves server-supplied ranks/scores/order; it never computes official rankings. Development derives consistent rows from actual mock sessions, judging results and hint receipts. There are no hardcoded official entrants or illustrative official results. A fresh preview may have an empty table or one candidate until more sessions exist.

The mock sorts by net demonstration score, then solved count, then driver ID solely for deterministic preview behavior. The table labels simulation explicitly. Potential points are never presented as earned standings points. The results visibility setting remains under `/admin/results`; the backend must enforce both the visibility endpoint and leaderboard data access. An administrator can view the mock as an explicitly privileged preview; production access/visibility is determined by the server response.

## Syntax Guide

The arena action toolbar has **SYNTAX GUIDE**. It opens inside the same document and automatically selects the active CodeMirror language. Candidates may browse Python 3, Java, C++ and JavaScript without changing the editor language. It reuses the existing `starterCode` entry points/imports/basic input setup: no algorithms, solutions or problem-specific hints are added.

**COPY BOILERPLATE** uses the browser Clipboard API and reports success or failure. The guide never inserts into the editor, replaces source, changes a draft or calls the hint-unlock service. There is no point deduction. It is available only when monitoring/session policy permits the reference; the Race Control lock takes precedence. Ordinary in-app opening/browsing does not hide the page or create tab-switch incidents. Clipboard behavior still depends on browser permissions and secure context; error feedback allows manual selection/copy.

Before real judging, confirm runtime/language entry-point and input contracts with the backend team. No external links/tabs or Monaco editor were introduced.

## Official CPC branding and homepage

Verified and visually inspected the user-supplied files:

- `public/branding/cpc-mark.webp`: optimized navbar mark.
- `public/branding/cpc-logo.webp`: optimized homepage and footer logo.

The original files and their white/neon-green colors are preserved. Images use meaningful alt text, original aspect ratio and object-fit contain. Code Grand Prix remains the primary event wordmark. The incorrect Coding & Programming Club placeholder is removed; club text and page metadata use **Competitive Programming Club**.

The existing race background is unchanged. The small date/CPC label has been moved above the right-hand countdown, away from the rear wing, with a dark translucent background, red edge, stronger text and readable sizing. The university caption also gains a dark backing. A small mobile wordmark sizing correction keeps it within the viewport. These are focused readability corrections, not a homepage redesign.

## Proposed APIs (backend integration paused)

All paths are relative to `VITE_API_BASE_URL`. These contracts do not imply deployed endpoints.

| Method/path | Permission | Request | Response |
| --- | --- | --- | --- |
| GET `/contest/problems/:problemId/hints` | Authenticated eligible CANDIDATE | Server derives candidate/contest/round | HintState; LOCKED has no content, previously purchased UNLOCKED may include its paid content |
| POST `/contest/problems/:problemId/hints/:hintId/unlock` | Same, plus active authorized contest session | HintUnlockRequest; Idempotency-Key header equals operationId | HintUnlockResult; repeated purchase returns existing receipt with zero new deduction |
| GET `/admin/problems/:problemId/hints` | Server-verified ADMIN | Problem ownership/scope validated | AdminHint[] |
| POST `/admin/problems/:problemId/hints` | ADMIN | `{ hint: AdminHint, expectedRevision }` | Updated AdminHint[] |
| PATCH `/admin/hints/:hintId` | ADMIN | `{ hint: AdminHint, expectedRevision }` | Updated AdminHint[] |
| DELETE `/admin/hints/:hintId` | ADMIN | `{ expectedRevision }` | Updated AdminHint[] |
| GET `/leaderboard` | Server-authorized CANDIDATE or ADMIN | Server derives visible contest and identity | LeaderboardSnapshot below |

The existing POST/PATCH `/admin/problems` / `:id` ProblemInput contract is extended with the optional hint array, to support atomic question-and-hint draft saves used by this editor. The standalone hint CRUD adapters above are prepared for granular integrations and operate on the same catalog; they are not a second administration system. After granular CRUD, consumers can refetch the problem for its updated revision. The backend team must confirm transaction/revision response details before integration.

LeaderboardSnapshot:

```ts
{
  contestId: string;
  contestTitle: string;
  status: 'WAITING' | 'LIVE' | 'PAUSED_BY_ORGANIZER' | 'FINISHED';
  visible: boolean;
  simulation: boolean;
  updatedAt: string; // authoritative ISO timestamp
  rows: {
    rank: number;
    driverId: string;
    problemsSolved: number;
    totalProblems: number;
    totalScore: number;
    totalHintPenalties: number;
    status: SessionStatus | 'WAITING';
  }[];
}
```

Required backend guarantees: derive authenticated roles and candidate identity; validate problem/contest/round publication; prohibit hint content in locked DTOs; enforce session locks/time windows; validate configuration revisions/costs; atomically enforce uniqueness for `(contest,candidate,problem,hint)` in addition to request idempotency; compute authoritative penalties, scores and ranks; persist receipts across sessions; audit live changes; apply agreed refunds/scoring rules; restrict administrator payloads; protect CSRF/cookies; omit hidden tests/reference solutions and unpublished questions. Use 401/403 for authentication/authorization errors, 404 for unavailable content and 409 for stale configuration. No client role headers or browser role values grant production authority.

## Test each feature

1. Start the development server and sign in as ADMIN. In Question Management, unpublish p2 and edit it. Add/remove/reorder hints, preview, test blank content and fractional/negative costs, then save and publish. Set the event round LIVE with a valid schedule; changing existing hint content/cost must show the live-round confirmation.
2. Enable candidate results visibility in the existing admin Results controls. Sign out and sign in as CANDIDATE. Complete camera/fullscreen/rules inspection and enter the arena.
3. On p2, expand Race Assist. Confirm initial hints are locked and penalties are zero. Open and cancel a hint request. Reopen and confirm; content appears only after acknowledgment and potential points fall by the displayed cost.
4. Refresh status, switch problems/languages and reload. The paid hint remains unlocked and no additional charge applies. Restore camera/fullscreen explicitly after reload. p1 demonstrates the zero-hint state.
5. Use the DEV monitoring disconnection fixture or browser failure simulation to test an unlock failure. No content/penalty update should appear. Reconnect and reconcile status before retrying. Trigger a session lock; unlocking/reference controls must be blocked until a separate staff account authorizes recovery.
6. Open Syntax Guide. Check all four languages and Copy Boilerplate success/error feedback. Verify the editor language/source and hint penalties stay unchanged. No browser tab is opened.
7. Submit an accepted mock outcome, then open `/results`. Verify judged score, paid penalties, solved count and current-driver highlighting. Revoke visibility from ADMIN and refresh; rows must disappear. Production must display only the service's scores/ranks.
8. Inspect homepage/navbar/organizer/footer at 1920x1080, 1440x900, 1366x768 and mobile. Logos must preserve proportions; the date/CPC panel must stay clear of the car. The full logo is not repeatedly placed throughout dashboards.
9. Run build/lint/native checks. A default production preview must not issue backend requests or use mocks. An explicitly API-configured build may be tested with controlled/intercepted responses; API failures must never fabricate authentication, hints or standings.

Commands: `npm.cmd run build`, `npm.cmd run lint`, `node scripts/verify-assist.mjs`, `node scripts/verify-questions.mjs`, `node scripts/verify-monitoring.mjs`, `node scripts/verify-drafts.mjs`.

## Modified files

- Types/contracts: `src/types/assist.ts`, `src/types/problems.ts`, `src/services/assist/{index,backend,mock,contracts,rules}.ts`, existing `services/problems/{contracts,validation,mock}.ts`.
- Arena integration: `src/components/assist/{RaceAssist,SyntaxGuide,RaceDialog}.tsx`, `src/pages/ArenaPage.tsx`, `src/services/arena/{mock,mockState,mockProgress,submission}.ts`, `src/services/monitoring/ledger.ts`.
- Administration: `src/components/admin/HintConfiguration.tsx`, existing `QuestionEditor.tsx`.
- Existing results route: `src/components/results/DriverStandings.tsx`, `src/pages/PlaceholderPages.tsx`, `src/components/Layout.tsx`.
- Branding/readability: `RacingIdentity.tsx`, `LandingPage.tsx`, `LoginPage.tsx`, `src/data/event.ts`, `index.html`, `src/styles/phase-4-1.css`, `src/index.css`, the two supplied `public/branding` assets.
- Configuration/handoff: `services/api.ts`, `mode.ts`, `.env.example`, `README.md`, this document and `scripts/verify-assist.mjs`.

## Known limits and remaining backend dependencies

No Phase 5 work was started. Real authentication, transactional hint purchase/deductions, private content protection, official judging/scoring/ranking, live scoring policy and release/visibility rules still require the backend. The development ledger/catalog can be inspected or edited by a user and cannot enforce real competition security. Candidate browser parsers reject unsafe responses but cannot make an already transmitted private payload secret. Production API authorization cannot be verified without a real server. Physical camera/lab-browser behavior and judge-specific boilerplate contracts still need on-device confirmation. Browser clipboard permissions may differ by browser.
## Validation results

- `npm.cmd run build` and `npm.cmd run lint` pass. The standings component is lazy-loaded; the final production build has no oversized-chunk warning.
- All native hint/scoring/DTO checks and existing question, monitoring and scoped-draft checks pass.
- Isolated headless Chrome passed the complete DEV flow: administrator hint creation/editing/removal/reordering/preview, validation and live-round confirmation; candidate confirm/cancel/unlock; concurrent duplicate requests; failure without reveal/charge; language/problem/refresh persistence; zero-hint question; all four Syntax Guide copies; preserved source/draft; service-derived judged standings and penalty display; role restrictions.
- Additional checks passed: clipboard rejection feedback, mobile guide layout, synthetic video-track-ended interruption, blocking reference/purchase actions during a session lock, locked refresh preserving code, separate volunteer authorization and unchanged official contest deadline. Fake video hardware was used; no physical camera claim is made.
- A default production preview was observed with Network instrumentation: no backend requests, no mock accounts and no mock login fallback. An explicitly API-configured production build was tested using **intercepted local API responses**, not a real backend: unsafe locked content was rejected, an unlock failure revealed nothing, retries retained their idempotency key, and the UI preserved server rank/score/penalty values. Visibility revocation and API failure cleared standings rows. No Phase 5 backend was started.
- Reviewed homepage screenshots at 1920x1080, 1440x900, 1366x768 and 390x844. Reviewed arena hints, confirmation, syntax reference, admin hints and standings screenshots for consistency; responsive standings keep overflow inside the table. No application runtime exceptions were observed in passing runs.

Local ignored QA evidence: `.qa/phase4-1-results.json`, `phase4-1-extra-results.json`, `phase4-1-production-results.json`; screenshots `.qa/phase4-1-home-{width}x{height}.png`, `phase4-1-arena-hints-1440x900.png`, `phase4-1-hint-confirmation-1440x900.png`, `phase4-1-syntax-guide-1440x900.png`, `phase4-1-syntax-mobile-390x844.png`, `phase4-1-admin-hints-1440x900.png` and `phase4-1-standings-{width}x{height}.png`.
Additional modified files: `src/data/problems.ts` corrects inherited encoding of comparison/arrow symbols in public demonstration statements; `docs/admin-question-management.md` links the updated configuration and enhancement contracts. The supplied logo PNGs were integrated without modifying their pixel data.
The earlier Phase 4 end-to-end regression suite also passed with the Phase 4.1 enhancements: all three roles, question creation/editing, public and hidden test-case forms, draft/publication/scheduling/assignment, dynamic problem loading, Run/Submit, session locking, separate volunteer approval, code restoration and results visibility. No runtime exceptions were observed.

Additional native coverage confirms that reordering or removing configured hints retains paid content/cost and keeps displayed hint numbers unique. Final build, lint and all native checks pass after that correction.
