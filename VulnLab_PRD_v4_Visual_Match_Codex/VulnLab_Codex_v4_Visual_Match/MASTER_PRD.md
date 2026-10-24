# VULNLAB — MASTER PRODUCT REQUIREMENTS DOCUMENT v4.0
## Visual-Fidelity Edition · Codex Implementation Contract

**Product:** VulnLab, an Indonesian-first Web & API Security / authorized Bug Bounty learning platform.  
**Document date:** 2026-10-23 · **Status:** Ready-to-implement specification, NOT a running Laravel application.  
**PRIMARY VISUAL SOURCE OF TRUTH:** [`design/visual-reference.png`](design/visual-reference.png), the **newest seven-screen VulnLab poster** approved by the project owner.  
**Priority:** Follow this v4 PRD and v4 design docs when there is a conflict with any v3 file or older prototype.  
**Core principle:** Preserve all functioning Laravel backend routes/data when applying the UI redesign; do not replace legitimate code with screenshots or invented demo data.

## 0. Read this before coding
This update is specifically intended to correct the earlier mismatch between the requested concept art and the prior prototype. The **target is the supplied poster itself**: bright illustrated home, dramatic dark illustrated roadmap, 3-column learning view, true split-screen dark lab, light progress analytics, dark knowledge-notes editor, light structured-report form, and the matching VulnLab header/design language. Do **not** return to the generic sidebar dashboard or substitute a different academy layout. The image is a *seven-view contact sheet*, **not** one giant application screen: each numbered panel becomes a separate responsive real page.

The poster is generated concept art containing decorative labels and microscopic text which may be inconsistent or illegible; **the PRD defines canonical spelling, functional behavior, actual content, and hierarchy**. Build high visual similarity at normal 1440x900 desktop views and accessible responsive mobile equivalents, not an inaccessible literal screenshot overlay. All controls are actual React UI.

## 1. Product outcomes and persona
**Primary persona:** Indonesian beginner with basic Web development experience and 120 minutes per day, targeting ethical Web/API Bug Bounty skills. **Job to be done:** open app → see what to do → read credible material → answer a quiz → do an isolated hands-on lab → take Markdown notes → draft a vulnerability report → monitor genuine progress.

**Done at MVP means:**
1. Seven top-level routes `Beranda`, `Roadmap`, `Modul`, `Lab`, `Progres`, `Catatan`, `Laporan` link to **working screens** with no `Segera Hadir` placeholders.
2. New v4 UI matches the reference's **information architecture, major compositions, nav positioning, imagery, colors, typography, button hierarchy, and light/dark presentation**; screenshot comparisons performed on all seven.
3. User can switch between dark and light globally; the poster's pages demonstrate a mix of themes, **but no page is forced to a particular theme**.
4. Seed **25 authored Indonesian lessons, 50 quiz questions, 8 lab design scenarios, and 90 daily roadmap tasks** from unchanged attached data files. These are starter editorial drafts, not certified/expert-verified materials.
5. Quiz grading, checklist completion, streak, notes, and reports persist via the backend, not React mocks/localStorage.
6. Intentional vulnerabilities execute only inside **separately isolated VulnShop containers** with disposable dummy data and allowlisted requests. When no runtime is available, show a real disabled/unavailable state, **not fake responses**.
7. Run and report backend, frontend, E2E, security, and visual tests; only claim a pass after it actually passes.

## 2. Visual direction — fixed requirement
**Style:** a high-end, playful **Cyber Adventure Academy** (illustrated learning journey + premium minimalist classroom), not a SOC monitoring console. Brand has a blue shield hexagon, bold `VulnLab` wordmark, rounded pill actions, blue-cyan-violet-teal highlights, soft editorial surfaces for light, and deep navy/indigo atmospheres for dark. The illustrations appear at meaningful places (home hero, roadmap path, progress milestone) rather than as repeated decorations.

Refer to `design/DESIGN_SYSTEM.md`, `design/SCREEN_SPECS.md`, and `design/VISUAL_ACCEPTANCE.md` for **implementable measurements**. The poster file must be included inside the repo and handed to the coding agent alongside this document; text-only prompts are insufficient to guarantee matching.

### Page and theme crosswalk
| Poster panel | Route | Reference composition | Default screenshot theme |
|---|---|---|---|
| 1. Halaman Utama | `/dashboard` | Friendly illustration hero + navy continue panel + compact next-step card + four quick-launch tiles | Light |
| 2. Roadmap | `/roadmap` | Immersive navy mountains with glowing zig-zag path, 5 waypoint markers + right detail drawer | Dark |
| 3. Learning Modules | `/learning/{slug}` | Left module outline, center readable lesson/code tabs, right trusted sources | Light |
| 4. Lab Workspace | `/labs/{slug}` | Midnight-dark left guided challenge, right actual HTTP request/response editor with bottom flag form | Dark |
| 5. Progress | `/progress` | White analytics with useful streak, mountain milestone, skill radar and weekly learning chart | Light |
| 6. Notes | `/notes` | Dark note library: tags/list left, Markdown editor right, search and new-note button | Dark |
| 7. Reports | `/reports/{id}` | Light bug-bounty report form with compact right guide and status steps | Light |

**Global theme choice:** system/light/dark setting; all seven screens are fully usable in either chosen theme. Capture **both** themes in QA; defaults above only identify the poster panels.

## 3. Navigation and interaction
Desktop **single slim, horizontal top navigation** on each page: shield logo `VulnLab` at left; `Beranda Roadmap Modul Lab Progres Catatan Laporan` in a compact row; search, notification button if functional, theme control, and avatar on right. Active tab uses blue underline or pill, not a full left sidebar. Max-width shell approximately 1440–1480 CSS pixels with 24–32px gutters. Top bar visually 56–64px tall. If a notification system is not built, hide the bell rather than create a dead button.

Mobile: wordmark, theme/profile; accessible bottom navigation `Beranda / Roadmap / Modul / Lab / Lainnya`, with Catatan + Laporan in `Lainnya`; account and search accessible. Use responsive adaptive pages, not a shrunk montage.

**Global command search** filters actual module titles/tags; empty/no-results states; skip-to-content; `aria-current` active route; keyboard navigation; focus visibility. Theme persists per account (guest OS preference); avoid hydration flash.

## 4. Screens and feature requirements
See `design/SCREEN_SPECS.md` for exact layouts and acceptance. The mandatory story:

**Home:** friendly `Halo, Hacker Muda! 👋`, safe illustrated science/academe landscape (original art inspired by image), search `Apa yang ingin kamu pelajari hari ini?`, prominent navy `Lanjutkan Belajar` block with real completion meter and CTA, `Langkah Berikutnya` white panel with next two tasks, row of four quick entry links `Mulai Roadmap / Jelajahi Lab / Lihat Modul / Baca Catatan`. Hero copy and quoted tagline are real text, never baked into the image.

**Roadmap:** full-bleed within content canvas (not entire website) *night mountain illustration*, illuminated ascending blue/cyan route, five clickable marker nodes numbered 1–5 and stage titles, top `Roadmap 90 Hari`, filter `90 Hari / 6 Bulan / 1 Tahun` only if data/view logic exists (for MVP, 90 Hari works, other modes clearly disabled or hidden), right detail overlay `Detail Tahap`, daily task drawers with theory/practice/reflection + authentic dates and progress. Show link to accessible textual list.

**Learning:** left `Web Security Fundamentals` outline with lesson steps/status, central lesson with breadcrumb, tag, `Jenis dan Teknik SQL Injection` as **one example** from the 25 seeded lessons (not a fixed homepage), tabs `Materi / Contoh Kode / Referensi / Diskusi` (only expose Diskusi if working; otherwise omit), readable code block and Copy, `Quiz Cepat`, next-step CTA, right narrow `Sumber Terpercaya` panel with actual official reference links from database. Reader prose and examples are responsive, not screenshot text.

**Labs:** premium dark testing workspace. Breadcrumb + lab difficulty/title/duration; left tabs `Deskripsi / Petunjuk / Solusi` with controlled spoiler and safeguards, goals checklist, 3 progressive hints and flag submission. Right Request editor method + internal endpoint + header/body tabs + Send, Response viewer with syntax highlight, elapsed request time only if actually measured. Lab target allowlisted local-only; show `Sandbox belum berjalan` if disabled. Flags/state validated on server.

**Progress:** `Perkembangan Belajarmu` title. Meaningful real learning streak and seven-day dots, journey card with mountain mini-illustration and true 90-day completion, radar chart tracking evidenced skills, weekly bar chart for completed modules/labs/notes and achievement chips. A newly registered learner starts at 0, not poster's sample figures.

**Notes:** dark editor/library like a premium knowledge base. Title `Catatan Saya`, search, prominent `+ Catatan Baru`, left topic filters + note list, right Markdown toolbar/editor/preview with chips and linked lesson/lab, autosave state. Private notes, sanitized preview, correct auth and conflict handling.

**Reports:** title `Buat Laporan Bug Bounty`, button `+ Laporan Baru`, form `Judul / Tingkat Keparahan / Ringkasan / Langkah untuk Reproduksi / Proof of Concept / Dampak / Rekomendasi`; right sidebar `Tips Laporan yang Baik` and report state tracker `Draft / Submitted / Diterima / Ditolak` **only for practice reports and clearly labelled simulation**. Default practice statuses should use `Draft / Dievaluasi / Perlu revisi / Selesai` instead of implying real third-party bounty acceptance. Export Markdown. Never submit to actual platforms automatically.

## 5. Credible learning content — preserved, not decorative
- `content/lessons.json`: **25 complete starter lessons** in Bahasa Indonesia, with analogy, short explanation, safe HTTP examples, mitigation, source URLs, editorial status.
- `content/quizzes/question_bank.json`: **50 actual MCQs** (2 per lesson), answers and explanations must stay **server-side until graded**.
- `content/labs/labs.json`: **8 guided scenarios** including IDOR/BOLA/BFLA and related Web/API topics, **design specs only until isolated implementations are actually built**.
- `planning/roadmap_90_days.json`: **90 distinct daily sessions** at 20 min theory + 70 min practice + 30 min reflection; preserve user completion on re-seed.
- `docs/SOURCES_AND_EDITORIAL.md`: human-reviewed sourcing and licensing workflow. Cite OWASP/PortSwigger/MITRE/MDN where relevant; avoid copying their proprietary course pages. Always display the truthful badge `Materi draft — belum ditinjau pakar` until reviewed.

### Evidence-based progress
Keep four distinguishable states: `visited/read`, `quiz_passed`, `lab_verified`, `report_practiced`. A course read never implies an exploit demonstrated; quiz passed never implies a lab solved. Progress bars = real database fractions and skills derived from actual evidence. XP/badges awarded only by idempotent server-side rules.

## 6. Route and data contract
- `/`, `/login`, `/register`, `/dashboard`, `/roadmap`, `/learning`, `/learning/{slug}`, `/labs`, `/labs/{slug}`, `/progress`, `/notes`, `/notes/{id}`, `/reports`, `/reports/{id}`, `/settings`.
- Laravel session auth + Inertia React TS; use policies and scoped queries for all private records. REST `/api/v1/*` interaction endpoints specified in v3 API and retained here, with authorization, CSRF and server-only grading.
- Entity schema and migration definitions: `users`, `tracks`, `lessons`, `lesson_sources`, `lesson_prerequisites`, `quiz_questions`, `quiz_options`, `quiz_attempts`, `quiz_answers`, `lesson_progress`, `roadmap_templates`, `roadmap_days`, `user_roadmap_days`, `labs`, `lab_sessions`, `lab_completions`, `notes`, `reports`, `study_sessions`, `achievements`, `user_achievements`, `content_revisions`; detailed field contract maintained in `docs/ARCHITECTURE_DATA_SECURITY.md`.
- Idempotent seeders keyed by stable slug, no destructive overwriting of actual user records.

## 7. Runtime and security boundaries
**Core:** nginx `127.0.0.1:8088` → Laravel PHP-FPM → MySQL internal network (not host-published). Use Docker Compose, distinct `.env` sample values, never ship real credentials. **Lab:** separated disposable VulnShop runtime, isolated Docker network, dummy user/order fixtures, loopback-only gateway and allowlisted endpoints, no Docker socket, no host mounts/secrets, no internet egress by default. Validate lab-to-core isolation with actual probes before enabling. No arbitrary public HTTP proxy, DoS/credential abuse, or remote targets.

Start **content-only mode**, with detailed lab instructions and an honest unavailable status; turn on real labs only after implementation and isolation tests. Use server-side flags/state; no flags baked into JS.

## 8. MVP sprints and deliverable gates
| Sprint | Build | Must pass before moving |
|---|---|---|
| S0 | Visual system + app shell/auth + theme + Laravel/Docker | Home shell fidelity, both themes, mobile nav, backend tests |
| S1 | Home + illustrated 90-day Roadmap, tasks and completion | data persisted; keyboard node navigation; screenshot parity |
| S2 | Three-column lesson reader, 25 lessons, 50 server-graded quizzes, notes | correct quiz security, real content, editor autosave |
| S3 | Lab catalog + dark workspace + isolation runtime (first challenge) | no bogus responses; isolation probes and session ownership |
| S4 | Progress analytics + reporting studio | true metrics, private reports, correct rubric/export |
| S5 | Full fidelity polish, a11y, responsiveness, visual regression | seven screen review vs latest image; security/e2e suites |

If an existing repository already implements features, **inspect them first and preserve them** rather than generating a new divergent app.

## 9. Acceptance gate / Definition of Done
- [ ] Latest visual reference included and used (`design/visual-reference.png` SHA match with delivered asset).
- [ ] Top nav (no desktop left sidebar), shield logo and blue/violet palette consistent across seven screens.
- [ ] Home hero + illustration, dark illustrated roadmap with 5 checkpoints, 3-column reader, 2-column dark lab, progress evidence views, dark note editor, light report studio implemented.
- [ ] Screenshot `1440x900` light/dark for all pages, `390x844` mobile for all seven, manual reference comparison and issues documented. Never claim pixel-identical art from generated image.
- [ ] No fake progress, stock demo stats, nonfunctional chart legends, fake request timing or dead buttons.
- [ ] 25/50/8/90 content imported (8 labs may remain disabled until safely live).
- [ ] `php artisan test`, TypeScript typecheck, lint, Vite build, E2E, accessibility, Docker config and app-security tests executed; exact pass/fail logs.
- [ ] Unreviewed lessons do not claim expert signoff; lab cannot access core DB, external targets, or host secrets.

## 10. Success measurement (product KPI, not fake UI numbers)
- Activation: new learner completes first lesson/quiz within first session.
- Retention: days with actual study evidence, accurately measured.
- Comprehension: % quizzes passed, track separately from reading completion.
- Practice: % isolated labs verified server-side.
- Reporting: % training reports meeting rubric completeness threshold.
- Accessibility: keyboard/200% zoom works across pages and themes.

## 11. Source-of-truth precedence
1. `design/visual-reference.png` for **art direction, composition and placement**.
2. `design/VISUAL_ACCEPTANCE.md` and `design/SCREEN_SPECS.md` for **responsive, measurable layout and interactions**.
3. `design/DESIGN_SYSTEM.md` for **tokens and components**.
4. `MASTER_PRD.md` for requirements and backend boundaries.
5. `content/*`, `planning/*`, `docs/SOURCES_AND_EDITORIAL.md`, `testing/QA_PLAN.md` for seeded data and validations.
6. `VulnLab_UI_Prototype_v3_LEGACY.html` is **behavioral reference only**; do not copy its old UI styling over the approved poster.

If conflicting requirements appear, document the conflict, follow the newest approved reference and maintain real functionality/accessibility/security. Report material departures rather than silently changing the UI.
