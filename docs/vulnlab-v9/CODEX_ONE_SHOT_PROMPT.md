# CODEX — VULNLAB v9: UI RECOVERY + MATERIALS + LAB EXPANSION

You are the lead Laravel/Inertia/React engineer, cybersecurity learning content engineer, visual QA designer, and sandbox security tester. Continue the **EXISTING repository**; do not scaffold a new app.

Read `docs/vulnlab-v9/MASTER_PRD_V9.md`, all files in `docs/vulnlab-v9/docs/`, inspect reference screenshots in `docs/vulnlab-v9/design/`, and inspect the current repo/DB/tests. **Visual authority: APPROVED_PRE_V8 screenshots and ORIGINAL_V4 reference. The REJECTED_V8 screenshots are deliberately NOT a target.**

## Objective

Repair the V8 visual regression and complete the v7.1 planned educational expansion. Retain Laravel backend, existing users and progress, 10 learning paths, 25 existing lessons/50 questions, 8 existing runnable labs, Admin Studio, quiz grading, XP, notes, reports, profiles/settings. Aim for 35 review-approved lessons/80 quiz items and 20 **truly playable local labs**, not just definitions. Hosting/aaPanel is out of scope.

## Strict safe process

1. Audit Git history, actual routes, UI assets, data sources, editorial workflow and lab runner. Back up test fixtures; preserve data and create working branch. Write exact current counts: paths, drafted/published lessons, questions, 8 existing executable labs, additional draft labs, labs visible to learners, quizzes, current XP. Identify V8 CSS/art regression and any stale build.
2. Restore and polish Dashboard and Roadmap **FIRST**: previous premium illustrated mountain hero, real glowing winding path/five interactive nodes and compact contextual panels. Do NOT replace with flat triangle SVGs or screenshot backgrounds. Horizontal navigation stays. Use #74AAFF sparingly and WCAG-valid semantic text colors. Capture actual browser 1440x900, 1280x800, 390x844 and 320px dark/light screenshots and compare to approval references. If real original art is unavailable, report it explicitly; don't fake visual match.
3. Extend coherent UI across Modules, Labs catalog/workspace, Progress, Notes, Reports, Login/Register, Profile/Settings and Admin Studio. Different layouts by task, no generic giant stacked rectangles. Preserve the form/role/security flows; all widgets real data. No dummy progress. Verify route/logic/navigation on mobile and keyboard.
4. Review current content schema and import **only missing** `N026..N035` and `Q051..Q080` from `content/` in an idempotent, version-aware way. Deepen 25 old lessons using `LESSON_ENRICHMENT_MATRIX.json` in **new revisions**. Do not overwrite historical attempts/progress. Publish only genuinely reviewed lessons/quiz; display honest draft status and explain if target published count not reached. Use official OWASP, PortSwigger, MITRE and MDN references; original Indonesian easy-to-read text, practical fake HTTP, misconceptions, safe fixes and assessments. Do not claim URL checks are expert review.
5. Implement 12 additional runtimes `L009..L020` in pairs with actual local isolated fixtures, vulnerable-vs-secure observations, 3 hints, per-session proof, reset, rate/resource/time limits, no arbitrary request forwarding, no public outbound/network access to host/core/aaPanel. Reuse existing secure lab runner design and source contracts. Definition alone is not playable. Mark available only after tests for each one. Fail closed with 503 when unavailable. Preserve historical XP and old 8 labs.
6. Link published content and verified playable labs to roadmap, modules, progress, XP and reports through real server authorization. No duplicate XP or client-side grading/proof. Show lesson count distinct from module count, and lab definitions distinct from playable labs.
7. Test and fix: existing PHP SQLite/MySQL tests, lint/build/unit, E2E browser desktop/mobile/dark/light, 200% zoom, CSP/autosave/permissions, content versioning, sandbox baseline/vulnerable/secure/proof/reset/isolation for EACH lab, concurrency/XP idempotency, backup/restore on disposable schemas. Capture outputs in docs. Avoid claiming things passed if not actually run.

## Mandatory evidence and stop conditions

- Create `docs/v9/implementation/AUDIT_BEFORE.md`, `RELEASE_AUDIT.md`, per-lab test table and screenshot contact sheet, and `CONTINUE_HERE.md` if unfinished.
- Report counts **before and after**, broken down by module/lesson/question/lab manifest/local playable/public visibility, drafts vs published.
- Report files changed, migrations, test commands + pass/fail/skip, actual screenshots, restored illustration source and outstanding issues.
- Confirm historical learner data not changed unexpectedly.
- If user review is needed for new visual art/editorial review, keep the item pending, NOT complete.
- Never run `migrate:fresh`, `git reset --hard`, expose sandbox to internet or change aaPanel/Cloudflare/DNS.
- Do not report 20 playable labs merely because lab metadata was seeded.

## Execution order

A audit → B restore two core screens and screenshot gate → C other UI → D content → E 12 labs in verified pairs → F complete regression. Commit/checkpoint after each validated slice. If context/time ends, finish current gate, persist resume instructions and do not make false completion claims. **Start with the repo audit now.**
