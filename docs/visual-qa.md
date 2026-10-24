# v4 visual comparison — Sprint 0–1

Final review: 24 October 2026, Asia/Jakarta. Scope: shared shell, Beranda and Roadmap. The seven-page release gate remains open until S2–S5; this report does not claim all seven pages are implemented.

## Reference and method

The supplied 1672×941 contact sheet was opened and inspected with image tools. Panel 1 defines the Home composition; panel 2 defines the mountain journey. The original is retained at `design/visual-reference.png`, SHA-256 `B2696ED0C815872043B7B838949B45204B7A0C9129FCAE57CB1C7A1C9F827F72`, matching the supplied extracted asset. It is not loaded into the application UI.

Real browser screenshots were captured after fonts loaded, with deterministic start date 2026-10-23 and newly registered test learners at 0%. Desktop and mobile captures were opened for manual comparison against the reference. Both themes were reviewed; tablet was inspected separately and corrected. This is human visual judgment, not a computed pixel-diff score.

## Comparison and fixes

| Priority | Observation | Action/result |
|---|---|---|
| P0 | Prior UI had a permanent desktop sidebar and generic dashboard cards | Replaced with a 64px horizontal header, shield logo, active underline and responsive navigation |
| P1 | Home lacked the observatory/landscape composition | Original SVG sky, star arc, observatory, layered hills, trees and river; real greeting/search over left side; art at right |
| P1 | Continue/next actions did not match panel 1 | Navy continue card and white next-two-task panel in a 1.55:1 grid; four compact pastel icon tiles below |
| P1 | Roadmap was only a list | Illustrated navy mountain landscape, cyan/teal/violet path, five real HTML stage buttons, right detail overlay; accessible list retained |
| P1 | Initial Home CTA contrast was 4.4:1 | Darkened button blue; subsequent axe scans pass |
| P1 | Tablet final-stage label approached the detail overlay | Moved label left within the tablet breakpoint, recaptured and reran both tablet tests; label now clear |
| P1 | Mobile could not use desktop spatial composition | Home panels stack; map becomes five vertical, touch-accessible stages followed by detail panel and daily list |
| P2 | Illustration is flatter and less textured than poster art | Original vector equivalent intentionally retained; composition/colors match the intent, not individual painted pixels |
| P2 | Roadmap light mode retains the mountain artwork | Header/detail/control surfaces use light colors; terrain remains illustrated with a brighter palette and legible labels |
| Scope | Future links/tiles cannot yet open implemented destinations | They identify their sprint and are noninteractive. No placeholder pages or fictitious navigation success |

Subjective S0–S1 score only: **86/100** (placement 28/30, illustration 15/20, theme 14/15, typography/spacing 13/15, details 7/10, responsive/accessibility 9/10). This is an implementation self-review, not independent approval or a seven-page score. Remaining visual differences are original-vector texture, slightly different art geometry, readable text density, and the explicit future-feature labels. No pixel-perfect claim is made.

## Required subset: eight page/theme/viewport combinations

| Page / theme | Desktop 1440×900 | Mobile 390×844 |
|---|---|---|
| Beranda light | [Viewport](screenshots/v4/dashboard-desktop-light-viewport.png) · [Full](screenshots/v4/dashboard-desktop-light.png) | [Viewport](screenshots/v4/dashboard-mobile-light-viewport.png) · [Full](screenshots/v4/dashboard-mobile-light.png) |
| Beranda dark | [Viewport](screenshots/v4/dashboard-desktop-dark-viewport.png) · [Full](screenshots/v4/dashboard-desktop-dark.png) | [Viewport](screenshots/v4/dashboard-mobile-dark-viewport.png) · [Full](screenshots/v4/dashboard-mobile-dark.png) |
| Roadmap light | [Viewport](screenshots/v4/roadmap-desktop-light-viewport.png) · [Full](screenshots/v4/roadmap-desktop-light.png) | [Viewport](screenshots/v4/roadmap-mobile-light-viewport.png) · [Full](screenshots/v4/roadmap-mobile-light.png) |
| Roadmap dark | [Viewport](screenshots/v4/roadmap-desktop-dark-viewport.png) · [Full](screenshots/v4/roadmap-desktop-dark.png) | [Viewport](screenshots/v4/roadmap-mobile-dark-viewport.png) · [Full](screenshots/v4/roadmap-mobile-dark.png) |

Additional full-page captures use `dashboard|roadmap-tablet-light|dark.png` at 768×1024 and `dashboard|roadmap-mobile360-light|dark.png` at 360×800. A total of 24 PNGs is retained: 16 full-page captures across four viewport projects plus 8 viewport captures for the specified desktop/mobile subset. Fixed mobile navigation appears at the viewport boundary inside full-page images; viewport images show its actual on-screen position.

## Functional evidence and limitations

All controls are React/HTML. The art is decorative SVG with no baked-in labels or copied screenshot controls. Five stage buttons expose accessible name/status/percentage and support arrows/Home/End; each stage exposes its real 18 dates and 54 tasks. Backend checks control prerequisites and completion. Dialog focus returns to its trigger. Account preference supports light, dark and system, including fresh browser sessions.

The complete browser suite passed at four widths and ran 16 axe page/theme/viewport scans with zero violations. These checks do not certify all WCAG criteria. A full screen-reader and 200%-browser-zoom audit remains unperformed. The other five pages and their 20 required screenshots remain deferred to their sprints.

## Asset provenance

`BrandMark.tsx` and `JourneyArt.tsx` are original locally authored vector compositions. The user-supplied poster is an internal reference only. Plus Jakarta Sans and Inter are bundled locally through Fontsource; their OFL license text is distributed under `public/licenses/`. No remote font or image requests are required.
