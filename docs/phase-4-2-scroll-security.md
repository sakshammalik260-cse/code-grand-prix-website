# Phase 4.2: official About CPC, navigation and access audit

## Homepage enhancement

The existing About introduction was replaced by one official About CPC section, immediately after the unchanged cinematic hero and before Schedule. The About link retains `/#about`. The existing schedule, journey, rules, final CTA and contact/footer remain accessible.

`src/data/cpc.ts` contains all four supplied paragraphs verbatim. The section uses those strings directly; the final paragraph is highlighted as the club philosophy. The section displays the original `public/branding/cpc-logo-transparent.png` through the existing ClubLogo component, with unchanged pixels/colors, meaningful alt text and object-fit contain. It includes BUILD, SOLVE and IMPROVE cards using Lucide icons, brief descriptions grounded in the supplied text, and subtle green hover accents.

The desktop composition has a logo column and a description column, followed by three cards. Mobile stacks the logo, text and cards. Motion viewport reveals are gentle and run once. When prefers-reduced-motion is enabled, initial content is visible and movement/transition durations are disabled. No scroll-jacking, snap points, new images or dependencies were introduced.

## Sticky navigation and smooth scrolling

The audit found `.race-header { position: absolute }` overriding the existing sticky `.site-header` rule. Public headers now use sticky positioning relative to the actual document scroll. A constant-height negative bottom margin keeps the cinematic header over the hero without moving the hero or changing its background/composition.

The homepage header retains its initial transparent gradient. A passive scroll listener, batched with requestAnimationFrame, changes only its surface/border/blur/shadow after 24 pixels of scrolling. Its height and the hero's height stay constant. Public headers have z-index 40, below application dialogs and critical overlays. Mobile menus retain their existing controls and close after choosing a link.

Home, About, Rules, Schedule and Contact use the existing React Router links and native scrolling. Home now targets `/#home`, so it also works after manually scrolling down while already on the homepage. The existing ScrollToPage helper now handles repeated same-hash navigations, cross-route anchors and decoded direct hashes. Hash targets use the current responsive header height plus a scroll margin. Route changes without a hash reset the appropriate scroll container immediately. Reduced motion uses instant/auto scrolling. There is no global smooth-scrolling rule on individual editors or pane descendants.

## Arena and staff scrolling audit

The arena still uses `.arena-route-shell`, its fixed viewport and existing independently scrollable panes. CodeMirror, results, problem statement/navigation, resizing, timer and monitoring controls were not changed. The public navbar is never inserted over the coding arena.

A second scrolling issue was found: staff and results routes inherited the arena's `overflow: hidden` shell. Programmatic scrollIntoView could move hidden content, while ordinary page scrolling could be constrained. Those routes now use a separate `.dashboard-route-shell`:

- Admin/results page content scrolls in the route's main viewport. Their existing headers stick to the top of that viewport. Admin side navigation remains accessible on desktop; its existing horizontal mobile navigation is preserved.
- Volunteer retains its existing flex layout and independently scrolling table/content area, with its toolbar outside that area. No workflow or role permissions were changed.
- Staff header stacking remains below incident-review dialogs. The arena lock remains above the inert coding workspace.

## Role permission matrix

| Area | Unauthenticated | CANDIDATE | VOLUNTEER | ADMIN |
| --- | --- | --- | --- | --- |
| Public homepage/login | Allowed | Allowed | Allowed | Allowed |
| Check-in, lobby, arena | Redirect to login | Allowed after required check-in | 403 | 403 |
| Candidate results | Redirect to login | Subject to service visibility | 403 | Authorized results/preview access |
| Volunteer dashboard and nested paths | Redirect to login | 403 | Allowed | Allowed |
| Admin dashboard/questions/hints/cases/rounds/results | Redirect to login | 403 | 403 | Allowed |

App.tsx, RequireRole, SessionProvider, the authentication adapters, navigation, admin routes and volunteer routes were inspected. Existing nested guards already satisfy this matrix; no authentication, role, API or dashboard workflow rewrite was necessary.

Candidates do not receive admin or volunteer navigation links or approval actions. Volunteers do not receive admin links. The admin's existing link to Race Control and the volunteer console's admin-only Administration link are preserved. Rendering visibility is a UX aid; the nested guards still make the access decision.

## Access audit findings and limitations

**FRONTEND ROUTE PROTECTION: Implemented and tested.**

- Protected nested administrative/volunteer routes inherit the role guard.
- Unauthenticated access waits for identity verification and redirects to login.
- Signed-in accounts with the wrong role receive the existing F1-themed 403 page.
- URL role parameters, localStorage role fields, sessionStorage role fields and the obsolete mock-volunteer flag do not grant permissions.
- Production identity/roles come from the explicit API adapter's GET `/auth/me`, not browser storage or client role headers. Unknown server role values are rejected by identity validation.
- DEV account controls are gated by Vite DEV mode and excluded from production. API failures never switch to development authentication.

No production route-guard bypass was found in the tested matrix. No permission changes were made. The old public cinematic positioning and staff overflow issues were scrolling defects, not authorization bypasses.

Development mock accounts are intentionally inspectable local testing infrastructure. Their account ID is stored in sessionStorage, so someone editing the **mock account ID itself** can impersonate another known demo account. This is a DEV-only limitation, not a production identity mechanism. Tests that mutate role fields while keeping the candidate ID show no escalation. Production tests also forge the stored ID and verify that the API-reported candidate role still wins. The supplied test credentials are public demo fixtures, not production administrator secrets.

**BACKEND AUTHORIZATION: Pending integration and security testing.**

Backend integration remains paused. The existing API configuration and contracts are unchanged: only explicit VITE_ARENA_MODE=api enables transport, and the backend must derive identity from authenticated sessions. The future backend must enforce roles, contest/round ownership, publication/visibility, session locks, hint transactions and code-execution restrictions on every endpoint. Frontend JavaScript cannot secure an API or prove a real user's role. Cookie/CSRF/session-expiry handling and actual server enforcement require separate backend security testing. No Phase 5 server was built.

## Modified files

- `src/components/AboutCpc.tsx`: official section, original logo, philosophy, pillars and reduced-motion reveals.
- `src/data/cpc.ts`: exact supplied four-paragraph copy.
- `src/pages/LandingPage.tsx`: replace the old introduction; insert About immediately after hero; add the Home anchor. Hero/background/countdown logic remain unchanged.
- `src/components/Layout.tsx`: sticky state, robust existing section navigation and separate staff/results scroll shells. No role/authentication changes.
- `src/styles/phase-4-2.css`, `src/index.css`: scoped section, public header, anchor margins and scroll-container corrections.
- `scripts/browser-qa.mjs`: dependency-free CDP helper for an isolated local Chrome test browser.
- `scripts/verify-scroll-security.mjs`: responsive section/navigation checks and actual DEV route-access matrix.
- `scripts/verify-production-access.mjs`: production guard behavior using intercepted local API responses or an unconfigured offline build.
- `README.md`, this document: handoff and testing instructions.

## Run and verify

```sh
npm.cmd run dev -- --host 127.0.0.1
npm.cmd run build
npm.cmd run lint
node scripts/verify-assist.mjs
node scripts/verify-questions.mjs
node scripts/verify-monitoring.mjs
node scripts/verify-drafts.mjs
```

Browser scripts require Node's built-in WebSocket support and a separate Chrome debugging instance. Do not point them at a personal browser profile. Example PowerShell launch in another terminal:

```powershell
$qaProfile = Join-Path $env:TEMP 'cgp-scroll-access-qa'
& 'C:/Program Files/Google/Chrome/Application/chrome.exe' --headless=new --no-sandbox --disable-gpu --no-first-run --remote-debugging-port=9225 ('--user-data-dir=' + $qaProfile) --use-fake-ui-for-media-stream --use-fake-device-for-media-stream about:blank
```

Then run `node scripts/verify-scroll-security.mjs` with the DEV mock server at 127.0.0.1:5173. It refuses to submit demo credentials unless development preview controls are present. It uses the existing candidate, volunteer and admin accounts in separate sign-in sessions, closes its isolated browser and writes ignored QA artifacts. Override CGP_QA_BASE_URL / CGP_QA_CDP_URL if using other local ports. The media device is fake; physical camera hardware is not validated.

For a default production preview on port 4173, restart the isolated browser and run `node scripts/verify-production-access.mjs --offline`. It checks forged storage, absence of DEV controls and no API transport.

For API-adapter route testing, build a separate local artifact with VITE_ARENA_MODE=api and serve it on 4174. Restart the isolated browser, then run `node scripts/verify-production-access.mjs`. Every API request to that local origin is intercepted with controlled responses. The script verifies API-derived roles, denied routes, staff access and unknown-role rejection. This does **not** verify real backend authorization or use a real server.

Manual checks:

1. Scroll from the hero into About. Verify the four exact paragraphs, full CPC logo, philosophy highlight and cards.
2. Choose About, Rules, Schedule, Contact and Home from the public navbar. Repeat a link after manually scrolling elsewhere; navigate to About from Login and load /#about directly. Headings must clear the header.
3. At 1920x1080, 1440x900, 1366x768, 768x1024 and 390x844, verify the header's transparent/dark state, mobile menu, card stacking, text size and absence of horizontal overflow. Repeat with reduced motion enabled.
4. Sign in as each role. Manually visit actual nested staff routes and refresh a forbidden route. Candidates must receive 403 on `/admin`, `/admin/questions`, `/admin/contests`, `/volunteer` and `/volunteer/incidents`; volunteers must receive 403 on administrative routes.
5. Enter the arena through real check-in and inspect its native pane scrolling, timer/status bar, editor and session overlay. Scroll a long admin question form and the volunteer table while using their headers and modal actions.

## Validation evidence

Responsive About screenshots are retained locally under `.qa/phase4-2-about-{width}x{height}.png` and `phase4-2-about-viewport-{width}x{height}.png`. The browser checks compare the DOM copy against all four official paragraphs, verify one About target immediately after the hero, check the loaded original logo and test unchanged header/hero heights while sticky state changes. Screenshots were visually inspected for the section's dark racing design, spacing, logo proportions and mobile reading layout. Production browser tests use intercepted responses and do not claim backend verification. Detailed final pass/failure results are recorded with the completed validation below.
### Completed validation

- `npm.cmd run build` and `npm.cmd run lint`: passed; final build has no oversized-chunk warning.
- Existing native question, hint/scoring, monitoring and draft persistence checks: passed.
- `scripts/verify-scroll-security.mjs`: passed at all five requested viewport sizes. Exact copy, one About section immediately after hero, loaded original logo, card titles/stacking, anchor offsets, unchanged header/hero heights, mobile links, repeat links, direct and cross-route hashes, smooth/reduced-motion behavior and no horizontal page overflow were checked.
- The same browser suite passed unauthenticated redirects, candidate 403s across actual nested routes and encoded/case variants, forbidden-route refresh, manipulated role fields/query/obsolete preview flag, permitted candidate arena access, absence of privileged candidate/volunteer links, volunteer review/authorization and admin access to both staff areas.
- Admin headers stayed visible while long question forms scrolled in the corrected route container at 1366x768 and 390x844. Volunteer review dialogs remained above their toolbar. The arena retained native independent statement/editor scrolling and the blocking overlay disabled Run as expected.
- Production offline checks passed: no DEV account selector, no mock fallback, ignored forged identity/roles and zero backend network requests.
- Production API-adapter checks passed with intercepted local responses: API-reported CANDIDATE and VOLUNTEER roles could not access admin routes despite forged stored ADMIN values; ADMIN retained both staff areas; unknown server roles were rejected. Denied candidate routes did not mount privileged API consumers. No role headers were sent. This tests frontend behavior only, not a real backend.
- Default and API-configured production JavaScript were scanned: demo credentials, role tools, mock catalogs and mock hint fixtures were absent.
- The existing Phase 4.1 end-to-end browser suite also passed after these layout changes: admin hint lifecycle, live-round confirmation, candidate hint unlocks/retries/persistence, all four Syntax Guide copies, preserved drafts, judged mock standings and role restrictions. No application runtime exceptions were observed in the passing suites.

Evidence is retained under ignored `.qa/phase4-2-results.json`, `phase4-2-production-offline.json`, `phase4-2-production-api.json`, the responsive About screenshots and `phase4-2-admin-scroll-{width}x{height}.png`. Fake video hardware was used for browser check-in; physical camera hardware was not tested. No remaining build/lint or browser-check failures remain.
