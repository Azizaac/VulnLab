# Backup, restore and rollback plan

**No target data was copied, migrated, restored or deleted in Sprint 7 planning.** Sprint 6 already performed two local disposable restores (50-table current / 42-table pre-V5) with original-column checks and rolled-back auth/roadmap/catalog/note persistence. Those [results](../qa/restore-results.json) are historical local evidence, not an off-host/server disaster-recovery drill.

## Recovery set and custody

Back up **as one recoverable generation**: logical MySQL data/schema; complete private `storage` (avatars, evidence, exports, required framework state); reviewed source SHA/artifact + build manifest/lockfiles; relevant vhost/pool/cron/connector metadata; and a reference to the matching APP_KEY/secret versions in a separate recovery vault. GitHub contains source/evidence only. Tunnel credentials should be revocable/reissued rather than published with a code backup. Do not put dumps, media, `.env`, vault keys or plaintext backup manifests into Git or a web-served directory.

Proposed beta policy for operator approval: daily plus pre-release backups; RPO **24 hours**, RTO **4 hours**; retain 10 daily / 6 weekly / 3 monthly generations subject to data-retention policy and capacity. Use encrypted off-host storage with independent access/recovery and an offline/immutable generation where supported. A second folder on the same home disk is not off-host recovery. Record backup owner, destination, key custodians and recovery contact (U09). Lost encryption keys are a recovery failure. Deletion/privacy obligations and replay of completed erasure requests after an older restore must be agreed before beta.

A proposed tool is restic, if approved/installed and its backend/key custody verified. Keep repository/password credentials in protected files/service credentials, not arguments. Verify restored bytes and manifests; a metadata-only repository check does not replace a restore. [Official backup guide](https://restic.readthedocs.io/en/stable/040_backup.html), [restore guide](https://restic.readthedocs.io/en/stable/050_restore.html). No backup tool installation or off-host connection occurred here.

## Consistent pre-release backup — future approved operator procedure

1. Confirm environment/schema/source SHA and physical backup path with two checks. Never accept a computed destination without resolving it outside the web root. Verify free space, owner-only permissions and an already-tested off-host target.
2. Close beta traffic/enter maintenance, drain active requests, pause **only this application's** scheduler/actual workers and other writers. Do not stop global cron, aaPanel, MySQL or other websites. Prevent DDL while dumping. Database transactions alone cannot make changing evidence files and DB references consistent.
3. Verify table engines; `--single-transaction` assumes transactional tables. Use a quiescent application/file snapshot window or a reviewed filesystem/database snapshot method. A live `rsync` during uploads is not claimed consistent.
4. With a protected credential file and least required backup privileges, create the logical dump. Example below is NOT RUN:

```sh
# Placeholders must be replaced and paths/schema independently verified first.
umask 077
mysqldump --defaults-extra-file=/PRIVATE/backup-client.cnf \
  --single-transaction --quick --no-tablespaces --set-gtid-purged=OFF --hex-blob \
  APPROVED_SCHEMA > /PRIVATE/BACKUP_GENERATION/database.sql
```

Use a compatible MySQL client. Do not add `--all-databases` or `--databases`: restore payloads must not silently select/recreate the source DB. Inventory any routines/events/triggers and explicitly include them if present with reviewed privileges; the application does not justify granting global administrative rights. Capture private storage/config as the same generation; inventory encryption key version without printing the key.

5. Compute a checksum manifest privately, encrypt/upload the recovery set, verify off-host readability/checksums and record success. Remove plaintext scratch only under the approved retention policy with exact verified paths; no broad recursive deletion command is prescribed.
6. Resume this application's writers only after the set is complete. Record backup ID, data cutoff, source/schema version, sizes, key version, target receipt and responsible operator, not learner row contents or passwords.

## Mandatory disposable restore acceptance — NOT RUN on target

Restore into a new schema and new private directory, e.g. an operator-generated `vulnlab_restore_<random>` on an isolated staging DB instance/account. Guard against equality with source/beta/staging names; permit only the exact generated prefix; verify target connection/host/schema before importing. Inspect the dump for `USE`, `CREATE/DROP DATABASE`, unrelated schemas, DEFINER clauses and version incompatibility. A dangerous source-name directive must be reviewed/reworked before import, not blindly executed.

Use a credential file and **explicit disposable schema** for import; never `mysql < dump.sql` without an independently verified target. Restore matching private storage/key material into the disposable root, preserve safe ownership, and keep mail/labs/public access disabled. For the no-dev-key policy, use the approved offline transformed dataset from [the key decision](ENVIRONMENT_MATRIX.md).

Acceptance record must contain:

- source/backup ID, time cutoff, checksums, encryption-key version available and verified decryption;
- original durable table/column counts, identifiers and semantic content equivalence, private file checksums and DB-to-file references; keep detailed hashes/PII private;
- reviewed migrations on the copy, before/after schema compatibility and no lost original records;
- real FPM/HTTPS smoke: synthetic pilot login, 90-day roadmap, lesson/quiz, note/report save/read/export, private evidence/avatar, Studio roles and correct XP;
- other-user denial, uninvited/missing JWT denial, wrong Host, safe DB-outage behavior; labs remain unavailable and never contact a runner;
- export-expiry/deletion policy handling and proof that no old public signed URL grants access;
- measured restore time versus RTO and backup age versus RPO; failure/cleanup results signed by the recovery operator.

Dispose only the explicitly created test schema/directory after review and path checks. Do not reset the learner DB or remove Docker volumes. The original backup remains recoverable. Repeat after major schema/storage/key changes and before first beta approval; propose a monthly restore drill thereafter. A successful SQL import alone is not application recovery.

## Rollback decisions

| Trigger | Immediate safe action | Recovery choice |
| --- | --- | --- |
| Authz/private-data leak, active lab/secret exposure | Keep Access closed, isolate only the beta route, preserve evidence, alert owner | Incident response; revoke affected environment credentials; do not reopen by removing Access |
| Wrong docroot/Host/cookie/proxy/JWT behavior | Close beta route/maintenance | Restore reviewed vhost/config; validate before any site-scoped reload |
| App/asset error with backward-compatible schema | Pause own writers, retain current files/data | Atomically return `current` to prior immutable release; reload own pool/OPcache, restart actual workers, smoke test |
| Destructive/incompatible schema or corrupt data | Keep maintenance/Access closed; snapshot failed state | Restore verified DB + files + key to a **new target**, validate, then controlled switch after approval |
| Disk/power/ISP/tunnel failure | Page operator, keep failures explicit | Repair infrastructure or recover off-host; no promise of high availability on one home server |

Code rollback does **not** undo a migration. Prefer expand/contract schemas and defer destructive changes until previous code and backups are retired. Do not run automatic `migrate:rollback`, reseed, regenerate APP_KEY, delete a current directory, or overwrite the only database to recover. Record/reconcile writes after the backup cutoff before accepting possible data loss. The restore target/schema switch is a separate explicitly approved operation; keep the original and failed state intact.

Rehearse both code/symlink rollback and a DB/storage restore on staging before beta. Retain at least the last two good releases and their hashed assets. The runbook's deploy-owned shared asset store keeps old URLs available when `current` switches; preserve the matching release manifests and asset checksums, without exposing private files. Test an in-flight old page and old asset URL during rollback. Operator decisions, commands, timing and post-rollback probes must be recorded. None of these recovery actions were executed against the home server.
