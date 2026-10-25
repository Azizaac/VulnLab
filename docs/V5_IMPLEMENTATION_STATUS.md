# V5 implementation status

Branch: `codex/2026-10-24-214944-v5-admin-profile-settings`, starting at `5e50fe6`. Implementation and validation: 24–25 October 2026, Asia/Jakarta.

The user requests implementation in the existing application. The attached PRD is a specification, not evidence of completed features or authorization for hosting. Read MASTER_PRD_V5_COMPLETE (its product/UI/database/QA sections), the V4 references and existing implementation. The supplied package is preserved in `docs/prd-v5`; the original V4 image remains unchanged.

## Phase A — compatibility map

| V5 requirement | Existing implementation | Planned compatible extension |
| --- | --- | --- |
| Authentication/RBAC | Laravel sessions, users.role=learner, ownership policies | Central permission gates, four roles, suspension/session invalidation, operator-only first-admin CLI; no private-data admin bypass |
| CMS and editorial | 25 lessons, learning_paths/modules, lesson_sources and prerequisites | Stable existing entities plus typed content entries, versioned drafts, immutable published revisions, review/audit history, safe previews |
| Quizzes | quiz_questions/choices, server grading and stored feedback | Published question revisions, attempt presentation snapshots; old attempts/choices preserved |
| Labs | Eight real isolated runtimes, separately stored metadata | Allowlisted non-executable metadata revisions only; no runner secrets/config editors |
| Roadmap | 90-day templates and personal snapshot plans | Versioned next-cohort templates/stages/tasks; existing plan records untouched |
| Profile/Settings | users.name/theme/timezone, no full settings UI | Additive profile/preferences, normalized avatars, verified password/session controls, private data requests |
| XP/notes/reports | Sprint 4 ledger, ownership and private exports | Reuse facts, feedback components and safe renderer; no forged accomplishments |
| V4 design | Horizontal learner shell, both themes, four viewport suites | Preserve learner screens; add Studio workspace tabs and profile/settings compositions |

## Phases and exit gates

1. Baseline tests and private database snapshot.
2. Additive schema, authorization/account security and tests.
3. CMS lifecycle, safe projections and versioned quiz/lab/roadmap integration with tests.
4. Studio and Profile/Settings UI, feedback/accessibility and browser flows.
5. Regression/MySQL/runtime/visual validation, original-record preservation, documentation and branch backup.

## Conditional capabilities

The current auth stack has no TOTP or verified email-change delivery. These controls will not claim enabled state or expose dead switches. Only Indonesian is a complete application locale. Notification controls must have actual local delivery; no fake email/reminder sends. Account deletion uses a cancellable grace-period request and a protected operator processing path rather than an immediate accidental cascade.

## Delivered phases

1. **Baseline:** Laravel suite passed 72 tests / 1,724 assertions; frontend build, nine unit tests and six desktop browser scenarios passed before V5 application changes. A private consistent SQL dump and hashes of the original columns of all 42 durable tables were saved outside Git.
2. **Accounts and authorization:** centralized role permissions, suspended-account enforcement, authentication epochs, protected first-admin CLI, password reauthentication, session invalidation, profile/preferences, normalized private avatars, local notifications, signed private exports and cancellable deletion requests. No actual learner was promoted or deleted.
3. **CMS and domain integration:** typed schemas and immutable publications for paths/modules/lessons, revision save history, optimistic conflicts, contributor-separated review, source checks, archive/clone/revert, versioned quizzes, safe lab metadata and next-cohort roadmap templates. Existing reader/catalog IDs and completion history remain intact.
4. **UI:** Studio overview/list/editor/quiz/lab/roadmap/review/users/audit, private Profile, six Settings sections, account navigation, real notifications, both themes and responsive layouts. Existing Sprint 4 feedback, safe Markdown and V4 learner shell are reused. Indonesian validation messages include nested quiz fields.
5. **Local integration and backup preparation:** additive MySQL migration and 80 legacy editorial snapshots applied to the existing local installation without reseeding or resetting volumes. All original records passed before/after comparison. Application images exclude private storage and test disks; localhost-only network boundaries remain enforced.

## Executed verification

Environment: Windows host PHP **8.4.27**, Node **24.19.0**, Laravel **12.70.1**; local Docker PHP **8.4.27**, MySQL **8.4.13**. PHP includes GD for image normalization. Browser projects use Chromium at desktop 1440×900, mobile 390×844, mobile 360×800 and tablet 768×1024.

| Command / check | Actual result |
| --- | --- |
| `.tools/php/php.exe artisan test --compact` | 96 tests / 1,950 assertions passed; includes the original 72 tests plus 24 V5 feature tests |
| `npm run test:mysql` | 96 tests / 1,950 assertions passed (123.68 s) on a randomly named disposable MySQL schema; schema removed afterward |
| `npm run build` | TypeScript and Vite passed |
| `npm run lint` | ESLint and Prettier passed |
| `.tools/php/php.exe vendor/bin/pint --dirty --test` | PHP style checked |
| `npm run test:unit` | 9 tests passed in 3 files |
| `npm run test:e2e` before the focused quiz addition | 32 passed across all four viewport projects (9.1 minutes) |
| `npm run test:e2e -- tests/e2e/v5-quiz.spec.ts` | 4 additional cases passed across all four projects (1.1 minutes) |
| `node scripts/test-sandbox.mjs` | All eight real lab scenarios passed: HTTP behavior, secure comparison, proof, reset, stale generations and target/header restrictions; unauthenticated runner request rejected |
| `node scripts/check-lab-isolation.mjs` | Isolation configuration passed; core DB and external TCP probes blocked from the vulnerable training containers |
| Original-record preservation | All 42 original durable tables retained identical original-column hashes and records after migration/import/local restart |

The 36 distinct browser/project cases include the seven V4 learning areas and the V5 account/editorial/quiz flows. Repeated diagnostic runs are not counted as additional coverage. Axe WCAG A/AA checks and horizontal-overflow checks execute on the checked views. Keyboard focus, review controls, roadmap reordering, theme failure rollback, wrong-password focus, private export and genuine second-session revocation are exercised. No final failures are knowingly left unresolved; historical failed iterations below were fixed and rerun.

Detailed private command logs remain in ignored `.tools/v5-*.log`. They are excluded from Git alongside credentials, databases, sessions, learner uploads and generated builds. Relevant source tests and screenshots are versioned.

## Security and regression evidence

- Learners receive 403 for Studio reads and mutations. Editors cannot review/publish/manage users; reviewers cannot edit drafts or publish without an explicit grant. An administrator cannot approve a revision they contributed to. Existing note/report/evidence ownership policies have no administrator bypass.
- A saved new draft is absent from learner routes. Editing published material leaves its current public body unchanged until a separate reviewer approves and a publisher acts. Published revisions reject edits. Stale saves return 409 and retain the browser's local draft.
- Required sources, HTTPS URLs, quiz option cardinality and answer correctness, unknown metadata fields, and prerequisite cycles are checked server-side. References never trigger server fetches. Markdown preview strips active HTML/unsafe URLs.
- Quiz presentations bind owner, lesson, question IDs, threshold, revision and expiry. Old question/choice records remain available for an already-open attempt after publication; old scores, feedback and XP are retained. Learner preview/reader payloads omit answer keys and private explanations before grading.
- Lab metadata publication cannot alter runner settings, runtime code, flags, solutions, points or endpoints. Newly published metadata without a verified runtime remains unavailable. Archived labs retain historical relationships for private sessions and reports.
- Publishing a roadmap leaves existing plans byte-for-byte unchanged. New plans copy its revision; assessment tasks cannot be completed through the manual checklist endpoint and reconcile only against persisted owner results. Stage and task ordering is keyboard operable and persists.
- Profile injection of roles/XP is rejected. Avatars are decoded and re-encoded; SVG, invalid MIME and detected polyglots are rejected without replacing the old avatar. Private activity visibility is applied before Inertia hydration.
- Password verification, strong confirmation, other-session invalidation, suspension, last-admin protection and explicit operator bootstrap are tested. Role/password/audit data never contains password plaintext or session secrets. UTC offsets are explicit in account/audit timestamps.
- Exports require ownership, reauthentication, a signed link and unexpired storage. Redaction excludes credentials, flags and other users. Expired files are inaccessible and purgeable. Deletion requires password plus `DELETE`, permits cancellation, waits seven days and uses a guarded operator command. Only disposable test accounts are erased in tests.

## Failures found and resolved

The first MySQL migration run revealed that the old composite source index also supported a foreign key. The migration now creates a replacement `lesson_id` index **before** dropping the old uniqueness restriction. Subsequent full MySQL runs passed. The test helper now stops on the first failure to avoid repeating a failed migration across the suite.

Other corrected findings: audit middleware ordering missed denied actions; an unordered test fixture selected different quiz banks in MySQL and SQLite; nested form labels did not reliably identify selects; tablet Studio branding caused overflow; test provisioning exceeded the production registration rate limit; persisted roadmap drafts required reusable E2E setup; a user search needed to await its actual matching row. Rate limits remain enabled. Browser fixture creation is guarded to CLI/testing and the dedicated `database/e2e.sqlite` file.

## Visual evidence

The supplied mockups were inspected as design references. UI screenshots contain disposable test-account data, never actual learner records. [V5 screenshot directory](screenshots/v5) contains both themes for Profile, General/Appearance/Security Settings and the content editor on all four viewports, Studio overview light/dark, review queues and Quiz Builder. Representative views:

- [Studio desktop light](screenshots/v5/studio-desktop-light.png), [Studio mobile dark](screenshots/v5/studio-mobile-dark.png)
- [Editor desktop light](screenshots/v5/editor-desktop-light.png), [Editor mobile dark](screenshots/v5/editor-mobile-dark.png)
- [Profile desktop light](screenshots/v5/profile-desktop-light.png), [Profile mobile dark](screenshots/v5/profile-mobile-dark.png)
- [Settings general mobile dark](screenshots/v5/settings-general-mobile-dark.png), [Security desktop dark](screenshots/v5/settings-security-desktop-dark.png)
- [Quiz Builder desktop](screenshots/v5/quiz-builder-desktop-light.png), [Review queue](screenshots/v5/reviews-desktop-light.png)

Existing V4/Sprint 2/3/4 screenshot matrices were refreshed by their regression suites. The illustrated learner dashboard, mountain roadmap, classroom, isolated workspace, progress, private notes and reports remain in the existing design system.

There are 56 V5 screenshots. The copied V4 reference and the existing `design/visual-reference.png` have the same SHA-256 (`b2696ed0c815872043b7b838949b45204b7a0c9129fcae57cb1c7a1c9f827f72`).

## Availability and operational notes

V5 runs locally at `http://127.0.0.1:8088`; the sandbox runner remains `127.0.0.1:8090`. There is no production, aaPanel, tunnel or public deployment. The database and storage volumes were preserved. GitHub backs up versioned source and evidence, not learner data; the private pre-V5 SQL dump remains separate.

No default administrator credentials are installed. An operator must explicitly grant an existing account the admin role with `studio:grant-role ... admin --confirm`; see [operator instructions](v5-admin-account.md). Legacy material remains labeled unreviewed until real human review occurs. Test reviewers and automated fixture checks are not expert certification.

Conditional PRD capabilities deliberately unavailable: TOTP enrollment/recovery, verified email changes, email notifications, timed reminders and an incomplete English locale. In-app publication/security notifications, password/session controls, exports and deletion requests are implemented. Expired-export deletion is scheduled hourly; running Laravel's scheduler is an operator setup task. Automated checks do not replace an independent human content/security review before any future public release.
