# VulnLab — PRD Sprint 4 Combined (v4.1)
**Progress Analytics · XP · Achievements · Bug Bounty Reports · Global Feedback & Validation**

| Metadata | Value |
|---|---|
| Product | VulnLab, Indonesian-first Web & API Security learning platform |
| Document status | Implementation specification; not evidence that features are deployed/tested |
| Version | v4.1 — Sprint 4 Addendum to Master PRD v4.0 |
| Date | 24 October 2026 |
| Target stack | Existing Laravel + Inertia React/TypeScript + Tailwind + MySQL + Docker for local development |
| Hosting | **Out of scope.** aaPanel deployment only after Sprint 5 QA |
| Visual source of truth | `design/visual-reference.png` plus V4 design specifications |
| Precondition | Sprint 0–2 implemented; Sprint 3 implementation must be audited before integration |

> **For Codex:** Keep `MASTER_PRD.md` (V4) authoritative for existing product, architecture, and seven-screen design. This document adds concrete acceptance criteria and contracts for Sprint 4, and does **not** replace previous requirements. Inspect the actual repository before proposing migrations or naming routes; adapt to working existing conventions. Preserve user data. Do not deploy or reset databases.

---

## 1. Why this sprint exists

The existing VulnLab app has Dashboard, illustrated Roadmap, Learning Modules, Notes, and is implementing guided Labs. Students need (a) reliable evidence of skill progression, (b) meaningful encouragement via XP and achievements, (c) a real practice vulnerability report editor, and (d) clear, usable feedback when actions succeed or fail. Currently, some successful/failed actions surface only as small messages at the top of the screen. That is insufficient for comprehension, particularly on mobile.

### Intended user outcome

A learner can open **Progres** to see actual learning evidence, complete a lab or quiz and receive clearly visible feedback, create a technical practice report, and return after refresh with all verified state preserved.

### Non-goals

- Public aaPanel/cloud deployment, Cloudflare setup, domain/SSL, production operations.
- Arbitrary remote HTTP testing or external bug-bounty submission.
- Implementing new deliberately vulnerable endpoints in the core Laravel process.
- Claiming a human security expert reviewed content or reports when none has.
- Overhauling unrelated pages, redesigning the main navigation, or migrating everything to a new frontend framework.

## 2. Release scope and priorities

| Priority | Epic | Must be usable in this sprint |
|---|---|---|
| P0 | Sprint 3 dependency audit | Know which labs actually work; no phantom completions or XP |
| P0 | Shared global notification/validation | Reusable toasts, inline errors, loading, accessible dialogs, API/Inertia normalization |
| P0 | Activity & XP event model | Real events, uniqueness, transactional awarding, safe backfill |
| P0 | Progres screen | Genuine stats, charts, skill evidence, empty/error states |
| P0 | Reports | Private CRUD, practice statuses, Markdown editor, review rubric, safe Markdown export |
| P1 | Learning streak & achievements | User-timezone calendar, unlock conditions, idempotency |
| P1 | Celebration/results | Lab completion modal; quiz result panel; no duplicated reward |
| P1 | Secure evidence uploads | Private storage, constrained types/sizes, ownership |
| P2 | PDF export | Only if dependencies and rendering can be verified; Markdown/printable HTML mandatory |

## 3. Experience design — stay faithful to V4

**Global:** keep slim horizontal VulnLab navigation, blue/cyan/violet palette, design tokens, large readable text, rounded controls, and optional system/light/dark theme. No admin left sidebar. Responsive priority: desktop 1440×900, mobile 390×844, tablet, 200% zoom; reduced motion preference respected.

### 3.1 Progres (`/progress`)

From reference panel 5: editorial white/light canvas in light theme, heading **Perkembangan Belajarmu**, welcoming progress narrative, activity graphs, evidence-oriented skill radar, illustrated journey milestone, achievement ribbon. Dark theme also needs full support.

**Required regions in reading order:**
1. Header with period filter `7 hari / 30 hari / 90 hari / Semua` and explanation of how stats are calculated.
2. Summary row (not generic dashboard-card overload): roadmap tasks completed / total, modules completed, quizzes passed, labs solved, verified study minutes, XP and level.
3. **Learning Activity:** time-series (x=date) of server-stored events; toggle by lessons, quizzes, labs, study minutes; accessible table alternative to chart.
4. **Skill Radar:** Web Fundamentals, Authentication, Access Control, API Security, Injection, Business Logic, Reconnaissance, Reporting; show normalized 0–100 scores and evidence tooltips.
5. **Learning Journey:** progress within actual 90-day plan and next recommended action, with illustrated mountain art.
6. **Achievements and Learning Streak:** last 7 dates, current streak and unlock dates.

**No-data states:** `Belum ada aktivitas belajar. Mulai dari satu materi atau kuis pertamamu.` with real CTA. Never display mock 42 hours, fake streak, or made-up skill values. When there are no qualified events, show zero or `Belum dinilai`, not fabricated 100%.

### 3.2 Reports (`/reports`, `/reports/create`, `/reports/{id}`, `/reports/{id}/edit`)

From reference panel 7: light, structured bug-bounty reporting studio, main editor + narrower contextual help panel; use theme-correct variants. Title **Buat Laporan Bug Bounty**. Nav and typography match V4. Responsive form becomes single column on mobile.

**Index:** saved practice reports with own title, category/CWE, lab, local practice status, severity, updated date; search, pagination, filter, create, edit, archive. Do not mark a report as submitted to a third-party service.

**Editor:** fields `judul`, `kategori/CWE`, `lab terkait`, `endpoint sandbox`, `severity usulan`, `ringkasan`, `prasyarat`, `langkah reproduksi`, `perilaku diharapkan`, `perilaku aktual`, `bukti/PoC tersanitasi`, `dampak`, `rekomendasi mitigasi`, `referensi`. Structured Markdown editor with escaped preview, unsaved indicator, field-level feedback, sticky context tips, Save Draft / Send for Internal Review. Severity is *proposed*, not externally verified.

**Practice status enum:** `draft`, `ready_for_review`, `under_internal_review`, `needs_revision`, `accepted_for_practice`, `archived`. UI labels must include `Latihan Internal` to avoid implying real bounty triage.

**Review rubric:** technical accuracy 0–4, reproducibility 0–4, supporting evidence 0–4, impact specificity 0–4, clarity 0–4, remediation usefulness 0–4; total 0–24. Automated feedback is labeled automated and never claims expert review. Prefer clear rule-based completeness feedback for MVP. `accepted_for_practice` can only be set by a dedicated authorized policy-controlled review pathway (or deterministic internal validator whose rule and limitations are disclosed), never by simply clicking an unguarded client-side status selector.

**Exports:** `.md` and printable sanitized HTML mandatory; PDF optional after tested. Never leak session tokens, cookies, passwords, or other people's data in output. Exports use authenticated scoped report fetches.

### 3.3 Feedback interaction specification

| Event | Visible location and behavior | Exact example Indonesian copy |
|---|---|---|
| Save report | Toast, action confirmed server-side | **Laporan disimpan** — Draft berhasil diperbarui. |
| Failed report save | Toast + field errors where applicable | **Gagal menyimpan laporan** — Periksa koneksi lalu coba lagi. Draft tetap tersedia. |
| Invalid field (422) | Below individual control; focus first field | **Judul laporan wajib diisi.** |
| Notes autosave success | Small persistent status by editor, **no toast spam** | **Tersimpan** |
| Notes autosave failure | Editor status + Retry control | **Perubahan belum tersimpan** — Coba lagi. |
| Correct lab flag | Prominent celebration modal after verified response | **Lab berhasil diselesaikan!** XP baru: `+50` (from server) |
| Incorrect flag | Inline near flag input, preserves input | **Flag belum cocok.** Periksa hasil lab atau buka petunjuk. |
| Lab timeout | Contextual error with safe restart | **Sesi lab berakhir** — Mulai ulang lab untuk mencoba lagi. |
| Quiz pass/fail | Dedicated score/result panel + explanation | **Kuis selesai — 8/10 benar** |
| Roadmap task saved | Toast (not on each auto-update) | **Progres diperbarui** |
| Delete a note/report | Confirmation dialog prior to deletion | **Hapus catatan ini?** Tindakan tidak dapat dibatalkan. |
| 401 | Re-auth action | **Sesi berakhir** — Masuk kembali untuk melanjutkan. |
| 403 | In-page alert | **Akses ditolak** — Kamu tidak memiliki izin untuk tindakan ini. |
| 404 | Full/inline empty state | **Konten tidak ditemukan** |
| 429 | Alert, server cooldown if provided | **Terlalu banyak percobaan** — Coba lagi sebentar. |
| 500/503/network | Friendly error, safe Retry | **Layanan sedang bermasalah** — Tidak ada perubahan yang dikonfirmasi. |

**Global toast policy:** fixed top-right on desktop, mobile safe-area-aware placement; bounded stack max 3, deduplicate repeated requests; success/info auto-dismiss 4–6s unless action needed; failure with action persists until dismissed or remediated; manual dismissal; screen reader `role=status` vs `role=alert`; WCAG AA contrast, keyboard handling, reduced motion. Never show success until HTTP/server-confirmed state. Avoid duplicated toast from Inertia flash + API hook.

**Form policy:** Laravel 422 maps field names to messages; connect `aria-invalid` + `aria-describedby`, jump focus to first error after submit, retain fields on failures, disable only duplicate active submits, provide loading labels (`Menyimpan...`), unsaved draft leave warning for Report/Notes. Do not confuse generic server errors with validation errors.

## 4. Data correctness contracts

### 4.1 Learning event model

Canonical source is validated domain state, not the frontend. Define a `learning_activity_events` table or safe adapter to existing records:
- `id`, `user_id`, `event_type`, `subject_type`, `subject_id`, `occurred_at` UTC, `duration_seconds` nullable, `source_event_key` unique, `metadata_json` (restricted non-secret metadata), timestamps.
- Event types: `lesson_completed`, `quiz_passed`, `lab_solved`, `report_accepted_for_practice`, `study_session_verified`.
- Only a trusted domain handler writes qualification events; client cannot POST arbitrary activity/XP.
- A timestamp is authoritative only if generated or verified on server. Study minutes use tracked sessions with credible start/end, idle handling, and abuse limits; until implemented, show `Belum dilacak` instead of guessed hours.
- Lesson opened != completed; quiz attempted != passed; lab flag submitted != solved; report drafted != accepted.

### 4.2 XP ledger

`xp_transactions`: `id`, `user_id`, `source_type`, `source_id`, `reward_key` unique for user/source/reward, `amount`, `granted_at`, `context_json` minimal, timestamps. Guarantee at-most-once reward with DB unique constraint and atomic transaction; concurrency tested. Consider `(user_id, reward_key)` composite unique. User's XP derives from sum of transactions (cached projection can be rebuilt). Server-only awards:

| Qualifying first-time action | XP |
|---|---:|
| Lesson completed | 10 |
| Quiz passed | 20 |
| Easy lab solved | 50 |
| Medium lab solved | 100 |
| Hard lab solved | 150 |
| Internally accepted practice report | 50 |

No XP for page views, mere logins, unverified completion, repeats, or pressing a button twice. If existing XP exists, write non-destructive data migration/backfill with a one-time idempotency marker rather than double-crediting. Display real server-awarded delta (if already earned, `0 XP baru`) on celebration.

**Leveling:** `level = floor(sqrt(total_xp / 100)) + 1` as a suggested monotonic MVP formula; derive progress-to-next-level from matching thresholds `100 × (level)^2` XP for the next level; document and centralize the formula in backend. Note: 0–99 XP is level 1, 100–399 level 2, 400–899 level 3. Do not hardcode level client-side.

### 4.3 Streak

Qualified local learning day is a day with at least one first verified learning completion/pass/solve or credible verified session, converted from UTC to the user's IANA timezone (`Asia/Jakarta` default). Count one day once. `current_streak` counts consecutive qualified days ending today or yesterday to avoid prematurely showing 0 before the learner studies today. `longest_streak` uses historical days. Timestamps are server-generated; daylight savings handled by timezone library. Show all calendar dates in user locale; no `login-only` streaks.

### 4.4 Competency scores

Eight dimensions. Store mapping from quiz topic / lab category / reviewed practice-report rubric to a dimension. **Practical evidenced level** should require lab/report evidence, not mere reading. Suggested initial method for each dimension: knowledge (quiz normalized score, 40% maximum) + practice (lab validated outcomes, 60% maximum), scaled to 0–100 with published denominators. Where practice evidence doesn't exist yet, label `Belum dinilai secara praktik`, and do not imply mastery. Missing assessments should show 0 score with evidence state or an undetermined state; no invented values. Guard against improving skill by resubmitting the same lab flag repeatedly.

### 4.5 Achievements

`achievements` (stable `code`, name, description, icon, rule_version), `user_achievements` (unique `(user_id, achievement_id)`, `unlocked_at`, `source_event_key`). Unlock rule runs idempotently after verified domain events.

Starter achievements:
- `first_step`: first real lesson completed.
- `http_explorer`: completes required HTTP Fundamentals lessons.
- `quiz_starter`: first quiz passed.
- `first_lab`: first lab solved.
- `api_explorer`: five distinct API-related labs solved.
- `note_master`: ten non-empty notes owned by user; no XP for note spam.
- `week_warrior`: seven consecutive qualified days.
- `bug_hunter`: first accepted **internal practice** report.

Only award badges that conditions truly satisfy. If an achievement requires content not yet in app, show it as locked/not yet attainable, not auto-unlocked.

## 5. Suggested MySQL model delta (adapt to existing schema)

| Table/model | Key columns | Constraints |
|---|---|---|
| `learning_activity_events` | user_id, event_type, subject_type, subject_id, occurred_at, source_event_key | FK user; globally unique event key; indexes user/time/type |
| `xp_transactions` | user_id, source_type, source_id, reward_key, amount, granted_at | Unique user/reward; FK user |
| `achievements` | code, name, description, rule_version | Unique code |
| `user_achievements` | user_id, achievement_id, unlocked_at | Unique user/achievement |
| `skill_assessments` (if needed) | user_id, skill_code, source_event_key, score, max_score, occurred_at | Stable source key; do not duplicate existing quiz/lab facts |
| `vulnerability_reports` | user_id, lab_id nullable, title, cwe_id nullable, endpoint, severity, status, body_json, version, reviewed_at | scoped ownership, validation, status enum |
| `report_evaluations` | report_id, evaluator_type, scores_json, feedback, rubric_version, evaluated_at | evaluator authorized; report FK |
| `report_evidence` | report_id, original_filename, disk, path, mime, size, uploaded_by | private storage; owner access only |

**Migration rule:** Before implementing any table, inspect Sprint 1–3 tables. Extend or reuse compatible existing entities and avoid duplicate `reports`, `study_sessions`, `achievements`, or `xp_events`. New migrations must be additive/rollback-aware; preserve current user progress; seed reference achievements idempotently. Store report bodies as typed fields or validated JSON mapped to stable DTO, not arbitrary editable status/XP fields.

## 6. Backend endpoint and policy contract

Use current Laravel routing style and session + CSRF rules. Paths below are *illustrative contracts*, not authorization to duplicate existing endpoints:

| Method | Proposed path | Backend behavior |
|---|---|---|
| GET | `/api/v1/progress/summary?period=30d` | authorized self-only aggregated metrics |
| GET | `/api/v1/progress/activity?period=7d` | time-bucket events with timezone conversion |
| GET | `/api/v1/progress/skills` | evidenced skills + sample counts |
| GET | `/api/v1/progress/achievements` | owned + locked badges and criteria |
| GET | `/reports` | only current user's reports; paginated |
| POST | `/reports` | validate draft; set owner from session |
| GET | `/reports/{report}` | policy ownership/authorization |
| PATCH | `/reports/{report}` | only editable states; optimistic lock `version` |
| DELETE | `/reports/{report}` | soft-delete/archive if desired; confirmation in UI |
| POST | `/reports/{report}/submit-for-review` | authorized status transition, no XP on submit |
| POST | `/reports/{report}/evaluate` | authorized review only; rubric + state transition |
| POST | `/reports/{report}/evidence` | private upload with type/size validation |
| GET | `/reports/{report}/export?format=md` | scoped fetch + sanitization |

Security requirements: `auth`, CSRF, per-user policies/scoped queries, request validation, server-controlled ownership/status/XP, rate limits on sensitive actions, secure download headers, no public evidence URL, safe Markdown renderer with HTML sanitization. Upload only safe allowlisted types (e.g., png/jpg/pdf/plain text, 5MB max each, configurable), store on private disk outside public webroot, generate randomized names; verify MIME and signature; block executable HTML/SVG uploads. Avoid logging confidential request headers, flags, cookies, tokens, or PoC secrets.

**No SSRF:** URLs inside report content are inert text, not fetched remotely by server. The lab HTTP client remains scope-allowlisted and lab-isolated.

## 7. Frontend reusable components and state

Build within existing React/TypeScript/Inertia conventions; use established shadcn/ui or equivalent project components rather than introducing unrelated UI systems.

Required:
- `GlobalToastProvider`, `AppToast`, `useNotify` or framework equivalent
- `FormFieldError` and centralized `normalizeLaravelError`
- `LoadingButton`, `ConfirmDialog`
- `LabCompletionDialog`, `QuizResultPanel`
- `SaveStatusIndicator`, `ErrorState`, `EmptyState`
- `ProgressSummary`, `LearningActivityChart`, `SkillEvidenceRadar`, `LearningStreakCalendar`, `AchievementGrid`
- `ReportEditor`, `ReportGuidance`, `ReportList`, `ReportRubric`, `ReportExportActions`

**Request lifecycle:** state `idle → pending → success|error`; no silent failing, no dead buttons. Async actions are disabled while same action pending; server response is single source of success. Autosave debounce ~800ms after last input, handle out-of-order responses by request revision, preserve unsaved text on failure, provide retry. Show clear server-confirmed saved timestamp only once revision matches. Respect accessibility. No full-page giant modals for mundane autosaves; lab victories may use modal.

## 8. User stories and acceptance criteria

### US-01: Genuine progress
As a learner, I open Progres and see values consistent with my previous lesson/quiz/lab activity.
- GIVEN new account WHEN page loads THEN zero values/no-evidence states appear rather than demo figures.
- GIVEN a quiz passed server-side WHEN I refresh Progres THEN pass count/XP reflects that attempt.
- GIVEN I switch 7d→30d WHEN chart loads THEN aggregation changes to actual event window.
- GIVEN I open someone else's account data URL THEN the API rejects access.

### US-02: XP integrity
As a learner, I get a reward once, only for validated first-time activities.
- GIVEN same `lab_solved` event twice (even concurrent requests) THEN at most one ledger credit exists.
- GIVEN invalid flag or failed quiz THEN XP delta is zero.
- GIVEN score page reload THEN XP does not change.

### US-03: Meaningful lab feedback
As a learner, I understand success/error without searching for tiny banners.
- GIVEN correct server-validated flag THEN modal shows lab name, actual new XP, next action.
- GIVEN wrong flag THEN inline explanation appears beside input; no modal, no awarded XP.
- GIVEN sandbox offline THEN user sees unavailable state with safe retry (not fake response).

### US-04: Report workflow
As a learner, I can produce an original practice report using a clear structured form.
- GIVEN valid draft THEN save and refresh restores all fields.
- GIVEN bad/missing required fields THEN errors display below relevant inputs.
- GIVEN another user's report URL THEN view/update/export/evidence access is denied.
- GIVEN report submitted for internal review THEN status correctly changes with no automatic bounty/XP.
- GIVEN approved internal evaluation THEN rubric is stored and report is eligible for first reward.

### US-05: Accessible validation
As a learner on phone/keyboard, I can recognize and recover from failures.
- GIVEN 422 response THEN first invalid field receives focus and its error is announced.
- GIVEN network failure while editing notes THEN unsaved content remains intact.
- GIVEN repeated flash+API event THEN notification is emitted once.
- GIVEN reduced-motion setting THEN animations are reduced.
- GIVEN color blindness THEN icon+text still differentiate feedback states.

## 9. Testing matrix and mandatory commands

| Category | Test cases |
|---|---|
| PHP unit | XP awards, level thresholds, streak calendar/timezones, skill aggregation, achievement predicates, status transitions |
| Laravel feature | Auth/policies; report CRUD; idempotent rewards; validation 422; scoped exports; private upload, signed download; API response shape |
| Concurrency | Two simultaneous completion events cannot give duplicate XP or achievement |
| Integrations | quiz/lesson/lab → event → XP → dashboard/progress; report accepted → XP/achievement; note autosave errors |
| Browser E2E | Save draft, incorrect fields, correct/incorrect lab flag, modal, retry, chart filters, toast dedupe, upload, mobile nav |
| Accessibility | 200% zoom, focus order, ARIA-live, dialogs focus trap, keyboard shortcuts, contrast and reduced motion |
| Visual regression | Progres and Reports desktop 1440×900, mobile 390×844, light/dark; compare V4 visual reference |
| Regression | Existing Roadmap, Learning, Notes, Labs, Auth unchanged; no loss of data or old URLs |
| Security | user A/B isolation, score/XP tampering blocked, XSS in Markdown/export, private attachments, SSRF/no server fetch, rate limits |

Commands depend on repository. Run existing equivalents of:

```bash
php artisan test
npm run build
npm run typecheck        # if script exists
npm run lint             # if script exists
npm run test:e2e         # if configured
```

Report **actual commands, exit codes, test counts, and failing tests**. A command not configured or environment dependency missing must be marked `not run / blocked`, not `passed`. Check screenshot parity manually and list visual gaps. Tests requiring Docker lab sandbox must be genuinely exercised, otherwise mark as blocked.

## 10. Execution order optimized for Codex context

1. **Inspect/audit** repository + Sprint 3 real runtime. Create `docs/SPRINT4_PROGRESS.md` with existing assets/gaps.
2. **Model/contracts** choose one source of truth and write safe migrations; no destructive resets.
3. **Reusable feedback** build toast, errors, loading, notes save status, dialog once; gradually integrate.
4. **Event & XP** implement transactional awarding, streak, achievements, skill evaluation; add tests.
5. **Progres UI** implement charts/radar/empty states from real APIs.
6. **Reports** implement CRUD, private evidence, review rubric, export, status changes and tests.
7. **Cross-module feedback** include lab and quiz results, all form validation and async states.
8. **Regression QA** run tests and screenshot comparison, document deltas.

For a long Codex run, update `docs/SPRINT4_PROGRESS.md` with completed work, commands/results, changed paths, blockers, and the next smallest actionable item before stopping. On resume, read that checkpoint and the repository diff before doing more work. Do not claim completed steps that haven't been validated.

## 11. Definition of Done — release gate

- [ ] Progress page uses persisted validated data; realistic empty states.
- [ ] Chart date filters and accessible table representation work.
- [ ] Skill radar explains knowledge/practice evidence and limitations.
- [ ] XP ledger awards verified first-time events only, transaction-safe.
- [ ] Streak is calculated by user's timezone and qualified activity.
- [ ] Achievement unlocks persist and cannot duplicate.
- [ ] Reports index/editor/detail/review/export functional, status clearly INTERNAL practice.
- [ ] Private attachments and ownership policies enforced.
- [ ] Global toasts, field validation, loading states, retry, confirmation dialog are consistent.
- [ ] Lab flags and quiz feedback reflect real backend validation.
- [ ] Autosave doesn't spam and preserves edits when failing.
- [ ] Seven-screen V4 brand/navigation preserved; Progres/Reports visual similarity reviewed in both themes/mobile.
- [ ] Tests executed and results documented; no known P0/P1 regression left unresolved.
- [ ] aaPanel/cloud deployment **not started**.

**Stop condition:** Complete Sprint 4 only. Hand off a validation report and Sprint 5 readiness; do not autonomously implement Sprint 5 or hosting.

## 12. Relationship to previous specifications

Read these in this order:
1. `MASTER_PRD.md` — V4 product, feature, security requirements.
2. `design/visual-reference.png` — exact chosen creative direction.
3. `design/DESIGN_SYSTEM.md`, `design/SCREEN_SPECS.md`, `design/VISUAL_ACCEPTANCE.md` — token/layout/visual acceptance.
4. **This file** (`PRD_SPRINT4_COMBINED.md`) — specific Sprint 4 Progress + Reports + UX contract, overrides older Sprint 4 descriptions if any.
5. `content/` — existing 25 lessons, 50 quizzes, 8 designed labs; don't overwrite genuine current user data.
6. `docs/` and `testing/` — baseline architecture and QA documentation.

Source materials for educational references: OWASP WSTG (https://owasp.org/www-project-web-security-testing-guide/), OWASP API Security (https://owasp.org/API-Security/), OWASP Cheat Sheet Series (https://cheatsheetseries.owasp.org/), MITRE CWE (https://cwe.mitre.org/), and PortSwigger Academy (https://portswigger.net/web-security). Cite source URLs in educational lessons and authored examples; do not silently copy proprietary text.
