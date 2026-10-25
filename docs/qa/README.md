# Reproducing the local Sprint 6 checks

Use the existing configured local repository, dependencies, PHP extensions and Docker services. Do not point tests at a production database. The developer's local PHP executable is `.tools/php/php.exe`; it is intentionally not in Git.

```powershell
.tools/php/php.exe artisan test --compact
npm run lint
npm run test:unit
npm run build
npm run test:mysql
npm run test:concurrency
```

The MySQL helper builds the testing image and uses a random disposable `vulnlab_test_*` schema. The race helper uses `vulnlab_concurrency_*`, two PHP processes and a deterministic proof fixture for its flag race. Both remove only their own schemas in `finally`; neither resets the learner DB.

Start the already configured local training services using [lab isolation instructions](../lab-isolation.md). With no other verifier user/test running, execute these runtime checks **serially**:

```powershell
node scripts/test-sandbox-transport.mjs
node scripts/test-sandbox.mjs
node scripts/check-lab-isolation.mjs
```

The raw runtime suite uses generated temporary sessions and removes its own fixtures. Isolation probes create/remove an owned canary container/network and do not scan public services. A busy single-render verifier returns 503 by design; avoid running raw runtime checks concurrently with browser lab workflows.

For browser tests, first migrate/seed **only the dedicated E2E SQLite database** if it is not already initialized, as described in the root testing setup. Keep `DB_DATABASE` explicitly set to `database/e2e.sqlite`; never run a reset command against the learner DB.

```powershell
$env:PHP_BINARY=(Join-Path (Get-Location) '.tools/php/php.exe')
$env:PLAYWRIGHT_BROWSERS_PATH=(Join-Path (Get-Location) '.tools/browsers')
$env:QA_SCREENSHOT_ROOT='docs/qa/screenshots/workflows'
$env:PLAYWRIGHT_JSON_OUTPUT_FILE='.tools/v6/playwright-results.json'
npx playwright test --reporter=list,json
```

The config starts loopback PHP on port 8089 with `APP_DEBUG=false`, isolated SQLite/session/cache settings and the existing local runner token from ignored `.env`. It runs one browser worker across five viewport projects. Seven V6 combinations are deliberately skipped because the complete preexisting workflows cover those widths; actual tab zoom is a desktop-only test. Test screenshots contain disposable fixtures.

The browser lab suite stops only sessions captured from its own authenticated responses. If an earlier run was interrupted, `tests/browser-lab-cleanup.php --confirm` can be run **only** with `APP_ENV=testing`, SQLite `database/e2e.sqlite` and the local runner environment; its guards refuse any other database. It preserves persistent solve records and never touches core MySQL.

```powershell
python scripts/qa-content.py
python scripts/check-learning-sources.py
python scripts/check-lab-sources.py
node scripts/qa-restore.mjs
node scripts/qa-preflight.mjs
node scripts/qa-log-scan.mjs
node scripts/qa-smoke.mjs
```

The restore helper writes private SQL dumps only under ignored `.tools/v6`, restores to generated `vulnlab_qa_*` schemas, compares original-column hashes, migrates, and performs a rolled-back sample authentication/roadmap/catalog/note workflow. The optional old-version drill needs the developer's private `.tools/core-before-v5.sql`; it is marked BLOCKED if that private snapshot is absent. Do not commit or share those dumps or raw browser traces.

Preflight tests a separate HTTP container whose DB points to an unavailable local fixture port; it never stops the learner database. Log scanning reports categories/counts rather than printing secrets. Public JSON artifacts contain sanitized summaries. Final result numbers come from [RELEASE_READINESS.md](RELEASE_READINESS.md), not from assuming these commands succeeded.

The QA JSON reporter must not receive private tokens in its explicit config: Laravel inherits them from ignored `.env`/process environment. Keep raw reporter JSON and traces private. After collecting the named final logs/reports, `python scripts/qa-summarize.py` validates the gates and generates sanitized totals/matrix statuses; it refuses to report PASS while a required result is missing or failing.

Git backup follows [github-backup.md](../github-backup.md): preserve the update branch, commit checked source/evidence, push without force, verify the remote SHA. Source backup excludes private learner data; SQL backup/restore remains a separate responsibility.
