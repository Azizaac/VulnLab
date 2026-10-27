# CODEX — ONE-PROMPT VULNLAB EXPANSION v7.1

You are acting as the lead Laravel/Inertia React engineer, product designer, lab runtime engineer, security reviewer and QA lead for the **existing** VulnLab repository.

**Read this entire expansion pack** (first `MASTER_PRD.md`, `design/AUTH_UI_DESIGN_SPEC.md`, the content JSON/Markdown, `testing/TEST_MATRIX.csv`), then read the existing V4/V5/V6 and Sprint 7-planning docs and inspect actual code. **The working repository and durable DB records take precedence where old documents disagree.**

## Goals
1. Redesign real Login/Register pages using `design/auth-preview.html` and `#74AAFF`, with premium restrained dark/light style, no neon, no generic admin dashboard.
2. Keep existing Laravel auth endpoints, policies, role and session handling. Make all displayed form actions real and secure. Restore accurate visible validation and feedback.
3. Enrich existing 25 lessons according to `content/LESSON_ENRICHMENT_MATRIX.json` by **creating new draft revisions**, not modifying historical revisions or quiz attempts.
4. Import 10 fully drafted lessons and 30 question drafts from `content/lessons`, `content/LESSON_MANIFEST.json`, and `content/quizzes/NEW_QUESTION_BANK.json` into Admin Studio with `research_draft_unreviewed` state. Ensure source provenance and staff review requirements. Never publish unreviewed text automatically.
5. Add 12 catalog definitions (L009–L020) from `content/labs/LAB_EXPANSION.json`. Implement *real isolated local* lab runners in small waves, starting L009/L010, then L011–L014, L015–L017, L018–L020. Never label a sandbox operational until fixture exploit/secure/proof/reset and isolation tests actually pass.
6. Connect these to existing Learning Modules, Roadmap, Notes, Progress, XP, Reports, and CMS. Avoid any duplicated learner XP, mismatched prerequisites, or destroyed progress.

## Non-negotiable constraints
- **NO HOSTING**. Do not SSH to home aaPanel, deploy, change DNS, configure tunnel, open ports, or expose vulnerable labs publicly. Hosting remains deferred until explicit approval.
- **NO REBUILD**. Preserve Laravel 12/React 19, routes, database and all existing V4/V5 UI. Refactor only related surfaces.
- **BACKUP FIRST**. Before schema changes, verify a reversible non-production database snapshot. New migrations additive/compatible. Do not execute `migrate:fresh`, `db:wipe`, `docker compose down -v`, or destructive seeders on actual learner DB.
- Existing core and vulnerable lab must be isolated; never use arbitrary URL proxy/host fetch, Docker socket in core, privileged containers, host mounts, or production secrets in lab. Limit egress, CPU, RAM, PIDs, request size, redirects, time, and concurrent sessions.
- Reviewer credentials, admin and learner notes remain protected by Laravel policies. No public raw HTML Markdown. Existing published revisions and graded attempts immutable.
- **Do not claim independent expert review.** These materials are author drafts based on official references. Imported questions contain answer keys that must never be serialized in learner pre-submit Inertia props/API payloads.
- Do not claim tests passed unless you have actually executed them. Avoid fake frontend success or hardcoded metrics.

## Execution checkpoints — do in order

### Checkpoint 0 / Repo audit
- Inspect auth routes and actual model fields, content and lab services/runner, XP ledger, CMS approval system and test tooling.
- Record `docs/qa/EXPANSION_BASELINE.md`: commands, current counts and blockers.
- Determine whether an existing staging/test database already has 25/50/8; preserve stable records and maps.

### Checkpoint 1 / Login + Register
- Implement the visual reference as React/TypeScript components with existing design tokens; preserve both themes and horizontal learner nav.
- Integrate actual `/login`, `/register`, password reset, email verification if configured. Keep anti-CSRF, rate limits, session regeneration, secure cookies/proxy config; never weaken existing auth for aesthetics.
- Add field errors, loading, password visibility, register password quality/help, remember, keyboard focus, screen-reader alerts, tiny-screen breakpoints.
- Run auth tests including 422/429, session expiry, real backend login and registration, mobile/zoom/theme; capture screenshots.

### Checkpoint 2 / Curriculum deepening
- Create versioned draft revisions for all 25 legacy lessons from enrichment matrix, documenting content accuracy and not changing existing progress.
- Import N026–N035 detailed original markdown + Q051–Q080; map IDs to real schema without collisions, pin question revisions and hide answers until grading.
- For each lesson: objectives, prerequisites, analogy, real technical explanation, HTTP fixture example, practice, Laravel fix, false-positive caution, references, 3 explanation questions, follow-up links.
- Run import/idempotency, source URL and course reader tests. Status stays DRAFT until authorized reviewer approves.

### Checkpoint 3 / Add 12 labs in safe waves
- Import lab manifests as unavailable/draft first, without connecting executable code from CMS.
- Implement L009 + L010 with mock isolated fixtures; real request/responses, bound HTTP viewer, hint, flag proof, reset, secure comparison, XP once, server-side ownership.
- Prove container/network isolation and run regression. Then implement waves L011–L014, L015–L017, L018–L020, with isolation tests per lab. Difficult SSRF/upload/traversal/race use synthetic local fixtures only and strict budgets.
- For a lab runner not yet built, catalog UI says **Sedang disiapkan**, returns explicit 503, does not issue XP or claimed completion.

### Checkpoint 4 / UX integration
- Module links to published/approved lesson and available lab, lab completion updates progress only via existing authoritative events; shared notes/report launch points; clear loading/toast/error and no dead CTAs.
- Admin Studio can review and publish content, with revision history, reviewer identity and source links; editors cannot publish or create executable runtimes via CMS.

### Checkpoint 5 / QA, performance and report
- Run PHP SQLite/MySQL suites, TypeScript lint/build, Vitest, Playwright at 1440 and 390px dark/light, keyboard, 200% zoom, accessibility smoke, password manager behavior where testable.
- Execute isolated lab baseline/insecure/secure/flag/reset/isolation scenarios for each new lab and existing 8. Concurrency: verify duplicate requests award XP once and race lab bounds remain <= configured threshold.
- Check migration/restore on disposable database, CMS review gates, source provenance, N+1, direct-object ownership.
- Make `docs/qa/EXPANSION_RELEASE_REPORT.md` with actual PASS/FAIL/SKIP/NOT RUN, counts `defined vs implemented vs tested vs published` and risk register.
- **Do not deploy, do not start hosting.**

## Definition of done
- Auth pages visually match new preview direction in both modes and all real flows pass E2E.
- 25 legacy lessons survive unchanged as immutable historical revisions; 10 new lesson drafts/30 questions imported idempotently; no fabricated citations.
- 12 **defined** new labs; only those actually deployed and tested local are `available` and award XP. Full 12-lab expansion is complete **only** if all 12 have real isolated verified runtimes.
- Existing 8 labs and progress are intact, no critical security regressions.
- Evidence includes commands/screenshots, open defects and recommended next priority.

Start by auditing the existing repository. Implement this work incrementally in the **same repo**, not in a new project. If completion is blocked by time or tooling, checkpoint completed work and precise next steps rather than claiming success.
