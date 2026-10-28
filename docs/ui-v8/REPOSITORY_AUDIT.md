# UI v8 repository audit

The application is Laravel/Inertia with React pages resolved by `resources/js/app.tsx`. The authenticated pages share `AppShell`; guest authentication uses `Auth` and its own stylesheet. Navigation, theme, real search, permissions and the account drawer already exist in the shell. Existing interactions must remain connected to their controllers and owner-scoped services.

| Route | Inertia page | Existing data and workflow |
| --- | --- | --- |
| `/dashboard`, `/roadmap` | `Dashboard`, `Roadmap` | Roadmap service overview, saved plan, tasks, dates and progress. |
| `/learning`, `/learning/{lesson}` | `Learning`, `LessonReader` | Course and lesson records, prerequisites, read and server-graded quiz state. |
| `/labs`, `/labs/{lab}` | `Labs`, `LabWorkspace` | Catalog and isolated runner session, routes, hints, evidence and history. |
| `/progress` | `Progress` | Server-calculated activity, XP, achievements and skills. |
| `/notes` | `Notes` | Owner-scoped notes, tags, linked subjects and autosave. |
| `/reports`, `/reports/create`, `/reports/{report}/edit` | `Reports`, `ReportEditor` | Owner-scoped reports, structured editing, evidence and internal review. |
| `/login`, `/register` | `Auth` | Existing Laravel authentication, validation and session protections. |
| `/profile`, `/settings/{section}` | `Profile`, `Settings` | Account and preference data, reauthentication and privacy operations. |
| `/studio/{section}`, `/studio/content/{entry}/edit` | `Studio`, `StudioEditor` | Permission-gated drafts, revisions, review, publication and audit. |

Existing styles are distributed across `app.css`, `journey.css`, `learning.css`, `labs.css`, `sprint4.css`, `v5.css`, and `auth.css`. Changes must be scoped to avoid altering unrelated routes. Prototype data and simulated actions are not production data. `phpunit.xml` uses in-memory SQLite; browser tests must use a dedicated temporary SQLite fixture and never reset learner data or Docker volumes.
