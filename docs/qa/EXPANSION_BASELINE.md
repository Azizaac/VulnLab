# Expansion v7.1: audit and authentication checkpoint

Date: 27 October 2026 (Asia/Jakarta). This is the first checkpoint, not a release report for the complete expansion. The repository audit and the dependency for importing draft quizzes are in [REPOSITORY_AUDIT.md](../expansion-v7.1/REPOSITORY_AUDIT.md).

The kit describes 25 existing lessons, 10 additional lesson drafts, 30 additional questions, eight existing labs and 12 new lab definitions. These are package/repository targets, not a live learner-database inventory. The new material has not been imported or independently reviewed; the new lab definitions are not implemented or verified. No schema, learner database, Docker volume or lab runtime was changed in this checkpoint. Git is a source backup only; no learner database backup was created or verified.

## Checks

| Check | Result |
| --- | --- |
| `python docs/expansion-v7.1/testing/validate_package.py` | PASS: structural package validation; not editorial or runtime verification. |
| `.\.tools\php\php.exe artisan test` | PASS: 103 tests, 2,106 assertions; in-memory SQLite. |
| `npm run test:unit` | PASS: 4 files, 11 tests. |
| `npm run lint` | PASS. |
| `npm run build` | PASS; generated assets are excluded from Git. |
| Playwright auth expansion | PASS: 15 tests across 1440, 768, 390, 360 and 320px, using a newly migrated and seeded temporary SQLite database. Includes both themes, automated axe checks, overflow, keyboard password visibility and registration/logout/rejected login/successful login. |
| Playwright CSRF and focus | PASS: 5 viewport projects, using the same disposable database. |
| Docker daemon | UNAVAILABLE: Docker client could not connect to the Linux engine. MySQL, live sandbox and isolation checks were not run. |
| Independent editorial review, 200% zoom, real screen reader and physical device | NOT RUN. |

The authentication feature suite includes login and registration validation, rate limiting, password hashing and session behavior. The remaining expansion work, including content import, draft review, all 12 lab runtimes, integration and full release regression, is outstanding. Do not publish draft content or describe any new lab as available until its review and runtime checks pass.

Desktop (1440px) and mobile (390px) screenshots for both authentication routes and both themes are in [screenshots](expansion-v7.1/screenshots/).

To reproduce the browser checks in PowerShell, create a new disposable database and use the repository's test PHP binary:

```powershell
$testDbFile = New-TemporaryFile
$env:E2E_DB_DATABASE = $testDbFile.FullName
$env:DB_DATABASE = $testDbFile.FullName
$env:DB_CONNECTION = 'sqlite'
$env:APP_ENV = 'testing'
$env:APP_KEY = 'base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
$env:SESSION_DRIVER = 'database'
$env:CACHE_STORE = 'database'
$env:PHP_BINARY = (Join-Path (Get-Location) '.tools/php/php.exe')
& $env:PHP_BINARY artisan migrate --seed --force
npx playwright test tests/e2e/auth-expansion.spec.ts
npx playwright test tests/e2e/journey.spec.ts --grep 'mutations require CSRF and focus is visible'
```

The key above is a public test fixture, not an application credential. The browser run used synthetic accounts and empty-form screenshots. Playwright and axe smoke tests do not replace manual accessibility testing.
