# aaPanel staging and controlled release runbook

**Deployment NOT started; approval required.** Every target-side action below is a future operator step. This runbook does not authorize SSH, software installation, config writes, uploads, migrations, service reloads or publication.

## A — Inventory and reserve resources

Complete U01–U12 in [inventory](INVENTORY_REDACTED.md). Export/back up the relevant aaPanel vhost/pool metadata privately and record co-host baselines. Reserve the staging/beta loopback ports and independent schemas/users before installing anything. No change to other websites, default vhost, PHP CLI selection, shared FPM service, MySQL major version or firewall is implicit.

If PHP 8.4 or a required extension is absent, propose a side-by-side aaPanel installation in a separate change window. Confirm availability for the exact Ubuntu/aaPanel version; do not substitute PHP 8.2/8.3 because the framework's general minimum is lower. If the existing database is MariaDB/older MySQL, stop for compatibility testing; no in-place shared DB upgrade. The primary deployment is native PHP, not the local Compose stack.

## B — Create isolated rehearsal after explicit staging approval

Proposed layout (operator must approve actual mount/ownership paths):

```text
/www/wwwroot/vulnlab-staging/
  releases/<reviewed-40-character-sha>/   # code + vendor + public/build
  current -> releases/<sha>
  shared/.env                           # outside public, separate staging secrets
  shared/storage/                       # app/private, framework, logs
  shared/nginx/                         # protected logs
  shared/public-build-assets/           # deploy-owned, immutable public assets
/www/wwwroot/vulnlab-beta/                # same layout, independent data/secrets
```

Do not put backups under either document root. Code belongs to a deploy identity; each environment's FPM user writes only its storage and release `bootstrap/cache`. A single shared `www` account across unrelated applications fails the private-data separation gate. Ensure parent directories/symlinks and aaPanel `open_basedir` permit this site's `current`, resolved release and shared paths without permitting other sites. Do not globally disable anti-cross-site restrictions. aaPanel distinguishes the site directory, running directory and PHP CLI selection: [PHP Project reference](https://www.aapanel.com/docs/Function/php.html).

The staging database is synthetic/empty or an explicitly authorized protected disposable copy. Use separate schema-limited migrator and CRUD runtime identities, not root. Never point a rehearsal at the original learner DB. Decide [APP_KEY/data migration](ENVIRONMENT_MATRIX.md) before importing encrypted rows. Do not copy a development `.env`.

Acquire source at an approved immutable commit, with a read-only deploy credential kept outside the web tree. A server repository/secret transport must be approved first; no Git upload/server checkout occurred here. Build as an unprivileged deployment user, with lockfiles:

```sh
# FUTURE OPERATOR COMMANDS — in the approved new release directory only.
/CONFIRMED/PHP84/bin/php /CONFIRMED/composer.phar install --no-dev --prefer-dist --optimize-autoloader --no-interaction
/CONFIRMED/PHP84/bin/php /CONFIRMED/composer.phar check-platform-reqs --no-dev
npm ci
npm run build
```

Link the approved staging env/shared storage and create restricted writable subdirectories before package scripts/cache commands that need them. Confirm Composer scripts reviewed in `composer.json`. Never use `composer update`, `--ignore-platform-reqs`, root-owned npm builds or `composer run setup` (it generates a key and migrates/seeds). Build on a compatible separate build host if server capacity is insufficient; verify artifact checksum/source SHA/lockfiles on target. Never copy Windows development `vendor`, dependencies or private environment into a Linux runtime artifact. Do not put secrets in `VITE_*` variables or artifacts.

Assemble the final core release from a reviewed allowlist: `app`, `bootstrap`, `config`, `database` source (no database files), `public` source + built assets, `resources`, `routes`, `artisan`, Composer manifest/lock and Linux-built production `vendor`. Include license/required attribution and an artifact manifest recording source SHA and checksums. `storage` and `.env` are environment-owned links, not copied development content; `bootstrap/cache` must not contain build-machine configuration or routes. Review the exact file list before transport. Keep `.git`, `sandbox`, local Compose/Docker files, `tests`, `docs`, `.tools`, traces, dependencies for frontend development, dumps and private files out of the runtime payload. A full source checkout, if needed to build, stays in an approved nonserved build workspace, not the final release. Validate the assembled artifact on staging; do not claim the planned allowlist has been built/tested in this documentation update.

Only after restore/pre-migration gates and target identity checks:

```sh
/CONFIRMED/PHP84/bin/php artisan migrate:status
# Reviewed migrations first succeed on the disposable copy.
/CONFIRMED/PHP84/bin/php artisan migrate --force
/CONFIRMED/PHP84/bin/php artisan config:cache
/CONFIRMED/PHP84/bin/php artisan route:cache
/CONFIRMED/PHP84/bin/php artisan view:cache
```

These are future **writes**, not inventory commands. Record schema/source SHA and fail the rehearsal on any error. Do not seed a restored/populated database. An empty-environment curriculum/account bootstrap requires its own explicit scope and must not reuse dev passwords. Pilot account provisioning/closed enrollment is C03, not a completed operator command. Studio's existing `studio:grant-role` promotes an **existing** approved account; there is no seeded default admin. Use its documented confirmation procedure and least roles, not a new anonymous admin route.

## C — Dedicated vhost and FPM

In aaPanel PHP Project, add the separate staging site with approved hostname. Set the site/current directory and **running document root to `/www/wwwroot/vulnlab-staging/current/public`**, selected PHP **8.4**, and the dedicated pool/socket; beta uses its own equivalent path. Record the actual generated vhost/include filenames (commonly panel-managed; not assumed). Preserve panel markers, backups and unrelated includes. Reject automatic public `listen 80/443` for this new site before any code becomes reachable.

Review [nginx-core.conf.example](templates/nginx-core.conf.example), render only approved placeholders and integrate into that site's existing configuration. It is not a drop-in replacement for the server's global Nginx config. Proposed bindings: staging `127.0.0.1:18080`; beta `127.0.0.1:18081`. Unknown Host is rejected; only `index.php` executes. Keep dotfiles/private paths/backups unavailable; no `/storage` symlink is required for existing authenticated media controllers. Keep Laravel's nonce CSP and stricter exported-HTML CSP; do not replace them with `unsafe-inline` scripts at the proxy.

Current application C01–C04 must be implemented and tested before accepting beta traffic. The template's `/register` denial is defense in depth, not a replacement for app-side closed enrollment or origin JWT checks. Use a dedicated PHP pool with constrained `pm.max_children`, `pm.max_requests`, memory/time/upload limits and OPcache based on measured memory. Suggested starting upload limits: PHP file 5 MiB, request 6 MiB, Nginx 6 MiB, matching existing app validation. No broad PHP handler or executable uploaded files. Inventory socket permissions and aaPanel FPM function/open_basedir restrictions; do not simply remove restrictions until a page loads.

Future validation/reload gates:

```sh
/CONFIRMED/PHP84/sbin/php-fpm -tt
/CONFIRMED/nginx -t
curl --fail --silent --show-error -H 'Host: APPROVED_STAGING_HOST' http://127.0.0.1:18080/up
curl --fail --silent --show-error -H 'Host: APPROVED_STAGING_HOST' http://127.0.0.1:18080/ready
```

After C02, direct origin checks must carry an approved valid assertion or use an explicitly isolated maintenance probe; absence/forgery must be denied. A local 403 after origin protection is not a database-readiness failure. Approve only the necessary site/pool reload, check global Nginx first, then verify all co-host probes. Prefer a dedicated service/pool that can be reloaded without a broad PHP restart. Do not restart MySQL or unrelated websites.

## D — Staging acceptance

This completes the isolated-origin rehearsal after a separately approved **staging-only** Cloudflare/Access preview. That preview approval does not activate the beta hostname; see the approval sequence in [RELEASE_DECISION.md](RELEASE_DECISION.md).

Use two synthetic learners and separate editor/reviewer/publisher/admin identities. Re-run the relevant suites against an isolated schema under Linux PHP/FPM, plus actual HTTPS Access-protected browser flows. Confirm:

- login/logout, secure host-only cookie/CSRF/session expiration and encrypted browser history;
- 90-day plans, persistence, prerequisites, server quiz scores/retries and no duplicate XP;
- own notes/report/evidence/export, offline/failed-save recovery, cross-user denial;
- Studio draft/review/publish/role reauth and draft/key confidentiality;
- accurate progress, private file responses, working HTTPS signed links and no framework details on errors;
- labs unavailable without runner calls and old solve history retained; no register enrollment bypass;
- wrong Host/proxy headers, missing/forged Access JWT and uninvited identities denied;
- `/up`/`/ready`, deliberate **staging-only** DB outage, disk/private-storage, scheduler and alert recovery;
- light/dark UI at 1440/768/390/320, keyboard/200% zoom after the target config changes;
- [restore and rollback rehearsal](BACKUP_RESTORE_ROLLBACK.md), no co-host regression.

Actual target-side acceptance is **NOT RUN**. Existing Sprint 6 local results are not substituted for these checks.

## E — Beta activation after a separate sign-off

Freeze an approved release SHA/artifact and complete [sign-off](RELEASE_DECISION.md). Take a consistent DB/private-file/key-version backup, pause writers for migration and establish rollback deadlines. Stage a new release without overwriting the active release. Check migrations for backward compatibility; no automatic schema down-migration. Cache config/routes/views against the correct environment, validate FPM/Nginx and resolve `public/build/manifest.json`; `public/hot` must be absent.

The deployment operator then changes only the approved `current` symlink atomically (temporary sibling symlink + rename after confirming the old/current type and both resolved targets under this environment's release root). Retain old releases/assets, reload only the approved pool for OPcache and restart only workers that actually exist. On a first install the absence of `current` is handled explicitly, not by deleting a directory. Keep Access closed/maintenance active until smoke tests pass. Do not use `git reset --hard` over a working deployment or overwrite shared storage.

Before the pointer switch, append the reviewed release's hashed `public/build/assets` files to the deploy-owned `shared/public-build-assets` store used by the Nginx alias. Verify checksums and reject a same-name/different-content overwrite. Keep each release's own build manifest in its release directory. Retaining an old release on disk alone would not serve its old asset URLs through a changed `current` root. Proposed retention: last two good releases plus at least seven days of referenced assets, reviewed against cache/session lifetime; remove only unreferenced approved generations later. Test an already-open page across forward and backward switches and a direct old hashed-asset URL. Never copy private storage or uploads into this public alias.

Only then, after **separate Cloudflare/DNS activation approval**, enable the Access-protected core hostname. Complete external-LAN negative checks and a small pilot; observe the proposed 24-hour window. Roll back on the triggers in the recovery guide. Public enrollment and lab hosting remain out of scope. Record who approved, exact targets/SHA, change window, backup ID, outcome and recovery operator.
