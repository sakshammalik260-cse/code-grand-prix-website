# Code Grand Prix 2026

Existing React + TypeScript + Vite frontend for CPC Club at Jain (Deemed-to-be) University. Event date: **November 23, 2026**.

## Phase 4.2 - About CPC, scrolling and access audit

The homepage now places the official About CPC section directly after the cinematic hero, with the supplied four-paragraph description, club philosophy, original full logo and BUILD / SOLVE / IMPROVE cards. Public navigation stays visible, transitions to a dark surface while scrolling, and uses header-aware section links with reduced-motion support. The racing hero/background and competition flows are preserved.

Staff/results pages have their own scroll containers; the arena retains its fixed cockpit and native pane scrolling. Existing role guards were audited rather than rewritten. See [Phase 4.2 changes, role matrix and verification](docs/phase-4-2-scroll-security.md). Backend authorization remains pending.

## Phase 4.1 - Race Assist, Driver Standings and CPC branding

Race Assist now provides confirmed, idempotent paid hints; administrators configure hints in the existing question editor. The arena includes a free in-page Syntax Guide that copies basic boilerplate without replacing drafts. The existing results route now shows Driver Standings with judged scores, hint penalties, current-driver highlighting and visibility enforcement.

The supplied official CPC logos are integrated in the navbar, homepage organizer area and footer. The event/date information now sits above the right-hand countdown, away from the racing car, on a readable dark backing. The racing background remains unchanged.

See [Phase 4.1 features, API contracts, mock scoring and testing](docs/phase-4-1-enhancements.md). Backend integration is paused: **only an explicit `VITE_ARENA_MODE=api` enables backend requests**. Development uses the existing mock accounts; production never falls back to mock services. Earlier phase notes below describe historical behavior where superseded.

## Phase 4 - Roles and organizer questions

The existing app now supports CANDIDATE, VOLUNTEER and ADMIN accounts, role-protected routes and an F1-themed 403 page. Administration includes a question bank, validated question/examples editor, test-case forms, round assignment, publication scheduling, round management, participant sessions and results visibility. The arena dynamically fetches published eligible questions and applies each question's language allowlist while preserving drafts and Phase 3 monitoring.

See [administration, role permissions, proposed APIs and testing](docs/admin-question-management.md) for the complete handoff. **Mock services and the three demo accounts work only with `npm run dev`. An explicitly API-configured production build requires the backend and never falls back to mock data. Without API configuration, requests are blocked before transport.** Hidden test inputs/outputs are not stored in the development mock; only public cases and hidden metadata persist. Real hidden-case storage/judging requires the backend.

Demo candidate: `CGP2026` / `Race2026!`; volunteer: `VOLUNTEER2026` / `Marshal2026!`; admin: `ADMIN2026` / `Control2026!`. These public test accounts and seed statements are excluded from production builds. The old volunteer preview role switch and candidate self-approval have been removed; sign in with a separate staff account to authorize incidents.

Validation commands: `npm.cmd run build`, `npm.cmd run lint`, `node scripts/verify-questions.mjs`, `node scripts/verify-monitoring.mjs`, `node scripts/verify-drafts.mjs`.

## Phase 3 - Session monitoring and volunteer review

Active-arena monitoring now reports hidden tabs, separate window-focus signals, fullscreen exits and local camera interruptions. Race Control preserves the mounted editor, results and autosaved drafts while enforcing session policy. Confirmed service approval and restored monitoring setup are required to resume. The existing official clock continues during locks.

The `/volunteer` route now provides a role-protected mock review flow and an API role gate. Development-only simulation controls are omitted from production JavaScript. Camera access is shared across check-in, lobby and arena, then released on sign-out or leaving those routes.

See [Phase 3 files, API contracts, verification and organizer recovery procedure](docs/phase-3-monitoring.md). The backend remains unimplemented; browser monitoring and mock persistence are not security enforcement.

## Phase 2 — Coding Arena

The protected `/arena` route now implements the approved three-pane competitive programming IDE with CodeMirror 6, four public demo problems, Python/Java/C++/JavaScript templates, independent autosaved drafts, public sample/custom-input results, simulated Run/Submit services, race states/timer and service-driven demo progress. Desktop panes scroll independently; smaller screens use workspace tabs.

To enter: sign in, complete inspection, select **Live race** in the lobby mock controls, then **ENTER CODING ARENA**. Arena mock controls select verdicts, request failures and contest states. No source code is actually executed or judged.

See [Phase 2 architecture, modified files, API contracts and testing](docs/phase-2-arena.md). `.env.example` documents `VITE_ARENA_MODE=mock` and `VITE_API_BASE_URL=/api`. No dependencies were added.

## Local development

```sh
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

On Windows with PowerShell scripts disabled, use `npm.cmd` instead of `npm`. Camera access requires localhost or HTTPS. Use a desktop browser with camera and Fullscreen API support for the entire participant flow.

## Reference-matched visual redesign

The four entry pages follow `design-reference/DESIGN_SPEC.md` and references 01–04. All nine supplied images were inspected. Phase 2 implements reference 05; Phase 3 implements reference 06 and the volunteer dashboard from reference 07; Phase 4.1 implements the existing results route using reference 08.

| Page | Visual changes |
| --- | --- |
| Landing | Full-bleed original night-race artwork, realistic red car in the lower-left foreground, floodlights and light trails, large angular racing wordmark, checkered flag, floating countdown on the right and skewed red CTA. About and Rules remain below. |
| Login | Original helmet portrait fills the left side. A compact wordmark, DRIVER LOGIN heading, two inputs and red CTA sit on the right. The former oversized copy and standard card are removed. Demo access is in an expandable section. |
| Check-in | PRE-RACE INSPECTION heading; left checklist timeline, central real camera preview, and right System Status panel with START YOUR ENGINE underneath. All status indicators derive from the existing state. |
| Lobby | Night-circuit backdrop, left circuit mini-map, centered title and countdown, translucent Driver Details card on the right, and compact mock-state controls below. |

The branding uses a custom three-stripe speed mark and locally hosted **Goldman** typeface. No official F1/team logo is used. The artwork is separate from the actual semantic HTML, forms, buttons, timers and dashboard panels.

### Artwork

Original images were generated using the built-in imagegen tool and copied into the project as compressed WebP assets:

- `src/assets/artwork/night-race-hero.webp` — red open-wheel race car at a floodlit night circuit, about 180 KB.
- `src/assets/artwork/helmet-driver.webp` — black/red helmet portrait with red rim lighting, about 129 KB.
- `src/assets/artwork/night-circuit.webp` — empty night track for check-in and lobby, about 168 KB.

The complete generation prompts are recorded in `src/assets/artwork/README.md`. Font licensing is in `src/assets/fonts/OFL-Goldman.txt`. These original backgrounds follow the reference composition; they are not the reference poster/screenshots embedded as backgrounds.

The official CPC mark and full logo are now supplied under `public/branding` and integrated by Phase 4.1. All three cinematic backgrounds remain unchanged.

### Modified source

- `src/pages/LandingPage.tsx`, `LoginPage.tsx`, `CheckInPage.tsx`, `LobbyPage.tsx`: existing page components restyled and recomposed.
- `src/components/RacingIdentity.tsx`: reusable racing wordmark, CPC placeholder, checkered flag and circuit mini-map.
- `src/components/Layout.tsx`: unobtrusive entry-screen navigation and context-aware header/footer; existing route guards retained.
- `src/components/Countdown.tsx`: preserves the date countdown and adds an hours/minutes/seconds display for the lobby; days are included in the total hours.
- `src/styles/racing-redesign.css`, `src/index.css`: scoped cinematic styling and responsive layouts. Other route styles remain in place.
- `src/components/ArenaWorkspace.tsx`, `src/styles/arena-foundation.css`: the Phase 2 arena now uses this three-pane layout with a resizable CodeMirror/results workspace.
- `src/assets/artwork/`, `src/assets/fonts/`: original artwork, local display font, provenance and license.
- `README.md`: current setup, testing and handoff notes.

The existing `App.tsx` route architecture, authentication context, service modules, check-in hook, data and TypeScript types are preserved. No dependencies were added. Existing authentication and participant routes are retained; the volunteer route now implements Phase 3 review.

## Pages and manual verification

| Route | What to test |
| --- | --- |
| `/` | Inspect the cinematic hero, live countdown and CTA. Test Home/About/Rules/Schedule/Contact navigation, lower sections and the mobile menu. |
| `/login` | Submit empty fields and incorrect credentials; toggle password visibility. Expand **Preview access**, choose **Use demo credentials**, then select **ENTER THE GRID**. Verify loading and error feedback. |
| `/check-in` | Confirm driver identity. Enable and allow the camera, then activate fullscreen. Accept the rules. All four required checks must pass before START YOUR ENGINE enables. Press Esc to confirm fullscreen readiness clears, then reactivate and proceed. |
| `/lobby` | Confirm identity, check-in status, verification time and date countdown. Station remains “To be assigned” because no real assignment was provided. Use Waiting, Live race and Finished mock controls; follow the arena/results links. |
| `/arena` | Complete check-in and select Live race in the mock lobby. Verify problems/languages, scoped autosave, refresh recovery, Run/Submit simulations, errors, timer states and progress. |
| `/volunteer` | Sign in as VOLUNTEER or ADMIN. Search/review incidents and test KEEP LOCKED, ESCALATE and AUTHORIZE RESUME. |
| `/admin` | Sign in as ADMIN. Test question creation/editing, cases, filtering, assignment, publication, rounds and results visibility. |
| `/results` | Verify visibility, judged mock scores, paid hint penalties, current-driver highlighting and live refresh. |
| Unknown path | Verify 404 and return-to-grid link. |

Demo Driver ID: `CGP2026`  
Demo password: `Race2026!`

The mock identity uses sessionStorage when available; no password is stored. Phase 2 also retains a validated driver/contest mock check-in receipt for refresh recovery. Sign out clears both identity and receipt. The receipt does not indicate an active camera/fullscreen session, and backend security remains authoritative.

### Device and failure cases

- Deny camera permission: actionable feedback appears; entry remains disabled. Update browser site permissions and retry.
- Missing/busy/disconnected camera: verify the appropriate feedback and incomplete camera check.
- Navigate away while camera permission is pending: a later-granted stream is immediately stopped.
- Exit fullscreen: readiness clears. An unsupported or denied fullscreen request shows an error.
- Check-in to lobby to arena: the same local camera stream remains active. Leaving these routes or signing out stops all tracks. Restore camera explicitly after a full page reload.
- Test keyboard access, visible focus, the skip link, reduced motion and mobile navigation.

## Validation

The redesign was rendered in an isolated headless Chrome browser and captured at **1440×900**, **1366×768** **768×900**, **390×844** and **360×800**. Screenshots for the four entry pages are retained in `.qa/redesign-{landing,login,inspection,lobby}-{width}x{height}.png` (local, ignored by Git). The screenshots were visually compared with references 01–04. Corrections included angular typography, upright timer numerals, compact inspection spacing and title alignment.

Browser checks cover empty/invalid login, password visibility, demo autofill/sign-in, both route guards, camera-denied feedback, simulated camera streaming, actual browser fullscreen activation/exit, acknowledgment gating, system status, camera cleanup, lobby states, remaining routes, sign-out and mobile navigation. No runtime exceptions were observed. Physical camera hardware and other browsers still need on-device checks.

`npm.cmd run build` and `npm.cmd run lint` both passed after the final changes.

## Backend and timing boundaries

The API remains modular: replace `authService.login` with the real backend implementation and use the existing Axios client in `src/services/api.ts`. `VITE_API_BASE_URL` may configure the future endpoint. Never put secrets in frontend environment values.

Authentication, role access, contest state, check-in validation, session security, scoring and results must be authoritative on the backend. Mock lobby controls remain explicitly labeled and do not start a real contest. The volunteer API must enforce privileged roles server-side. Development volunteer access requires its separate test account.

The countdown still targets the start of **November 23 at 00:00 IST**, matching the provided event date. Race start time is TBA and displayed separately. Lobby total hours includes remaining days. Final rules require CPC Club confirmation.

Camera preview stays entirely local: no audio request, recording or upload. No hidden solutions/test cases, DevTools blocking, backend implementation or Monaco editor was added. CodeMirror 6 now powers the Phase 2 arena.

This is a local repository change. A future static deployment must rewrite BrowserRouter deep links to `index.html`.

