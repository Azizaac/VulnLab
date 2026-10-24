# v4 Sprint 0–1 implementation

The user's request authorizes the v4 foundation, Beranda and Roadmap first. The supplied start guide and build prompts describe later work; they are specifications, not additional requests to implement S2–S5. Root v2 documents remain intact as history. The extracted v4 design specifications take precedence for the new visual system. `RTK.md` was not present in the repository or checked parent paths.

## Changes

| Area | Files | Result |
|---|---|---|
| Shell | `AppShell.tsx`, `BrandMark.tsx` | Horizontal navigation, original shield, working search/account dialogs, mobile bottom navigation, no dummy notification button |
| Illustration | `JourneyArt.tsx` | Original observatory and mountain/path SVG; no screenshot controls or raster-page rendering |
| Home | `Dashboard.tsx` | Illustrated greeting, real continue meter, next two activities, quick-access tiles, retained today's tasks/activity/archive |
| Roadmap | `Roadmap.tsx` | Five interactive stages, detail panel, 90-day list, search/category filtering, keyboard navigation, mobile vertical journey |
| Visual system | `journey.css`, `app.tsx`, package files | v4 colors, local Plus Jakarta Sans/Inter, light/dark styles and responsive layout; existing auth/task styles retained |
| Theme | `ThemeToggle.tsx`, `types.ts`, `ThemeController.php`, `HandleInertiaRequests.php`, routes, Blade root | Validated account-owned light/dark/system preference; server-driven first paint; guest OS preference |
| Data | migrations `000003`/`000004`, seeder, `RoadmapService.php`, `RoadmapDay.php`, `database/data/roadmap-v4.json` | Additive theme/source-snapshot columns; exact 90-record source import; existing plans untouched |
| Tests | `VisualFoundationTest.php`, browser journey and Playwright config | Import/preservation, theme ownership, screenshot matrix, keyboard, persistence, CSRF and axe checks |
| Packaging | `.dockerignore`, `public/licenses/*` | Exclude design bundle/QA images from runtime images; distribute font licenses |

## Data and interaction decisions

The five stages group days 1–18, 19–36, 37–54, 55–72 and 73–90. They do not delete or rename database phase/week identities or personal task IDs. Each stage has 18 days and 54 tasks when a plan exists. Rings, counts, dates and status derive from authenticated server data. Locked stages can be inspected; locked task writes still fail validation. Arrow keys cycle the stage buttons; Home/End select first/last. The accessible list exposes all 90 days.

The v4 JSON is copied unchanged into `database/data/roadmap-v4.json`, validated for ordered days 1–90, and stored unchanged in template `source_actions`. New plans snapshot it on their days. Existing personal content, dates, descriptions, prerequisites and progress are not changed by seeding. Rescheduling retains source instructions and completed records, along with the established Sunday light review. Exercise wording referring to unavailable labs/quizzes receives an explicit safe paper-based alternative; it cannot award verified completion.

Both themes remain account choices. The authenticated preference is applied before stylesheet loading; system mode follows live OS changes. Browser storage is an optional account-keyed cache, not the source of truth. Theme updates cannot select another user.

Home uses actual checklist activity because lesson readers/quizzes are not implemented yet. Its meter explicitly says checklist. Global search searches real personal activities. Future navigation entries are noninteractive, with sprint descriptions in the account menu; unavailable shortcut tiles name their sprint. This is a scope limitation, not a claim those destinations work.

## Preservation and boundaries

Authentication, CSRF, named throttles, password hashing, policies, serialized progress writes, prerequisites and idempotent completion remain. Existing routes retain their behavior. The owner-scoped v1 progress archive remains available. No account recreation, application-key replacement, database reset or progress reset was performed.

A private backup was saved under ignored `.tools/core-before-v4.sql`. Before/after SHA-256 comparisons of ordered personal items, plans, legacy progress and existing account fields matched exactly after migration and seeding. Backups are not public assets or Docker build inputs.

Compose retains loopback-only port 8088, private MySQL, nonroot processes, read-only application filesystems and capability restrictions. No Docker socket, vulnerable endpoint, lab runtime or external service was introduced. Tests use separate SQLite or random temporary MySQL schemas.

## Deferred

S2 owns the 25 supplied draft lessons, 50 questions, reader and notes. S3 owns lab catalog/workspace/runtime and isolation probes. S4 owns verified analytics and report studio. S5 owns the full seven-page/28-image review and hardening. The supplied lesson, quiz and lab files remain unmodified and are not claimed as implemented features.
