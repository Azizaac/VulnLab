# Sprint 3 — interactive local cybersecurity labs

Date: 24 October 2026, Asia/Jakarta. Existing Laravel/Inertia/React/TypeScript/Tailwind/MySQL architecture retained. All work is local; public hosting and aaPanel remain deferred to Sprint 6. Sprint 4 is not implemented.

## Delivered system

`/labs` reads eight stored lab definitions and owner-specific progress, with featured lab, text/category/difficulty/status filters, duration, objectives, suggested prerequisite lesson, first-solve XP, completion date and start/continue/review actions. Reading the associated lesson is recommended, not a hard lab launch gate; independent lab practice never completes that lesson or its quiz.

`/labs/{slug}` follows reference panel 4: a 43/57 challenge and HTTP workspace, scenario/objectives, expandable guided steps, three progressively recorded hints, per-session flag input, request method/endpoint selectors, editable JSON headers/body, vulnerable/secure comparison, actual status/latency/headers/body, copy and request reset, the latest 20 owner-scoped requests, session start/stop/reset and one-hour expiry. Mobile switches among Instruksi/Request/Response/Flag; both themes share the v4 navigation, typography and surface tokens. Untrusted responses are rendered as escaped syntax-highlighted code.

The nine-step workflow covers concept, dummy scenario, HTTP inspection/testing, response analysis, flag submission, root cause, secure code and backend-validated completion. A local checkbox records only the learner's place in the instructions. The solution opens after success or an explicit acknowledgment; viewing it grants no completion or XP.

| ID | Implemented lab | Difficulty | First-solve XP | Runtime behavior |
| --- | --- | --- | --- | --- |
| LAB001 | IDOR — Order Access (`order-idor`) | Easy | 50 | B reads A's SQLite order; secure policy rejects it |
| LAB002 | BOLA — Profile API (`address-bola`) | Easy | 50 | B changes A's city through PATCH; secure ownership check rejects it |
| LAB003 | Reflected XSS (`search-xss`) | Easy | 50 | Real reflected HTML executes a dummy callback in isolated Chromium; secure encoding prevents execution |
| LAB004 | SQL Injection (`product-sqli`) | Medium | 100 | Unsafe SELECT exposes the session's hidden dummy product; parameter binding prevents it |
| LAB005 | Mass Assignment (`profile-mass-assignment`) | Medium | 100 | Blind field binding changes dummy role; secure allowlist rejects role input |
| LAB006 | JWT Validation (`jwt-validation`) | Medium | 100 | Modified role is trusted by decode-only handler; secure signature/claims verification rejects it |
| LAB007 | BFLA (`admin-bfla`) | Medium | 100 | Customer publishes a dummy draft; secure gate requires admin |
| LAB008 | Coupon Validation (`coupon-logic`) | Hard | 150 | Repeated coupon changes 100→90→80; secure conditional update rejects reuse |

The full set awards 700 XP once per learner. A reset or another successful attempt cannot award it again. All scenarios use original Indonesian explanations, dummy identities/data, real HTTP and disposable SQLite. No vulnerable route is added to Laravel.

## Implementation order and actual validation

The first two runtimes were implemented and enabled before the other six. Their direct HTTP tests passed baseline/exploit/secure/reset/ownership-capability restrictions. Ten initial Laravel lab tests passed (184 assertions), and the desktop browser flow then passed both labs through real requests, invalid/valid flags, persisted completion, reset and exactly 100 XP. Only after that validation were the remaining six runtimes enabled.

The new six then passed direct runtime tests and a desktop browser flow through all six solves, secure comparisons and exactly 600 XP. The source/runtime checks are separate from Laravel feature tests: feature tests inject the runner interface to test transactions, authorization, failure states and scoring deterministically; the Node/Playwright tests execute real Docker services. No mocked feature response is presented as sandbox connectivity evidence.

## Actual final results

| Executed check | Actual result |
| --- | --- |
| Pre-change MySQL baseline | 37 passed / 1,096 assertions |
| Final Laravel SQLite suite | **51 passed / 1,369 assertions**, 24.27 s |
| Final Laravel MySQL 8.4 suite | **51 passed / 1,369 assertions**, 47.82 s; disposable schema removed |
| Frontend unit tests | **5 passed**, two files |
| Full Playwright suite | **20 passed**, four viewports, 5.8 minutes |
| Real sandbox runtime tests | **All 8 lab scenarios passed**, including vulnerable/secure comparisons, evidence, reset, stale generations, expiry and header/target restrictions |
| Repeated XSS checks | **12 cycles / 36 Chromium renders passed** using fresh sessions, including successful proof and secure prevention |
| Transport checks | **4 passed**: matching route contracts, real HTTP, redirects not followed, oversized responses rejected |
| Build/style | TypeScript, production Vite build, ESLint, Prettier and PHP Pint passed |
| Primary reference URL check | **8/8 reachable**; not an expert review |
| Docker installation smoke | Login/health 200, protected lab routes 302; deployed Laravel→runner→shop provisioning, HTTP and evidence passed |
| Isolation checks | Non-root/read-only/capability/resource/mount/port checks passed; shop and verifier could not reach MySQL by name/IP or the tested external TCP destination |

The Playwright matrix is 1440×900, 390×844, 360×800 and 768×1024. It executes all eight lab workflows at every size, with flag validation and persistent completion, plus existing auth/roadmap/learning/quiz/notes regressions. Workspace/catalog captures and axe scans cover light and dark themes. No client runtime errors were observed in the final run. The first two labs' refresh/reset checks preserve exactly 100 XP; the additional six preserve exactly 600 XP in their separate test account.

The initial longer run caught shared unnamed throttle counters, an ambiguous old dashboard selector and intermittent verifier failures. The lab throttles now have separate action/user keys, the regression selector identifies lesson progress explicitly, and verifier lifecycle/configuration was hardened with writable ephemeral Chromium configuration, init/reaping, bounded render time and cleanup before accepting the next render. The final complete run and repeated real-browser proof cycles passed. No earlier failed run is represented as a pass.

The local upgrade used an additive migration and seed, with a private database backup. Existing user, legacy progress, notes/tags, lesson-progress and quiz-attempt data remained unchanged. A UTF-8 column audit confirmed all 25 original lesson rows, Markdown and source snapshots unchanged. One new personal plan with 270 items was observed during verification (the backup had no plan/items); no existing roadmap rows were overwritten. Raw whole-table hashes differ for additions/client formatting, so [the preservation report](sprint3-preservation.json) records the semantic result explicitly. No reset, volume deletion or `migrate:fresh` was run against the normal database.

The deployed-container transport smoke uses an in-memory session object and stops its temporary sandbox fixture afterward; it creates no learner accounts or progress. CI configuration now starts the separate sandbox for real browser tests, but no remote CI run or public deployment is claimed.

## Screenshots and comparison

There are **24 Sprint 3 captures** in `docs/screenshots/sprint3/`: workspace full-page and viewport captures plus full catalog captures, for four viewports and two themes.

| View | Light | Dark |
| --- | --- | --- |
| Desktop workspace | [Screenshot](screenshots/sprint3/workspace-desktop-light-viewport.png) | [Screenshot](screenshots/sprint3/workspace-desktop-dark-viewport.png) |
| Mobile workspace | [Screenshot](screenshots/sprint3/workspace-mobile-light-viewport.png) | [Screenshot](screenshots/sprint3/workspace-mobile-dark-viewport.png) |
| Desktop catalog | [Screenshot](screenshots/sprint3/catalog-desktop-light.png) | [Screenshot](screenshots/sprint3/catalog-desktop-dark.png) |
| Mobile catalog | [Screenshot](screenshots/sprint3/catalog-mobile-light.png) | [Screenshot](screenshots/sprint3/catalog-mobile-dark.png) |

Compared with `design/visual-reference.png` panel 4, the workspace retains the horizontal shell, dark developer-style editors, blue actions, 43/57 split, challenge tabs, target scope, yellow hints, flag area and response diagnostics. Guided steps collapse to reduce left-column height; mobile uses four explicit panel controls with no page overflow. Request bodies/headers use JSON editors and a bounded endpoint selector to make the fixed scope visible. The diagnostic view intentionally shows the actual response rather than decorative sample HTTP. All illustrations are original SVG/components; no screenshot is used as a page background.

## Data, ownership and integration

Migration `2026_10_24_000002_create_interactive_labs.php` adds ten tables: `lab_categories`, `labs`, `lab_instructions`, `lab_hints`, `lab_sessions`, `lab_attempts`, `lab_progress`, `lab_hint_usage`, `xp_events`, and `lab_requests`. Foreign keys, unique user/lab sessions, unique first completions/XP events and unique per-session submission UUIDs protect consistency. Request history is indexed by session/id.

`LabSeeder` imports eight definitions by stable slug, six categories, 72 instructions and 24 hints. All 25 lesson bodies, 50 quiz questions and user progress remain. The original eight `lab_specs` are retained; the new JWT metadata makes nine metadata records. The original SSRF specification remains readable metadata and is **not** advertised as an implemented ninth lab. The BOLA slug stays `address-bola` to preserve existing lesson/note relationships; its interactive scenario is the requested profile API with a city field.

`LabSessionPolicy` checks authenticated ownership before HTTP, flags, reset and stop. The core stores encrypted random session credentials and a flag hash. The sandbox also checks an unguessable capability and generation. Start/provision are idempotent; failure leaves retryable state. Flag submission needs both the correct session flag and independently recorded runtime evidence. It records no submitted flag plaintext. User/session locks and unique constraints make scoring atomic. Named per-action rate limits keep normal HTTP/hint work from consuming the reset allowance.

Learning Modules show live lab links and owner-specific solved state. Related roadmap **practice items** receive a separate verified lab status from `lab_progress`; existing manual checklist status, timestamps and 20/70/30 schedule are not silently converted into verified completion. Dashboard shows real lab totals, XP, next unfinished lab and solve activity. Lesson reading, quiz passing, lab solving and wider skill demonstration remain separate. No skill-mastery percentage, verified study time or streak is fabricated.

New/rescheduled unfinished roadmap instructions now refer to available lessons, quizzes, Notes and optional local labs. Existing completed/personal snapshots are never rewritten by seeding or deployment.

## Architecture and isolation

See [local setup and isolation](lab-isolation.md) for the diagram, commands, threat boundaries and [executed probe report](lab-isolation-check.json).

The optional `compose.labs.yaml` overlay connects only Laravel to an authenticated control network. The separate sandbox project contains:

- `shop`: vulnerable Node application, per-session SQLite on bounded tmpfs, internal training network only.
- `runner`: trusted fixed-route gateway; control/training networks plus an edge bridge for authenticated loopback 8090 access. Its only HTTP destinations are the shop and verifier; no arbitrary URL or command is accepted.
- `verifier`: Chromium with no secrets, core/control access, host mount or host port. It executes XSS proof HTML with network interception/CSP and returns only callback evidence. Container init reaps subprocesses.

All have non-root users, read-only roots, dropped capabilities, no-new-privileges, CPU/memory/PID limits and no Docker socket. Core MySQL stays on its own network. The core image excludes `sandbox/`; shop and runner use different image targets so the gateway image does not contain vulnerable handlers. SQLite authorizer restrictions bound the intentionally unsafe SQL example to the session's products.

The future VM/host boundary is `App\Contracts\LabRunnerAdapter` (provision/request/evidence/stop). No public runner, host-selection UI, remote commands or production deployment is implemented.

## Main files changed

| Area | Files |
| --- | --- |
| Schema/data | New migration above; `database/seeders/LabSeeder.php`, `DatabaseSeeder.php`; `database/data/labs-sprint3.json`, `lab-routes.json`; original seed files retained |
| Models/policy | `app/Models/Lab.php`, `LabCategory`, `LabInstruction`, `LabHint`, `LabSession`, `LabAttempt`, `LabProgress`; `app/Policies/LabSessionPolicy.php` |
| Backend | `LabController`, `LabService`, `LabFlagValidation`, `LabResetService`, `LocalLabRunnerAdapter`, runner contract; `config/labs.php`, routes/provider; LearningController and RoadmapService integrations |
| UI | `pages/Labs.tsx`, `LabWorkspace.tsx`; `components/CodePanel.tsx`, SafeMarkdown XML highlighting; `labs.ts`, `labs.css`; AppShell, LessonReader, Dashboard, TaskRow and type integrations |
| Sandbox | `sandbox/compose.yaml`, Dockerfiles, `common.mjs`, `shop.mjs`, `runner.mjs`, `verifier.mjs`, contracts and pinned lockfile; `.env` is ignored |
| Setup/tests | `compose.labs.yaml`, `.env.example`, Docker/git ignores; setup/fixture-generation/runtime/source/isolation scripts; `LabTest.php`, overlay checks and browser lab specs; prior test expectations updated for real lab navigation |

## Known limits and Sprint 4 readiness

This is a localhost training MVP. Fixtures are isolated per session in a shared shop container, not separate VMs/containers per learner. The Chromium process uses `--no-sandbox` inside a constrained, secret-free container; use stronger per-learner/VM isolation before hostile multi-user operation. The trusted runner has OS egress through its edge network, while its application destinations are fixed. Shop and verifier have internal networks and passed limited egress/database denial probes. This is not a full penetration test.

Only one HTML verification runs at a time; a concurrent request can receive a retryable unavailable response. Fixed predefined resource routes and a SELECT-only authorizer deliberately bound the educational scope. Expiry is one hour and the runtime caps active fixtures at 64. A container restart discards disposable data; use Reset to restore it. Request/attempt history stays in the core database; long-term retention/cleanup remains future work.

Content is a reference-based research draft, **not independently expert-reviewed**. The secure code samples illustrate remediation and require adaptation to a real application's policy/data model. Browser validation uses Chromium; Firefox/WebKit and a full manual screen-reader/zoom audit are not claimed. Wider skill demonstration, analytics and report building belong to later sprints.

Sprint 4 can build analytics from existing `lesson_progress`, quiz attempts, `lab_progress`, `xp_events` and hint usage. It must retain the distinction between self-reported reading/checklists, assessments and runtime-verified lab evidence. Sprint 4 is not started automatically.
