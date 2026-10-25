# Sprint 7 deployment planning

**Deployment NOT started; approval required.** This package is a plan for the existing core application, not an executable deployment or an assertion that the home server is compatible. No SSH, upload, aaPanel/DNS/router/firewall/tunnel change or lab exposure was performed. The supplied [PRD](../prd-v7/MASTER_PRD_SPRINT7.md) is planning input; it does not grant infrastructure approval.

Source audited: Sprint 6 commit `9df28d25d404f6685409b0a391cee54a6cc6ff71`. Planning branch starts from that commit. Date: 25 October 2026, Asia/Jakarta. Existing application code, learner data, V4/V5 designs and Sprint 6 evidence are preserved.

Read in order:

1. [Inventory and compatibility](INVENTORY_REDACTED.md): facts, unknowns and commands for the operator.
2. [Environment and secrets](ENVIRONMENT_MATRIX.md): native PHP deployment, encryption/data decision and proposed code changes.
3. [aaPanel rehearsal/runbook](AAPANEL_RUNBOOK.md): staging first, paths, FPM, Nginx and release gates.
4. [Cloudflare Access/Tunnel](CLOUDFLARE_ACCESS_TUNNEL.md): private identities and origin protection.
5. [Backups, restore and rollback](BACKUP_RESTORE_ROLLBACK.md).
6. [Operations](OPERATIONS_MONITORING.md) and [lab boundary](LAB_ISOLATION_PLAN.md).
7. [Actual local preflight](PREFLIGHT_RESULTS.md) and [private-beta decision/sign-off](RELEASE_DECISION.md).

Examples under `templates/` are **inert proposals** with unresolved placeholders. Do not copy them into aaPanel or enable a service yet. No file in this package changes the application's runtime configuration. In particular, an environment file alone cannot implement trusted proxies, invite-only registration or Access JWT validation.

The proposed target is native Nginx + a dedicated PHP 8.4 FPM pool + a dedicated MySQL schema. Existing Docker Compose remains the **local** development/test topology. Do not run `compose.labs.yaml`, the sandbox, Vite dev server or PHP's development server on the aaPanel production host.
