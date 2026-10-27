# Repository audit: v7.1 starting point

This audit describes the source and test configuration inspected for the first v7.1 batch. It does not establish the current contents of the learner database or claim that tests have passed in this update.

## Application and authentication

The existing application is Laravel 12 with Inertia and React/TypeScript. `routes/web.php` renders the shared `Auth` page for guest GET requests and routes POST requests to `AuthController`. Registration normalizes email, validates a unique address, confirmed password of at least 12 characters and a timezone, and prohibits a submitted role. It creates the user and personal roadmap in a transaction, signs the user in, regenerates the session and records the authentication epoch. Login checks that the account is not suspended, applies rate limiting and regenerates the session. Logout invalidates the session and regenerates the CSRF token. Protected application routes use authentication middleware; Studio adds permission gates.

The redesign must retain these server contracts, validation errors, session behavior, guest redirects and existing user records. A prototype control does not imply that a corresponding server feature exists.

## Data and editorial workflow

The migrations and models already represent users, lessons, prerequisites, quiz questions and attempts, lesson progress, personal roadmap plans and items, notes, lab sessions and progress, activity/XP, and reports. Progress is associated with stable user and subject IDs. The repository's lesson seed data and enrichment cover the existing curriculum; `LearningSeeder` uses `firstOrCreate` for existing lessons and skips Studio-managed content, so changing source JSON alone will not replace existing lesson bodies. Roadmap links and personal plan snapshots also require preservation.

`ContentCatalog::importLegacy()` creates editorial snapshots of legacy records. `ContentWorkflow` supports drafts, version-checked saves, submission, independent review and publication. Publishing an existing lesson projects into its existing subject ID. Quiz publication deactivates old question records and inserts revision-specific questions, preserving old records for attempts and presented quizzes. Publication requires a different reviewer and explicit editorial checks. New content should enter this workflow as unreviewed drafts; a successful import or reachable reference is not expert review. Do not reset or reseed the learner database to implement the expansion.

The kit specifies 25 existing lessons, 10 new drafts and 30 new questions as its planned scope; these figures are not a live database inventory. Check the actual catalog non-destructively before importing, and make imports repeatable and collision-aware.

## Labs and isolation

The current local runtime separates Laravel/core MySQL from the vulnerable shop and verifier. The sandbox Compose configuration uses internal training and control networks; the vulnerable services have no host ports or shared core volumes. The trusted runner is reachable on loopback and uses fixed destinations and route contracts. Lab sessions use separate temporary fixtures; flags require sandbox evidence and ownership checks. See [lab-isolation.md](../lab-isolation.md) for the boundary and its limitations, including Chromium's `--no-sandbox` in the restricted local verifier.

The kit's L009–L020 definitions are designs, not proof of executable runtimes. Studio lab metadata alone cannot configure or enable a runtime. Each implementation batch needs actual vulnerable and safe behavior, evidence validation, reset and isolation checks before it is represented as runnable. No public exposure, aaPanel deployment, learner database reset or Docker volume removal is required.

## Tests and verification

PHP feature tests cover auth, learning, labs, Studio/account, roadmap, notes, progress and reports. `phpunit.xml` configures in-memory SQLite. Vitest covers frontend logic, and Playwright configures localhost on port 8089 with a dedicated `database/e2e.sqlite` and desktop, tablet and mobile viewports. Browser fixture code guards its use to the dedicated test database. `npm run test:mysql` creates a randomly named temporary test database; sandbox runtime and isolation scripts are `scripts/test-sandbox.mjs` and `scripts/check-lab-isolation.mjs`. Build and lint scripts are defined in `package.json`.

These are available checks, not results for this update. Execute relevant tests against their isolated fixtures and record actual commands, outcomes, limitations and screenshots. Preserve ignored credentials and generated build artifacts outside Git.

## Principal risks and next batches

1. Complete the auth redesign and verify functional login, registration, errors, keyboard and responsive behavior against the prototype without changing authorization semantics.
2. Inventory existing IDs and revisions, then create non-destructive lesson enrichment and new lesson/quiz drafts through Studio; retain draft status pending independent editorial review.
3. Implement the 12 lab scenarios in small batches, with real runtime, safe-mode, evidence, reset, ownership and network isolation checks. Do not count metadata as working labs.
4. Verify roadmap, progress, XP, notes and report integration against persisted learner outcomes and historical records. Test imports and upgrades with representative disposable data before touching local learner data.
5. Record test results, screenshots, runnable lab inventory and remaining issues. Back up versioned changes on the required update branch; learner data requires its own separate backup.

## Next content implementation dependency

A new lesson draft exists only as a Studio content entry and revision until publication creates its `lessons` row. Quiz drafts currently require an existing `lessons.id`, so the kit's 30 questions cannot yet be attached to their 10 unpublished parent drafts through the existing workflow. Publishing those lessons to obtain IDs would bypass the required independent editorial review.

A safe next step is to extend Studio with an explicit, immutable quiz-to-lesson-entry link for drafts, retaining the existing lesson-ID path for published content. Resolve the link to a visible published lesson only when the quiz is published; enforce one quiz bank per parent, reject conflicting imports, and preserve permission, review, audit and history protections. Test the migration and both draft and publication paths using disposable databases before any import into the learner database. This capability has not been implemented or tested in this batch.
