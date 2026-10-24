# Verified test evidence — 2026-10-23

Tests below apply ONLY to the **offline standalone HTML UX prototype**, not to a Laravel application or the executable vulnerable labs.

Commands executed:

```bash
python3 testing/validate_bundle.py
python3 testing/smoke_prototype.py
```

Results observed:
- `validate_bundle.py`: PASS — 25 source-linked lessons, 50 four-option MCQs, 8 isolated lab *design specifications*, 90 day-plan entries, editorial status and copy contract consistency.
- `smoke_prototype.py`: PASS in headless Chromium using Playwright test harness with an in-memory stand-in for browser storage due to sandbox navigation restrictions. Seven desktop navigation pages, theme switch, lesson display, both quiz questions, correct result, roadmap completion, note save, progress, 390px mobile navigation and layout overflow, mobile More → Reports navigation.
- JS syntax checked using Node `--check` before UI testing.
- Screenshots generated: `design/preview-desktop-light.png`, `design/preview-desktop-dark.png`, `design/preview-mobile-light.png`, `design/preview-mobile-labs.png`.
- JavaScript page exceptions during smoke: none.

NOT tested / NOT claimed:
- Laravel app, database, API, Docker compose, authentication/authorization, persistent account data, live isolation probes, source-link liveness for every URL, expert editorial fact check, vulnerability exploitation/flag validation.
- Browser native `localStorage` was replaced with in-memory shim for automated browser smoke; actual HTML uses browser localStorage only as a prototype convenience.

Public production requires all test gates in `QA_PLAN.md` to be implemented and run by Codex, plus human editorial review of lesson accuracy and licensing.
