# Sprint 4 Combined implementation checkpoint

Started 24 October 2026 (Asia/Jakarta), branch `codex/2026-10-24-sprint4-combined` from `370cc30`.

## Scope and sources

Read the existing root MASTER_PRD (v2), attached V4_REFERENCE/MASTER_PRD (v4), PRD_SPRINT4_COMBINED (v4.1), CODEX_SPRINT4_COMBINED and the seven-screen visual reference. The newer attached V4/v4.1 contracts govern Sprint 4; existing routes, data and V4 visual language are preserved. The user explicitly requests implementation and validation only; document prompts do not authorize deployment or unrelated work.

The user-supplied unpacked specification directory was already untracked in the workspace before work began. It is preserved. A new branch was created before editing without deleting or moving that directory.

## Audit

- Existing stack: Laravel 12 / PHP 8.4, Inertia 2, React 19 / TypeScript, MySQL 8.4, Docker; localhost ports 8088 (core) and 8090 (runner).
- Existing working modules: Auth, Dashboard, Roadmap, Learning/quiz, Notes, eight isolated VulnShop runtimes.
- Sprint 3 has concrete implementation and prior verification documentation; real runtime/isolation checks will be repeated in this run.
- Existing `xp_events` represent first lab awards. Canonical Sprint 4 ledger must preserve these records and migrate their credits exactly once.
- No study-attention verification exists. Progress must display `Belum dilacak`, without converting planned/estimated minutes into verified time.
- Progres/Laporan navigation is now enabled on desktop and under mobile Lainnya. Shared feedback and existing module integrations are complete.

## Completed implementation

- Analytics: additive events/ledger/achievements, safe backfill, `/progress`, quiz/lab/note hooks, centralized level and timezone streak, evidence denominators.
- Reports: private versioned drafts, deterministic disclosed internal review/rubric, signed protected evidence and redacted Markdown/print exports, archive/delete, ownership and tampering validation.
- UI: V4 Progress and Reports screens, accessible charts/tables, responsive themes, serialized autosave/conflicts/retry and contextual guidance.
- Shared feedback: bounded deduplicated toast provider, normalized status/cooldown/field errors and focus, loading/confirmation/save states; existing module integration. Confirmation cancellation restores opener focus. Offscreen skip links stay keyboard accessible without leaking into full-page screenshots.
- CI includes the concurrent reward delivery check; production/aaPanel deployment is not configured or started.

## Validation log

| Executed command/check | Actual result |
| --- | --- |
| `.tools/php/php.exe artisan test --compact` | Exit 0: **72 passed / 1,724 assertions**, SQLite, 28.21 seconds |
| `npm run test:mysql` | Exit 0: **72 passed / 1,724 assertions**, MySQL 8.4, 80.41 seconds; disposable schema removed |
| `npm run test:concurrency` | Exit 0: two independent PHP containers released together; twelve deliveries produced exactly 30 XP / two ledger rows / two events / two badges; disposable schema removed |
| `npm run test:unit` | Exit 0: **9 tests passed / three files**, final run 3.02 seconds |
| `npm run build` | Exit 0: TypeScript and production Vite build, final build 4.99 seconds |
| `npm run lint` | Exit 0: ESLint and Prettier passed |
| `.tools/php/php.exe vendor/bin/pint --test` | Exit 0 |
| `.tools/php/php.exe .tools/composer.phar validate --strict` | Exit 0 |
| `npm run test:e2e` | Initial full matrix: **20 passed, four failed** in 5.6 minutes; failures were old selectors colliding with new toast controls/status regions |
| `npm run test:e2e -- tests/e2e/learning.spec.ts tests/e2e/sprint4.spec.ts` | Final focused matrix: **8 passed** in 2.3 minutes after selector/focus fixes; combined with the other sixteen passing cases, all **24 unique browser cases** validated |
| `npm run test:e2e -- tests/e2e/sprint4.spec.ts` | **4 passed** after integer-axis label correction and final screenshot capture checks |
| `node scripts/test-sandbox.mjs` | Exit 0: all eight real runtime scenarios, reset/evidence/expiry/restrictions, unauthorized runner rejected |
| `node scripts/test-sandbox-transport.mjs` | Exit 0: four transport checks |
| `node scripts/check-lab-isolation.mjs` | Exit 0: constrained topology and database/external TCP denial probes |
| `docker compose -f compose.yaml -f compose.labs.yaml config --quiet` | Exit 0 |
| Local image rebuild/recreation + `php artisan migrate --force` | Additive migrations applied; localhost login HTTP 200; PHP upload limit 5M / post limit 6M |
| Original MySQL content hashes | **All 34 original durable tables unchanged** after migration; full private dump remains ignored under `.tools` |
| `git diff --cached --check` on implementation paths | Passed; supplied reference Markdown's intentional two-space hard breaks are preserved |

The four browser projects are 1440×900, 390×844, 360×800 and 768×1024. New tests cover actual lab reward → report evaluation → Progress, 422 field focus, save/reload, network-failure retention/retry (desktop), private upload, exports, both themes, chart filter/table, modal keyboard cancellation/focus restoration and 720-CSS-pixel reflow equivalent to 200% browser zoom on a 1440px window. Targeted axe scans report no violations in these flows. This is not a claim of full manual screen-reader certification.

Repairs made during validation: calendar ARIA labels needed semantic roles; the scrollable activity table needed keyboard focus; report field labels needed stable names independent of error copy; legacy selectors needed exact button names and scoped save-status regions after toast integration. The initial frontend build was attempted before the stylesheet had finished being written; subsequent production builds passed. PHP style and test-fixture path assertions were corrected. No known P0/P1 regression remains from the executed checks.

24 new screenshot files cover Progress empty/evidence and Reports in both themes at all four viewports; existing page screenshots were refreshed by the regression suite. Manual visual review checked Progress and Reports at desktop and mobile in both themes against the V4 poster. The report's additional mandatory fields and explicit evidence explanations make it taller than the concept panel. The art remains original SVG and is not claimed pixel-identical. Standalone server PDF, credible attention minutes and expert review are explicitly not claimed; printable HTML/browser PDF is available.

## Handoff

See `docs/sprint-4.md` for the delivered data/review/security contracts and `docs/analytics-contract.md` for formulas and mappings. The update is ready for a versioned GitHub source backup on this branch. `main` and earlier backup branches are preserved. Remote GitHub Actions are triggered by push; a remote CI pass is not implied by the local results above. Sprint 5 remains a separate future request. No production/aaPanel deployment occurred.
