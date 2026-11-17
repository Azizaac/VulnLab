# V9 Audit & Prioritized Development Plan

**Updated:** 2026-11-18 (Asia/Jakarta)  
**Branch:** `codex/2026-10-30-171111-v9-visual-recovery-content-and-labs` (`HEAD` `74247f9` + in-progress V9 worktree)  
**Scope:** Local development & QA only (`127.0.0.1`). Zero changes to aaPanel, Cloudflare Tunnel, DNS, firewall, or public lab exposure.

---

## 1. Repository & Stack Inventory

| Area | Actual Implementation | Notes |
|---|---|---|
| Framework | Laravel 12 (`php ^8.4`) + Inertia v2 + React 19 + TypeScript 5.9 + Tailwind CSS v4 + Vite 7 | Preserved intact; no framework or stack rewrite |
| Core Database | MySQL 8.4 (`vulnlab-db-1` on internal `vulnlab_core` network) + SQLite for fast isolated tests | Lossless backup saved to `.tools/v9-live-backup-20261118.sql` (`849,408` bytes, SHA-256 `AE7C379A1EABEA4B...`) |
| Routes | `routes/web.php`, `routes/v5.php`, `routes/sprint4-*.php` | Horizontal learner nav (`/dashboard`, `/roadmap`, `/learning`, `/labs`, `/progress`, `/notes`, `/reports`), `/profile`, `/settings/*`, `/studio/*` |
| Services | `LabService`, `LocalLabRunnerAdapter`, `LabFlagValidation`, `LabRuntimeRegistry`, `V9LabCatalog`, `ContentWorkflow`, `ExpansionV71Importer`, `V9ContentImporter`, `V9LessonEnrichmentImporter`, `ProgressService`, `LearningEventService`, `RoadmapService` | Server-authoritative grading, XP ledger, proof validation, RBAC & Studio workflow |
| Isolated Sandbox | `sandbox/` (`runner.mjs`, `shop.mjs`, `verifier.mjs`, `contracts.json`, expansion modules) | Private internal networks (`lab`, `labcontrol`), read-only rootfs, `cap_drop: [ALL]`, `no-new-privileges`, session SQLite/tmpfs fixtures, strict endpoint/header allowlist |
| Automated Suites | PHPUnit 11.5 (`tests/Feature`, `tests/Unit`), Vitest 5 (`11/11` PASS), ESLint 9 + Prettier, Playwright 1.56 (`tests/e2e`), sandbox & isolation scripts (`scripts/*.mjs`) | Executed via local Node + `vulnlab-testing` / `vulnlab-sandbox-*` containers |

---

## 2. Live Database Counts & Learner Preservation Baseline (Verified 2026-11-18)

| Entity | Live DB Count (Before V9 Apply) | V9 Target | Status / Gap |
|---|---:|---:|---|
| `learning_paths` | 11 total (**10** visible course paths; `web-api-security` is umbrella non-course row) | 10 course paths | Reconciled by course filter & clear UI `10 jalur belajar ≠ N lesson` labeling |
| `modules` (`is_course=1`, visible) | **10** | 10 | Complete |
| `lessons` (learner-visible) | **25** (`L001`–`L025`, all `research_draft_unreviewed`) | 25 preserved + 10 expansion (`N026`–`N035`) | `N026`–`N035` + 25 enrichments ready via `V9ContentImporter` as Studio drafts pending human review; honest counts displayed |
| `lesson_sources` | **50** | Preserved + expansion citations | Complete in importer provenance |
| `quiz_questions` / `quiz_choices` | **50 / 200** (`Q001`–`Q050`) | 50 preserved + 30 expansion (`Q051`–`Q080`) | `Q051`–`Q080` imported as Studio quiz drafts (`quiz-N026`..`quiz-N035`); server-side answer keys only |
| `labs` in DB | **8** (`LAB001`–`LAB008`, all `enabled=1`) | 8 preserved + 12 verified local (`LAB009`–`LAB020`) = **20 playable local** | `LAB009`–`LAB010` verified; `LAB011`–`LAB012` drafted; **`LAB013`–`LAB020` missing** |
| `content_entries` / `content_revisions` | **80 / 80** | +45 V9 revisions (25 baseline enrichments + 10 lessons + 10 quizzes) | Pending additive schema migration (`content_import_records` + quiz draft link columns) & import |
| `editorial_reviews` | **0** | Truthful `0` until human reviewer approves | Never faked |

### Learner Data Checksums (Verified Unchanged vs Oct 30 Baseline)

| Table | Rows | SHA-256 Prefix (16 hex) |
|---|---:|---|
| `users` | 1 (`id=3`, `role=learner`) | `d43c8edfbe10466d` |
| `xp_transactions` | 5 | `dc431d2f79ffdc9a` |
| `lesson_progress` | 1 | `79cf0b06d6f7e8a9` |
| `quiz_attempts` | 1 | `38544f0959768736` |
| `lab_progress` | 3 | `0a4de972d73ca278` |
| `lab_sessions` | 3 | `9b8388756b93c7da` |
| `notes` | 0 | `4f53cda18c2baa0c` |
| `vulnerability_reports` | 0 | `4f53cda18c2baa0c` |

---

## 3. Visual, Content, Lab, and Integration Gaps Identified

1. **UI & Visual Quality Regression (Highest User Priority):**
   - `a7b8583` (rejected V8) flattened the platform into monotonous dark-navy bordered rectangles and polygon triangles.
   - `cb1868a` + `24578b6` reconnected `JourneyArt.tsx` SVGs, **but major visual defects remain**:
     - **Roadmap (`/roadmap`):** Summit peak & purple flag are hidden behind the right `.v8-stage-panel`; milestone orbs `2–5` use flat dashed circles misaligned above the glowing path with clunky 3-row black bordered label boxes; `JourneyArt.tsx` uses flat geometric triangles instead of rich atmospheric mountain depth.
     - **Dashboard (`/dashboard`):** Still renders the forbidden empty full-width `Aktivitas terakhir` rectangle when `activities` is empty (`MASTER_PRD_V9.md` §Dashboard); flat metric boxes lack hierarchy and polish.
     - **Profile (`/profile`):** Renders a tall blank `#132944` banner rectangle (`v8-profile-banner`) and an empty full-width `Aktivitas terbaru` box.
     - **Modules (`/learning`) & Lesson Reader (`/learning/:slug`):** Needs clearer `10 jalur belajar · N lesson` visual hierarchy, category accents, and an explicit `"Belum paham? Lihat ringkasan sederhana & prasyarat"` helper in `LessonReader` (`MASTER_PRD_V9.md` §Modules).
     - **Labs (`/labs`):** Missing `Playable Lokal` vs `Segera Hadir` availability filter, featured recommended lab spotlight, and explicit `X playable lokal` vs `Y terencana` counters (`MASTER_PRD_V9.md` §Labs).
     - **Admin Studio (`/studio`):** Needs explicit separated indicators for `Lesson Terbit`, `Lab Playable Lokal`, and `Draft Menunggu Review` (`CONTENT_EDITORIAL_AND_IMPORT.md`).

2. **Content & Quiz Gaps:**
   - 6 additive migrations (`2026_10_27_*` and `2026_11_16_*`) are pending on the live local MySQL DB.
   - `V9ContentImporter` + `V9LessonEnrichmentImporter` + `v9-lesson-enrichment.json` (25 rich addendums for `L001`–`L025`) + `v9-expansion-review.json` (`N026`–`N035` + `Q051`–`Q080`) are implemented and verified on disposable MySQL, ready to be applied cleanly via a dedicated non-learner editor account without touching learner `id=3`.

3. **Hands-on Lab Gaps (`LAB009`–`LAB020`):**
   - `LAB009` (`password-reset-token-lifecycle`) & `LAB010` (`csrf-preferences`): implemented & verified.
   - `LAB011` (`path-traversal-receipts`) & `LAB012` (`file-upload-validation`): sandbox handlers drafted, missing acceptance scenarios in `scripts/v9-scenarios.mjs` and status `201` handling in `V9LabRuntimeTest.php`.
   - `LAB013` (`graphql-object-access`), `LAB014` (`cors-credential-boundary`), `LAB015` (`webhook-ssrf-fixtures`), `LAB016` (`oauth-callback-state`), `LAB017` (`coupon-race`), `LAB018` (`api-property-auth`), `LAB019` (`api-data-minimization`), `LAB020` (`multi-tenant-workspace`): **not yet implemented** in `sandbox/`, `contracts.json`, `lab-routes.json`, `labs-v9.json`, `LabService.php`, `V9LabRuntimeTest.php`, or `v9-scenarios.mjs`.

4. **Cross-Feature Integration Gaps:**
   - `LearningController::show()` checks `$lab?->enabled && config('labs.enabled')` without `LabRuntimeRegistry::available($lab)`.
   - `ProgressService::SKILLS` and `LearningEventService::API_LABS` only map `LAB001`–`LAB008` and `L001`–`L025`, omitting `LAB009`–`LAB020` and `N026`–`N035`, and `ProgressService` counts disabled/unverified labs in `labs_total` unless scoped to playable labs.

---

## 4. Prioritized V9 Development Plan (Execution Order)

1. **Slice V9-A — Audit, Safety Snapshot & Baseline Verification (Completed):**
   - Captured full lossless MySQL dump `.tools/v9-live-backup-20261118.sql` and verified learner table SHA-256 fingerprints.
   - Verified baseline Vitest (`11/11` PASS) and V9 feature suites (`22/22` PASS, 891 assertions).
2. **Slice V9-B — Premium Illustrated Dashboard & Roadmap Recovery + Improvisation:**
   - Replace flat polygon vector placeholders with bespoke, text-free painted atmospheric illustrations (`hero-observatory`, `roadmap-panorama`) layered beneath semantic interactive React controls and luminous SVG winding trail.
   - Fix all Roadmap layout & alignment issues: keep summit peak & glowing flag unobstructed left of the inset glassmorphic `Detail Tahap` card, align 5 color-coded glowing milestone orbs directly along the luminous path with readable floating pills, restore stage CTA button, and preserve full keyboard/mobile accessibility.
   - Polish Dashboard hierarchy: compact illustrated hero + `Hari Ini` mission card, crisp inline metric ribbon, accented quick-launch tiles, `Lanjutkan Belajar` spotlight, and hide empty `Aktivitas terakhir` box in favor of a welcoming onboarding strip when empty.
3. **Slice V9-C — Visual Polish Across All Remaining Screens:**
   - Unify refined midnight-slate & light-mode WCAG-compliant design system (`v9-design-system.css`) across Modules (`10 jalur ≠ N lesson` clarity), Lesson Reader (`"Belum paham"` expandable helper + inline quiz feedback + crisp code blocks), Labs Catalog (Featured lab + `Playable Lokal` filter & honest counters), Lab Workspace, Progress (8-domain competency visualization), Notes, Reports, Login/Register, Profile (illustrated aurora banner replacing blank box), Settings, and Admin Studio (separated published/playable/draft indicators).
4. **Slice V9-D & V9-E — Content Preservation Import + 12 Local Sandbox Labs (`LAB009`–`LAB020`):**
   - Complete and verify Pair 2 (`LAB011`–`LAB012`), Pair 3 (`LAB013`–`LAB014`), Pair 4 (`LAB015`–`LAB016`), Pair 5 (`LAB017`–`LAB018`), and Pair 6 (`LAB019`–`LAB020`) in `sandbox/`, `labs-v9.json`, `contracts.json`, `lab-routes.json`, `LabService.php`, `V9LabRuntimeTest.php`, and `v9-scenarios.mjs`.
   - Rebuild local sandbox containers and verify all 8 baseline + 12 expansion = **20 playable local labs** against all 10 runtime, proof, secure-mode, reset, expiry, ownership, XP idempotency, and network isolation checks.
5. **Slice V9-F — Full Integration, Safe Local DB Sync, Regression & Release Audit:**
   - Integrate verified labs & content with `LearningController`, `ProgressService`, `LearningEventService`, `StudioController`, Roadmap, Notes, and Reports.
   - Rehearse migrations + imports on disposable MySQL (`v9-content-smoke.mjs` + `test-mysql.mjs`), then safely apply additive migrations, V9 Studio drafts, and verified local lab receipts to local dev DB (`127.0.0.1:8088`) while verifying learner `id=3` data checksums remain untouched.
   - Capture desktop/laptop/tablet/mobile/320px dark & light screenshots, run full PHPUnit (SQLite + MySQL), ESLint/Prettier, TypeScript/Vite build, Vitest, Playwright E2E, concurrency, sandbox, and isolation suites, and write `docs/v9/implementation/RELEASE_AUDIT.md`.
