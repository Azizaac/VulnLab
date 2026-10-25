# Environment, secrets and proposed changes

**Plan only.** The running local `.env` and application were not changed. A separate [example](templates/environment.production.example) contains placeholders and no valid key/password/token. Copying it cannot make the application production-ready.

| Setting | Existing local/test | Staging proposal | Private beta proposal |
| --- | --- | --- | --- |
| Runtime | Docker/host PHP, local URLs | Native dedicated PHP 8.4 FPM | Separate native PHP 8.4 FPM pool |
| APP_ENV / DEBUG | local/testing; debug false | production / false | production / false |
| URL | loopback 8088/8089 | approved HTTPS staging hostname | approved HTTPS beta hostname |
| DB | local learner MySQL / isolated test schemas | separate synthetic/restored disposable schema | dedicated approved dataset/schema |
| APP_KEY | existing local key; test fixture key | fresh staging-specific key for synthetic data | fresh key for empty beta; approved offline re-encryption for imports |
| Sessions | database / test array | encrypted DB, Secure, HttpOnly, Lax, host-only, distinct cookie | same; 120 minute application lifetime; no cross-host cookie domain |
| Cache/queue | database; tests array/sync | separate DB/prefix; no worker without jobs | same; no connection to another site's cache/schema |
| Storage | local private persistent volume | independent protected shared storage | own persistent protected shared storage |
| Logs | local single/daily | daily, warning, 14 days proposed | same; no secrets/request bodies/query tokens |
| Mail | not configured; in-app notices are synchronous DB inserts | array transport, no delivery claim | no email feature offered until provider and recovery tests approved |
| Labs | eight local runtimes enabled only in local environment | **disabled**, no credential/runner connectivity | **disabled**, historical progress readable |
| Access | none on loopback | distinct invited staging identities/app/audience | invited beta identities + IdP MFA; application auth/RBAC still enforced |
| Scheduler | registered hourly export cleanup | one per minute trigger, only own environment | same; account deletion is operator-only, never automatic cron |

## Data and APP_KEY decision — release blocker

`LabSession` encrypts `capability` and `flag_secret`; encrypted sessions and signed URLs also depend on the app key. Password hashes, notes and reports are different from these encrypted fields. **Do not run `key:generate` against an existing dataset or copy development keys into production.** Laravel's configured `APP_PREVIOUS_KEYS` is a decryption fallback, not a substitute for an approved migration; it would still place an old key on the target. See [Laravel encryption](https://laravel.com/docs/12.x/encryption).

Choose explicitly:

1. **Fresh synthetic/private-beta dataset:** create a new environment/key, retain all original local data/backups unchanged. No claim that local accounts/progress have moved. Bootstrap curriculum/accounts only on a verified empty staging/beta schema under separate approval.
2. **Migrate real learner data:** pause writes, back up DB + private files + key version; implement/review an offline transformation on a disposable local copy. Decrypt known encrypted columns with the old key in a trusted local process and re-encrypt for the new key; verify plaintext equivalence in memory without printing it. Preserve original backup and durable identifiers/completions/audits; agree how old runtime sessions and expired exports are disabled without losing solve history. Force application reauthentication and regenerate target-domain signed links. Move only transformed data/new production secrets to the target. Prove restore + key recovery first. **This transformation is not implemented/executed in this sprint.**

Backups must retain the matching historical encryption key in a separate protected vault. Losing the key can make a successful SQL restore unusable. Do not invent an environment reset that silently discards learner history.

## Secret inventory (names, never values)

| Secret | Custody / scope / recovery |
| --- | --- |
| APP_KEY | unique per environment/dataset; stable across releases; vault with versioned recovery access; not in artifact/build arguments |
| DB runtime password | own schema CRUD; protected env file; no FILE/SUPER/global privileges |
| Migration/backup credentials | separate short-lived/schema-scoped identities; private client files; not exposed to PHP workers |
| Tunnel token | per-environment connector; systemd credential file; rotate/revoke through approved Cloudflare workflow |
| Access service token | optional machine health monitor only; separate allow policy, expiry and vault; never a browser bypass |
| Backup repository key | off-host secret store and independently recoverable operator escrow; not next to unencrypted backup |
| SMTP / lab secrets | absent while those integrations are disabled; no development runner/control token on the home host |

Deploy account owns code/releases; FPM users can write only their `storage` and `bootstrap/cache`. Shared env is outside public root, owned by a privileged maintainer with group-read for that environment's FPM/CLI identity (e.g. mode 0440, protected parent). Do not use 0777 or one shared `www` user for unrelated private applications. Confirm aaPanel `open_basedir` permits only that site's release/shared paths and required PHP temporary paths; do not disable it globally.

## Proposed implementation work — NOT applied

| ID | Required before beta | Acceptance / rollback |
| --- | --- | --- |
| C01 | Configure explicit trusted proxy/header mask and exact approved hosts in `bootstrap/app.php` | No `*` proxy/host trust; HTTPS signed URLs/cookies correct; forged Host/XFF/proto rejected/normalized; revert patch with Access kept closed |
| C02 | Enforce Access origin assurance, including direct-loopback/co-host bypass threat | Validate JWT signature, fixed issuer/audience/time using trusted keys (no header-presence check); require supported connector Access validation; unauthorized dynamic origin requests, including `/up`/`/ready` outside the web route group, denied. Public build assets contain no private state. Alternative strong origin isolation must be explicitly reviewed |
| C03 | Closed enrollment / pilot provisioning | Reject GET/POST register at edge and app; invited/approved accounts only; no nonexistent `REGISTRATION_ENABLED` flag; do not disable existing local registration globally |
| C04 | Honest beta lab-disabled mode and imported-session handling | No session fixtures/credentials or active controls when hosted labs false; preserve solves/theory; mutation attempts 503 without runner traffic; UI says labs unavailable on beta |
| C05 | Approved dataset/key migration if importing records | Dedicated fixture tests for re-encryption, original IDs and semantic equivalence; original backup untouched |
| C06 | Access expiration UX + production configuration tests | Expired Access session cannot report a successful save; local drafts recover; valid new Access/app session restores normal behavior |

C01–C06 are a proposed change list, not completed features. The current flags only disable runner availability and do not implement the entire hosted-beta policy. All changes require a later authorized implementation update, tests and a new reviewed release commit; do not deploy an unreviewed planning branch just because the templates exist.
