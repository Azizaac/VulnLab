# Admin Studio and account management (V5)

This update extends the existing Laravel/Inertia application. The supplied packet is preserved in `docs/prd-v5/`; it describes requirements and mockups, not verified software or permission to deploy. Learner navigation, V4 artwork, notes, reports, lab isolation and XP rules remain in the existing application.

## Local operator setup

Back up the learner database before migrations. Use the existing local Compose stack and its ignored credentials. Build the current application image locally, apply pending migrations **without reseeding learner data**, then import source snapshots:

```sh
docker compose -f compose.yaml -f compose.labs.yaml build app web
docker compose -f compose.yaml -f compose.labs.yaml run --rm app php artisan migrate --force
docker compose -f compose.yaml -f compose.labs.yaml run --rm app php artisan studio:import-legacy
docker compose -f compose.yaml -f compose.labs.yaml up -d app web
```

`studio:import-legacy` is idempotent. It adds editorial snapshots for existing paths, modules, lessons, quizzes, labs and the roadmap. It does not certify legacy content as reviewed or modify learner records. The V5 migration expands the existing role enum to a string and adds columns/tables; it does not drop source records. Its down migration refuses destructive rollback. Use a reviewed restore plan if rollback is necessary.

There is no seeded administrator or shared admin password. An operator with local CLI access can grant a role to an **existing** account using its ID or exact email:

```sh
php artisan studio:grant-role <existing-user-id-or-email> admin --confirm
```

Use the same command with `editor`, `reviewer`, or `learner` when bootstrapping a review team. The command audits the change, rotates the remember token and invalidates previous sessions. Web user management requires an active administrator and recent password confirmation; the final active administrator cannot be demoted, suspended or deleted.

## Editorial model and permissions

| Role | Drafts | Review | Publish | Users / audit |
| --- | --- | --- | --- | --- |
| Learner | No | No | No | No |
| Editor | Create, edit, preview, clone, submit | No | No | No |
| Reviewer | Read and preview | Approve or request changes | Only with explicit publisher grant | No |
| Admin | Create/edit and administrative actions | Subject to contributor separation | Approved revisions | Yes, with reauthentication for access changes |

Permission gates are centralized in `StudioAccess`. They do not override ownership policies for private notes, reports, evidence or exports. Denied Studio requests are audited without request bodies or passwords.

`content_entries` maps each kind to an existing stable entity ID. `content_revisions` stores a complete typed payload and optimistic `lock_version`. Every draft save records an author, snapshot and version. Published revisions are immutable. Existing content remains public while a later revision is a draft, in review, changes requested or approved.

The workflow is draft → in review → approved → published, with a changes-requested loop. Any contributor to a revision is excluded from approving it, including administrators. Approval records manual checks for accuracy, clarity, safety, references and attribution; merely entering a URL is never presented as verification. Publication projects the approved revision transactionally into the existing reader/catalog. Revert copies an older revision into a new draft. Archive hides the catalog entry while retaining history and progress; referenced prerequisites and populated parents are protected.

Sources accept HTTPS URLs as inert citations. The server never fetches a source or accepts a CMS-selected network destination. Markdown uses the existing safe renderer and DOM sanitization. Source content, comments, answer keys and learner private data are excluded from audit metadata.

### Quizzes, labs and roadmap

- Quiz banks support 2–6 distinct choices with exactly one correct answer, explanations, difficulty, citations, passing threshold and optional randomization. Reader DTOs expose prompt/choice IDs and text only. A private, owner-bound 24-hour presentation pins question IDs, revision and threshold. Publishing creates new question/choice records; an attempt already opened can still be graded against its original presentation. Old attempts and first-pass XP remain unchanged. Legacy submissions without a presentation remain compatible until that bank is managed in Studio.
- Lab editing accepts only a fixed metadata schema. Runtime keys, endpoints, Docker settings, commands, solutions, flags, secrets and points are absent from editable payloads. New lab metadata has zero runtime points and `enabled=false`; it renders an unavailable workspace and cannot create a runtime session. Existing runtime slugs/configuration and solve records are retained.
- Roadmap revisions store stages, exactly 90 days, ordered typed tasks and an acyclic prerequisite graph. New enrollment copies the latest published managed revision. Existing personal plans are never automatically upgraded. Manual checklist completion cannot complete quiz, lab or report tasks; these reconcile against the owner's persisted server-verified results. Rescheduling a V5 plan changes dates while retaining its task snapshot. The learner sees a notice when a newer template exists.
- Seed reruns skip managed lesson/prerequisite/quiz/lab content. They cannot silently restore old editorial data after a reviewed publication.

## Profile, settings and data

Profile is self-only and uses actual XP, level, achievements, progress, enrollment and continuation facts. The privacy preference for recent activity is applied by the server before hydration. There is no public profile endpoint or leaderboard.

Settings provide general profile data, appearance, in-app notifications, security, privacy and data/account controls. Username validation includes a reserved-name list and database uniqueness. Only the complete Indonesian locale is offered. IANA timezone preferences do not rewrite UTC event history; new database DTO timestamps include their UTC offset.

Avatar uploads accept genuine PNG/JPEG/WebP up to 2 MB, 4096 pixels per side and 8 million pixels overall. GD decodes, resizes and re-encodes PNG output, removing metadata and trailing content. SVG, HTML, detected polyglots and invalid images are rejected. Avatar files are private and served through the owner's authenticated route. GD is included in the Docker PHP image.

Password changes verify the current password, require confirmation and at least 12 characters, rotate remember tokens, and invalidate other sessions. Session revocation also requires a password or a recent 15-minute confirmation. An authentication epoch invalidates sessions even with a non-database session backend. Device listings use the real database sessions and omit raw session IDs, IP addresses and user-agent strings. Suspended accounts cannot authenticate or continue an existing session.

Notification preferences control real in-app messages on publication; security messages cannot be disabled. **TOTP, verified email changes, email notifications and timed reminder delivery are not implemented**, as permitted by the PRD's conditional capabilities. Their controls do not claim enabled status. The UI explains availability rather than simulating enrollment or delivery.

Private exports are generated synchronously as ready JSON files. They include the owner's profile, notes, reports and learning progress, with explicit field allowlists and secret redaction. They exclude credentials, session identifiers, raw flags, other accounts and runtime configuration. Downloads require the same authenticated owner, a signed URL and an unexpired record. Files expire after 24 hours; `account:purge-exports` removes expired files and is scheduled hourly. Run Laravel's scheduler locally if automated cleanup is desired; an expired file cannot be downloaded even before physical cleanup.

Account deletion requires the current password and the exact text `DELETE`. A pending request is cancellable for seven days and remains cancellable until an operator processes it. Nothing is erased by the request itself. An operator reviews the request and runs:

```sh
php artisan account:process-deletion <request-uuid> --confirm
```

The command refuses early/cancelled requests, the last active admin, and accounts with active lab leases. It deletes only that requested account and its private files after checking constraints, retains published content and anonymizes author/reviewer foreign keys. This command is tested only on disposable test accounts; no learner account is deleted as part of this update.

## Validation and constraints

Actual phase results, environments, screenshots and remaining limitations are recorded in [V5_IMPLEMENTATION_STATUS.md](V5_IMPLEMENTATION_STATUS.md). MySQL tests use a randomly named temporary schema; browser tests use `database/e2e.sqlite`, never the learner database. No production, aaPanel, tunnel or external target deployment is authorized or performed.
