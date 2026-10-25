# Codex — VulnLab Sprint 7: Deployment planning ONLY

You are the senior DevOps/SRE and Laravel release engineer for the EXISTING VulnLab repository.

Read `docs/prd-v7/MASTER_PRD_SPRINT7.md`, existing Sprint 6 `RELEASE_READINESS.md` and related evidence, and inspect the actual application/configuration. Treat the QA report as a claim to be checked where practical, not independent certification.

Goal: produce a reproducible, safe **deployment plan** for an Ubuntu HOME SERVER using aaPanel, Nginx, PHP-FPM, MySQL, Cloudflare Tunnel and Cloudflare Access. The existing Laravel 12/Inertia React app is the deployable CORE; intentionally vulnerable labs are NOT part of public deployment.

STRICT RULES:
- Do NOT SSH to the home server, upload code, edit aaPanel, DNS, router, firewall, tunnel or production DB without explicit new approval.
- Do NOT run destructive commands or expose credentials. Do NOT deploy automatically.
- Do NOT replace existing code or learner records. Preserve V4/V5 UI and Sprint 6 test evidence.
- If real server details are unknown, mark them **UNKNOWN / REQUIRES OPERATOR CHECK** and supply exact read-only commands rather than guessing.
- No lab runner on the production aaPanel host. Never expose vulnerable endpoints or host Docker socket.

Deliver in a single execution where feasible:
1. Read-only repository inventory: Laravel/PHP/Node/MySQL versions, extension needs, paths, build scripts, sessions/cache/queue/scheduler/storage and exact production dependencies.
2. Risk assessment for co-hosted home services (port/resource conflicts, backups, reverse proxies, Nginx config, firewall and tunnel).
3. aaPanel manual installation and safe staging-like rehearsal guide with dedicated Laravel `/public` vhost and DB, no dev assets.
4. Secrets/environment template, secure HTTPS/proxy/cookie/CSRF/CSP configuration plan.
5. Cloudflare Tunnel + Access private beta plan, keeping aaPanel itself private and no router inbound port forwarding.
6. Migration/backups/restore/rollback plan, including real disposable restore acceptance test and schema-compatibility cautions.
7. Operational checks for `/up`, `/ready`, app flows, jobs, logs, disk/CPU memory alarms and recovery.
8. Production-safe lab-disabled feature mode; separate future VM/host architecture and P2 concurrency disposition.
9. Detailed acceptance checklist and GO/NO-GO gate. Mark tests EXECUTED vs NOT RUN with evidence.
10. Record all findings in `docs/deploy/` files named by the PRD.

Execute only **non-destructive local checks** where available. Output the exact inventory gaps requiring my input, a proposed change list, rollback prerequisites, a phased runbook, and explicit statement: `Deployment NOT started; approval required`.

START with repository inspection and Sprint 6 readiness review. Do not deploy.
