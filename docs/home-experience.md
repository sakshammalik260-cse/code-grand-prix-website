# Homepage experience

Phase 4.5 adapts the brief opening sequence, numbered navigation and section-by-section pacing of [BREYDAQS](https://www.breydaqs.com/en) to the existing Code Grand Prix artwork and wordmark.

The intro runs for about 1.7 seconds on the first homepage visit in a browser tab session. Skip Intro, Escape and a direct Driver Login link are available throughout. Direct links to informational sections open at their destination. The browser's reduced-motion setting and the homepage's persistent Reduce animation preference both bypass the intro and turn off section and scenery animations.

The sticky navigation highlights the section beneath the header as the user scrolls. Contact is highlighted at the bottom of the page because its footer is shorter than the viewport. Results stays a regular route link. A single observer triggers heading and content reveals, including the BUILD, SOLVE and IMPROVE stagger. All sections remain readable before the observer runs. Hidden tabs pause decorative animation timelines.

The preference control offers motion only. English and the dark racing theme are the available language and theme. The intro uses a native dialog and falls back to the homepage in browsers without modal dialog support. Session completion and the motion preference use browser storage.

Run the homepage browser check with Vite running and an isolated Chrome instance listening on port 9225.

```text
node scripts/verify-home-experience.mjs
node scripts/verify-living-race.mjs
```

The first script checks intro completion, Skip, Escape, Driver Login, the five requested viewport sizes, sticky anchors, numbered highlighting, exact CPC copy, the three-card stagger, motion preferences and countdown updates. Screenshots are saved under `.qa/phase45-*.png`. The second script checks the existing racing scenery and compares approved text and element bounds when the original baseline is available locally.
Build, lint, native verification scripts, the homepage browser checks, the sticky navigation and role checks, and the full monitoring browser regression passed. At all five requested sizes, a pixel comparison with the approved reduced-motion screenshots matched below the header. Header dimensions, hero and section bounds, and existing section copy matched the baseline.
