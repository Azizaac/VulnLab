# Visual Match Acceptance & Pixel-Intent Handoff — v4

## Reference to match
`design/visual-reference.png` (1672×941) = latest screenshot/contact sheet confirmed by owner. **No other concept sheet overrides it.** Treat it as seven separate layouts. It is not a source of exact app strings, user metrics, current learning state, or a ready-to-use cropped frontend.

### Poster regions (approximate for visual analysis only)
- ① Home: top-left region spanning roughly x=14..525, y=67..441.
- ② Roadmap: top-center x=531..1120, y=67..441.
- ③ Learning: top-right x=1127..1640, y=67..441.
- ④ Lab: lower-left x=14..499, y=481..842.
- ⑤ Progress: lower-middle-left x=503..878, y=481..842.
- ⑥ Notes: lower-middle-right x=886..1232, y=481..842.
- ⑦ Reports: lower-right x=1238..1640, y=481..842.

The poster is a **product-design contact sheet**: don't set it as a website background and don't expect 1672×941 pixels to be the dimensions of one web page.

## Scorecard for visual review
| Category | Weight | Pass criteria |
|---|---:|---|
| Architecture & placement | 30 | Seven correctly split pages; header is horizontal; correct page composition and column ratios |
| Hero/roadmap illustration | 20 | Soft observatory/mountain hero + nocturnal mountain path with 5 rings; legible interactive overlays |
| Color & theme | 15 | Accurate sapphire/cyan/violet/navy; white-blue surfaces; dark lab/notes/roadmap motifs and both modes |
| Typography & spacing | 15 | Similar density, type hierarchy, borders, rounded surfaces and CTA positions; all text real and readable |
| Details & affordances | 10 | Active tabs, code block, lesson/source rails, hint button, note toolbar, report tips/status |
| Responsive/accessibility | 10 | No lost functionality 390px mobile, keyboard/contrast, readable without poster text tiny sizing |

**Target:** >=85/100 hand-reviewed fidelity before declaring visual redesign done, **subjective heuristic, not computer-derived metric**. Any failing category requires screenshots and a fix list. Never claim `pixel-perfect` unless that level of comparison is really achieved; illustrations can be original equivalents of the specified art.

## Required screenshot matrix (28 screenshots)
For each of these routes capture `1440×900` desktop and `390×844` mobile in BOTH **light** and **dark** modes: `/dashboard`, `/roadmap`, `/learning/{seed-slug}`, `/labs/{seed-slug}`, `/progress`, `/notes`, `/reports/{id}`. Use deterministic seed test account/data, screenshot filenames `{route}-{desktop|mobile}-{light|dark}.png`. Desktop poster comparison focuses on native theme panels (Home light, Roadmap dark, Learning light, Lab dark, Progress light, Notes dark, Report light); the opposite theme confirms adaptation.

## Execution test — MUST run in Codex
1. Capture target page screenshot.
2. Compare side-by-side with panel in `visual-reference.png` and inspect layout, illustration, colors, copy, call-to-action positions.
3. Log discrepancies sorted P0/P1/P2 into `docs/visual-qa.md` with screenshots or measurable descriptions.
4. Fix P0/P1 visual deviations, then capture again; run E2E nav, forms, dark/light and viewport tests.
5. Keep scope honest: screenshots/visual QA cannot prove backend behavior, isolation or content fact-checking.

## Hard fail examples
- Reverts to an admin left sidebar.
- Replaces illustrated roadmap with only an ordinary stacked list on desktop.
- Renders 7 montage panels together as a single screen.
- Uses a picture of a request/response editor rather than a working React editor.
- Cards display fixed fictional `60%`, `24 Hari`, or `45%` from concept poster for every new account.
- Any page CTA navigates nowhere or reports lab verified while runtime unavailable.
- Text and contrast degrade enough to be illegible to satisfy a superficial pixel match.

## Visual art implementation guidance
Use original illustration assets: SVG layered mountains/stars/river/path + waypoint HTML, or another authorized illustrated asset created for the project. Do not use unrelated internet screenshots as interface assets. Decorative image never contains interactive control text. Art assets should be local, optimized, and licensed; no hotlink surprises.
