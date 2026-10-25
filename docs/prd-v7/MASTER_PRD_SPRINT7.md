# VulnLab — Sprint 7: Home aaPanel Deployment Planning & Controlled Release

Version: 7.0 (planning)

Date: 25 October 2026 (Asia/Jakarta)

Status: **PLANNING ONLY — NOT AUTHORIZATION TO DEPLOY**

## 1. Inputs and decision

The supplied Sprint 6 `RELEASE_READINESS.md` reports **GO FOR SPRINT 7 PLANNING**, not a production go-live. Local environment: Laravel 12.70.1, PHP 8.4.27, React 19, MySQL 8.4.13, Node 24.19.0; main app and lab runner loopback-only. Reported outcomes include 103 backend tests passed (SQLite and disposable MySQL), 48 browser combinations finally passed, 8/8 local lab scenarios passed, zero open P0/P1, one accepted P2 regarding verifier concurrency and one P3 editorial wording/citation issue. These are **Codex-reported results**, not independently reproduced in this planning package.

Sprint 7 goal: establish a repeatable, reversible and observable deployment path for the **safe core application** on an Ubuntu home server managed by aaPanel. Do not expose intentionally vulnerable lab runtimes. Public deployment requires an explicit separate release decision and operational/security approvals.

## 2. Non-goals
- No automatic SSH, aaPanel, domain, DNS, Cloudflare, router or firewall changes during planning.
- No live database migration before successful disposable-schema test, backup, and rollback design.
- No deployment of vulnerable Docker lab workloads on the aaPanel production host.
- No unconditional public registration or public access on first release.
- No resetting user data, re-seeding live data, copying development secrets, or exposing aaPanel/phpMyAdmin.
- No immediate framework upgrade from Laravel 12 to 13 as part of deployment.

## 3. Target deployment topology

```text
Browser (private beta, HTTPS)
     |
Cloudflare Access policy (recommended private beta)
     |
Cloudflare Tunnel (outbound connector)
     |
127.0.0.1: dedicated Nginx vhost on Ubuntu + aaPanel
     |                             \
PHP-FPM (Laravel 12)              static Vite-built assets
     |
MySQL: dedicated VulnLab database and least-privilege account
     |
Persistent private file storage, logs, scheduler/worker

LABS: separate future VM/physical host, isolated networking,
private runner API, separate dummy DB and credentials; DISABLED for hosted beta.
```

The core home server may share physical resources with other services. Inspect ports, CPU/RAM, storage, firewall rules, existing Nginx sites, aaPanel-managed configuration, backup jobs and Docker networks. Changes must not interrupt other workloads. Prefer a dedicated vhost and avoid routing public traffic to an old dev port such as `8088`.

## 4. Release phases and approval gates

### Phase 7A — Read-only inventory
Collect, **redacting secrets**, the following: `uname -a`, Ubuntu version, CPU/memory/disk, aaPanel/Nginx/PHP-FPM/PHP CLI/Composer/Node/MySQL versions, active vhosts/ports, current backup schedules, UFW/network policy, production PHP extensions, disk capacity, DNS/domain ownership and Cloudflare readiness. Confirm the production host matches `composer.lock` platform requirements. PHP 8.4 on Windows does not guarantee PHP 8.4 compatibility on the server. Use the project's lock files as version authority.

Deliverables: `docs/deploy/INVENTORY_REDACTED.md`, compatibility matrix, port/conflict map, risk and capacity notes. Gate: no incompatible runtime or unreviewed conflict.

### Phase 7B — Staging-like rehearsal (LAN or Access-protected preview)
Create **separate** target paths, vhost and MySQL database. Use clean source checkout with fixed commit, `composer install --no-dev --prefer-dist --optimize-autoloader`, `npm ci`, `npm run build`, and a new production environment file with server-specific secrets. Nginx document root must be Laravel `/public`. Keep writable directories restricted to `storage` and `bootstrap/cache`. Do not run dev Vite on the host. Exclude lab environment and dev/debug tooling.

Practice migrations first on a restored **disposable** copy or empty staging schema and verify backwards compatibility. Preserve original source database. Test `/up` and `/ready` according to their actual implementation: `/up` may remain 200 even if DB is down; `/ready` must detect dependencies without disclosing errors. Exercise login, roadmap, lesson, quiz, notes, practice report, Admin Studio RBAC, export, permissions and safe error UX. Public access remains disabled at this stage.

Gate: staging smoke + role-isolation tests pass with no secret leakage or regressions.

### Phase 7C — Production hardening (preflight, not activation)
Specify `APP_ENV=production`, `APP_DEBUG=false`, a persistent securely generated `APP_KEY` stored outside Git, secure session cookies over HTTPS, correct trusted proxy and host configuration, CSRF/CSP preserved, and a dedicated DB user. Do not print credentials in logs or pull requests. Ensure real client IP handling cannot be spoofed from unauthorized upstreams. Avoid exposing debug endpoints, test artifacts, browser traces, backups, dump files or PHP admin tools via public web root.

Use a Cloudflare Tunnel published application route only after the intended Nginx vhost is validated. Cloudflare Tunnel removes the need for inbound port forwarding; it does not replace origin security. For beta, restrict via Cloudflare Access to invited identities and separately enforce VulnLab application authentication. Confirm tunnel origin/Host header, redirect behavior and HTTPS; never disable origin TLS verification without an explicitly reviewed reason.

Gate: negative access and security smoke checks pass from **outside** the LAN.

### Phase 7D — Operations and recovery
Implement scheduler once per minute **only if the application uses schedules**. Inspect queues: configure supervised worker(s) only when necessary, with controlled concurrency, retry policy and restart during releases. Monitor web health, app readiness, storage, CPU/RAM, MySQL, Nginx/PHP-FPM, tunnel and background jobs. Set log retention, disk alarms, failure alerts and maintenance procedure.

Backup MySQL, user media/evidence and essential configuration to encrypted off-host storage. Document frequency (at minimum daily for beta, and pre-release), retention, encryption key custody, restore steps, RPO/RTO targets and actual restore evidence into a disposable location. A source Git checkout is not a backup of learner data.

Define deploy method: release directory + symlink or equivalent controlled rollout, fixed Git commit, maintenance policy, asset build, pre/post checks, schema compatibility and rollback. **Code rollback cannot always reverse a schema migration**; plan forward-safe migrations and separate tested restore procedure.

Gate: restore drill and rollback rehearsal pass, resources remain healthy, operator can recover without developer laptop.

### Phase 7E — Private beta decision
Collect evidence for all hard gates, obtain explicit user approval for production changes, then publish only the **core learning site** behind identity access policy. Exercise a pilot account and monitor at least one planned observation window. Public registration remains off until separately approved.

A later public release requires explicit privacy/legal, accessibility and content-review decisions. Lab hosting requires a separate security review and independently administered lab host/VM.

## 5. Labs boundary (hard requirement)
- Keep existing eight local lab runtimes **offline/private**, not reverse proxied through the public site.
- Hosted Laravel must not have access to the Docker socket or general-purpose privileged lab host APIs.
- Lab features on hosted core should show an accurate `Lab tidak tersedia pada beta` state, while preserving solved progress and theory/quiz content. No fabricated flag success.
- Future lab runner requires a separate VM/physical host with independent kernel boundary, restrictive firewall, private authenticated control plane, IP/target allowlist, limited outbound routes, egress-denied by default, dummy seeded DB, resource/time quotas and session cleanup.
- Address accepted Sprint 6 P2 (single verifier render/concurrency) through separate-host capacity and abuse testing before enabling multiple public lab users.

## 6. Acceptance criteria (must all be checked with evidence)
1. Actual aaPanel server inventory and PHP extension compatibility documented.
2. Dedicated site and database have zero impact on co-hosted services.
3. Source pinned to reviewed commit, secrets separate, builds reproducible.
4. Laravel site serves from `/public`; no `.env`, `.git`, backups, logs or private media exposed.
5. `APP_DEBUG=false`; secure cookies, trusted hosts/proxies and CSP validated with TLS.
6. User auth, RBAC, student content, quiz scoring, notes, reports and progress pass deployed smoke tests.
7. Scheduler, workers (if required), monitoring, resource limits and log controls operate as specified.
8. Verified backup and disposable restore; rehearsed rollback with test evidence.
9. Lab services are not Internet-reachable and core cannot access lab/host sensitive networks.
10. Explicit operator approval recorded for each production activation and for any later public enrollment.

**NO-GO if**: any open P0/P1, missing restore evidence, publicly reachable vulnerable runner, exposed secret, unknown vhost/docroot, broken auth/RBAC, regression/data loss, or unreviewed effects on other services.

## 7. Feature smoke matrix

| Area | Positive case | Negative case |
|---|---|---|
| Auth | Sign in/out, remember/secure cookie | Invalid login, session expiry, CSRF |
| Roadmap | Create 90 days, refresh persistence | Duplicate submit, timezone edges |
| Modules & quizzes | View source, pass/fail server grade | Score tampering and broken prerequisites |
| Notes | Save/autosave/reload | Another user blocked; failure retains draft |
| Reports | Create/export own report | Evidence privacy, unsafe Markdown, cross-user access |
| Admin Studio | Approve/publish as authorized | Learner/editor cannot bypass review |
| Progress | Accurate XP/achievements/streak | Duplicate XP events rejected |
| Labs | Disabled private-beta state | No reachable vulnerable API/runtime |
| Infrastructure | `/up`, `/ready`, assets, tunnel | DB failure, wrong Host, blocked `.env` |

## 8. Deliverables Codex must produce
- `docs/deploy/INVENTORY_REDACTED.md`
- `docs/deploy/AAPANEL_RUNBOOK.md` (exact vhost, document root, PHP/FPM selection and Nginx checks)
- `docs/deploy/ENVIRONMENT_MATRIX.md` and secret inventory without values
- `docs/deploy/CLOUDFLARE_ACCESS_TUNNEL.md` (no credentials)
- `docs/deploy/BACKUP_RESTORE_ROLLBACK.md`
- `docs/deploy/OPERATIONS_MONITORING.md`
- `docs/deploy/LAB_ISOLATION_PLAN.md`
- `docs/deploy/PREFLIGHT_RESULTS.md` with PASS/FAIL/NOT RUN evidence
- `docs/deploy/RELEASE_DECISION.md` with sign-off items and explicit GO/NO-GO for **private beta only**
- Optional safe `.env.production.example` with placeholders; no copied real secrets.

## 9. Source of truth and references
- Actual repository source and `composer.lock`/`package-lock.json` (highest priority for implementation facts).
- User-supplied Sprint 6 release-readiness report (the local evidence, not an independent certification).
- Laravel 12 deployment: https://laravel.com/docs/12.x/deployment
- Laravel 12 request/trusted proxies: https://laravel.com/docs/12.x/requests#configuring-trusted-proxies
- Laravel 12 scheduling: https://laravel.com/docs/12.x/scheduling
- aaPanel PHP Project: https://www.aapanel.com/docs/Function/php.html
- Cloudflare Tunnel: https://developers.cloudflare.com/tunnel/get-started/

## 10. Final instruction
This document authorizes **planning, documentation and non-destructive local validation only**. Before any production-oriented command or external infrastructure change, request specific operator approval. Never claim Sprint 7 deployed because this PRD exists.
