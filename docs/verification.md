# Current Sprint 3 verification

For the current eight-lab implementation, real runtime tests, database tests, browser matrix, screenshots, isolation probes and limitations, see [Sprint 3 verification](sprint-3.md). The sections below retain earlier verification history.

# Sprint 2 verification

The sections below preserve the Sprint 0/1 history. For the current learning/quiz/notes implementation, migration, MySQL and SQLite results, browser matrix, screenshots and limitations, see [Sprint 2 verification](sprint-2.md#verification-record).

# Actual verification — v4 Sprint 0/1

Final report: 24 October 2026, Asia/Jakarta. These commands were executed locally, not inferred from configured CI.

| Check | Actual result |
|---|---|
| `.tools/php/php.exe artisan test` | **26 passed, 725 assertions**, isolated SQLite |
| `npm run test:mysql` | **26 passed, 725 assertions**, actual Docker MySQL 8.4.13; disposable schema removed |
| `npm run test:unit` | **3 passed** |
| `npx playwright test` | **8 passed**, Chromium across 1440×900, 390×844, 360×800 and 768×1024; 1.2 minutes |
| `npx playwright test --project=tablet` after final label adjustment | **2 passed**, 16.7 seconds; screenshots updated |
| `npm run lint` | ESLint and Prettier passed |
| `npm run build` | TypeScript and Vite production build passed |
| `vendor/bin/pint --test` and `composer validate --strict` via local PHP | Passed |
| Compose config, build, additive migrations and seed | Passed |
| Docker app/web/MySQL and login HTTP | Running / healthy; HTTP **200** at localhost:8088 |
| Before/after hashes of existing personal items, plans, legacy progress and account fields | **Unchanged** |

Browser coverage includes signup, both implemented pages/themes, fresh-context account theme persistence, live system theme, five-stage arrow/Home/End navigation, day 73–90 selection, all 90 day groups, task start/completion/reload/prerequisites, category/search, rescheduling, logout/login, CSRF 419, visible focus, dialog focus restoration, client-error and overflow checks. **16 axe WCAG 2 A/AA and 2.1 AA page/theme/viewport scans found zero violations** in tested states. One registration per viewport respects the unchanged five-per-minute registration limit.

Resolved during execution: CTA contrast initially measured 4.4:1 and was corrected; initial browser fixtures triggered the genuine registration throttle and were reorganized; strict JSON comparison now sorts object keys because MySQL normalizes key order; tablet label overlap was corrected and retested. No app safety checks were weakened.

See [visual comparison](visual-qa.md) and [implementation decisions](v4-implementation.md). Logs are retained under ignored `.tools/v4-php-tests.log`, `v4-mysql.log`, `v4-unit-tests.log`, `v4-e2e.log`, `v4-tablet-final.log`, `v4-lint.log`, `v4-build.log` and `v4-compose-build.log`.

Only S0–S1 is complete. The other five poster pages/full 28-image gate, Firefox/WebKit, screen-reader and full manual WCAG 2.2/200%-zoom audits are untested or deferred. No vulnerable lab runtime exists, so lab isolation runtime probes are not claimed. No editorial certification, public deployment, remote CI pass or pixel-identical artwork is claimed.

---

# Historical verification — MASTER PRD v2, before the v4 redesign

Date: 23 October 2026, Asia/Jakarta. This report supersedes the first PRD's task-XP/streak results.

| Executed command/check | Actual result |
| --- | --- |
| `php artisan test --compact` | **24 passed, 489 assertions**, isolated in-memory SQLite |
| `npm run test:mysql` | **24 passed, 489 assertions**, actual MySQL 8.4.13 on Docker; randomly named temporary schema removed afterward |
| `npm run test:unit` | **3 passed** (theme preference, reload initialization, unavailable browser storage) |
| `npm run test:e2e` | **8 passed**, Chromium at 1440×1000, 768×1024, 375×812, 360×800 |
| axe WCAG A/AA scans in E2E | **No violations in the tested dashboard light/dark states at the four viewport sizes**; not a full WCAG certification |
| `npm run lint` | **Passed**, ESLint and Prettier |
| `npm run build` | **Passed**, TypeScript and Vite production assets |
| `php vendor/bin/pint --test` | **Passed** |
| `composer validate --strict` | **Passed** |
| `docker compose config --quiet` | **Passed** |
| `docker compose build` | **Passed**, separate non-root PHP and Nginx targets |
| Runtime migrate/seed and HTTP smoke | **Passed** on MySQL; login HTTP 200 at `http://127.0.0.1:8088` |

## Backend evidence

- Password hashing, normalized unique email, session auth, guest redirects, login/logout, rate limits and rejected role escalation.
- Login and registration now use separate named limiter buckets; regression coverage proves failed login activity does not consume registration allowance.
- Exactly 90 day templates, 13 weeks, four phases; each personal plan has exactly 90 dated day rows and 270 checklist rows, with a 20/70/30 split (120 minutes daily, 180 planned hours). Final week has six days.
- Date tests cover leap day, year crossing during reschedule, DST and learner-local midnight. Today comes from the plan timezone. Sunday activities are review-only, with a full planning target.
- Explicit creation, unique plan per learner, duplicate creation requests, seed repeatability, missing curriculum errors and no partial plans. GET requests create no plans or progress.
- Owner policy rejects a different learner's item ID. Query-string user IDs cannot select someone else's data; client user/XP/completion timestamp fields are rejected.
- Prerequisites and three-item day completion, persisted status/timestamp, duplicate/reordered requests, no duplicate events, zero manual XP/verified time/streak, no manual lesson/lab completion.
- Rescheduling preserves IDs/completion timestamps, updates only the owner's plan and unfinished calendar exercises. Legacy records survive and appear only in their owner's archive, excluded from new completion/XP.
- Linux testing exposed case-sensitive Inertia page discovery and non-resetting MySQL auto-increment assumptions in tests. Actual lowercase page paths and dynamically resolved fixture IDs fixed both.

## Browser evidence

At all four sizes: signup with chosen start date, honest empty dashboard, dark theme persisted after reload, explicit start/review, prerequisite unlock, reload, category/search filters, logout/login, schedule adjustment and preserved completion. Mobile/tablet drawers close with Escape and restore focus; mobile bottom More does likewise. No horizontal overflow or client runtime errors occurred. Missing CSRF is rejected with HTTP 419, and keyboard focus is visible.

The scans found and prompted fixes to low-contrast locked badges/dark text and the built-in loading indicator's invalid ARIA role. An accessible custom loading state is used instead. Screenshots were generated during successful runs and visually inspected; light/dark desktop, tablet, 375px and 360px variants are under `docs/screenshots/`.

## Docker and data boundaries

- Nginx publishes only `127.0.0.1:8088`; PHP and MySQL publish no host ports and join core only. Nginx joins frontend/core; no service joins the reserved lab network. Core/lab are internal.
- Runtime app/web users are non-root, root filesystems read-only with scoped writable volumes/tmpfs, capabilities dropped, no host filesystem or Docker socket mounted. The app receives allowlisted environment variables; MySQL root password is reserved for DB and the host-side test helper.
- The `testing` image includes development tools separately from production. MySQL tests create only a random test schema, run the full suite, revoke its grant and drop that schema. The core learner DB is not reset.
- Before upgrading the running database, a local ignored SQL backup was saved. The additive migration and seeder ran without dropping legacy learner tables; existing users choose their new plan explicitly. Application key and current users are retained.

## Honest limitations

No lesson renderer, quiz, notes editor, reports, analytics/mastery engine, content admin, lab runtime/controller, flags or lab solve flow is implemented. `CURRICULUM_SEED.json` remains an editorial brief, not published/human-reviewed content. Meaningful checklist exercises have no dead lesson/lab links. Verified counters stay zero until their evidence systems exist.

No lab/core isolation penetration test is claimed: there is no lab runtime. The topology test checks configuration, not a future running vulnerable service. CI is configured but no remote CI run or public deployment is claimed. Browsers tested locally are Chromium; other browser engines and a full manual assistive-technology audit remain untested.

