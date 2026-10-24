# VulnLab — Product Requirements Document (PRD)
Version: 1.0 | Status: Ready for implementation planning | Language: Indonesian

## 1. Product overview
VulnLab adalah platform belajar cybersecurity untuk individu yang ingin menguasai Web & API Security hingga siap mengikuti program bug bounty resmi. Nilai utama: roadmap harian yang jelas, materi ringkas, lab interaktif di lingkungan terisolasi, dan monitoring progres otomatis. **VulnLab bukan toko online biasa**; konsep toko (VulnShop) adalah salah satu lingkungan lab.

### Goals
- Membantu pengguna mengikuti learning path 90 hari, 2 jam/hari.
- Mengukur penyelesaian materi, lab, milestone, waktu belajar, dan kompetensi.
- Menyediakan latihan Web/API yang legal, terisolasi, dan dapat di-reset.
- Membantu pengguna menyiapkan laporan temuan dan metodologi hunting yang bertanggung jawab.

### Non-goals (MVP)
- Tidak menyediakan eksploitasi target internet secara otomatis.
- Tidak menjamin payout bug bounty, sertifikasi resmi, atau skill level profesional.
- Tidak membuka lab rentan ke internet publik.
- Tidak menyediakan multiplayer live attack, marketplace, atau pembayaran.

### Persona
Solo learner: sudah memahami dasar web development, ingin praktik Web/API security 2 jam/hari, membutuhkan jalur belajar dan feedback yang terukur.

## 2. Information architecture / sitemap
- /login, /register
- /dashboard — progress overview, streak, continue learning, lab rekomendasi
- /roadmap — timeline 90 hari, filter topik, status milestone
- /roadmap/:phaseId — daftar minggu dan tugas
- /learn — learning paths dan modul
- /learn/:moduleSlug — lesson reader, contoh, kuis singkat
- /labs — katalog lab dengan filter difficulty, topic, status
- /labs/:slug — deskripsi, tujuan, hint, launch/reset lab, submission flag
- /progress — charts, competency breakdown, history, time tracking
- /notes — personal notes (Markdown), tag per lesson/lab
- /reports — template laporan vulnerability dan latihan report
- /settings — profil, tema, timezone, reset progres (dengan konfirmasi)
- /admin/* — pengelolaan konten, hanya admin, tidak rentan

## 3. UI/UX specification
Visual direction: modern SaaS learning dashboard; sidebar navy #101827; background #F6F8FC; card white #FFFFFF; primary blue #2563EB; success green #16A34A; warning amber #D97706; text #111827; muted #64748B. Dark theme optional via design tokens. Font Inter or system sans. Radius 12–16px, spacing 8pt grid, Lucide icons.

Layout desktop: sidebar 248px fixed, header 64px, main max width 1440px, responsive grid. Tablet: collapsible sidebar. Mobile: drawer navigation, single-column cards. Accessible keyboard focus, color contrast >= WCAG AA where feasible, no status conveyed only by color.

### Screen A — Dashboard
Header greeting + search. Hero: circular progress for roadmap, total tasks, current week, CTA 'Lanjutkan'. KPI cards: lab solved, learning hours, streak, XP. Below: continue learning module card, active lab card, 3 recommended lessons, last activity. Empty state CTA 'Mulai roadmap'.

### Screen B — Roadmap
Horizontal category tabs (Fundamental, Web, API, Bug Bounty), vertical timeline phases, each expandable to weeks and daily tasks. Each task: type, duration, prerequisite, status (locked/available/in progress/done), CTA. Show estimated remaining hours and milestone. Do not mark complete from opening a page; require explicit completion or validated lab.

### Screen C — Learning module
Left lesson outline, central content (Markdown with syntax highlighting, diagrams), right optional summary/notes. Prev/Next lesson, mark complete, linked labs. Lesson status saved.

### Screen D — Labs catalog
Search + filters (topic, difficulty, duration, solved status). Cards show objective, tags, difficulty, estimated time, XP, state, launch CTA. Show 'Runs locally' safety indicator.

### Screen E — Lab workspace
Two-panel desktop: left guide (objective, prerequisites, hints revealed progressively, remediation explanation after completion), right request/response sandbox interface (or link to locally hosted VulnShop lab). Actions Launch, Reset, Submit Flag. State transitions: not started -> provisioning -> ready -> solved / reset / error. No raw attack traffic sent to arbitrary domains.

### Screen F — Progress
Date-range filter, roadmap completion, lab completion, time spent, weekly activity bars, skill breakdown across auth, access control, injection, business logic, API, milestones and activity history. Metrics must be computed from persisted events; avoid fake metrics.

### Screen G — Notes and Reports
Markdown notes linked to modules/labs, searchable tags; report drafting template with title, affected asset, steps, expected/actual, impact, evidence and remediation. Warn users to redact credentials and private data.

## 4. MVP scope & priority
P0: auth; seeded roadmap 90 days; module reader; daily tasks & manual completion; dashboard; progress persisted; labs catalog; one isolated guided lab (IDOR with two dummy accounts); flag verification server-side; hints; reset; basic notes; responsive UI.
P1: 8 labs (IDOR, BOLA, mass assignment, XSS, SQLi, JWT validation, business logic, function-level authorization); XP; streak; badges; progress charts; report drafting.
P2: skill assessments; certificates labeled non-accredited; leaderboards opt-in; content authoring admin; additional lab environments; exports.

## 5. Functional requirements & acceptance criteria
FR-01 Auth: register/login/logout; password hashed; authenticated routes protected; rate-limit auth. Acceptance: unauthenticated user redirected; other users' progress inaccessible.
FR-02 Roadmap: phases -> weeks -> tasks with duration and prerequisite. Acceptance: seed contains exactly 90 numbered days; daily sum target 120 min; user can see current/next tasks.
FR-03 Task progress: user may manually complete reading tasks; lab tasks complete only after validated lab. Acceptance: reload preserves state; repeat completion does not double count XP.
FR-04 Learning: modules with ordered lessons and Markdown content. Acceptance: lesson completion records timestamp; next recommended lesson uses prerequisite logic.
FR-05 Labs: catalog searchable and filterable. Acceptance: only provision labs allowed by policy; no public bind; lab status reflected in UI.
FR-06 Guided hints: sequential reveal; optional XP penalty configurable. Acceptance: reveal recorded per user and lab; no hint leakage across users.
FR-07 Flag submission: per-user/per-instance signed or randomly generated flag, stored hashed. Acceptance: arbitrary strings rejected; flag not present in frontend source; replay doesn't award points twice.
FR-08 Reset: recreate only learner's lab state and dummy data. Acceptance: reset doesn't affect other learner or core platform data.
FR-09 Analytics: derived from completed tasks, lab events, time logs. Acceptance: zero data shows honest empty state; no hardcoded stats.
FR-10 Notes: CRUD, owner-scoped. Acceptance: one user cannot read/update another user's notes.
FR-11 Theme and responsive: accessible on mobile 375px and desktop 1440px. Acceptance: no horizontal overflow; focus states visible.
FR-12 Report templates: create/save/export Markdown. Acceptance: no sensitive real user data in templates.

## 6. Core data model
users(id, name, email unique, password, role, timezone, created_at)
learning_paths(id, slug unique, title, description)
phases(id, learning_path_id FK, title, sort_order)
weeks(id, phase_id FK, week_number, title)
roadmap_tasks(id, week_id FK, day_number, title, task_type, estimated_minutes, lesson_id nullable, lab_id nullable, prerequisite_task_id nullable)
user_task_progress(id, user_id FK, roadmap_task_id FK, status, completed_at, UNIQUE(user_id,roadmap_task_id))
modules(id, slug unique, title, topic, sort_order)
lessons(id, module_id FK, slug unique, title, content_md, estimated_minutes, sort_order)
user_lesson_progress(id, user_id FK, lesson_id FK, completed_at, UNIQUE(user_id,lesson_id))
labs(id, slug unique, title, difficulty, topic, description_md, objective_md, duration_minutes, xp, enabled)
lab_hints(id, lab_id FK, sort_order, content_md)
lab_instances(id, user_id FK, lab_id FK, instance_key, status, started_at, expires_at, reset_at)
lab_submissions(id, lab_instance_id FK, user_id FK, submitted_at, is_correct)
user_lab_progress(id, user_id FK, lab_id FK, solved_at, xp_awarded, UNIQUE(user_id,lab_id))
user_hint_reveals(id, user_id FK, lab_hint_id FK, revealed_at, UNIQUE(user_id,lab_hint_id))
learning_sessions(id, user_id FK, started_at, ended_at, source, duration_seconds)
notes(id, user_id FK, lesson_id nullable, lab_id nullable, title, content_md, created_at, updated_at)
activity_events(id, user_id FK, event_type, metadata_json, created_at)

Keep platform tables in core DB; lab shop data in separate lab DB/instance. Use FK constraints and indices on user_id, timestamps, status. Keep role as explicit enum or policy, never mass assign role.

## 7. Technical architecture
Stack: Laravel 12+ PHP 8.3+, Inertia React TypeScript, Tailwind CSS, shadcn/ui, MySQL 8.4, Docker Compose, Redis optional (queue/cache), Recharts, Lucide, Pest/PHPUnit, Vitest optional, Playwright E2E. Start as Laravel monolith with separate lab runtime.

Core Laravel modules: Auth, Content, Roadmap, Learning, Labs (orchestrator), Progress, Notes, Reporting, Admin. Use Policies, Form Requests, services for progression and lab validation, jobs for provisioning. Routes web for Inertia pages, /api for sandbox interaction only where needed. React components: AppShell, Sidebar, StatCard, ProgressRing, RoadmapTimeline, TaskRow, LabCard, HintPanel, RequestEditor, ActivityChart.

### Docker Compose topology
Services: app (Laravel/PHP), web (Nginx), db (core MySQL), lab-runner (lab application), lab-db (dummy data). Bind web to 127.0.0.1:8088; lab web to 127.0.0.1:8090 if browser access required. DB services internal only (no host ports); dedicated internal networks for lab and core; avoid sharing database credentials. Lab runner must not mount Docker socket, host filesystem, or core app secrets. Use non-root users, read-only rootfs where feasible, CPU/memory limits, network egress disabled/restricted, disposable volumes. Core backend should not directly expose privileged container management endpoints to users. Lab provisioning may start as one local fixed lab, later move to isolated per-user instances with quotas and TTL.

Important: Docker Compose internal networks alone do not guarantee isolation if a service joins both networks; explicitly audit routing and capabilities. Never publicly deploy deliberately vulnerable labs without a dedicated security review.

## 8. Guided lab #1 — IDOR order API
Objective: learner uses two predefined dummy accounts to demonstrate broken object-level authorization on order details in local VulnShop.
Flow: open instructions -> launch local lab -> inspect dummy account A order -> log in as dummy account B -> attempt access to A order via permitted local endpoint -> obtain unique flag in a lab-owned marker field -> submit flag -> view remediation.
Secure mode: same endpoint checks order.owner_id equals authenticated user id and returns 403/404 when unauthorized. Explain vulnerable vs patched diff.
Success criteria: user gets completion only from server-side validator; no exposure of real data; reset restores seeded dummy orders; vulnerable service cannot reach core database.

## 9. Product analytics definitions
roadmap_completion = distinct completed roadmap tasks / available tasks in assigned roadmap; labs_solved = count distinct solved labs; learning_hours = sum validated learning_session durations (exclude idle > configured threshold); streak = consecutive calendar days with qualifying activity in user timezone; XP = sum one-time awards for unique solved labs + configured learning awards. All calculations tested for duplicate events, timezone boundaries, and resets.

## 10. Delivery milestones
Sprint 0 (days 1–3): repo, Docker, Laravel/Inertia scaffold, theme tokens, auth, CI lint/tests.
Sprint 1 (week 1): AppShell, dashboard skeleton, roadmap schema + seed 90 days, roadmap task progress.
Sprint 2 (week 2): lessons reader, progress service, dashboard real metrics, notes.
Sprint 3 (week 3): labs catalog, lab runtime separation, IDOR lab + flags + reset.
Sprint 4 (week 4): progress analytics, charts, guided hints, tests and accessibility.
Sprint 5–6: more labs, reporting, polish, hardening, docs.

## 11. QA / test plan
- Feature tests: authorization on every user-owned record; idempotent XP; prereq unlock; reset scoped to user; flag validation.
- Integration: core app cannot connect to lab DB with its DB credentials; lab cannot reach core DB; Docker binds loopback only.
- E2E: signup -> roadmap -> lesson -> launch lab -> solve -> progress dashboard updated.
- Accessibility: keyboard navigation, contrast, responsive breakpoints, semantic labels.
- Security: CSRF, XSS safe Markdown rendering, sanitized notes, secrets never in client bundle, rate-limit flag attempts, log redaction.

## 12. Codex implementation instructions
Build incrementally. Before editing, inspect repo and report current state. Do not claim features exist without tests. Implement Sprint 0 then Sprint 1 first. Use TypeScript for React, server-side authorization, Form Requests, Laravel Policies, migrations and seeders. Include README with commands, env example, test instructions, screenshots only when generated. No external services required. Avoid public network exposure. Run tests and report results and remaining issues. Do not implement vulnerable endpoints inside the core platform; keep vulnerabilities inside the isolated lab service.

### Initial Codex prompt
"Read VulnLab_PRD_Codex.md. Implement only Sprint 0 and Sprint 1 for the VulnLab platform using Laravel 12+, Inertia React TypeScript, Tailwind, MySQL, Docker Compose. Create responsive sidebar layout, dashboard with real empty-state metrics, seeded 90-day roadmap, task completion, auth, migrations, tests, README. Keep all services bound to localhost and reserve separate architecture for vulnerable labs; do not implement the lab exploit yet. First provide file plan, then implement, run tests, and summarize verification." 

## 13. Open decisions
- Single-user local-first MVP or multiple registered learners? Default: multiple users in core, single lab instance locally for MVP.
- Video hosting? Default: external links only, no media upload.
- Theme? Default: light content + dark sidebar, optional full dark mode.
- Progress import/export? Default: deferred to P1.
- Lab runner scalability? Default: local single-instance, per-user isolated instances later.
