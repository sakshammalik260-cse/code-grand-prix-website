# Code Grand Prix — Approved Visual Design Reference

This directory contains the exact 8-panel **visual target** approved for the frontend. These images are **references**, not backgrounds/screenshots to display directly. Recreate the pages using semantic HTML, React components, Tailwind/CSS, and appropriate local artwork assets. Do not simply put these screenshots in an `<img>` or set them as a page background. Do not remove functionality to match aesthetics.

## Order of authority
1. Screenshots `01`–`08` are the highest authority for page visual hierarchy, arrangement, colors, and look.
2. Existing functioning application flows and accessible controls must be preserved.
3. Content text and exact countdown values shown in screenshots are conceptual/illustrative; use real event data and real client state.

## Specific layout targets
- `01-landing.png`: cinematic dark/night race circuit **with realistic red racing car in left foreground**, stadium lighting, large angular racing wordmark in upper left/center, race countdown panel floating on right, red Enter the Grid CTA, checkered flag at upper right. Full-bleed immersive hero, not a half-screen vector track illustration. Site header may remain if unobtrusive, but should align with mockup.
- `02-login.png`: **two-panel hero**: dramatic **helmeted driver portrait filling left ~50%**, saturated red/black diagonal lighting, right ~50% contains racing logo, DRIVER LOGIN title, compact two inputs, vivid red CTA. Remove huge generic copy block ('Every great race starts with you'), oversized whitespace and form-heavy card. Keep functionality, validation, feedback, route guards.
- `03-check-in.png`: dark race dashboard with the PRE-RACE INSPECTION title centered, three columns: checklist timeline on left, large rectangular live camera preview centered, compact green-status checklist on right, red START YOUR ENGINE button below.
- `04-race-lobby.png`: nighttime illuminated racing track as backdrop, centered RACE LOBBY title and compact large countdown; a translucent Driver Details card on right; track mini-map on left; race-staging atmosphere.
- `05-coding-arena.png`: dense desktop IDE dashboard — top narrow dark nav with round/time/camera/driver; left problem nav (~15%); problem description (~33%); CodeMirror editor + run/submit controls and result panel (~52%). Much denser than landing pages; readability matters more than decoration. The layout should be useful at 1366×768, with independently scrollable panes and code persistence.
- `06-violation-lock.png`: blurred/dimmed coding arena behind a small centered dark-red bordered RACECONTROL modal with amber warning icon, clear lock reason, Awaiting Authorization disabled status. No fake override button for contestants.
- `07-volunteer-dashboard.png`: functional control room layout, narrow left nav, 4 KPI cards in a row (Total Drivers, Racing, Flagged, Disconnected), search field and full-width incident table; red lock badges and red Authorize Resume buttons. Not a marketing landing page.
- `08-results.png`: results dashboard with a DRIVER STANDINGS table center-left, black/red navigation and trophies, white checkered flags and bold RACE COMPLETED panel at right. Use mock standings until backend ready.

## Core visual tokens
- Background near-black #0B0B0F; panel #17171D; red #E10600; off-white #F5F5F5; green #00D084; yellow #FFCC00.
- Motorsport type: wide, italic, angular display typography for identity; clean sans-serif for UI labels/code.
- Cinematic visuals on marketing/entry pages; restrained use of animation inside editor.
- Layered gradients, red rim light, checkered motifs, high-contrast buttons, thin red outlines, compact control panels.

## Requirements to preserve
- React + TypeScript + Vite + Tailwind CSS; use CodeMirror 6, NOT Monaco.
- React Router, mock auth, check-in camera access, fullscreen, check-in gating, race lobby status and timers; never reduce these to inert buttons.
- Back end is a separate team. Keep service interfaces and mock mode toggles.
- Browser fullscreen and camera can be exited by users; monitor/report rather than claim to prevent them.
- Do not place actual hidden solutions or hidden tests in frontend.

## Acceptance checklist
- Screenshot each route at 1440×900 and 1366×768. Compare visually side-by-side to relevant references.
- Correct overall composition of major regions (e.g., photographic left/right split for login).
- Visually recognizable F1 vibe with cinematic racing artwork, not just red buttons.
- All interactive controls continue to work in mock mode.
- Run `npm run build`, `npm run lint`, then examine warnings/console errors.
- Iterate until layout and imagery match as closely as the real viewport permits.

## Artwork guidance
- Create/obtain permitted **original** high-resolution race car at track / dark helmet-driver artwork assets. Do not use the panel screenshot as a hero background because it contains UI text and controls. Do not incorporate official F1 logos or team/trademark marks.
