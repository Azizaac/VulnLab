# Future deployment prerequisites — documentation only

This file records prerequisites required by Sprint 6. **Sprint 7 has not started. Nothing here authorizes deployment or aaPanel changes.** No server, DNS, Cloudflare token, firewall, router or public runtime was changed.

Before a separately requested deployment task:

1. Re-run the release matrix against the exact proposed commit and target environment; resolve any P0/P1 and reassess accepted P2 risks.
2. Review aaPanel/PHP/MySQL compatibility, TLS, trusted proxy/host rules, cookie Secure/HttpOnly/SameSite, debug-off production configuration, private storage and non-web executable uploads.
3. Provision/rotate environment-specific secrets outside Git. Review dependency advisories again. Configure least-privilege DB access and restrict administrative access.
4. Approve an independent security/content review appropriate to the intended audience. Preserve unreviewed editorial labels until genuine human approval; do not imply certification.
5. Use a separate VM/host for deliberately vulnerable training, with reviewed network egress, browser containment and operational controls, or disable live labs. Shared local Docker isolation and the single-render verifier are not production availability/escape guarantees.
6. Define off-host encrypted backup retention, restore operators, recovery objectives, monitoring/alerts and a tested rollback to a separate restored database. GitHub source backups do not contain learner data.
7. Configure the scheduler for export/session expiry, disk/DB/runner health monitoring, sanitized logs, deletion operator process and real email delivery only if offered in the UI.
8. Obtain the user's separate authorization for any deployment action. Keep current data/backups and update branches; do not use migrate:fresh or remove data volumes.

The local SQL restore/migration rehearsal is documented in [restore-results.json](restore-results.json). It establishes local recoverability, not off-site disaster recovery or permission to restore over the live learner database.
