# Sprint 2 — learning system and private notes

Implementation date: 24 October 2026. This extends the existing Laravel 12 / Inertia 2 / React TypeScript / Tailwind / MySQL application. Sprint 3 runtime work is not included.

## Delivered behavior

- `/learning`: ten requested learning paths with outcomes, difficulty, duration, prerequisite links, primary references, lesson counts and owner-specific completion.
- `/learning/{slug}`: expandable course outline, reader, objectives, technical supplement, safe highlighted code and copy action, references, classification, lab metadata, notes shortcut, editorial dates, previous/next navigation. The original curriculum order and prerequisite graph remain intact, including dependencies across paths.
- All lessons can be previewed. Progress and assessment require the prerequisites to be completed. Merely opening a lesson writes no completion record. Explicit reading acknowledgement and passing the quiz are separate records; both are required for lesson completion.
- Quizzes are graded on the server. Scores of 70% pass; the starter two-question quizzes therefore require both answers correct. Every retry is retained; the reader displays the latest 20. Explanations appear after submission. Initial question payloads contain no answer keys or explanations. Choice order is shuffled; UUID submission keys make network retries idempotent. Passing again does not duplicate completion events or grant XP.
- `/notes`: owner-only create/read/edit/delete, Markdown edit/preview, category and tags, lesson/lab metadata relationships, pinning, timestamps, database-backed search and pagination. Autosave waits 800 ms after typing and serializes updates. A numeric revision checked under a database row lock prevents stale tabs from overwriting changes; HTTP 409 offers server reload or a new copy of the local draft. Navigation is prevented while changes remain unsaved, with a browser unload guard as a fallback.
- Server CommonMark strips HTML, unsafe links and images. Client DOMPurify sanitizes again before selected code languages are highlighted. There are no user-controlled server URL fetches. Note Markdown whitespace is preserved, including code indentation.
- All 90 roadmap days have a curriculum crosswalk. Existing schedule snapshots, manual checklist states, prerequisite chains and 20/70/30 cadence are retained. Lesson/read/quiz evidence is shown separately beside the activity; reflection links open Notes. Dashboard lesson totals and the next eligible unfinished lesson are derived from persisted progress.
- Lab solves, verified practice time, skill demonstrations and XP are not fabricated. Lab metadata is explicitly marked for Sprint 3, with no launch action, target proxy or vulnerable route.

## Content and editorial status

The importer copies `lessons-v4.json` (25), `questions-v4.json` (50 questions / 200 choices), and `lab-specs-v4.json` (8 specifications) from the supplied v4 bundle into deployable structured files. Original lesson Markdown and its complete source snapshot are preserved. `lesson-enrichment.json` adds 25 original Indonesian supplements with topic-specific objectives, technical explanations, common mistakes and classifications. The SQL lesson adds a parameter-binding PHP example; it does not add executable training endpoints.

The 10 paths group the original lessons rather than fabricate additional course volume. Some paths contain a single starter lesson. Prerequisites retain the supplied curriculum graph, so a learner may need a lesson from another path. All lesson sources, safe exercises, analogies, prevention guidance and the original two knowledge-check questions remain accessible.

Source data associated `profile-mass-assignment` with the recon lesson in one direction. The imported lab relation is normalized to the mass-assignment lesson (L021); the original source files/snapshots are unchanged. This is metadata only.

Content remains **research draft, unreviewed by an independent expert**. `reviewed_at` stays null. The source checker reports 24/24 stored unique URLs reachable on the run recorded in [learning-source-check.json](learning-source-check.json). HTTP reachability is not editorial certification. Technical additions were checked against primary references including [MDN HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview), [OWASP authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), [OWASP XSS prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html), [OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), and [PortSwigger JWT](https://portswigger.net/web-security/jwt).

## Database and deployment

Additive migration: `database/migrations/2026_10_24_000001_create_learning_workspace.php`.

It extends `learning_paths` with course metadata and creates `modules`, `lessons`, `lesson_sources`, `lesson_prerequisites`, `lab_specs`, `quiz_questions`, `quiz_choices`, `quiz_attempts`, `lesson_progress`, `roadmap_lesson_links`, `notes`, and `note_tags`. Foreign keys and uniqueness protect imports, one progress row per user/lesson, submission idempotency and note tags. Owner/time/category indexes support common queries. No existing user table or personal plan is reset.

`LearningSeeder` uses stable source IDs and first-or-create operations. It does not overwrite original/imported lesson bodies, questions, personal notes or user progress. Missing supplemental fields may be added without replacing existing enrichment values. The existing roadmap seeder continues to manage templates only.

Upgrade an existing local installation after a database backup:

```sh
docker compose build app web
docker compose run --rm app php artisan migrate --seed --force
docker compose up -d
```

Do not use `migrate:fresh` or remove the database volume for an upgrade. The app remains at `http://127.0.0.1:8088`; MySQL remains private on the Compose core network. No additional containers, host ports, privileged mounts or lab networks are activated by this sprint.

## Main changed files

| Area | Files |
| --- | --- |
| Backend | `app/Http/Controllers/LearningController.php`, `NoteController.php`; `app/Services/LearningService.php`, `SafeMarkdown.php`, `RoadmapService.php`; `app/Policies/NotePolicy.php`; `routes/web.php`; `bootstrap/app.php` |
| Models | `Lesson`, `Module`, `LessonSource`, `LabSpec`, `QuizQuestion`, `QuizChoice`, `QuizAttempt`, `LessonProgress`, `Note`, `NoteTag` in `app/Models/` |
| Data | New migration above; `database/seeders/LearningSeeder.php`, `DatabaseSeeder.php`; four curriculum JSON files in `database/data/` |
| UI | `resources/js/pages/Learning.tsx`, `LessonReader.tsx`, `Notes.tsx`, `Dashboard.tsx`; `components/SafeMarkdown.tsx`, `AppShell.tsx`, `TaskRow.tsx`; `learning.ts`, `types.ts`, `app.tsx`; `resources/css/learning.css` |
| Dependencies | `package.json`, `package-lock.json`: DOMPurify and highlight.js |
| Verification | `tests/Feature/LearningTest.php`, `NotesTest.php`; `tests/e2e/learning.spec.ts`; `SafeMarkdown.test.tsx`; `scripts/check-learning-sources.py`; this report and screenshots |

## Verification record

Before Sprint 2, the actual MySQL baseline passed **26 tests / 725 assertions**. This covered plan generation, ownership, prerequisite unlocks, refresh persistence, timezone/DST calculations, reschedule preservation and daily cadence.

The expanded SQLite suite passed **37 tests / 1,096 assertions**. The new tests cover import fidelity/idempotency, authenticated access, all lesson pages, absence of answer keys, scores of 0/50/100, retries and duplicate submissions, forged scores/foreign choices, prerequisites, progress isolation, roadmap preservation, notes CRUD/ownership/search/tags/links, stale revisions and Markdown attacks.

The expanded **MySQL 8.4 suite also passed 37 tests / 1,096 assertions** in a disposable schema on the private Compose network (35.39 s). The helper removed only its temporary schema afterward. The first run exposed a test assumption about JSON key order; the fidelity assertion now compares object content while still checking the Markdown bytes exactly.

Frontend unit tests passed **5 tests** across ThemeToggle and SafeMarkdown. TypeScript and the production Vite build passed. ESLint and Prettier checks passed.

| Executed check | Actual result |
| --- | --- |
| `php artisan test` (SQLite, final run) | 37 passed, 1,096 assertions, 18.95 s |
| `npm run test:mysql` (MySQL 8.4 container) | 37 passed, 1,096 assertions, 35.39 s |
| `npm run test:unit` | 5 passed, 2 files |
| `npm run build` | TypeScript and Vite passed |
| `npm run lint` | ESLint and Prettier passed |
| Existing Playwright roadmap/auth/theme cases | 8 passed across four viewports in the combined run |
| Final `playwright test tests/e2e/learning.spec.ts` | 4 passed: desktop, mobile, mobile360, tablet; 1.4 minutes |
| Reference URL checker | 24/24 HTTP 200 |
| Docker image build, upgrade and HTTP smoke | Passed; existing-data hashes unchanged |

There are **12 distinct browser cases** across the regression and new-learning suites. The first combined run had 10 passes and two mobile failures: axe flagged horizontal code regions without keyboard focus. After making code regions focusable and explicitly labeling the lesson/lab selectors, all four new learning cases passed. Additional browser checks caught and fixed note-selection reset during theme changes; a theme write is now also safe while a note is dirty. These results are from actual local executions, not a claimed remote CI run.

The final four-viewport run covers lesson/quiz persistence, retries, next-lesson recommendations, Markdown XSS, notes CRUD/autosave/search/pinning, version conflicts, both themes, horizontal overflow, and axe scans. Desktop additionally covers edits during an in-flight save, offline-save failure/retry and switching theme while a draft is unsaved. No client runtime errors were observed in these runs.

The local Docker images were rebuilt and the additive migration/seed applied successfully. HTTP smoke checks returned 200 for `/login`, `/up` and built login assets; unauthenticated `/learning` and `/notes` correctly redirect with 302. The running MySQL database contains 10 modules, 25 lessons, 50 questions, 8 lab metadata records and 90 curriculum mappings. A private database backup was saved before deployment. Before/after hashes of existing users, plans, checklist items and legacy progress were identical. No reset or fresh migration was used.

## Visual comparison

The source is `design/visual-reference.png`, specifically learning panel 3 and notes panel 6. Reader proportions use 23/54/23, white/blue surfaces, a compact outlined course rail, dark code panel, primary-source rail, purple quiz callout and bottom lesson navigation. Notes uses a 42/58 library/editor split, categories and tags beside the note list, and a dark Markdown editor with edit/preview tabs. Both pages share the existing header, fonts, rounded surfaces and persisted theme controls.

**32 screenshots** are under `docs/screenshots/sprint2/`: two pages × four viewports × two themes × full-page/viewport captures. The dimensions are 1440×900, 390×844, 360×800, and 768×1024. The visual review corrected low-contrast course numbers, strengthened title weights, restored the reference navigation order, and found/fixed note selection being reset by a theme change. Screenshots use real seeded curriculum and a note entered through the UI, without screenshot backgrounds or fabricated learner progress.

| Page | Desktop | Mobile |
| --- | --- | --- |
| Learning | [Light](screenshots/sprint2/learning-desktop-light-viewport.png), [dark](screenshots/sprint2/learning-desktop-dark-viewport.png) | [Light](screenshots/sprint2/learning-mobile-light-viewport.png), [dark](screenshots/sprint2/learning-mobile-dark-viewport.png) |
| Notes | [Light](screenshots/sprint2/notes-desktop-light-viewport.png), [dark](screenshots/sprint2/notes-desktop-dark-viewport.png) | [Light](screenshots/sprint2/notes-mobile-light-viewport.png), [dark](screenshots/sprint2/notes-mobile-dark-viewport.png) |

The poster is a stylized composite rather than a pixel-level specification. Original Indonesian lesson titles and real prerequisite notices take more space. Source rails show the actual lesson references rather than decorative third-party logos. Mobile collapses the course/source rails and switches between library and editor. Accessibility and actual state take precedence over copying tiny poster text or fake percentages.

## Limits and Sprint 3 handoff

- Reading acknowledgement is self-reported; quiz success checks this small starter question bank, not professional mastery. No expert review is claimed.
- Notes use database LIKE search, not ranked full-text indexing. The owner sees 30 notes per page. There is no collaborative realtime merge, version history, attachment upload or offline synchronization. Conflicts preserve the current local draft while the page stays open; explicitly discarding/reloading can lose that draft.
- Browser validation is Chromium automation. Firefox/WebKit, screen-reader testing and a complete manual accessibility audit remain outside the executed matrix.
- Sprint 3 must implement separately isolated lab containers, dummy fixtures, authorization-bound launch/validation/reset, network/resource restrictions and genuine solve events. It must integrate the existing eight metadata records without adding intentionally vulnerable endpoints to the Laravel core. Progress/reporting work beyond this scope remains deferred.
