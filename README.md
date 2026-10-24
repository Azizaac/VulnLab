# VulnLab — Sprint 0–4

Local learning platform built with **Laravel 12, PHP 8.4, Inertia 2, React 19 + TypeScript, Tailwind CSS 4, Radix/shadcn-style components, MySQL 8.4 and Docker Compose**. No external account or service is required.

Implemented against **v4 Sprint 0/1** in `VulnLab_PRD_v4_Visual_Match_Codex/VulnLab_Codex_v4_Visual_Match/`: horizontal navigation, an original SVG observatory hero, navy continue-learning panel, real next-two activities, four quick-access tiles, an illustrated five-stage 90-day journey, accessible daily list, and server-persisted light/dark/system themes. Authentication, CSRF, throttling, ownership, dates, prerequisites, manual progress, rescheduling and historical archives are preserved. Stage ranges are 1–18, 19–36, 37–54, 55–72, 73–90; underlying 90 days and 270 checklist items are retained.

Sprint 2 adds the **10-path learning catalog, 25 lesson reader, server-graded quizzes, persisted lesson progress, and private Markdown notes with autosave**. Modul and Catatan are available in desktop/mobile navigation. The reader and knowledge workspace follow panels 3 and 6 of the v4 reference. Global search searches personal roadmap activities; Modul has its own lesson/topic search, and Catatan searches the owner's stored notes. Vulnerable runtimes run in the separate sandbox project; the Laravel core has no vulnerable endpoints. Checklist review never awards verified time, quiz/lab completion, XP or streak.

The unchanged v4 roadmap JSON is imported into **templates for new plans**. Existing personal content and completion records are never overwritten by reseeding. New plans snapshot source actions; rescheduling retains those source instructions and completed records. The curriculum importer preserves all 25 original lessons, 50 questions, and the original eight lab specifications; Sprint 3 adds JWT metadata and eight interactive definitions. Read status, quiz pass, lab solve and checklist review remain separate. A lesson completes after reading acknowledgement plus a server-graded score of at least 70%. All educational content is visibly marked as an unreviewed draft.

Sprint 3 adds eight guided VulnShop labs with real HTTP, per-session fixtures/flags, server evidence validation, progressive hints, safe reset, and once-only XP. The optional sandbox runs as a **separate localhost-only Compose project**. See [Sprint 3 implementation and verification](docs/sprint-3.md), [lab isolation design and local setup](docs/lab-isolation.md), [Sprint 2 report](docs/sprint-2.md), and [verification history](docs/verification.md). Public hosting is deferred to Sprint 6.

Sprint 4 adds **Progres**, a transactional XP ledger, timezone-based streaks, eight achievements, and a private report studio with versioned autosave, secure evidence uploads, disclosed automated internal review, Markdown and printable HTML exports. Shared notifications, inline validation, retry, confirmations, lab completion dialogs and quiz result panels integrate with existing modules. See [Sprint 4 delivery and actual validation](docs/sprint-4.md) and [the implementation checkpoint](docs/SPRINT4_PROGRESS.md). Existing learner records are preserved by additive migrations and an idempotent backfill. Study minutes remain **Belum dilacak** because verified attention tracking is not implemented.

## GitHub backup

Source backups live in the private [Azizaac/VulnLab repository](https://github.com/Azizaac/VulnLab). Start each separate update on a new branch with `npm run update:new -- nama-update`, then commit and push that branch after checking it. See [the branch and backup workflow](docs/github-backup.md); local database and learner data require a separate backup.

## Run with Docker (recommended)

Requires Docker Engine/Desktop with Compose v2. PHP and Node do not need to be installed on the host.

1. Copy the environment file:

   ```sh
   cp .env.example .env
   ```

   PowerShell: `Copy-Item .env.example .env`. Set **different** local passwords in `DB_PASSWORD` and `MYSQL_ROOT_PASSWORD`.

2. Build the app and Nginx images:

   ```sh
   docker compose build
   docker compose run --rm --no-deps app php artisan key:generate --show
   ```

   Copy the generated `base64:...` value into `APP_KEY` in `.env`. Keep it stable between runs; sessions are encrypted. The container deliberately has no writable mount of the host `.env`.

3. Start, migrate and seed:

   ```sh
   docker compose up -d
   docker compose exec app php artisan migrate --seed --force
   ```

4. Open **http://127.0.0.1:8088** and register. The seeder creates curriculum only; there is no default user or shared password.

`docker compose down` stops the app and preserves its data. After source changes, rebuild the images and recreate services. Do not run `migrate:fresh` or remove named volumes unless you intend to erase learner data.

Only Nginx publishes a host port, bound to `127.0.0.1:8088`. Nginx alone joins the frontend bridge so Docker can publish this port; it also joins the internal core network to reach PHP. PHP and MySQL join only core and have no published ports. The separate internal lab network is reserved and unused; no service connects core to lab. App/Nginx have read-only root filesystems and non-root users. Writable paths use named volumes/tmpfs; no host filesystem or Docker socket is mounted. `APP_DEBUG=false` is the default. The loopback HTTP setup uses `SESSION_SECURE_COOKIE=false`; HTTPS deployments would require a separate reviewed configuration.

## Local development without Docker

Requires PHP 8.4 with PDO MySQL/SQLite, mbstring, intl, fileinfo, OpenSSL, ZIP and the usual Laravel XML extensions; Composer 2; Node 24; and a local MySQL 8.4 server.

```sh
composer install
cp .env.example .env
# Set DB_HOST=127.0.0.1 and credentials for an existing local database.
php artisan key:generate
php artisan migrate --seed
npm ci
npm run build
composer dev
```

Open http://127.0.0.1:8088. For hot reload, run `npm run dev` in a second terminal; Vite binds to loopback. `composer dev` uses `--no-reload` so the PHP child process preserves its environment on Windows; restart it after changing `.env`.

## Curriculum and progress rules

- Exactly **90 numbered days**, **13 weeks**, **4 phases**, **270 tasks**, and **120 minutes per day** (180 planned hours).
- Each learner chooses a start date and timezone (Asia/Jakarta default). Exactly 90 dated day records have three checklist items: **20 minutes theory, 70 practice, 30 notes/review**. Week 13 has six days. Sunday is a lighter recap without new material, while retaining the 120-minute planning target.
- Only an explicit start/completion action changes progress. Opening tasks or instructions never marks them complete.
- Prerequisites unlock each item and subsequent days after explicit manual review. Local paper exercises and dummy scenarios require no lab service. Only `checklist` items allow manual review; lesson/lab types are rejected by the server. 100% checklist review does not claim 100% topic mastery or lab completion.
- Retries preserve the original timestamp and do not duplicate activity. A completed item cannot be downgraded by a later start request. No manual-checklist XP is awarded; verified quiz/lab awards belong to later sprints.
- All writes take the authenticated user from the session. Policies, foreign keys and unique constraints protect ownership and duplicate records; a transaction locks the learner row to serialize completion requests.
- Rerunning `php artisan db:seed` updates day templates without deleting personal plans or their snapshots. No learner account/activity is seeded. Rescheduling changes dates and unfinished calendar exercises while preserving completed items and timestamps.
- Dashboard checklist completion, review days, estimated minutes and recent activity derive from persisted records. Lesson/lab completion and XP now use actual domain records and the Sprint 4 ledger. Progres shows the qualified learning streak in the account timezone. Verified minutes remain untracked; estimated study is explicitly distinct from verified time.
- Sprint 1 instructions support independent study; integrated lesson content and lesson/lab foreign keys arrive in later migrations.

Existing v1 task/progress tables are retained. Completed v1 work appears in an owner-scoped read-only dashboard archive; it is not silently converted to v2 lesson or lab completion. Existing users explicitly create their v2 plan on the dashboard. GET requests never create plans or progress. The old task write endpoint returns HTTP 410; the v2 endpoint is `PATCH /roadmap/items/{id}`. Create/reschedule uses `POST/PATCH /roadmap/plan` and takes the owner from the session.

## Tests and checks

```sh
php artisan test
vendor/bin/pint --test
composer validate --strict
npm run lint
npm run test:unit
npm run build
```

PowerShell PHP lint command: `php vendor/bin/pint --test`. Backend tests default to isolated in-memory SQLite and use a test-only app key. They cover auth, throttling, privilege escalation, ownership, seed invariants, prerequisite unlocks, idempotency, timestamps, timezone boundaries, empty states and Compose topology. SQLite is not a substitute for checking MySQL: CI also runs the same feature suite against MySQL 8.4.

Run feature tests against an **empty disposable** MySQL test database by supplying `DB_CONNECTION=mysql`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME` and `DB_PASSWORD` in the process environment before `php artisan test`. `RefreshDatabase` migrates that database; never point tests at learner data.

With the Compose database running, `npm run test:mysql` builds the separate `testing` image target, creates a randomly named test schema, runs the entire PHPUnit suite over the private core network, then revokes its grant and drops only that schema. It does not migrate/reset the learner database, publish a MySQL port, mount the Docker socket, or add dev dependencies to the production image. The host-side helper requires Node and uses the local root credential already configured inside the DB container.

After that image is available, `npm run test:concurrency` uses a separate randomly named schema and two independent PHP containers released together. It verifies that duplicate completion deliveries cannot duplicate XP/events/achievements, then drops only its test schema.

### Browser tests

Build assets first. Prepare the dedicated SQLite E2E database, without modifying the normal MySQL configuration:

```sh
touch database/e2e.sqlite
DB_CONNECTION=sqlite DB_DATABASE="$PWD/database/e2e.sqlite" php artisan migrate --seed --force
npx playwright install chromium
npm run test:e2e
```

PowerShell preparation:

```powershell
New-Item database/e2e.sqlite -ItemType File -Force | Out-Null
$env:DB_CONNECTION='sqlite'
$env:DB_DATABASE="$PWD/database/e2e.sqlite"
php artisan migrate --seed --force
Remove-Item Env:DB_CONNECTION,Env:DB_DATABASE
npx playwright install chromium
npm run test:e2e
```

The E2E runner starts a separate loopback server on port **8089**, uses `database/e2e.sqlite`, file sessions, a test-only key and a fresh database-cache namespace per run, and shuts down the server afterward. The normal Docker app can remain on 8088. `PHP_BINARY` can point to a PHP executable outside PATH. Tests retain normal auth limits; separate login/registration counters prevent unrelated actions from consuming each other's allowance.

Playwright checks signup with chosen start date → dashboard → roadmap → explicit start/review → reload → filter/search → logout/login → reschedule, at **1440×900**, **768×1024**, **390×844**, and **360×800**. It also exercises course search, real quiz grading, notes autosave/conflicts/retry/sanitization, all eight real lab solves and secure comparisons, verified completion dialogs, Progress filters and accessible tables, and report validation/autosave/evidence/review/exports. The suite checks themes, keyboard navigation, targeted axe WCAG A/AA scans, CSRF, focus restoration, horizontal overflow and client errors. Desktop includes failed report saves and a 720-CSS-pixel reflow check equivalent to a 1440px window at 200% browser zoom. Auth limits remain enabled.

The GitHub Actions workflow runs PHP lint, frontend lint/typecheck/build, SQLite and MySQL tests, browser tests, Compose validation, image builds and a container HTTP smoke test. These jobs require no paid service or account beyond the CI host.

## Screenshots and verification

Generated from real React pages with deterministic dummy learner plans:

- [Beranda desktop light](docs/screenshots/v4/dashboard-desktop-light-viewport.png)
- [Beranda mobile light](docs/screenshots/v4/dashboard-mobile-light-viewport.png)
- [Beranda desktop dark](docs/screenshots/v4/dashboard-desktop-dark-viewport.png)
- [Roadmap desktop dark](docs/screenshots/v4/roadmap-desktop-dark-viewport.png)
- [Roadmap desktop light](docs/screenshots/v4/roadmap-desktop-light-viewport.png)
- [Roadmap mobile dark, full page](docs/screenshots/v4/roadmap-mobile-dark.png)
- [Learning reader desktop light](docs/screenshots/sprint2/learning-desktop-light-viewport.png)
- [Learning reader mobile light](docs/screenshots/sprint2/learning-mobile-light-viewport.png)
- [Notes desktop dark](docs/screenshots/sprint2/notes-desktop-dark-viewport.png)
- [Notes mobile dark](docs/screenshots/sprint2/notes-mobile-dark-viewport.png)

See [Sprint 2 report](docs/sprint-2.md) and [previous visual QA](docs/visual-qa.md) for the implemented-page matrices, comparison against the supplied poster, limitations, and fixes. The full seven-page release gate awaits the remaining sprints. Historical implementation decisions remain in `docs/implementation-plan.md`.
