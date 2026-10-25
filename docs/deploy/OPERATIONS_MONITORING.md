# Operations and monitoring plan

All server cron, workers, monitors and alerts below are **proposed / NOT RUN**. No recurring automation was enabled. Assign an operator/backup contact and delivery channel before beta; an alert without a tested recipient is not readiness.

## Scheduler, queue and lifecycle

Source currently registers `account:purge-exports` **hourly**. It removes expired private export files and marks their request expired; it does not purge users, all sessions or lab data. Trigger Laravel's scheduler once a minute as the dedicated environment user with the **same PHP 8.4 binary, current release, env, storage and cache** as FPM. One trigger per environment, not both aaPanel Cron and system cron. Proposed future cron command:

```sh
# Add only after approval to the correct service user's crontab, not root's.
* * * * * cd /www/wwwroot/vulnlab-beta/current && /usr/bin/flock -n /www/wwwroot/vulnlab-beta/shared/storage/framework/scheduler.lock /CONFIRMED/PHP84/bin/php artisan schedule:run >> /www/wwwroot/vulnlab-beta/shared/storage/logs/scheduler.log 2>&1
```

The absolute root/PHP/flock paths are unverified and must be rendered for the host. Rotate scheduler output; no secrets in cron arguments. Verify the lock file is in a stable environment-private writable directory. `schedule:list` can access cache locks; our first local host attempt failed because Docker hostname `db` was not resolvable. A second list using an isolated array cache passed and only confirms registration. It does **not** prove a real scheduled cleanup ran. Use a deliberately expired **staging fixture** to prove file removal/status update and a nonexpired fixture to prove preservation; do not test by deleting real exports. [Laravel scheduling](https://laravel.com/docs/12.x/scheduling).

No application queued job/ShouldQueue dispatch was found. `QUEUE_CONNECTION=database` alone does not require a supervised worker; start none by default. If later jobs are added, review idempotency, concurrency and side effects, then use a dedicated supervised worker with timeout below `retry_after` (current database queue default 90s), bounded retries/backoff and a release restart. Example future parameters: sleep 3, tries 3, backoff 10, timeout 60, max-time 3600; validate exact job requirements first. Do not run a worker as root or consume another site's queue. [Laravel queues](https://laravel.com/docs/12.x/queues).

Application deletion remains an explicit matured operator command with confirmation, not a nightly cron. Establish separate policies for session/cache expiration, expired exports, logs and backups; avoid raw table truncation. Current lab fixture cleanup stays local/future lab-host responsibility, not home-core scheduler work.

## Probes and initial alert proposal

Thresholds below are proposed starting points, not measured host capacity or an SLA. Approve recipients and tune in the staging observation window.

| Signal | Scope / frequency | Initial alert / response |
| --- | --- | --- |
| `/up` | local origin, 60s | 3 failures: process/web unavailable; page owner |
| `/ready` | authorized origin + Access-protected external check, 60s | 3 non-200 responses: distinguish app/Access/DB/storage; never treat Access login HTML as healthy JSON |
| Private storage | disk and inodes, writable fixture path, 5 min | warning 80%, critical 90%; ensure backup/release scratch headroom; no automatic data deletion |
| PHP-FPM | pool RSS, active/idle, queue/max_children, slow/5xx rate | sustained queue/5xx spike: stop release, inspect pool and DB; keep status endpoint private |
| MySQL | availability, latency, connection pressure, disk/backup age | own schema errors or >80% connection budget: investigate without global restart |
| CPU/RAM/swap | per-service + whole host, 1–5 min | proposed >85% sustained 10 min / swap pressure; correlate co-host baselines |
| Cloudflared | service state, connector health, loopback metrics | lost connectors/external failures: page operator, no Access bypass |
| Scheduled export cleanup | heartbeat/last successful fixture/result, hourly task | >2h without successful expected run: investigate cron/PHP/env/cache/permissions |
| Backup | exit code, cutoff time, receipt/checksum, daily | no verified generation within proposed 24h: critical; beta approval suspended |
| Security | 403/419/429/5xx trends, role changes and Access denies | review suspicious burst; no payload/token logging; no auto-admin promotion |
| UPS/power/ISP | host/edge reachability from independent location | home outage triggers recovery/maintenance procedure; observe return consistency |

`/ready` only does DB SELECT and framework/log writability today. It does not prove schema completeness, private upload writes, SMTP, queue, scheduler, backup, lab or disk capacity. Monitor those separately. Keep external health checks behind Access (reviewed machine token if needed) with `ready=true`/expected JSON/body/status assertions. Do not create an Everyone/BYPASS health policy. Never place service tokens in URLs.

Metrics proposed on loopback 20241/20242; no Internet-facing Prometheus, FPM status, MySQL admin or aaPanel metrics. Scrape through an approved private collector. [Cloudflare metrics](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/monitor-tunnels/metrics/).

## Capacity and co-host protection

Inventory memory/CPU/disk and measure FPM p95 worker RSS under an approved small synthetic load. Set `pm.max_children = floor(approved PHP memory budget / measured p95 RSS)` with safety margin after MySQL, aaPanel, OS, connector and other sites are budgeted. Do not infer native FPM capacity from local Docker limits or SQLite timings. Bound PHP request time/upload size and a per-service cgroup where available. No flood/soak test on shared services without a separately approved window and rollback criteria. Monitor co-host response/error baselines before/during/after any eventual reload.

## Logs and incident operations

Propose Laravel daily warning logs (14 days); protected minimal Nginx access logs omit query strings, bodies, cookies, Authorization, Access assertions/service tokens and credentials. URLs/path IDs can still be private metadata; restrict/rotate them and define retention. Correlate a server-generated request ID; adding middleware correlation is future work, not an existing telemetry claim. Restrict FPM/cron/connector journals, disable verbose/debug production output and redact exports before sharing incident excerpts. No `phpinfo`, env dump or raw JSON reporter config with secrets.

Test an actual alert failure/recovery and backup failure on staging. Proposed pilot window is 24h with a recovery operator available, plus checks after reboot/power loss: intended units only, DB/private files intact, correct release/caches, Access enforced and no lab processes. Maintain an incident contact/backup owner, last good SHA, backup ID and route-disable procedure. Incident containment affects only VulnLab, not global aaPanel, unrelated DNS/tunnels or household networking.
