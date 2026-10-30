# Visual recovery — 30 October 2026

Recovery baseline: `a7b858328354` (rejected V8). Last saved pre-V8 layout: `86e4a88`. The original V4/V5 visual poster is the design reference; the saved commit is not a new claim of human visual approval.

## Root cause and recovered assets

V8 replaced `HeroIllustration` with a small flat polygon SVG and removed `PathIllustration` from Roadmap in favor of an unrelated decorative banner plus a flat timeline. Global overrides removed depth and made the learning journey feel disconnected. These were presentation changes, not evidence of lost learner progress.

Original artwork is available: `resources/js/components/JourneyArt.tsx`, originally versioned in `37e912b` and present unchanged in `86e4a88`. It contains the observatory, clouds, river, forest, moon, mountain ridges, tent, summit flag and luminous winding path. This recovery reconnects those vector layers; no poster crop, screenshot background, new stock illustration or generated polygon replacement is used.

The artwork is the existing original SVG interpretation of the poster, not the poster's detailed painted illustration. No separate high resolution painted landscape asset was found in the production source. That fidelity limit remains explicit.

## Changes

- Dashboard: restored observatory landscape, readable overlaid greeting/action, daily tasks, compact real counters, four quick routes, curriculum/lab recommendations, actual checklist progress and visible recent activity.
- Roadmap: restored night landscape and connected ascending path, five large live checkpoint buttons, completed/active/locked states, selected outline, current-day detail, compact adjacent panel and mobile vertical journey. Keyboard navigation, accessible list, filtering, template-based grouping and persistence remain current V8 logic.
- Global: requested dark navy/text/accent tokens, subtle surface depth, readable navigation and distinct reader/catalog/workspace/editor layouts. Progress artwork opacity restored; account and editorial controls retained.
- Authentication: original observatory illustration replaces the decorative line drawing; all registration/login fields and validation remain intact.
- Modules, HTTP lab workspace, progress analytics, notes editor, reports, Profile/Settings and Studio retain their purpose-specific structures rather than sharing a new card template. This is selective recovery, not a source-tree rollback.

## Evidence and reproduction

[Before/after gallery](comparison.html) contains 128 image pairs: 16 routes × four viewports × two themes. Viewports are 1440×900, 1280×800, 390×844 and 320×740; captures are full-page. Every capture uses real Laravel responses with fresh synthetic accounts and disposable SQLite data. Zero counters in those accounts are expected; no learner account, MySQL connection or aggregation was changed to improve screenshots. Fixtures differ between before/after, including timestamps and generated account/draft IDs.

```sh
# Existing dependencies and a local build required. No hosting/deployment.
npm run build
node scripts/test-ui-recovery.mjs after
node scripts/test-ui-recovery.mjs regression
node scripts/recovery-gallery.mjs
```

The runner creates a fresh database under the OS temporary directory, migrates/seeds only that database and leaves it for private failure diagnosis. `PHP_BINARY` can select the installed PHP 8.4 binary. Browser lab completion additionally requires the existing localhost-only sandbox. Visual capture uses loopback 8098; regression uses 8089. Output directories are separate to prevent Playwright trace cleanup collisions. Do not run `before` on the recovered checkout and mislabel it as V8 evidence: the committed before images were captured before the UI edits/build.

## Validation results

Final results are recorded in [results.json](results.json). Laravel: **115 tests / 2,247 assertions**. Frontend unit: **11 tests / four files**. Build includes TypeScript checks. Eight actual local lab scenarios and four transport checks passed using temporary sessions, including secure comparison/reset/flag evidence. Browser acceptance includes real roadmap persistence, CSRF/focus, grading, notes autosave, private report evidence/export, account security and editorial roles.

An intermediate screenshot review found inherited negative artwork z-index and overlapping summit labels; both were corrected and captures repeated. Parallel browser runs initially shared `test-results` and caused missing trace files at teardown; the recovery configuration now has its own output directory. Those runs are retained as failed attempts, not silently reported as clean passes; final reruns are listed in the results.

Ten unique desktop browser regression workflows passed after the targeted rerun. The actual browser-tab 200% zoom test failed twice because full Chromium could not launch (`spawn UNKNOWN`), while ordinary headless browser tests ran successfully. This is an unresolved environment blocker, not a passing zoom result or a reason to remove the test. Four-viewport screenshots and the separate keyboard/reflow checks are not substitutes for that missing evidence.

## Preservation and limitations

No backend/controller/service, migration, route, database configuration, content record or business rule changed. Backend diffs against `a7b8583` were checked. Application tests used in-memory SQLite; browser tests used temporary SQLite; sandbox tests used temporary sessions. No learner database reset, re-seed, volume deletion, whole-app Git revert, force-push, aaPanel or production operation was performed. Safety snapshot: ignored local `.tools/ui-recovery-before.bundle`, preserving the complete saved V8 HEAD.

Automated screenshots/reflow and axe checks are not human visual approval or full accessibility certification. Firefox, Safari, physical devices and real assistive technology were not tested. Existing private learner data was not copied into screenshots. The original painted poster art is not available as an isolated runtime asset; the restored original vector art is the available recovery asset. Remaining non-UI Sprint 7/expansion blockers are unchanged.
