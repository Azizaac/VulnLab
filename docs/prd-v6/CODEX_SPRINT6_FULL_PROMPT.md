# VulnLab — Sprint 6 FULL Codex Prompt

You are a lead Laravel/Inertia React QA engineer, application security engineer, accessibility reviewer and release manager.

## Context
- Continue **existing** VulnLab, not a new repository.
- Read `docs/prd-v6/MASTER_PRD_SPRINT6_FINAL_QA.md` first; it is the implementation contract.
- Use `docs/prd-v6/testing/QA_TEST_MATRIX.csv` as the case inventory; refer to images in `docs/prd-v6/references/`.
- Existing V4 governs seven learner pages; V4.1 governs Progress/Reports/global feedback; V5 governs Admin CMS/Profile/Settings.
- Preserve Laravel, Inertia React TS, MySQL, Docker development, all data and existing business logic unless fixing a reproduced bug.
- Do not install an alternative UI stack or rewrite all pages simply to claim visual similarity.
- **Hosting aaPanel is Sprint 7 and must not begin in this run.**

## Phase 0 — Baseline
1. Audit actual routes, controllers, policies, migrations, seeders, queues, frontend packages, tests and environment.
2. Record feature implementation truth for J1–J6, current dependencies, baseline failing tests, data risks and suspected P0/P1 issues.
3. Prepare a safe development backup/recovery plan and run on an isolated database for destructive checks.
4. Write `docs/qa/00_AUDIT.md`, defect register and exact baseline commands.

## Phase 1 — Functional and integration
- Verify registration/login, 90-day roadmap, checklist persistence, published lesson/quiz grading, private notes/autosave, isolated labs/flags/reset, XP/streak/progress, report CRUD/exports, admin editorial workflows, profile/settings/security.
- Test first-run, empty, loading, error, offline, 401/403/404/419/422/429/500 and double-submit states.
- Ensure real DB events are the source of truth. Retain identity and progress when content is revised or schedule changed.
- Verify GlobalToast, inline field errors, quiz results, lab completion modal, nonintrusive autosave, a11y focus and accurate server-confirmed messages.
- Record results in `docs/qa/01_FUNCTIONAL.md` and actual executable test additions.

## Phase 2 — Security and containment
- Use OWASP ASVS 5.0 and stable WSTG as reference checklists, not as a certification claim.
- Test server policy and negative cross-user/cross-role access on notes, quiz answers, reports, attachments, CMS, user management, privilege escalation.
- Test Markdown XSS sanitization, file upload controls, error details, mass assignment, secrets leakage and server-only XP/flag logic.
- Test lab gateway target allowlist incl redirects/SSRF, lab-to-core network denial, dummy-only data, no Docker socket/privileged mounts, flags only on server, CPU/memory limits and cleanup.
- If containment cannot be proven, block active lab release and return truthful disabled state, no fake request responses.
- Write `docs/qa/02_SECURITY.md`, with exact tests, risks and evidence, keeping secrets redacted.

## Phase 3 — Content and UI
- Audit current actual lesson and quiz count, correctness, safe examples, sources and editorial status; do not automatically say 25/50 verified from PRD alone.
- Align V4 illustrated student experience and V5 Admin/Profile at desktop/tablet/mobile. Test BOTH themes, headings, contrast, keyboard, inputs, dialogs, code scrolling and charts.
- Capture real Playwright screenshots, compare against V4/V5 reference composition; fix high-impact differences using components/assets, not image screenshots as UI.
- Test responsive 1440×900, 768×1024, 390×844, 320px and 200% zoom when possible.
- Document `docs/qa/03_VISUAL_A11Y.md` and `docs/qa/04_CONTENT_AUDIT.md`.

## Phase 4 — Release gate
- Retest fixed failures; run backend tests, TS/lint, Vite build, E2E and security cases; explain any tests not run.
- Verify development backup restore on a disposable DB, not the live data.
- Create `docs/qa/RELEASE_READINESS.md` using the included template, issue register and next-sprint prerequisites.
- State GO, CONDITIONAL CONTENT-ONLY or NO-GO truthfully. Explicitly identify outstanding issues, lack of editorial human review, performance results and unsupported features.
- Produce final summary: files changed, migrations, actual commands/results, screenshots, defects fixed, remaining blockers and whether Sprint 7 planning can begin.

## Absolute prohibitions
- No `migrate:fresh`, `db:wipe`, `docker compose down -v` on existing data.
- No public lab deployment, aaPanel login, Cloudflare change, port opening, or posting reports externally.
- No testing third-party real sites, no sample actual private credentials in docs, no counterfeit cert/security badge.
- No declaring passing results or production readiness from generated test files alone.

Start now with phase 0 and proceed through Sprint 6 only. Save compact, structured checkpoint reports to disk to preserve Codex context.
