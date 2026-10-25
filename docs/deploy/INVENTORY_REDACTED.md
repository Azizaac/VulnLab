# Inventory and compatibility — redacted

**Actual home server: UNKNOWN / REQUIRES OPERATOR CHECK.** Nothing below identifies or connects to it. Proposed paths/ports are reservations to review, not discoveries. Local evidence is in [LOCAL_CHECKS.json](LOCAL_CHECKS.json); prior end-to-end evidence remains in [Sprint 6](../qa/RELEASE_READINESS.md).

## Repository facts

| Component | Observed authority | Target requirement |
| --- | --- | --- |
| PHP | `composer.json`: **`^8.4`**, stricter than Laravel 12's general minimum; local 8.4.27 | PHP CLI **and selected FPM** 8.4.x; check lock requirements against both SAPIs |
| Laravel / Inertia | lock: Laravel 12.70.1; Inertia PHP/React v2 | Install existing lock; no Laravel 13 upgrade |
| Frontend | React 19; Vite 7; local Node 24.19.0; exact versions in local JSON | Build with reviewed Node 24 baseline and `npm ci`; Node not required to serve prebuilt assets |
| Database | MySQL driver; local MySQL 8.4.13; JSON queries, transactions, unique constraints | Prefer dedicated MySQL 8.4 schema; other MySQL/MariaDB versions **not certified interchangeable** |
| Extensions | Lock platform checks + Dockerfile/application usage | ctype, curl, dom, fileinfo, filter, hash, iconv, json, libxml/XML, mbstring, openssl, pcre, PDO/pdo_mysql, session, tokenizer; **GD PNG/JPEG/WebP** for avatars, intl and zip match tested runtime; OPcache for FPM. SQLite/pdo_sqlite is test-only. Native extensions preferred over polyfill-only checks |
| State | `config/session.php`, queue/cache config | Database sessions (encrypted), database cache/locks, private filesystem; tables already migrated |
| Files | `config/filesystems.php`, avatar/report/export controllers | `storage/app/private` contains avatars, evidence and account exports; persist full `storage`, keep out of web root; no broad public symlink |
| Scheduler | `routes/console.php` | Hourly `account:purge-exports`; one minute scheduler trigger, one instance/environment |
| Queue | Source search found no application `ShouldQueue`/dispatch jobs | No worker needed today; reassess when jobs are introduced; database queue setting alone does not prove queued work |
| Health | `/up`, `ReadinessController` | `/up` liveness; `/ready` checks DB SELECT and writable framework/log dirs only; extra disk/private-storage/scheduler checks needed |
| Labs | `config/labs.php`, adapter, sandbox Compose | Hosted beta **false**, no runner URL/token/network/workloads; preserve historical solves |
| Security gaps | `bootstrap/app.php`, routes/UI | No target-specific trusted proxy/host or Access JWT middleware; `/register` open; lab-disabled text is generic; production work remains proposed |

Framework requirements: [Laravel deployment](https://laravel.com/docs/12.x/deployment). Repository/lock requirements take precedence. Composer's local platform result accepts some polyfills; it is not proof that native FPM extensions or GD formats exist on Ubuntu.

## Unknowns and proposed conflict map

| ID | Operator input/evidence required | Proposed value, not an assertion |
| --- | --- | --- |
| U01 | Ubuntu version/support lifecycle, architecture, kernel/systemd, patch status | Supported Ubuntu LTS compatible with aaPanel and PHP 8.4 |
| U02 | aaPanel edition/version, Nginx binary/config/include paths, panel port and private access method | Retain current panel, admin access via existing private LAN/VPN only |
| U03 | PHP CLI and each FPM version/pool/socket/UID, disabled functions/open_basedir | Dedicated `vlab-stg` / `vlab-beta` users/pools; never change global PHP CLI for other apps |
| U04 | MySQL **server** version, socket/bind/port, schema engines/collation, backup rights and spare capacity | Separate staging/beta schema and users; runtime CRUD only, separate schema-limited migrator |
| U05 | Existing sites, listeners, reserved ports, cron/worker/backup jobs and workload owners | Leave 80/443/panel/DB/other sites unchanged |
| U06 | CPU/RAM/swap, filesystem/free space/inodes, growth, UPS/power/internet reliability | Size FPM from measured RSS and total co-host headroom, not guessed concurrency |
| U07 | Domain/zone ownership, Cloudflare account/plan/team/IdP/MFA, invited identities, tunnel ownership | `staging.learn.example.com` and `learn.example.com` are reserved example placeholders |
| U08 | Router NAT/UPnP/IPv6 exposure, existing firewall, ISP/CGNAT and outbound policy | No new inbound forwarding; outbound tunnel only; preserve existing co-host services |
| U09 | Recovery operator, off-host encrypted backup destination/key custody, restore target/RPO/RTO | Initial proposal: daily + pre-release, RPO 24h, RTO 4h; approval/drill required |
| U10 | Dataset choice: fresh beta vs real learner migration; privacy consent/key-handling | No data copied until [encryption decision](ENVIRONMENT_MATRIX.md) approved |
| U11 | On-call contact, pilot size, observation window, acceptable co-host impact and maintenance window | Small invite-only pilot; 24-hour observation with rollback operator available |
| U12 | Whether co-hosted users/processes are trusted and separately isolated | Shared `www` identity is unacceptable for private files/secrets; origin bypass must be tested |

Proposed staging listener `127.0.0.1:18080`, beta `127.0.0.1:18081`, metrics `127.0.0.1:20241/20242`; each requires an explicit free-port check. **8088/8090 are existing local dev ports, not proposed production origins.** FPM uses separate Unix sockets; DB remains loopback/socket only. Neither panel nor phpMyAdmin gets a tunnel hostname. The current PC/Docker versions/ports are not home-server facts.

## Read-only operator inventory — NOT RUN on server

After separately approved server access, an operator can run these locally on the server. Capture privately, redact unrelated domain/IP/user/path information before sharing. Do not print `.env`, credentials, full `phpinfo`, `printenv`, database grants with secrets or tunnel tokens.

```sh
uname -srmo
cat /etc/os-release
lscpu
free -h
df -hT
df -i
systemctl --version
ss -lntup
systemctl list-timers --all --no-pager
systemctl list-units --type=service --state=running --no-pager
```

Use discovered absolute binary paths (examples are not promises of aaPanel layout):

```sh
/CONFIRMED/PHP84/bin/php -v
/CONFIRMED/PHP84/bin/php -m
/CONFIRMED/PHP84/sbin/php-fpm -v
/CONFIRMED/PHP84/sbin/php-fpm -tt
/CONFIRMED/nginx -V
/CONFIRMED/nginx -t
/CONFIRMED/PHP84/bin/php /CONFIRMED/composer.phar check-platform-reqs --no-dev
node --version
npm --version
cloudflared --version
sudo ufw status verbose
sudo nft list ruleset
```

FPM `-tt`, firewall rules and existing site configuration can reveal private topology; keep raw output private. Inspect the aaPanel PHP Project version/site directory/CLI selections without changing them. Review Nginx vhost files locally for `listen`, `server_name`, `root`, FPM socket, includes and symlink handling; do not paste a full `nginx -T` dump containing unrelated auth headers. Review cron as each relevant service user and aaPanel Cron UI; do not run `schedule:run` during inventory.

With a preexisting protected MySQL client credential file supplied by the operator, not a password argument:

```sh
mysql --defaults-extra-file=/PRIVATE/inventory-client.cnf --batch --skip-column-names \
  -e "SELECT VERSION(), @@sql_mode, @@character_set_server, @@collation_server, @@time_zone;"
```

The client `mysql --version` alone does not identify the running server. Review schema engines, migrations and capacity with approved schema-scoped SELECT queries; never SELECT private learner row contents for the inventory. No aaPanel/PHP/DB installation or global upgrade is part of this read-only phase.
