# VulnLab — MASTER PRD & CONTENT BLUEPRINT v2.0

**Status:** Implementation-ready specification, NOT an already implemented application or fully human-reviewed course.  
**Date:** 23 October 2026  
**Language:** Indonesian-first, technical terms English in parentheses.  
**Product:** Personal cybersecurity education, Web/API Bug Bounty, guided labs and measurable learning.  
**Primary stack:** Laravel + Inertia React TypeScript + Tailwind + MySQL + Docker.  
**Operating mode:** local-first, single-user MVP; architecture may later support multi-user.  

## 0. Non-negotiable product rules

1. User must be able to genuinely learn; do not ship empty pages or 'coming soon' placeholders for core navigation.
2. Every lesson must have original, beginner-friendly explanation, one example, comprehension check, source URL and source review status. Do not claim AI-authored content is independently fact-checked.
3. All vulnerable code must live in an isolated, disposable, loopback-only lab. Main app must never run intentionally vulnerable endpoints.
4. Lab network must not expose ports on 0.0.0.0, mount Docker socket, have production credentials, or allow external callbacks. Default lab egress denied where feasible; test and document actual isolation.
5. Never run active scanning on third-party targets without written program authorization. No automated external hunting in the MVP.
6. Persist progress on the server, derive dashboard values from database, never hardcode fake completed metrics.
7. No external paid services required to use the core platform.
8. No copied third-party article text, proprietary images, or branding. Link to external labs instead of mirroring their content.

## 1. Product definition

### Problem
Beginner security learners struggle to connect credible theory, hands-on practice, daily learning routines, notes and vulnerability reports. Their progress is scattered across platforms.

### Solution
VulnLab is a guided learning OS: roadmap -> concise lesson -> knowledge check -> isolated hands-on lab -> personal notes -> report practice -> evidence-based progress.

### Personas
- Primary: Indonesian learner with web-development basics, 2 hours/day, wants Web/API Bug Bounty skills.
- Secondary (future): instructors publishing reviewed modules and grading reports.

### Outcomes
- Follow a realistic 90-day study plan, 2h/day.
- Understand core Web/API vulnerabilities and defenses.
- Solve isolated challenges without needing external targets.
- Produce clear, ethical vulnerability reports.
- Track demonstrated competency, not just reading completion.

### Explicit non-goals MVP
- Public internet-hosted vulnerable labs; automatic exploitation of real targets; live bounty payout integration; social leaderboards; certificate claims; automated AI fact-checking.

## 2. Information architecture and routes

| Route | Screen | Core interaction |
|---|---|---|
| `/login`, `/register` | Auth | account, secure session, logout |
| `/dashboard` | Home | today's plan, continue lesson, skill snapshot, streak |
| `/roadmap` | 90-day roadmap | phase/week/day, task state, due dates |
| `/learning` | Learning catalog | track, level, search, filter |
| `/learning/{slug}` | Lesson reader | content, source, quiz, next, notes |
| `/labs` | Lab catalog | type, difficulty, status, prerequisites |
| `/labs/{slug}` | Guided lab | scenario, launch/reset, hints, verify, remediation |
| `/progress` | Analytics | learning minutes, solved labs, topic mastery |
| `/notes` | Notes | create, search, tags, autosave |
| `/reports` | Report practice | drafts, structured editor, review rubric |
| `/reports/{id}` | Report editor | summary, steps, evidence, impact, remediation |
| `/settings` | Preferences | theme, timezone, study target, data export |
| `/admin/content` | Local content admin | draft/review/publish (protected) |

## 3. UI design system

**Visual direction:** polished learning SaaS, desktop dark charcoal sidebar and bright neutral content. Dark mode supported. Do not replicate other platforms pixel-for-pixel.

**Tokens:** background #F7F9FC; surface #FFFFFF; sidebar #101827; primary #2563EB; primary-hover #1D4ED8; success #059669; warning #D97706; danger #DC2626; text #111827; muted #667085; border #E5E7EB. Dark mode background #0B1220, surface #121D30, text #F3F4F6. Font Inter or system sans; 8px spacing grid; cards 12px radius; buttons 10px; WCAG AA contrast, visible keyboard focus.

**Desktop:** sidebar 248px; topbar with breadcrumb, search, notifications (local only), profile; content max-width 1440px; 12-column grid. **Tablet:** collapsible sidebar. **Mobile:** topbar + bottom nav Dashboard/Roadmap/Learning/Labs/More; no horizontal scroll; large touch targets.

### Screen wireframes

**Dashboard:** top welcome, today 120-minute plan; 4 compact metrics (days studied, minutes, lessons, labs); 'Continue Learning' card; week roadmap timeline; suggested lab; recent notes; empty state for first-time learner. Never fabricate stats.

**Roadmap:** header progress, 13 week accordion, 90 day cards, status `locked|available|in_progress|completed`, learning objective, lesson/lab links, notes and 'mark reviewed' action. Future dates are adjustable based on start date. Tasks completed only when underlying requirements met; manual checklist tasks may be manually checked.

**Learning:** track filters (Foundation, Web, API, Hunting), level chips, search, lesson cards showing duration, source-review state, prerequisites, quiz status. Lesson detail uses sticky table of contents, reading progress, code blocks with copy, diagrams built as components, source panel, knowledge checks and 'Saya belum paham' simplified explanation.

**Labs:** searchable catalog; challenge detail shows scope warning, target URL only localhost, objectives, start/reset, account fixtures, HTTP examples, 3 progressive hints, answer submission, 'why it works' and secure code comparison. Show lab status `stopped|starting|running|solved|error`. No remote arbitrary URL fetch.

**Progress:** 7/30/90 day study chart, topic mastery based on quizzes + labs, milestone timeline, lab attempts, session minutes, achievements. No public ranking MVP.

**Notes:** list/detail, markdown editor with autosave debounce, preview, tags, linked lesson/lab, safe markdown sanitization, last saved state, export Markdown.

**Reports:** report list, template wizard, editable summary/steps/expected/actual/impact/evidence/remediation, rubric scoring, export Markdown, no sending to third parties.

**Settings:** timezone Asia/Jakarta default editable, daily goal 120 min, theme, local data export, delete account confirmation.

### UI states for every screen
Loading skeleton; empty with one useful CTA; error with retry; success feedback; permission denied; responsive mobile layout; keyboard and screen-reader labels.

## 4. User journeys

1. Register -> choose 2h/day -> create 90-day plan -> open first lesson -> pass quiz -> roadmap updates -> next lesson unlocked.
2. From lesson IDOR -> launch disposable VulnShop order lab -> test only dummy accounts -> submit flag -> remediation explanation -> XP and mastery update -> note auto-linked.
3. From solved lab -> 'Write report' -> prefill non-sensitive title and scenario -> user writes steps and impact -> self-assessment rubric -> save/export.
4. Returning learner -> dashboard shows next unfinished item and actual learning stats -> resume.

## 5. Functional requirements

| ID | Requirement | Acceptance criterion |
|---|---|---|
| AUTH-01 | secure session auth | unauthorized requests redirect or return 401; password hashed; CSRF protection |
| RM-01 | personalized 90-day plan | 90 dated items generated from user start date; timezone correct |
| RM-02 | persisted task progress | refresh/login preserves completion; no double XP |
| LEARN-01 | lesson renderer | renders original Markdown safely with source and review status |
| LEARN-02 | quiz | attempts stored, score computed server-side, explanations shown |
| LEARN-03 | prerequisites | unavailable content clearly marked; admin can override in dev |
| LAB-01 | lab lifecycle | start/stop/reset/timeout work on isolated lab, no Docker socket exposed to web process |
| LAB-02 | answer validation | flags validated server-side and scoped to user/instance |
| LAB-03 | guided hints | three stages, recorded, no points inflation |
| NOTE-01 | autosave | edits persist after refresh; only owner can access |
| REPORT-01 | report builder | required fields, draft save, Markdown export |
| PROG-01 | real analytics | aggregates match underlying lessons/labs/sessions |
| CONTENT-01 | editorial workflow | draft/review/publish; unreviewed clearly labeled |
| SEC-01 | isolated lab | loopback bind and no production DB access, isolation test documented |
| A11Y-01 | accessible UI | keyboard usable, labels, AA contrast, no motion dependence |

## 6. Technical architecture

- Laravel (supported stable version at build time) + Inertia + React + TypeScript + Tailwind + Vite.
- MySQL for durable app data; Laravel migrations and seeders; queues via database driver (or sync for local MVP).
- `web` Laravel session routes for UI, internal JSON routes for quizzes/progress/notes/lab orchestration; avoid duplicate auth stacks.
- Role policy: learner/admin; policies enforce ownership; rate-limit submissions and auth.
- Markdown sanitized server-side and client-side as appropriate; never trust lesson HTML or lab output.
- Docker Compose: `web` Nginx loopback 127.0.0.1:8088, `app` PHP, `db` private network, `lab-controller` isolated management process, `lab-target` disposable app on 127.0.0.1:8090. No public ports for MySQL.
- For MVP, lab controller may run a pre-provisioned single lab via explicit allowlisted commands; NEVER mount `/var/run/docker.sock` into the main web container. If secure orchestration is too complex, ship static lab guidance with external OWASP links first and defer dynamic container lifecycle.
- Labs must use fake seeded identities and orders, never real personal data or payment systems.
- Security boundaries: separate database credentials and networks for main platform vs vulnerable target; no shared auth cookies, sessions or secrets.
- Tests: PHPUnit/Pest feature + policy tests, Vitest UI tests, Playwright E2E, Compose isolation smoke test.

## 7. Database schema (minimum)

| Table | Key columns |
|---|---|
| users | id, name, email unique, password, role, timezone, daily_goal_minutes |
| tracks | id, slug unique, title, description, sort_order |
| modules | id, track_id FK, slug, title, summary, sort_order |
| lessons | id, module_id FK, slug unique, title, body_md, simplified_md, minutes, difficulty, editorial_status, reviewed_at, published_at |
| lesson_sources | id, lesson_id FK, url, title, publisher, accessed_at, license_note |
| lesson_prerequisites | lesson_id FK, prerequisite_lesson_id FK, composite unique |
| quizzes | id, lesson_id FK, passing_score |
| questions | id, quiz_id FK, stem, explanation, sort_order |
| choices | id, question_id FK, label, is_correct (server-only) |
| quiz_attempts | id, user_id FK, quiz_id FK, score, passed, submitted_at |
| roadmap_plans | id, user_id FK, starts_on, timezone, status |
| roadmap_items | id, plan_id FK, day_number, lesson_id nullable, lab_id nullable, task_type, title, status, completed_at |
| lesson_progress | id, user_id FK, lesson_id FK, status, read_at, completed_at, unique(user_id,lesson_id) |
| labs | id, slug unique, title, difficulty, scenario_md, remediation_md, image_key, points, is_enabled |
| lab_hints | id, lab_id FK, level, body_md, points_penalty |
| lab_instances | id, user_id FK, lab_id FK, instance_token_hash, status, started_at, expires_at |
| lab_attempts | id, user_id FK, lab_id FK, instance_id FK, success, attempted_at |
| lab_progress | id, user_id FK, lab_id FK, solved_at, hints_used, points_awarded, unique(user_id,lab_id) |
| notes | id, user_id FK, title, body_md, lesson_id nullable, lab_id nullable, updated_at |
| note_tags | note_id FK, tag, composite unique |
| reports | id, user_id FK, lab_id nullable, title, summary, reproduction_md, expected_md, actual_md, impact_md, remediation_md, status, created_at |
| study_sessions | id, user_id FK, started_at, ended_at, duration_seconds, lesson_id nullable, lab_id nullable |
| xp_events | id, user_id FK, source_type, source_id, points, created_at, unique(user_id,source_type,source_id) |

Index FKs and status/time filters. Use transactions for scoring and idempotent XP; foreign keys cascade only where data retention policy allows. No answer keys or flags in client payload.

## 8. Learning engine rules

- Reading status: `not_started -> in_progress -> read`; completed only when quiz passed if quiz exists.
- Quiz: minimum 3 questions per lesson, pass threshold 70%; no answers sent before submission; allow retries and record attempts.
- Mastery topic score: 40% latest passing quiz average + 60% solved linked labs; if no lab available, display 'theory only', not 100% mastery.
- XP: lesson quiz first pass +20, lab first solve easy +50/medium +100/hard +150; never award XP twice; hints may reduce lab XP but never below 20%.
- Streak: days with >=10 minutes verified study or one passed quiz/lab; use user's timezone; no fabricated streak.
- Lab solve verified by server, not by clicking 'complete'.
- Roadmap day completion depends on assigned tasks, not just opening page.
- Study timer pauses when page hidden or user idle; label estimate, not verified attention.

## 9. Editorial and content quality

- Source priority: OWASP official, PortSwigger Academy, MITRE CWE, MDN, official Laravel docs. Add per-lesson source links and `accessed_at`.
- Every lesson follows: 'Tujuan', 'Penjelasan singkat', 'Analogi', 'Contoh HTTP/kode', 'Kesalahan umum', 'Bagaimana memperbaiki', 'Ringkasan 3 poin', 'Kuis', 'Latihan', 'Referensi'.
- Indonesian easy-to-read: paragraphs <= 80 words, explain jargon at first use, use one analogy, avoid exaggerated claims.
- Never claim sourced/verified merely because URL exists. Label `draft`, `review_needed`, `reviewed`; only human review can mark reviewed.
- Never scrape and republish copyrighted content; write original summaries and link to sources. Confirm third-party licenses before copying diagrams/media.
- External lab links can be shown, but cannot be auto-marked solved without a legitimate integration; provide manual 'completed externally' separate from verified labs.

## 10. Content catalog: 30 planned lessons

Each item below is a **source-mapped editorial brief**, not a complete human-reviewed lesson. Codex must create original lesson content following section 9 and clearly mark generated drafts `review_needed`.

01. **FND-01 — Internet, DNS, dan browser** (module Fondasi Web & HTTP). Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview
02. **FND-02 — HTTP request dan response** (module Fondasi Web & HTTP). Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview
03. **FND-03 — HTTP methods dan status code** (module Fondasi Web & HTTP). Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
04. **FND-04 — Cookies, session, dan SameSite** (module Fondasi Web & HTTP). Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
05. **FND-05 — REST API dan JSON** (module Fondasi Web & HTTP). Reference: https://portswigger.net/web-security/learning-paths/api-testing
06. **TOOL-01 — Burp Proxy dan HTTP history** (module Tools & Methodology). Reference: https://portswigger.net/burp/documentation/desktop/tools/proxy
07. **TOOL-02 — Burp Repeater dan request editing** (module Tools & Methodology). Reference: https://portswigger.net/burp/documentation/desktop/tools/repeater
08. **TOOL-03 — Scope, izin, dan pengujian aman** (module Tools & Methodology). Reference: https://wstg.owasp.org/
09. **TOOL-04 — Evidence dan dokumentasi pengujian** (module Tools & Methodology). Reference: https://wstg.owasp.org/
10. **AUTH-01 — Authentication vs authorization** (module Authentication & Authorization). Reference: https://portswigger.net/web-security/authentication
11. **AUTH-02 — Session management dan logout** (module Authentication & Authorization). Reference: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
12. **AUTH-03 — Access control horizontal dan vertikal** (module Authentication & Authorization). Reference: https://portswigger.net/web-security/access-control
13. **AUTH-04 — IDOR dan object ownership** (module Authentication & Authorization). Reference: https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html
14. **AUTH-05 — BOLA pada REST API** (module Authentication & Authorization). Reference: https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/
15. **WEB-01 — XSS: reflected, stored, DOM** (module Web Vulnerabilities). Reference: https://portswigger.net/web-security/cross-site-scripting
16. **WEB-02 — SQL injection dan prepared statements** (module Web Vulnerabilities). Reference: https://portswigger.net/web-security/sql-injection
17. **WEB-03 — CSRF dan perlindungan request** (module Web Vulnerabilities). Reference: https://portswigger.net/web-security/csrf
18. **WEB-04 — Information disclosure** (module Web Vulnerabilities). Reference: https://portswigger.net/web-security/information-disclosure
19. **WEB-05 — File upload dan validasi** (module Web Vulnerabilities). Reference: https://portswigger.net/web-security/file-upload
20. **API-01 — API discovery dan dokumentasi** (module API Security). Reference: https://portswigger.net/web-security/learning-paths/api-testing
21. **API-02 — Mass assignment dan property authorization** (module API Security). Reference: https://portswigger.net/web-security/learning-paths/api-testing
22. **API-03 — BFLA: fungsi admin dan user** (module API Security). Reference: https://owasp.org/API-Security/editions/2023/en/0xa5-broken-function-level-authorization/
23. **API-04 — JWT fundamentals dan validasi** (module API Security). Reference: https://portswigger.net/web-security/jwt
24. **API-05 — GraphQL dan otorisasi field** (module API Security). Reference: https://portswigger.net/web-security/graphql
25. **API-06 — Business logic dan voucher** (module API Security). Reference: https://portswigger.net/web-security/logic-flaws
26. **HUNT-01 — Memilih program dan membaca scope** (module Bug Bounty Workflow). Reference: https://www.hackerone.com/for-hackers/how-to-start-hacking
27. **HUNT-02 — Asset inventory pasif dan endpoint mapping** (module Bug Bounty Workflow). Reference: https://wstg.owasp.org/
28. **HUNT-03 — Membuat hipotesis dan matriks akses** (module Bug Bounty Workflow). Reference: https://wstg.owasp.org/
29. **HUNT-04 — Validasi dampak dan bukti minimal** (module Bug Bounty Workflow). Reference: https://wstg.owasp.org/
30. **HUNT-05 — Menulis laporan vulnerability** (module Bug Bounty Workflow). Reference: https://docs.hackerone.com/en/articles/8476499-submitting-reports

## 11. Starter original lesson: IDOR (draft, source-linked)

**Lesson:** AUTH-04 | **Estimated time:** 15 min | **Level:** beginner | **Editorial status:** review_needed.

### Tujuan
Kamu dapat membedakan ID objek dengan izin akses, menjelaskan IDOR, dan memahami cara menguji kepemilikan objek menggunakan dua akun dummy.

### Penjelasan mudah
Bayangkan aplikasi toko menampilkan pesananmu lewat alamat `/api/orders/101`. Angka `101` hanya menunjukkan pesanan yang diminta. Angka tersebut **bukan bukti bahwa kamu pemiliknya**. Jika server menerima permintaan dari akun B untuk pesanan milik akun A tanpa memeriksa pemilik, itu merupakan masalah otorisasi objek. Pola ini sering disebut IDOR; dalam konteks API, istilah BOLA lebih umum.

### Contoh pada lab lokal
Akun dummy A memiliki pesanan 101; akun dummy B memiliki pesanan 102. Saat B meminta `GET /api/orders/101`, server yang aman menolak dengan `403 Forbidden` atau `404 Not Found`, sesuai desain aplikasinya. Server rentan justru mengembalikan detail pesanan A.

### Mengapa berbahaya?
Data pribadi atau transaksi dapat diakses tanpa izin. Pada operasi update/delete, dampaknya dapat meliputi perubahan data orang lain. Besar dampak bergantung pada informasi dan operasi yang benar-benar terbukti dapat diakses.

### Cara memperbaiki (Laravel)
Gunakan authorization policy atau query yang dibatasi kepemilikan, misalnya `Order::where('user_id', auth()->id())->findOrFail($id)` untuk resource yang memang harus dimiliki user. Jika admin diizinkan mengakses pesanan lain, atur kebijakan eksplisit dan uji setiap role.

### Kuis
1. Mengapa mengganti ID belum tentu bug? **Jawaban:** bug baru ada bila server gagal menerapkan kontrol akses.
2. Apakah ID acak/UUID menggantikan authorization? **Jawaban:** tidak.
3. Apa yang harus terjadi saat B meminta pesanan A? **Jawaban:** akses ditolak sesuai kebijakan.

### Latihan
Jalankan lab `idor-order-view` di localhost. Masuk sebagai dua akun dummy. Bandingkan request milik sendiri dan objek akun lain yang disediakan lab. Buktikan kontrol akses yang hilang menggunakan data lab saja. Setelah solve, lihat perbaikan dan tulis laporan latihan.

### Sumber
- https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html
- https://portswigger.net/web-security/access-control

## 12. Guided lab design: initial 8 scenarios

| ID | Title | Difficulty | Fixture | Success validation | Fix lesson |
|---|---|---|---|---|---|
| LAB-01 | View another dummy order (IDOR) | easy | accounts A/B, orders 101/102 | access dummy A order from B in vulnerable target | owner-scoped query |
| LAB-02 | Change another dummy address (BOLA) | medium | two address records | B modifies A address in disposable lab | policy per object |
| LAB-03 | User calls admin-only route (BFLA) | medium | user/admin role | non-admin invokes protected function | role middleware + policy |
| LAB-04 | Excessive fields in profile JSON | easy | fake profile | API leaks hidden dummy field | DTO/resource allowlist |
| LAB-05 | Unsafe profile mass assignment | medium | fake editable fields | modify restricted dummy property | validated field allowlist |
| LAB-06 | Search reflected XSS | easy | lab-only search | sandbox test confirms unsafe rendering | output encoding |
| LAB-07 | Voucher double redemption | hard | fake coupons | exploit flawed voucher state in lab | atomic transaction |
| LAB-08 | Unsafe file upload | medium | harmless test files | lab identifies missing validation | type/content validation |

Each lab includes objective, in-scope endpoints, accounts, setup/reset, 3 hints, flag derived per-instance, solution explanation, defensive patch and regression test. All attempts recorded; reset cannot erase completed progress unless user explicitly resets progress.

## 13. 90-day schedule generation

Generate **exactly 90 day entries** from user's chosen start date. First 60 days: theory and labs; last 30 days: ethical program selection, mock reports, external lab practice, review and hunting readiness. 2h/day split 20m theory, 70m practice, 30m notes/review. Sundays are lighter review, not empty days.

**Weeks 1–13 plan:**
1. HTTP, browser, DNS, request/response
2. Cookies, sessions, Burp Proxy and Repeater
3. Auth and session flows
4. Access control and IDOR
5. XSS, output encoding
6. SQLi and CSRF
7. API discovery and documentation
8. BOLA, BFLA, mass assignment
9. JWT, GraphQL, business logic
10. Lab practice and remediation
11. Scope, legal testing, report writing
12. Guided mock hunting on local VulnShop
13. Review, portfolio, program readiness (final week has 6 days to reach 90)

**Deterministic day template:** Monday theory+example; Tuesday guided lesson+quiz; Wednesday lab; Thursday defensive fix; Friday harder lab; Saturday report/notes; Sunday review/recap. Last week use 6 days. Content mapping must reference actual lesson/lab IDs; where content is unavailable, create meaningful review tasks, not dead links. Display 'estimated study' vs 'verified time' separately.

## 14. API / server actions

| Verb/path | Purpose | Guard |
|---|---|---|
| GET /dashboard | aggregate current learner metrics | auth |
| GET /roadmap | user's 90-day plan | auth/owner |
| PATCH /roadmap/items/{id} | manual task completion only | auth/owner, allowed task type |
| GET /learning/{slug} | lesson, refs, prerequisite state | auth |
| POST /lessons/{id}/quiz-attempts | grade on server | auth/rate-limit |
| GET /labs | catalog | auth |
| POST /labs/{id}/start | allowlisted local lab launch | auth/rate-limit |
| POST /labs/{id}/reset | reset disposable instance | auth/owner |
| POST /labs/{id}/submit | validate flag server-side | auth/rate-limit |
| GET/POST/PATCH/DELETE /notes | CRUD notes | auth/owner |
| GET/POST/PATCH/DELETE /reports | CRUD report drafts | auth/owner |
| GET /progress | analytics | auth/owner |
| GET /settings/export | export own data | auth/owner |

Use Inertia page controllers and named routes where appropriate; JSON for autosave, quiz and lab operations. Validate input, use form requests, policies, CSRF, tests. No generic shell command API.

## 15. Test plan and definition of done

- Unit: quiz grading, prerequisites, streak, XP idempotency, 90-day generation incl. timezone/date boundaries.
- Feature: auth, ownership, note/report CRUD, lab attempt scope, permissions, content review state.
- E2E: onboarding -> lesson -> quiz -> progress; lab solve -> report; mobile navigation.
- Security: XSS in notes sanitized, hidden correct quiz answers, no public lab exposure, isolated credentials, no Docker socket in app, no open DB port, no user access to another user's data.
- Accessibility: tab order, keyboard controls, labels, contrast, responsive 360px width.
- Seeders: 30 source-mapped lesson drafts; 8 labs metadata; 90 day tasks; dummy account and data only in local development. Never seed real passwords into version control.
- CI must pass all available automated tests. Clearly state tests not run, not implemented, or blocked; never claim success without execution.

## 16. Delivery phases for Codex

**Sprint 0 — Foundation (first):** scaffold Laravel/Inertia React/TS/Tailwind/MySQL, Docker local only, auth, policies, design tokens, base shell, tests.

**Sprint 1 — Dashboard & Roadmap:** deterministic 90-day plan, today tasks, real progress persistence, empty states, responsive dashboard.

**Sprint 2 — Learning & Notes:** lesson schema, 30 original *draft* lesson seeds from briefs, one fully polished sample, quiz engine, safe Markdown, notes autosave, source status UI.

**Sprint 3 — Labs:** first implement LAB-01 end-to-end in isolated disposable target; then other seven. If isolation tests fail, block lab launch and show error, never silently fall back to host.

**Sprint 4 — Analytics & Reports:** verified XP/streak/mastery, chart, reports editor and rubric, export.

**Sprint 5 — Hardening:** E2E, security isolation review, performance, a11y, documentation, editorial review queue.

### Each sprint deliverables
Source code; migrations; seeders; UI screens; tests; README setup; changed files list; executed commands and outcomes; known gaps; screenshots if environment permits. No placeholder-only screens counted as done.

## 17. Codex master prompt

```text
You are implementing VulnLab from MASTER_PRD.md. Inspect the existing repository first. Do not assume it is empty. Follow the PRD precisely, and work in sequential sprints. Begin ONLY with Sprint 0 and Sprint 1, producing working code, migrations, seeds, tests, and setup documentation. Use Laravel + Inertia React TypeScript + Tailwind + MySQL and a polished accessible UI. Bind app services to localhost; never expose deliberately vulnerable targets to the public internet. Do not implement vulnerable labs in the main application. Never mount Docker socket into the web container. No fake progress metrics, no empty Coming Soon screens for implemented features. Maintain server-side ownership policies, CSRF protection, validated inputs, idempotent XP and real database-backed progress. For content, create original Indonesian easy-to-read material with official reference URLs and status review_needed, never claim human verification. Run relevant tests and report exact pass/fail/untested results. When finished, summarize files changed, architecture decisions, and the next sprint prompt. Ask only when a blocking design choice cannot be inferred from this PRD.
```

## 18. Sources and licensing notes

- OWASP API Security Top 10 (2023): https://owasp.org/API-Security/editions/2023/en/0x11-t10/
- OWASP Web Security Testing Guide: https://wstg.owasp.org/
- PortSwigger Web Security Academy: https://portswigger.net/web-security
- PortSwigger API learning path: https://portswigger.net/web-security/learning-paths/api-testing
- OWASP Juice Shop: https://owasp.org/www-project-juice-shop/
- MITRE CWE: https://cwe.mitre.org/
- MDN HTTP: https://developer.mozilla.org/en-US/docs/Web/HTTP

Do not copy full third-party lessons. Confirm reuse licenses for each asset and maintain attribution. Content URLs may change; validate before publication.

## 19. Remaining honest limitations

This PRD specifies product, architecture, UI, data, 30 lesson briefs, one complete draft lesson, 8 lab scenarios, testing, and implementation phases. It is **not** 30 complete reviewed lessons, executable lab images, or tested application code. Those are Codex implementation/editorial tasks. Human review remains required for technical accuracy and source compliance before public publication.
