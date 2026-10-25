# VulnLab — Sprint 6 release readiness

**Decision: GO FOR SPRINT 7 PLANNING**, under the supplied Sprint 6 local release-candidate criteria. **Sprint 7 has not started. This does not authorize production/aaPanel deployment or public labs.**

QA date: **25 October 2026, Asia/Jakarta**. Revision: the commit containing this report on `codex/2026-10-25-072442-sprint6-final-qa`, based on `feb859edb36a`. Reviewer: Codex, agent-assisted technical/browser review; no independent human security/content/accessibility certification.

Environment: existing Laravel 12.70.1 / PHP 8.4.27 / React 19 application, Windows local development, MySQL 8.4.13 in Docker, isolated SQLite/MySQL fixtures, Node 24.19.0 and Chromium 156. Core web and runner remain loopback-only. The local Docker app/web were updated; no remote server, aaPanel, DNS or firewall was changed.

## Executed final results

| Command | Environment | Actual result | Evidence |
| --- | --- | --- | --- |
| `.tools/php/php.exe artisan test --compact` | Dedicated test SQLite | **103 passed; 2,106 assertions**, 61.79 s | [command totals](command-results.json), versioned `tests/Feature` |
| `npm run test:mysql` | Random disposable MySQL schema | **103 passed; 2,106 assertions**, 126.62 s | [command totals](command-results.json), `scripts/test-mysql.mjs` |
| `npm run lint` | Local ESLint/Prettier | **PASS** | [command totals](command-results.json) |
| `npm run build` | Local TypeScript + Vite | **PASS**, Vite 7.84 s; generated assets excluded from Git | [command totals](command-results.json) |
| `npm run test:unit` | Vitest/jsdom | **11 passed / 4 files** | [command totals](command-results.json), request timeout/feedback/Markdown/theme tests |
| `npx playwright test --reporter=list,json`, then focused retests | Actual loopback app; five viewport projects | **48 distinct executed combinations finally passed; 7 intentional skips** | [full initial results and final retests](browser-results.json), [screenshots](screenshots/) |
| `npm run test:concurrency` | Two real PHP/MySQL workers | 12 completion deliveries: **30 XP / 2 rewards / 2 events / 2 badges**; six valid fixture-proof flag deliveries: **one solve / 50 XP** | [command totals](command-results.json), race script |
| `node scripts/test-sandbox.mjs` | Actual isolated training services; serial run | **8/8** baseline/exploit/secure/proof/reset/contract scenarios passed; unauthenticated runner call rejected | [security checkpoint](02_SECURITY.md), command totals |
| `node scripts/test-sandbox-transport.mjs` | Owned local HTTP fixtures | **4 checks passed**, including redirects not followed and bounded responses | [security checkpoint](02_SECURITY.md) |
| `node scripts/check-lab-isolation.mjs` | Actual Docker configuration + owned probes | **PASS**, shop/verifier blocked from core/host/metadata and separate-bridge canary; positive control reachable | [isolation evidence](../lab-isolation-check.json) |
| `node scripts/qa-restore.mjs` | Newly generated QA schemas only | **2 restores passed**, migrations and rolled-back login/roadmap/catalog/note workflow; source unchanged | [restore evidence](restore-results.json) |
| `node scripts/qa-preflight.mjs` | Separate HTTP app with unavailable DB | **PASS**: `/up` 200, `/ready` 503, no exception detail even with database session/cache configuration | [preflight](preflight-results.json) |
| `node scripts/qa-smoke.mjs` | Updated local Docker app | **PASS**: `/up`, `/ready`, `/login` 200; `/.env` 403; CSP nonce/headers and no dev-server assets | [local smoke](local-smoke-results.json) |
| Composer audit / npm audit | Configured registries, QA date | **0 advisories / 0 vulnerabilities** reported | [security checkpoint](02_SECURITY.md), command totals |
| Content/source checks | Versioned curriculum + HTTPS references | **25 lessons / 50 questions / 8 labs / 90 days** structurally valid; **24/24 learning**, **8/8 lab**, **2/2 clarification** URLs reachable | [content review](04_CONTENT_AUDIT.md), [additional sources](errata-source-results.json) |
| `node scripts/qa-log-scan.mjs` | Local runtime and QA logs | Final scan clean; one private reporter-config issue fixed before commit | [log scan](log-scan-results.json), [security details](02_SECURITY.md) |

The [121-case matrix](QA_TEST_MATRIX.csv) records **121 scoped PASS results**, actual observations, commands, evidence and linked defects. This does not convert untested capabilities into passes. Lighthouse, screen-reader/real-device testing, Firefox/WebKit, independent pentesting, real email delivery/TOTP and public deployment are **NOT RUN** or unavailable as documented.

## Feature truth and corrections

| Feature | Actual verified behavior | Limits |
| --- | --- | --- |
| Auth/roadmap | Real accounts/sessions, default learner role, 90-day persisted plans, timezone/prerequisite/idempotency checks | SMTP reset/verification integrations not configured |
| Lessons/quizzes | Catalog, prerequisites, safe materials, server grading, pinned questions/attempts and stable progress | All 25 starter materials retain independent-review limitations |
| Notes/reports/progress | Private persistence, autosave recovery/conflicts, evidence/export controls, authoritative XP/charts/achievements | Report acceptance is internal practice, not an external bounty result |
| Labs | Eight real local runtimes; actual isolated-browser XSS proof and secure comparisons | One verifier render at a time; safe 503 under contention; no production-scale availability claim |
| Studio | Author/reviewer/publisher roles, audited revisions, atomic publication, quiz/lab/roadmap/user controls | Metadata cannot introduce executable runtimes or arbitrary targets |
| Profile/settings | Persisted profile/avatar/preferences/privacy, reauth/session revocation, own export and protected deletion | Mature deletion remains an explicit operator process; no actual learner deletion run |

Fixed readiness semantics, nonced core CSP while preserving export sandboxing, private browser history, stalled-save deadlines/recovery, current-revision/path Studio filters, login error focus, catalog N+1 source queries, two additive technical clarifications, primary-action contrast and Studio target size. Existing V4/V5 layout/art and original learner/editorial records remain intact.

Performance measurements are in [performance-results.json](performance-results.json): catalog query growth changed **19→39** at 10→30 modules to **10→10 on SQLite / 8→8 on MySQL**; Studio remained **11→11** after adding 30 entries. Observed timings are not production latency guarantees.

## Browser failures and retests

The full five-project run initially recorded **45 passed, 3 failed, 7 skipped**. The failures were: one XSS request returned safe 503 during competing local work; the mobile visual journey exceeded its old 30-second harness limit; and the zoom helper checked visibility before hydration. The visual deadline is now bounded at 90 seconds, zoom waits for visible rendered content/fonts, and runtime checks are run serially. All three combinations passed focused retests.

An intermediate added errata test used a button locator for the existing tab role; that harness run was interrupted and restarted with the corrected role and a bounded action timeout. The fresh final V6 run passed desktop + 320px security/keyboard/reduced-motion/reflow/offline/double-click/errata checks and actual 200% zoom in both themes. The complete desktop lab suite was rerun after removing a private token from reporter-visible configuration and passed both tests. [browser-results.json](browser-results.json) retains the initial failures and final per-combination results; no automatic retries disguise them.

## Data integrity and backup

A private consistent MySQL dump and hashes were taken before edits. After all application/test work, **all 50 durable tables matched their original columns and records exactly**. No learner DB reset/reseed, data-volume removal, real-account deletion or production restore occurred. Temporary browser lab cleanup touched only guarded E2E SQLite sessions; solve history remained intact.

The current 50-table dataset and pre-V5 42-table snapshot were restored into separate disposable schemas. Their preexisting data survived migration; the sample workflow was rolled back and the temporary schemas removed. Private SQL backups, credentials, sessions, logs, dependencies and generated builds are excluded from Git. GitHub backs up checked source/evidence on this update branch; it does not contain learner data.

## Remaining findings and disposition

[Defect register](DEFECT_REGISTER.csv): **0 open P0, 0 open P1**. One **accepted P2** is the verifier's limited concurrency/availability; it fails closed, has explicit resource limits, and requires a future separate-host/operations review before public use. One **open P3** covers minor Indonesian wording/broad citations; existing issued question presentations were preserved. Fifteen findings were fixed and retested, including QA-harness/privacy issues.

The release gates for this local candidate are satisfied: core learner/admin flows, negative authorization, server grading/rewards, lab containment, responsive UI and restore evidence exist. Human editorial limitations remain visible. The decision therefore permits **planning only**, with no Sprint 7 execution initiated. TLS/secure-cookie/proxy configuration, production secret rotation, off-host recovery, scheduler/monitoring, independent review and separate training-host approval remain [future prerequisites](SPRINT7_DEPLOYMENT_PREREQS.md).

Reproduction commands, fixture guards and private-evidence handling are in the [QA guide](README.md). This report is evidence for review, not an assertion that all possible vulnerabilities, devices or operational failures have been tested.
