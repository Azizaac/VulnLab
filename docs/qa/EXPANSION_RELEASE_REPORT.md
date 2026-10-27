# Expansion v7.1: incremental status

27 October 2026 (Asia/Jakarta). This report covers the initial authentication and Studio-import foundation, not a completed expansion or a hosting release.

## Implemented in source

- Login and registration use the existing Laravel routes and session controls, with responsive light/dark styling, real route navigation, inline errors and keyboard-accessible password visibility. See [baseline evidence](EXPANSION_BASELINE.md) and its screenshots.
- Studio can associate a quiz draft with an unpublished lesson entry. It requires the parent lesson to be published before the quiz is published. Source keys remain attached to questions across ordinary edits and reordering; published question rows remain revision-specific so old presentations and attempts can still be graded.
- A transactional, permission-gated importer can create ten lesson and ten quiz drafts containing 30 questions. It requires explicit course-module and question-source mappings, records provenance, detects collisions and refuses to overwrite changed drafts. See [import workflow](../expansion-v7.1/IMPORT_WORKFLOW.md). This is code tested on disposable data, not an import into the learner database.

## Verification

| Check | Result |
| --- | --- |
| PHP full suite, in-memory SQLite | PASS: 115 tests, 2,247 assertions. |
| Frontend build and lint | PASS. |
| Frontend unit suite | PASS: 11 tests. |
| Auth browser tests | PASS: 15 tests at five widths; 5 CSRF/focus tests. Both themes, automated axe, real registration and login using disposable SQLite. |
| Studio browser tests | PASS: desktop and mobile draft-parent selection and path filtering using disposable SQLite. |
| SQLite migration rollback/reapply | PASS for the tested migrations in isolation. |
| MySQL migration, concurrency and restore tests | NOT RUN: Docker Linux engine unavailable. |
| Sandbox runtime and network isolation | NOT RUN: Docker Linux engine unavailable. |
| 200% zoom, real screen reader and physical device | NOT RUN. Automated axe is not a substitute for manual testing. |

## Outstanding

The 25 existing lessons have not been deepened, and the ten new lessons and 30 questions have not been imported into the actual Studio database. Course assignments and source selections need careful mapping; all material remains unreviewed. The 12 new labs are defined in the kit but none has an implemented or verified runtime in this update. Lab integration and expansion-wide release testing remain outstanding. The existing eight-lab runtime was not reverified in this session. The schema additions have not been applied to a learner database; the updated Studio code requires them. Before applying them, establish a verified reversible non-production database snapshot and validate the migrations on MySQL. Git backs up source only, not learner data. Public hosting and aaPanel deployment remain out of scope.
