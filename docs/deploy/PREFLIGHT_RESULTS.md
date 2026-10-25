# Sprint 7 planning preflight

Date: 25 October 2026, Asia/Jakarta. Scope: this Windows workspace and existing local Docker only. **No home-server access, deployment, DNS/aaPanel/router/firewall/tunnel modification or lab exposure.** Facts come from source/locks and current safe checks; unknown target results remain NOT RUN.

## Checks actually executed

| Check / command | Result | Actual evidence / limit |
| --- | --- | --- |
| Read Sprint 7 master/prompt; Sprint 6 readiness/matrix/JSON; current configs/routes/services | PASS | Source baseline `9df28d25d404...`; [inventory](INVENTORY_REDACTED.md), proposed C01–C06 |
| `.tools/php/php.exe .tools/composer.phar validate --strict --no-check-publish` | PASS | Manifest/lock valid; no dependency installation/update |
| `.tools/php/php.exe .tools/composer.phar check-platform-reqs --no-dev` | PASS locally | Host PHP 8.4.27; Composer may accept polyfills. Not target FPM certification |
| PHP version/extensions/GD inspection | PASS locally | Native mbstring/curl/pdo_mysql/GD etc; PNG/JPEG/WebP true in [LOCAL_CHECKS.json](LOCAL_CHECKS.json) |
| `npx tsc --noEmit` | PASS | Typecheck only; no build/deploy or application change |
| `.tools/php/php.exe artisan test --compact --filter=FinalQaTest` | PASS | **7 tests, 156 assertions**, 11.77s; isolated SQLite fixtures only; not full deployed workflow acceptance |
| `docker compose -f compose.yaml -f compose.labs.yaml config --quiet` | PASS | Existing local config parses without rendering private environment values to output |
| Filtered existing container inspection | PASS | Local service state/users/ports/mount types/capabilities recorded; no raw container environment/credentials collected |
| GET loopback 8088 `/up`, `/ready`, `/login`, `/.env` | PASS | 200 / 200 (ready true) / 200 with defense headers / 403. No user login or DB record contents read |
| Host `artisan schedule:list` with default local database cache | **FAIL locally** | Host cannot resolve Docker-only `db`; schedule listing attempted cache-lock access. No home server contacted; no learner DB reset. This is not a server failure |
| `CACHE_STORE=array SESSION_DRIVER=array php artisan schedule:list` | PASS (isolated list) | Observed `0 * * * * account:purge-exports`; no scheduled cleanup executed; no persistent cache writes |
| Rendered proposed Nginx vhost + `nginx -t` | PASS locally | Cached local Nginx image, offline disposable parser, `--network none`, no listener started; [TEMPLATE_CHECKS.json](TEMPLATE_CHECKS.json). Not aaPanel/FPM connectivity validation |
| Example JSON/env/unit structure, required docs and relative links | PASS after package validation | `node scripts/check-deployment-plan.mjs`; catches unsafe flags/missing files; not Cloudflare API or systemd execution |

The first Nginx parser attempt exposed a relative `fastcgi_params` include assumption. The template now requires an explicit inventoried absolute include path. The offline wrapper also needed writable temporary parser directories under `/tmp`; the live Nginx config was never touched. The final rendered syntax check passes, while native include/socket/path/module permissions remain a target gate.

Local versions observed: Laravel **12.70.1**, Inertia PHP **2.0.28**, React **19.3.1**, Vite **7.3.7**, Node **24.19.0**, PHP **8.4.27**. Exact extension and existing Docker facts are in the JSON. Ubuntu/aaPanel target versions remain UNKNOWN. No conclusion that a Windows PHP pass proves server compatibility.

## Historical evidence checked, not rerun wholesale

[Sprint 6](../qa/RELEASE_READINESS.md) reports 103 backend tests / 2,106 assertions per SQLite and disposable MySQL, 11 frontend unit tests, 48 browser combinations, eight real local labs and two disposable restore drills. These records were inspected on the unchanged application baseline. They are **previous local results**, not fresh Linux native-FPM/Cloudflare/home-server tests or independent security certification. Full backend/MySQL/browser/lab/restore suites were not repeated merely for a documentation-only plan.

## NOT RUN / blocked target checks

| Target check | Status / prerequisite |
| --- | --- |
| Ubuntu/aaPanel/native Nginx/PHP-FPM/MySQL inventory, pool/extension match | NOT RUN — no SSH/panel access authorized or attempted; U01–U06 |
| Shared-site conflicts, port reservations, firewall/NAT/IPv6/power/capacity | NOT RUN — operator evidence U05/U06/U08/U12 |
| Target package install, source upload, release directories/env/secrets, DB migration | NOT RUN — explicit staging authorization and C01–C06/data decision |
| Cloudflare account/zone/IdP/Access policy/tunnel/DNS setup | NOT RUN — U07 plus separately scoped approval |
| cloudflared native config validation / systemd unit validation | NOT RUN — tools/target versions not available here; JSON structure only checked |
| Actual client-IP/HTTPS/cookie/CSRF/signed URL and origin-bypass behavior | NOT RUN — implement proxy/host/Access prerequisites, then real target/edge tests |
| Deployed learner/admin workflows and responsive/accessibility regression | NOT RUN — protected staging and synthetic accounts |
| Off-host DB/files/key restore and code/schema rollback rehearsal | NOT RUN — real backup target/key custody/operator; historical local drills are insufficient |
| Actual scheduler cleanup, monitor/alert delivery, worker if introduced, reboot recovery | NOT RUN — staging fixtures and approved jobs/operations window |
| Image CVE scanner/SBOM/signing or OS package vulnerability audit | NOT RUN — no scanner installed or image pulled; target runtime/package review still required |
| Any public lab endpoint / home-server lab hosting | NOT RUN and prohibited by beta scope |

No failed/unknown target gate is converted into PASS. Final disposition: planning package ready for review; **private beta NO-GO** until the [release prerequisites](RELEASE_DECISION.md) are evidenced and explicitly approved.
