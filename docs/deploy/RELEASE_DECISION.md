# Sprint 7 decision and approval record

**Deployment NOT started; approval required.**

**Planning readiness: COMPLETE for review. Private-beta activation: NO-GO. Public release: NOT APPROVED. Hosted labs: NOT APPROVED.** No target-side action has been performed. Sprint 6's GO was permission to plan, not permission to deploy.

The application baseline is `9df28d25d404f6685409b0a391cee54a6cc6ff71`. This planning update preserves application/data behavior. The production implementation will need a new reviewed/tested commit after prerequisites below; the planning branch is not itself a deploy-ready runtime change. Date: 25 October 2026, Asia/Jakarta.

## Blocking prerequisites

| Gate | Current state | Required evidence / owner |
| --- | --- | --- |
| B01 Server compatibility | UNKNOWN | Operator supplies redacted U01–U06: Ubuntu/support, aaPanel, exact PHP CLI/FPM 8.4 + extensions, native Nginx paths/socket, real MySQL version/engines, ports/capacity/co-host baselines |
| B02 Trusted origin and HTTPS | NOT IMPLEMENTED / NOT RUN | C01/C02 fixed-host/proxy model and origin JWT assurance; valid/invalid/expired/wrong-audience, spoofed host/proto/IP, direct-origin and HTTPS signed-link tests |
| B03 Beta-only access | NOT IMPLEMENTED / NOT RUN | C03 invite-only enrollment/provisioning; Access IdP/MFA/allowlist; app auth/RBAC and expiry UX; no Everyone/BYPASS policies |
| B04 Hosted labs disabled | PARTIAL local flag only | C04 hosted unavailable UI/old-session safeguards and all mutation denials; no runner credentials, network or workload on aaPanel host |
| B05 Data/key choice | UNKNOWN | U10 fresh dataset vs approved offline re-encryption/import; preserve original records/backups; no copied development secrets or blind APP_KEY regeneration |
| B06 Recoverability | Historical local evidence only | Consistent off-host DB+private-files+key recovery; actual target disposable restore and timed rollback rehearsal meeting approved RPO/RTO |
| B07 Operations/co-host safety | UNKNOWN / NOT RUN | Approved maintenance window; site/pool-scoped effects; cron/monitor/alert fixture tests, capacity and reboot/power recovery; owner/backup contact |
| B08 External private-beta acceptance | NOT RUN | Safe core only, invited/uninvited identities from outside LAN, app workflows/private evidence, TLS/cookie/CSRF/cache separation and disabled labs |
| B09 Approval | NOT GRANTED | Explicit scoped operator/user sign-off for each phase and activation below |

The accepted local verifier P2 blocks multi-user hosted labs, not a reason to put the runtime on the home server. The P3 content wording/citation item and independent expert/content/accessibility review limitations remain disclosed. No new independent pentest/certification is claimed by this plan.

## Proposed change scope for review

Inventory first, then separately authorize implementation C01–C06 as needed, a dedicated private staging site/pool/schema, production-specific secret custody, Access/Tunnel, backup/monitoring and rehearsals. Keep Laravel 12, existing UI/features and durable IDs. No global aaPanel/PHP/DB upgrades, unrelated site changes, public registration, vulnerable lab deployment, socket exposure or automatic destructive migration. All host/zone/path/recipient values in examples must be resolved before action.

## Approval ledger — deliberately blank

| Phase | Exact scope to approve | Evidence required first | Approver / date / decision |
| --- | --- | --- | --- |
| A Read-only target inventory | Named host, operator/access method, redaction boundaries; no writes | U01–U12 request reviewed | **PENDING — not authorized** |
| B Implementation + isolated staging | Named source/change scope, staging paths/pool/schema, dataset/key choice, allowed maintenance actions | A reviewed; C01–C06 design; backups/co-host impact accepted | **PENDING — not authorized** |
| C Tunnel/Access/DNS and hardening | Exact account/zone/hostnames/identities/audiences, origin/token custody, only VulnLab routes; approve staging preview and beta separately | B private-origin preflight passed for staging preview; Access fail-closed/secret design reviewed; beta hostname additionally requires completed staging and recovery gates | **PENDING — not authorized** |
| D Recovery/operations rehearsal | Disposable restore targets, failure fixtures, alert recipients, code rollback scope | Consistent backups and recovery operator available | **PENDING — not authorized** |
| E Private-beta activation | Final immutable SHA, artifacts, target/hostname, pilot users, observation window and stop criteria | B01–B08 all met; no open P0/P1; pre-release backup verified | **PENDING — not authorized** |
| Later public enrollment / labs | Separate privacy/content/legal/security and separate lab-host scope | Separate proposal, testing and explicit approval | **OUT OF SCOPE** |

Record the approval message/change ticket identifier, exact host/schema/paths/SHA, change window, recovery contact, backup ID, authorized operations and result. Approval for read-only inventory does not authorize writes; staging approval does not authorize publication; beta approval does not authorize public enrollment or labs. Do not create an automation or infer approval from a blank checklist/time elapsed.

Sequence clarification: B first establishes an isolated origin; a separately approved **staging-only** C preview then permits HTTPS/Access staging acceptance. Complete B's end-to-end evidence and D recovery/operations before requesting the beta-specific C settings and E activation. This avoids treating an untested origin as beta-ready or requiring completed external tests before the staging preview can exist.

## Evidence acceptance checklist

- [ ] Actual server compatibility and co-host impact independently checked.
- [ ] Production-specific implementation reviewed/tested at the exact proposed SHA.
- [ ] Dedicated `/public` vhost/pool/schema; permissions and all private paths denied.
- [ ] Debug off, persistent approved key, secure host-only cookies, strict hosts/proxies, CSP/export CSP intact.
- [ ] Access policy/MFA/JWT/origin bypass/client IP and external negative tests pass.
- [ ] Learner/admin/quiz/notes/report/progress/private-file deployed smoke tests pass.
- [ ] Scheduler/alerts/backup/retention/actual workers if needed operate correctly.
- [ ] Off-host restore and code/schema rollback drills pass; data cutoff/reconciliation agreed.
- [ ] Hosted core contains no lab runtime/control secrets; labs clearly unavailable, history intact.
- [ ] Explicit private-beta activation approval recorded; pilot and rollback operator ready.

Until every required item has real evidence and a named approval, **NO-GO for deployment/activation** remains the correct decision. [Local preflight](PREFLIGHT_RESULTS.md) and inert templates help preparation; they do not satisfy unknown target gates.
