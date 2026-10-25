# Sprint 6 — functional checkpoint

Environment: local Windows, Laravel/PHP 8.4.27, MySQL 8.4.13 in Docker, dedicated SQLite test databases, Chromium 156. No production or aaPanel access. Date: 25 October 2026, Asia/Jakarta.

The application already contained the V4 learner experience and V5 Studio/accounts. This update fixes defects in that implementation; no learner schema reset or replacement application was introduced. The current learner database was read for inventory: **25 lessons, 50 questions, eight labs and 90 roadmap day templates**.

## Workflow evidence

The final command totals and disposition are in [RELEASE_READINESS.md](RELEASE_READINESS.md). [QA_TEST_MATRIX.csv](QA_TEST_MATRIX.csv) retains every supplied case ID, expected outcome, actual outcome, command and evidence. Test source is versioned; private command logs and traces are ignored because they can contain disposable credentials or draft content.

| Workflow | Executed coverage |
| --- | --- |
| Login/register/logout | Credential validation, default learner role, normalized unique email, password hashing, throttling, session rotation, CSRF, protected navigation, encrypted browser history and history clearing at auth boundaries |
| Roadmap | Exactly 90 dated days, Jakarta/UTC/DST/calendar boundaries, 20/70/30-minute allocation, stage/task prerequisites, persisted manual checks, idempotent creation, rescheduling without losing progress, no XP for self-checks |
| Learning/quiz | Seed idempotency, source/prerequisite relations, separate read/mastery state, server grading, attempt history, key-free public DTOs, immutable issued quiz presentations, new/retired questions and stable completion identifiers |
| Notes | Private CRUD, search/tags/lesson links, autosave, local dirty state, offline/HTTP-error recovery, stale-version conflicts, safe Markdown and navigation guard |
| Labs | Eight real local training scenarios, normal/exploit/secure responses, actual isolated-browser XSS proof, wrong/correct/replayed flags, reset/stale generations, persisted solves and server XP |
| Progress/reports | Source aggregation, zero states, timezone streak, radar evidence methodology, achievements, private reports/evidence, autosave failures/conflicts, practice-only evaluation, redacted exports and once-only reward |
| Studio | Author/reviewer/publisher separation, contributor exclusion from review, five mandatory editorial checks, version conflicts, audit records, atomic publication, archive preserving history, typed quiz/lab/roadmap controls and role administration |
| Profile/settings | Persisted identity/avatar/preferences/privacy, notification opt-outs, password reauthentication, other-session revocation, own-data exports, expiry cleanup and protected/cancellable deletion with operator-only final processing |

## Defect changes

- Studio search, difficulty and reviewer filters now match the revision displayed in the list. Path filtering resolves module, lesson, quiz and lab relationships instead of looking only for a lesson's module field.
- JSON writes and response bodies have a 25-second deadline. A timeout explicitly says that the final result is unknown; drafts remain available, and writes are never automatically retried.
- Login/register errors use the same first-invalid-field focus helper as other forms. Existing adjacent labels/errors remain intact.
- Two starter examples receive hash-guarded, additive clarifications. Original database text and editorial revisions remain intact; corrections stop applying after an editor changes that text.
- Catalog reference fetching is batched. The regression fixture grows from 10 to 30 modules without increasing the query count (19→39 before; 10→10 after). Recorded timings are observations, not latency guarantees.

## Data and unavailable integrations

Both the current 50-table durable dataset and a 42-table pre-V5 snapshot were restored into newly generated `vulnlab_qa_*` schemas, migrated and read through Eloquent. Original-column hashes matched after migration. The source database hashes matched before/after the rehearsal. See [restore-results.json](restore-results.json).

Email reset/verification delivery, TOTP and external reminder delivery are not configured and were not simulated as successful integrations. The UI discloses unavailable capabilities. Deletion remains a deliberate operator action after its grace period; no learner deletion was run during QA. MySQL tests use random disposable schemas; browser fixtures require the dedicated `database/e2e.sqlite` database.
