# Living race background

## Scope

The existing homepage receives one decorative `LivingRaceBackground` child. Its approved background image, CSS crop, car/camera composition, logos, text, UI panels, buttons, navigation, countdown, breakpoints and subsequent sections remain unchanged. No assets or dependencies were added or replaced. Existing UI entrance animations were left intact; this component animates only scenery.

Files introduced/changed for this enhancement:

- `src/components/LivingRaceBackground.tsx`: reusable decorative SVG, unique gradient/clip IDs, visibility/intersection lifecycle.
- `src/styles/living-race-background.css`: scoped opacity/transform animations and static fallbacks.
- `src/pages/LandingPage.tsx`: component import and placement only (two added lines).
- `scripts/verify-living-race.mjs`: responsive, animation lifecycle, alignment and navigation verification.
- This document.

Authentication, competition routes, monitoring, dashboards, hints, syntax guide, question management, leaderboard and backend contracts were not changed by this enhancement. Earlier workspace changes remain intact.

## Artwork registration

The approved `src/assets/artwork/night-race-hero.webp` is a single 1672 x 941 plate. The car, tires, rear light, track, spectators and floodlights are baked into it. The original hero CSS continues to render the image; the component does not load another copy, translate the image or add a second car.

The SVG uses `viewBox="0 0 1672 941"` and `preserveAspectRatio="xMidYMax slice"`. This matches the hero's existing `center bottom / cover` crop on desktop and tablet. The tail-light overlays are centered at artwork coordinate (328, 734), with core/bloom/reflection gradients. A single 2.1-second ease-in-out cycle raises and lowers brightness gently. Two low-opacity rail streaks follow the right barrier's vanishing-point direction; road reflections follow the right asphalt perspective. Tire haze, clipped grandstand lighting and floodlight haze remain restrained.

The SVG is absolutely positioned in the isolated hero, clipped, aria-hidden, unfocusable and non-interactive. Its negative stacking level keeps it behind existing UI and flag elements. It contributes no layout height or scroll width.

## Intentional limits

- The car body does not vibrate or move: extracting/offsetting it from this flattened asset would expose duplicate edges or holes and violate the approved composition. Small tire haze and the pulsing existing rear light suggest a running car without altering it.
- Individual spectators are not animated. Only subtle light varies inside masks over visible grandstands.
- At widths of 700px or less the current homepage uses a different `auto 730px / 33% bottom` crop. The entire overlay is disabled at this existing breakpoint, preserving the exact mobile background. In portrait tablet crops, effects outside the image viewport are naturally clipped (the rear light itself can be outside the visible crop).
- `prefers-reduced-motion: reduce` disables and hides all scenery animation, leaving the original static homepage. Unsupported CSS animation also leaves the original image untouched.

## Lifecycle and performance

Effects use CSS opacity/transform loops with smooth matching endpoints; traveling streaks reset only while fully transparent. There is no animation-frame loop, particle engine, video, canvas, full-screen filter, second background image or new library. Gradients provide local softness instead of blur filters.

One visibility listener pauses CSS timelines while the document is hidden. One IntersectionObserver pauses them when the hero is fully outside the viewport. Cleanup removes the listener and disconnects the observer on route departure; returning creates a single scene. If IntersectionObserver is unavailable, document visibility pausing still works. CSS reduced-motion/mobile rules eliminate the animations entirely.

## Verification completed November 19, 2026

- `npm.cmd run build`: passed.
- `npm.cmd run lint`: passed.
- `node scripts/verify-living-race.mjs`: passed with no application runtime exceptions.
- Original versus static fallback screenshots were pixel-identical at 1920x1080, 1440x900, 1366x768, 768x1024 and 390x844, with frozen countdown time and identical reduced-motion settings. Original text and element bounds also match at all five sizes.
- Rear-light SVG coordinates match the original image's cover projection within 0.1 CSS px at every tested desktop/tablet size. Mobile overlay is disabled; no horizontal overflow was introduced.
- Verified low/peak rear-light phases, infinite timing, matching endpoint opacity and invisible moving-streak resets.
- Real browser tab changes pause all scenery animations; returning resumes. Scrolling fully past the hero pauses them. Reduced-motion and mobile render the unchanged static page.
- Countdown values advance independently. Home/About/Rules/Schedule/Contact scrolling, sticky-header clearance, Results, both ENTER THE GRID links and Driver login preserve their existing behavior.
- Login markup is unchanged and has no scenery component. Repeated route changes leave exactly one scene on the homepage and none on login. No other route implementation changed.
- A local isolated headless Chrome sample at 1440x900 measured 100 frames averaging 16.62 ms (maximum 16.8 ms), with approximately 45 ms of main-thread task time over a separate two-second active-animation sample. This is a local smoke measurement, not a guarantee for every GPU or lab machine.

To repeat browser checks, start `npm.cmd run dev -- --host 127.0.0.1`, then start an isolated Chrome profile with remote debugging on port 9225 and run `node scripts/verify-living-race.mjs`. The test uses a fixed Date.now only in its isolated browser for deterministic screenshots, then restores a progressing clock to verify countdown updates. An optional pre-change `.qa/living-race-baseline.json` enables exact original bounds/text comparisons; without it, the remaining functional/alignment checks still run. Test outputs are local ignored artifacts under `.qa/`.

Screenshots: `living-race-before-WIDTHxHEIGHT.png` (captured before implementation), `living-race-static-WIDTHxHEIGHT.png`, `living-race-animated-WIDTHxHEIGHT.png`, `living-race-light-low.png` and `living-race-light-peak.png`. Results: `.qa/living-race-results.json`, `.qa/living-race-pixel-comparison.json`. Desktop and mobile screenshots were visually inspected.
