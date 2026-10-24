# MASTER PRD v2 — Sprint 0 and Sprint 1

The explicit request is Sprint 0/1 only. `CODEX_START_HERE.md` describes the later delivery sequence; its proposed next prompts do not authorize implementing those sprints. `MASTER_PRD.md` supplies requirements. `CURRICULUM_SEED.json` contains editorial briefs for Sprint 2, not published course content. No lesson/quiz, notes, report, admin, or lab runtime has been implemented or counted as complete.

## Inspected state and gaps

The existing Laravel 12/Inertia 2 application already had auth, a loopback Docker/MySQL stack, a responsive dashboard, global 90-day task templates and per-user progress from the first PRD. Docker was running and previous data existed. The referenced `RTK.md` remains absent from the workspace and checked parent locations.

The v2 gaps were personalized dated plans, a chosen start date/timezone, the 20/70/30 split, calendar-based Sunday review, today's tasks, mobile bottom navigation, dark mode and stricter evidence-based metrics. The old manual-task XP/streak semantics conflict with v2 and have been removed from current metrics.

## Files changed and responsibilities

| Area | Files |
| --- | --- |
| Durable plans | `database/migrations/2026_10_23_000002_create_personal_roadmap_plans.php`; `app/Models/RoadmapPlan.php`, `RoadmapDay.php`, `RoadmapItem.php` |
| Templates | `database/seeders/RoadmapSeeder.php`: 90 day templates, 13 weeks, four phases; no default user |
| Progress and schedule | `app/Services/RoadmapService.php`: transactions, personal snapshots, idempotent review, calendar dates, rescheduling, today's plan, archive, real counters |
| Validation/authorization | `app/Http/Requests/RoadmapPlanRequest.php`, `TaskProgressRequest.php`, `RegisterRequest.php`; `app/Policies/RoadmapItemPolicy.php` |
| Auth bucket isolation | `app/Providers/AppServiceProvider.php`: independent login/registration limits and regression coverage |
| Registration and routes | `app/Http/Controllers/AuthController.php`, `RoadmapController.php`; `routes/web.php`; `app/Models/User.php` |
| Dashboard/roadmap | `resources/js/pages/Dashboard.tsx`, `Roadmap.tsx`, `Auth.tsx`; `components/PlanForm.tsx`, `TaskRow.tsx`; `types.ts` |
| Shell/theme/errors | `components/AppShell.tsx`, `ThemeToggle.tsx`; `pages/Error.tsx`; `resources/css/app.css`; root Blade view; `bootstrap/app.php`; `resources/js/app.tsx` |
| Linux page discovery | `config/inertia.php` explicitly uses the actual lowercase `resources/js/pages` directory |
| PHP tests | `tests/Feature/AuthTest.php`, `RoadmapTest.php`, existing topology suite; test IDs do not assume transactional MySQL auto-increments reset |
| UI/browser tests | `ThemeToggle.test.tsx`, `vitest.config.ts`, `tests/e2e/journey.spec.ts`, `playwright.config.ts`; axe checks and 360/375/768/1440 layouts |
| MySQL test runner | Separate `testing` Dockerfile target, `scripts/test-mysql.mjs`; disposable random schema, no learner DB resets |
| Tooling/docs | npm manifest/lock, CI unit test step, README, verification report, generated screenshots |

## Architecture decisions

- Preserve all legacy tables and completed records. Show owner-scoped history as a read-only archive. Do not reinterpret old work as newly verified lessons/labs. Existing users explicitly create their new plan; new registrations create it transactionally.
- Store exactly 90 `roadmap_days` per `roadmap_plan`, with 270 owned checklist items. Global templates seed content; the learner receives durable snapshots. Reseeding cannot erase personal progress.
- Store calendar dates independently of elapsed seconds. Evaluate today in the plan timezone, including DST. Rescheduling preserves item IDs/completion timestamps and updates unfinished weekday exercises.
- Enforce ownership with a policy and server-selected owner. Serialize writes by locking the learner row; unique constraints prevent duplicate plans/days/items. Completed reviews are monotonic, retries create no duplicate events.
- Manual checklist completion is self-reported review only. Verified time, XP/streak, lesson completion, lab completion and mastery await the later underlying evidence systems. An internal item of type lesson/lab cannot be completed manually.
- Provide self-contained paper exercises and dummy scenarios instead of links to nonexistent lessons/labs. Implemented sidebar navigation has no placeholder pages. Disabled mobile Learning/Labs entries identify the upcoming sprint without pretending those screens exist.
- Theme is a browser-local preference. Error pages expose status and recovery links, not stack traces. Custom loading feedback replaces the built-in progress markup with an invalid ARIA role.
- Keep the proven Compose topology: loopback Nginx on frontend/core, PHP and MySQL only on internal core, reserved unused internal lab network. No Docker socket, external target fetcher, lab launch API or deliberately vulnerable code is added.

## Remaining sprints

Sprint 2 owns original lesson drafts (`review_needed`), source verification, safe Markdown, quizzes and notes. Sprint 3 owns isolated labs and isolation proofs. Sprint 4 owns verified XP/streak/mastery, analytics and reports. No content is represented as human-reviewed. See `docs/verification.md` for executed results; configured CI is not proof of execution.
