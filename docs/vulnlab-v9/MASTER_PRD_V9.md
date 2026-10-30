# VulnLab v9 — Visual Recovery + Deep Learning + 20 Playable Labs

**Status:** Implementation specification; does not mean code changed. **Date:** 2026-10-30. **Target repo:** Existing Laravel 12 + Inertia React 19/TypeScript + MySQL + isolated Docker lab runner. **Hosting:** out of scope; do not deploy to aaPanel, modify DNS, or publish vulnerable labs. **Scope priority:** (P0) preserve user data and secure core, (P1) repair UI regression, (P2) fully integrate 35 lessons/80 questions, (P3) incrementally deliver 12 additional lab runtimes with evidence.

## Product decision and non-negotiable rules

1. **Approved visuals are pre-V8 screenshots**, particularly `design/APPROVED_PRE_V8_ROADMAP.png` and the original V4 multi-screen reference. **V8 screenshots are explicitly rejected**. Preserve prior detailed mountain scene, interactive luminous pathway, and premium composition. Current V8 is not the reference.
2. Keep learner navigation horizontal (not a left admin sidebar); profile/studio may use task-appropriate navigations. Use restrained `#74AAFF` and navy/chrome, no over-glowing neon or flat polygon placeholder mountains. Visual weight should guide learning, not decorate every element.
3. Existing data is authoritative. Do NOT reset migrations, drop/reseed accounts, reassign lesson IDs or wipe quizzes/XP/lab solves. Back up and restore-test only on disposable fixtures before any additive content changes. No `migrate:fresh` on real data.
4. Do not misrepresent catalog counts: **10 learning paths/modules may be correct**. Targets are **35 published lessons**, **80 available quiz questions**, and **20 playable/verified local labs**. The current 8 labs and 25 lessons must remain stable. If editorial review has not occurred, show truthful smaller published counts.
5. New lab manifests are **not runnable labs**. A lab is playable only after a real isolated runtime, proof/flag, vulnerable + secure verification, reset, and containment tests. Never enable fake lab requests or client-only flag checks.
6. Every lesson must be readable for Indonesian beginners yet technically precise: concept → analogy → mechanism → synthetic HTTP → expected/actual → remediation → quiz explanation → related lab → report exercise → references. Source URL availability is not expert verification.
7. Changes must be stage-gated, screenshot-tested in a **real browser** and feature-tested. Do NOT mark work complete merely because mockups/screenshots or database records exist.

## Current observed product vs release target

| Topic | Known context / observation | Desired after v9 | Validation |
|---|---|---|---|
| UI | V8 screenshots show flat mountains, weak content hierarchy, large empty cards | Restore pre-V8 premium illustrated road map and purposeful page composition | Compare 1440x900 screenshot to approved reference and visual checklist |
| Learning paths | User sees 10 modules | Keep 10 paths unless curriculum mapping needs justified adjustment | Count from DB and explain paths vs lessons |
| Lessons | Original 25, 10 new drafts supplied in v7.1 | 35 **approved and published** lesson records (or truthful draft status) | Learner query; editorial publication records; quiz linkage |
| Quiz | 50 baseline, 30 new draft questions | 80 available question items with server-only answers and explanations | DB counts and assessment tests |
| Labs | User reports 8 displayed | 8 preserved + 12 **actually playable locally** = 20, after incremental gate | Per-runtime E2E including reset/secure proof/isolation |
| XP/progress | Real user data exists | Preserve all, never award on import; progress real and consistent | Before/after data diff; per-user tests |
| Hosting | User wants later | No changes to aaPanel/home server | Explicit operations log: untouched |

## Existing system inventory (must run before code edits)

Find actual routes, controller/service names, content database, editorial review flow, docker runner, UI asset manifests, relevant commits and named Git tag(s). Produce `docs/v9/implementation/AUDIT_BEFORE.md` listing path, test command, current DB counts by status and user-visible counts. Check why V8 content rendered: source branch, last approved artwork, Vite build/stale asset/proxy, auth status and real account.

Create an isolated working branch and a safety snapshot. Do not use destructive Git commands. Record learner-related table row counts/checksums before and after; exclude personal data/secrets from exported reports. Use privacy-preserving metadata only.

## Delivery workflow: six verified slices (can be one Codex task with checkpoints)

| Slice | Scope | Hard gate |
|---|---|---|
| V9-A | Repo audit, current UI screenshots, baseline data and QA | Baseline state, screenshots, lossless backup strategy recorded |
| V9-B | Design tokens + approved Dashboard & Roadmap restoration | Real screenshots desktop + mobile; interaction and backend persistence intact |
| V9-C | Modules/Labs/Notes/Reports/Progress/Admin/Profile/Auth visual consistency | 11 page types visually reviewed; accessibility, themes, no fake stats |
| V9-D | Content: 10 additional lessons, 30 quizzes, deepen 25 baseline in *versioned* revisions | Editorial review statuses accurate, old attempts unchanged |
| V9-E | 12 additional labs, groups of 2–4 | Each lab individually executes vulnerabilities only within own sandbox and passes secure/proof/reset/isolation |
| V9-F | Full integration regression, trust/safety verification and readiness | No open critical regressions, fresh screenshots, tests, data preservation proof |

If the Codex context limit is reached, stop at a completed gate, persist a continuation file (`docs/v9/implementation/CONTINUE_HERE.md`) and resume only unfinished slices. Do NOT skip tests or mark future slices done.

## UI specification — all screens

**Shared shell:** horizontal desktop top navigation (Beranda/Roadmap/Modul/Lab/Progres/Catatan/Laporan), small profile/search/theme controls, active underline, max content width 1240–1360px, page-specific content hierarchy; responsive hamburger/drawer only on narrow screens. 14px lower bound for secondary body, 16px default body, high contrast, obvious focus-visible. Avoid gigantic full-width banners and nested equal-weight rectangles.

### 1. Dashboard `/dashboard`
- Personal welcome, meaningful **Continue Learning** call to action and an illustrated mountain hero occupying no more than ~35% of initial desktop viewport. Use actual user progress, not fake `0` if DB account has nonzero event history. Illustrations are layered/separate art, never a screenshot as functional UI.
- Right contextual today card with title, earliest incomplete activity, actual duration and action; meaningful empty state if user has no plan.
- Second visual tier: 3–4 **compact semantic inline** indicators (lessons finished, labs verified, XP, roadmap days), not oversized KPI tiles. Card density and text readability must be deliberately balanced.
- Below: one clear resume card, 1–2 recommended learning tasks, recent activities only if nonempty. Avoid empty giant box labelled "Aktivitas terakhir".
- When a new user: useful onboarding action, not fake progress.

### 2. Roadmap `/roadmap`
- Restore **illustrated night mountain panorama + luminous winding path + 5 interactive milestones** based on `APPROVED_PRE_V8_ROADMAP.png`; nodes carry genuine completed/active/locked states. Original visual depth must survive; do not substitute a single jagged SVG polygon.
- The journey remains a distinct illustrated viewport; compact right stage detail panel for goals, duration, real progress, four prioritized activities, and button. On mobile roadmap scrolls or simplifies to an accessible stepper with equivalent interactions.
- Beneath hero: separate daily task list and 90-day timeline with filters, actual completion persistence, timezone-safe active day, no duplicate XP for self-checks.
- Click stage opens data-driven content; locked stages have explanation/prerequisite and cannot be bypassed by UI state.

### 3. Modules `/modules`
- Course catalog with clear **10 paths ≠ 35 lessons** labeling, difficulty, prerequisites, source-review state and progress. Reader: collapsible contents rail + 680–760px article + contextual references panel. Avoid squashed code blocks or tiny type.
- Every lesson has goals, simple concept, analogy, working synthetic request/response, false-positive caveat, secure fix (Laravel where relevant), quiz with server-side grading, related safe lab, notes link and source citations. Option "Belum paham" expands a simpler explanation and prerequisite.
- Quiz wrong feedback should be visible next to question, not tiny toast at screen top; preserve attempt data and grading integrity.

### 4. Labs `/labs` and `/labs/:slug`
- Catalog with featured recommended lab, search, category/difficulty/status/availability filters, per-lab time and prerequisites, **playable vs draft/unavailable** state. Show "20 labs planned" only if catalog definitions exist; display "X playable" from verified runtime registry.
- Workspace: instruction + goals + progressive hints at left; safe HTTP request editor / response viewer at right; session status/reset/flag submission; compare Vulnerable and Secure behavior and remediation. **No arbitrary URL proxy**, no public runner endpoints, no fake 200 response.
- Correct flag -> modal with real server XP; wrong -> inline error; unavailable -> explicit 503 and retry, not success state.

### 5. Progress `/progress`
- Learning streak, activity chart, skill map, XP ledger and achievements. Reading, quiz pass, lab solved, skill demonstrated tracked distinctly; no score estimated from clicks. Clear time-range filters and empty states.

### 6. Notes `/notes`
- Focused three-pane knowledge workspace; list/search/tags, markdown edit/preview, link to lesson/lab, autosave status near editor; no infinite toast spam. Private ownership and safe Markdown.

### 7. Reports `/reports`
- Practice reports list, create/edit view, guided triager checklist, sections for summary, steps, PoC, impact/remediation and private evidence. Keep practice status distinct from external bounty.

### 8. Login/Register/Reset
- Retain editorial split-panel design from v7.1; no large empty navy rectangle, no excessive glow; make form visible above fold. Field-level validation, clear error/success, responsive, tab/label association. Existing Laravel auth remains authoritative.

### 9. Profile & Settings
- Distinct profile identity and learning evidence; settings for theme, timezone, password/security, notifications, privacy/export and session control; never expose secrets.

### 10. Admin Studio
- Editorial workbench: draft/review/publish, revision view, quiz builder, lab metadata, roadmap scheduling and user-role controls. Admin can review learner progress aggregates but not automatically read private notes or run arbitrary sandbox code.

## Content contract

Content assets in this package are **source drafts / baseline snapshots** under `content/` and `content/reference_only/`. They are reference input, **not commands to overwrite live DB**. New lesson manifest and 10 complete markdown lessons + 30 questions + 25 existing lesson enrichment matrix are from the previously provided v7.1 package, normalized here for one Codex handoff.

Import process: inspect existing 25/50 content and revisions → compare stable slug/revision checksums → create **new draft revisions** for enriched old lessons, preserving IDs/attempts → import 10 new lessons `N026..N035` and questions `Q051..Q080` idempotently → perform author/editor/technical review with citations/technical accuracy → publish only reviewed content → verify learner visibility. Preserve all prior progress, solved states and XP. Do not auto-mark reviews completed.

Each lesson must contain at least one realistic **synthetic** worked example and a compact practical exercise that a learner can do in an authorized local lab. Aim for ~8–15 minutes reading, 5-minute quiz and 15–30 minute lab; deep links and references. Avoid repeating same generic text per topic. Each quiz: question, 4 plausible choices, correct choice stored server-side, explanation for correct and wrong, learning objective tag, revision and status. Tests cover leaking answer keys in Inertia props, client mutation, repeat attempts and pinned revisions.

**Source register:** stable references OWASP API Top 10 2023, OWASP WSTG v4.2, OWASP Cheat Sheets, PortSwigger Academy, MITRE CWE, MDN Web Docs; link exact relevant page in lessons. Don't confuse "OWASP API Top 10 2023" with an unverified newer edition. URLs must be checked. Original explanatory copy, licensing/attribution policy respected. Editorial status must stay `draft_unreviewed` unless a real reviewer approves.

## Labs contract and secure isolation

Lab definitions in `content/labs/LAB_EXPANSION.json` are 12 drafts (`L009..L020`); the original eight are preserved. For each new lab, follow `docs/LAB_RUNTIME_ACCEPTANCE.md`. Run on an isolated nonprivileged local runner with private bridged networks, dummy accounts, no host mounts, no Docker socket, no outbound public internet, no access to aaPanel or production core, CPU/memory/PID/time limits; use two dedicated lab accounts for object access tests. Avoid enabling actual remote SSRF or unrestricted file upload. Explicit synthetic allowlists.

**Each lab must pass:** (a) baseline expected behavior; (b) intended vulnerable observation; (c) secure mode prevents the attack; (d) session-bound proof server validation; (e) invalid proof rejection; (f) reset returns baseline; (g) no unauthorized network access; (h) no duplicate XP; (i) learner ownership; (j) browser works. Store test evidence and runtime version in DB. Mark `playable_local` only after all checks; `published_public` always false in this phase. Do not perform active scanning on external assets.

## Data and CMS rules

- Review actual schema and add only necessary additive migrations; reuse existing source review, lesson revision, quiz version, lab registry, XP ledger, progress tables.
- Stable semantic slug and revision/version; no `truncate()` or destructive `updateOrCreate()` on published content.
- Multi-user access policies required for notes, reports, lab sessions, achievements and content drafts. Test negative authorization.
- Every error is surfaced through central accessible feedback; repeat submissions idempotent, retries safe, autosave unsaved changes preserved.
- Do not expose raw quiz keys, flags, sandbox URLs or credentials in React props/build bundles. Dummy account secrets belong in local fixture manager; rotate on reset if designed.

## Acceptance criteria — release candidate for local use only

1. Current user data preserved (row counts and historical progress/XP/quiz attempts/sessions checked).
2. Pre-V8 approved Dashboard/Roadmap design visibly restored; screenshot comparison documented with mobile and light/dark. Reject artwork substitutions that regress visual quality.
3. All 11 screen types have appropriate native layouts, no generic card repetition, keyboard support and no overflow at 320/390/768/1440.
4. 10 learning paths still valid; **learner-visible lesson counts truthfully reflect published revisions**; desired content target 35 lessons/80 questions met only after actual review/publish/import tests.
5. 20 lab definitions may be present but **only actual verified runtimes counted as playable**; target 20 playable local requires runtime evidence for L009–L020. No public deployment.
6. Automated tests actually run: PHP unit/feature on SQLite and disposable MySQL; `npm run lint`, `npm run build`, `npm run test:unit`; Playwright with mobile/screenshots, sandbox tests, security/isolation, idempotency, data comparison.
7. Report before/after counts with status and real command results, outstanding issues, and explicit readiness `LOCAL-GO`, `PARTIAL`, or `BLOCKED`.
8. aaPanel/Cloudflare/public DNS/port forwarding untouched.

## Evidence output

`docs/v9/implementation/RELEASE_AUDIT.md` should contain a table for exact paths, migrations, before/after counts, accessible lesson and playable lab counts, scores/XP preservation, screenshots per page, test commands/passes/fails/skips, source review decisions, and unfinished work. Set a future checkpoint document if context ends. Don't hide failures.
