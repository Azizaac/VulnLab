# VulnLab — Master PRD Sprint 6: Final QA, Security Audit & UI Polish

**Version:** 6.0 · 25 Oktober 2026  
**Project:** VulnLab · Cybersecurity Learning Academy / VulnShop Guided Labs  
**Status:** Engineering handoff / release-candidate specification — **not proof that testing has passed**  
**Intended environment:** local development / isolated staging only  
**Explicitly out of scope:** deployment to aaPanel, public DNS, Cloudflare Tunnel, exposing training vulnerabilities, live bug bounty target testing  
**Authoritative earlier specifications:** V4 visual reference, V4.1 Progress/Reports/Validation, V5 Admin CMS/Profile/Settings; actual working repository takes precedence for existing schema and interfaces.

> **Main goal:** Turn the current application into an honest, tested, visually polished *release candidate*, without rewriting features or erasing learner content. Any missing or failing feature must be recorded, fixed when safe, or explicitly classified as a release blocker. Hosting is Sprint 7, after a separate approval decision.

## 0. Non-negotiable instructions for Codex

1. **Audit first, code second.** Read the repository, composer.json, package.json, routes, migrations, current test tooling, PRDs, and screenshots before implementation. Do not assume Sprint 3–5 work is complete from past conversations.
2. Preserve all existing accounts, lessons, quiz attempts, roadmap completion, XP history, notes, reports and revisions. Use additive, backward-compatible migrations; take a recoverable development/staging DB backup before any potentially invasive migration.
3. **Do not run `migrate:fresh`, `db:wipe`, `docker compose down -v`, or seed-overwrite user data** on a populated database. Never silently delete data to make tests pass. Use isolated ephemeral test databases.
4. Existing learner interface retains horizontal nav, illustrated home, mountain roadmap, V4 lab workspace and both themes. V5 Admin Studio keeps its distinct editorial workspace. Avoid generic admin dashboards.
5. Secure core Laravel and vulnerable lab runtime remain separate. Do not expose deliberately vulnerable services to the public internet or connect them to aaPanel production resources.
6. Fix defects; avoid uncontrolled refactors, new frameworks, unrelated new features, invented metrics, fake API responses, fake completed tests or fictional editorial review.
7. Every test result must include command, environment, outcome, and failure details. If unavailable, mark **NOT RUN**, not **PASS**.
8. If a change would break migrations, permissions, or user data, stop that change and document the blocker rather than guessing.

## 1. Definition of a release candidate

A release candidate is an app whose stated core flows work in a representative test environment, whose evidence is attached, and whose security boundaries have been verified. It is **not** the same thing as production-ready or independently pentested.

**Must-have gates:**
- All major learner and admin journeys functional; no dead calls to action or misleading feedback.
- Critical and High-impact issues closed; no P0/P1 defects open. Security P0/P1 includes cross-account leakage, admin privilege bypass, authentication failure, secrets exposure, unrestricted lab proxy/host access, container-to-core access, or untrusted upload code execution.
- Migration/upgrader and database preservation checks pass with representative copies of data; restore procedure dry-run verified in nonproduction.
- Tests pass: backend relevant tests, static checks, frontend unit/functional, browser E2E smoke, authorization/security and isolation probes. If runner unavailable, release is **BLOCKED/NOT VERIFIED**, not automatically PASS.
- Visual and mobile reviews completed for V4 seven learner screens and V5 Admin/Profile/Settings, in light and dark themes.
- Content sources and lesson/quiz consistency audited; editorial status honestly reflected.
- Release artifact documents changes, residual risks, tests, backup/rollback and deployment dependencies.

**Suggested defect severity:**
- `P0 / Blocker`: exposed core private data, admin takeover, host/container escape possibility, destructive data loss, publicly reachable vulnerable lab, core app unavailable.
- `P1 / Must fix`: broken login/reset, grading can be manipulated, lab flags forged, duplicate XP, notes leakage, CMS publishes drafts to learners, broken DB migration, major data corruption.
- `P2 / Fix or document`: notable UX problem, a feature error with safe workaround, missing mobile workflow, inaccessible main form.
- `P3 / Backlog`: cosmetic alignment, non-blocking copy/animation, minor style polish.

## 2. Acceptance journeys (must actually run)

### J1: New learner (Beranda → Roadmap)
1. Register or login with a dedicated test user.
2. Create 90-day plan in Asia/Jakarta timezone, using **2 hours/day** template (20m theory, 70m practice, 30m note/review).
3. Confirm exactly 90 distinct days and staged progression; check start/end dates and correct day boundaries.
4. Complete a daily task; refresh, sign out, sign in; completion persists and dashboard updates.
5. Recreate/change plan without duplicating records, overwriting historical progress or creating XP from self-checks.
6. Handle first-run, empty roadmap, missed day, stage locked/unlocked, no lab runtime, and malformed submissions gracefully.

### J2: Learning module + knowledge check
1. Browse real published lesson list; search/filter, prerequisites, and navigation work.
2. Lesson content includes original understandable Indonesian prose, objectives, example, prevention and actual source URL(s).
3. Unpublished material not visible to learners; editor preview available only to authorized role.
4. Submit quiz; server calculates grade, explanation and attempts; correct answer unavailable in pre-submit public page payload.
5. Keep separate `lesson_read`, `quiz_passed`, `lab_solved`, `skill_demonstrated`; user never gets simulated mastery.
6. Refresh and return from mobile; state persists.

### J3: Notes and Reports
1. Create/edit note with Markdown, tags and lesson link; autosave reflects **Menyimpan → Tersimpan** on server confirmation.
2. Simulate network failure; draft remains in editor, clear failure state and safe retry; no silent data loss.
3. Search and delete with clear confirmation; user B cannot view/edit user A's note, including guessed IDs.
4. Create report with all required fields, linked local lab, sanitized PoC, severity and practice-only status.
5. Test report validation, edit, export Markdown/HTML (PDF if implemented), and prohibited private evidence exposure; exports sanitize content.
6. A report is never labelled as accepted by an external bounty platform without a genuine integration/confirmation.

### J4: Labs (local sandbox)
1. Show lab catalog from real records; title, hints, related lesson, estimated duration and completion state are accurate.
2. Start isolated lab; accept only specifically allowlisted sandbox requests; block any arbitrary URL, localhost service, LAN IP, metadata endpoint, redirect-to-external and file scheme.
3. Display real measured HTTP response or truthful unavailable state; no hardcoded success.
4. Incorrect flag shows visible inline explanation; correct flag validated **server side** and completion/XP persists.
5. Re-submit same flag and concurrent requests: no duplicate XP/achievements.
6. Reset lab dummy data without deleting historic completion; lab containers must not access core MySQL, secrets, Docker socket or host files.
7. If lab runner architecture is not ready/unsafe, disable **launch and Send** appropriately, keep content-only guided mode, and **block public release of live labs**.

### J5: Progress, XP, streak, achievements
1. Brand-new learner has honest zero-state charts; numbers are DB-derived, not sample poster figures.
2. Real study sessions and verified quiz/lab events flow to day/week/month graphs and skill evidence.
3. XP ledger is unique/idempotent, with server-controlled event sources; refresh/retry/concurrent submissions do not duplicate points.
4. Timezone boundary logic correct for Asia/Jakarta and alternative timezone; streak does not count login alone.
5. Achievements unlock at correct threshold, once. Activity filter empty-state works.

### J6: Admin Studio CMS editorial
1. A learner gets 403 on `/studio` and all mutation endpoints (not just hidden nav).
2. Editor creates or revises a lesson, attaches source, previews, requests review, but **cannot publish**.
3. Reviewer approves or requests changes; authorized publisher publishes stable revision; old published revision remains readable until new one is published.
4. Learner sees only published revision; existing lesson completions/history retain stable IDs.
5. Quiz builder stores correct answers securely; attempts graded by server; editor cannot forge achievements.
6. Lab CMS edits metadata/hints only, never arbitrary executable scripts/container commands, validation secrets or unrestricted target addresses.
7. Profile/Settings work for own account, including username/bio/avatar validation, preference persistence, session/password controls where implemented. Admin cannot casually read private learner Notes/Reports.
8. Role changes are audited and cannot be submitted by ordinary learners or editors; test privilege escalation.

## 3. UI/UX acceptance — V4 visual match + V5 account experience

**Brand:** premium Cyber Adventure Academy, student-facing horizontal header, shield wordmark, blues/cyans with violet/teal accent, soft light surfaces, midnight navy lab/roadmap panels. **Do not rebuild from poster pixels as a static image.** Text and controls must be accessible real components.

### Desktop reference (approx. 1440px shell, viewport 1440×900 or reference aspect)
- `/dashboard`: friendly landscape hero, search, continue lesson, upcoming task and quick actions; display real progress.
- `/roadmap`: full panel night mountain, glowing path with five waypoints and accessible alternate daily task list; clickable stages and unlocked status truthful.
- `/learning/{slug}`: three-panel reader (outline, content, trusted sources) with readable article and code examples; hide nonexistent Discussion tabs.
- `/labs/{slug}`: immersive dark challenge/request/response workspace, actual request states, hints and flags; clearly distinguish disabled sandbox.
- `/progress`: streak, honest metrics, skill radar and bar chart, legend and keyboard-accessible data table for chart values.
- `/notes`: search/library + Markdown editor, subtle autosave state, tags, preview, privacy.
- `/reports`: well-spaced editor plus status/tips rail, visible field validation and export.
- `/studio`: editorial workspace, content management tabs, real draft/review counters, no generic admin sidebar; access conditional on actual permission.
- `/profile`: meaningful identity, documented badges, real stats; no fabricated profile achievements.
- `/settings`: tabs for account, preferences, security, notifications, privacy/data; don't render dead buttons or pretend unavailable features are active.

### Themes and viewport matrix
Capture screenshots for at least 1440×900 (desktop), 768×1024 (tablet), and 390×844 (mobile). Test dark **and** light for representative screens; capture all major screens in their V4 reference theme. UI should work at 320px width, 200% zoom, and with reduced motion. Mobile menu/bottom-nav should be functional, not cropped desktop nav.

### Priority visual defects
1. Hierarchy and composition of hero/roadmap/lab/learning layout.
2. Header, spacing, design tokens, font scale, contrast and focus ring.
3. Modal feedback for successful lab; clear inline validation; no tiny top-page banners.
4. Responsive overflow for code editor, tables, forms, mobile nav and charts.
5. Empty/loading/error/disabled states, especially no roadmap, no study events, no live lab, invalid quiz, unsaved note.
6. Illustration fidelity: preserve original vector/image assets but avoid heavy animations or screenshots as functional UI.

### A11y baseline
Aim for WCAG 2.2 AA in core routes: semantic headings, form label/error relationships, focus management in modal, keyboard operability, visible focus, text contrast, ARIA live regions, no color-only status, reduced motion. Automated a11y scans are **not sufficient**: execute keyboard walkthrough and document manual outcomes.

## 4. Global validation & notifications QA

**User-observable result states:** Idle → Loading → Success/Error, with server confirmation. Provide accessible toasts that don't obscure content, field-level errors by inputs, dedicated quiz result panel, lab completion modal with real XP, inline wrong-flag message, notes autosave indicator, and explicit destructive confirmation.

**Failure handling matrix:**
- 401: session expired, safe return to login; preserve draft where possible.
- 403: permission denied, do not reveal private resource metadata.
- 404: helpful not-found page; do not assume item is public.
- 419: CSRF/session expiry with recovery action.
- 422: map server errors to actual fields and focus first invalid.
- 429: rate-limit explanation; do not automatically retry unsafe POST.
- 500/503: generic actionable server error with no stack/secrets.
- offline/timeout: note/report unsaved indicator and retriable operations, no false success.
- double click: one submission and one XP transaction; avoid duplicate toasts.

## 5. Security audit plan (secure core vs intentionally vulnerable sandbox)

Use [OWASP ASVS 5.0.0](https://asvs.owasp.org/) as a **requirements checklist** and [OWASP WSTG](https://owasp.org/www-project-web-security-testing-guide/) as testing methodology. Record only requirements actually checked, evidence, result and exceptions; do **not** claim ASVS compliance or certification. Application security testing must target local/staging assets owned by the developer, not external platforms.

### Core application checks
- Auth: login, registration, password reset/email verification **if configured**, session rotation on login, logout invalidation, throttling, CSRF, secure cookie configuration (for future HTTPS).
- Authorization: policies / scoped queries on notes, reports, attempts, learner progress, evidence, profile, admin endpoints. Cross-user ID and role escalation tests.
- Inputs/outputs: server validation, sanitized Markdown/HTML/code, XSS, SQL query parameterization, safe files, restricted path traversal and upload MIME/content/size limits.
- Admin CMS: publish/review status server-enforced; role permissions, optimistic locking, source URLs treated as metadata (no SSRF fetch), audit log without tokens.
- API: rate limiting, no public correct-answer leakage, no trust of frontend XP/severity/role/flag completion, deny unexpected mass-assignment fields.
- Secrets/infra: no .env in public root/build/logs, debug false for production candidate, safe error pages, dependency advisories reviewed, storage/public access reviewed. Never print credentials in report.
- Headers and browsers: appropriate CSP planned/tested, clickjacking defenses, CORS scoped, secure cookie settings behind TLS. Fix breakage via tests, not simply weaken CSP globally.
- Data lifecycle: change-password invalidates sessions when required, account export and deletion gated with re-auth, notes/private reports excluded from unauthorized export. Assess data retention.

### Lab containment tests — mandatory before live labs
- Separate lab runtime **preferably separate VM/host**; shared Docker daemon alone is not a hard security boundary.
- Bind development lab gateways only to loopback; no public ingress; avoid LAN access except explicitly restricted test clients.
- No Docker socket, privileged mode, host mounts, production env, SSH keys, secret volumes or shared MySQL credentials.
- Deny lab -> core app/admin/aaPanel/database, metadata services, host LAN segments, host Docker service, and outbound internet unless explicitly necessary and reviewed.
- Request proxy: target allowlist enforced **after canonicalization and on every redirect**, with IP/DNS rebinding protection; endpoint/method allowlist. Reject arbitrary URL fetching.
- Container CPU/RAM/PIDs limits, nonroot if possible, safe timeout, isolated volumes, fixture reset and cleanup confirmed.
- Server-only flag verification, session-bound flags, idempotency; no actual flags or verification signing keys embedded in JS or public JSON.
- Distinguish a deliberately vulnerable example app from vulnerabilities in the core app; never weaken secure core to make lab exercises work.

**Fallback when isolation unavailable:** keep lab lesson pages and explanations but disable HTTP send/live run, show `Lab interaktif belum tersedia` with honest reason. The release can be **content-only RC** if documented, but **not** described as fully functioning interactive labs.

## 6. Content integrity & educational quality audit

Audit available seeded content **against actual repository data**, not historical PRD counts: baseline V4 package contains 25 original starter lessons, 50 quiz questions, 8 guided lab definitions and 90 roadmap day entries, but current DB may differ.

Per lesson check:
- Valid slug and course relationship; title, goals, prerequisites, coherent sequence, difficulty/duration, summary and actual body.
- Bahasa Indonesia easy-to-read; define jargon before using; analogy supports technical facts; example doesn't encourage unauthorized testing.
- HTTP/JSON examples are syntactically plausible and tied to the concept; mitigations technically correct.
- Real authoritative source URLs (OWASP, PortSwigger, MITRE CWE, MDN); broken/mismatched link flagged; record URL, check date, factual review status, license where reuse occurs.
- 2+ quiz items where expected; unambiguous correct option, explanations, passing criteria, no answer leakage.
- Related lab exists or shows truthful unavailability; lesson -> lab mapping accurate.
- No plagiarism/copying whole third-party lessons, no made-up citations, no `verified by experts` label without actual human signoff.

Produce a content QA report with counts of **confirmed valid**, **needs review**, **missing**, **unavailable sources**, **broken relation**; do not silently rewrite all 25 lessons through AI without reviewing original source accuracy.

## 7. Architecture, data, reliability and performance checks

### Database and data integrity
- Audit existing schema; ensure stable unique identifiers for lessons/challenges, migrations are additive and idempotent.
- Validate FK/indexes for ownership, content revisions, attempt counts and XP idempotency.
- Ensure published revision changes do not invalidate existing learner progress.
- Test persistent across refresh and restart with sample accounts. DB test fixtures separate from actual dev user database.
- Backup and restore test DB copy (exclude secrets from artifact); document rollback of code and migrations. Never imply irreversible migration is safe without verified restore.

### Build/operations checks
- PHP/composer dependency resolution; TypeScript, lint, Vite production asset build; Laravel route listing and config bootstrap.
- Real health endpoint such as `/up` if present; no always-200 pretending dependency health.
- Assess queue worker/scheduler obligations; if no jobs/schedules, document as not required; if required, test in staging.
- Check log errors and request traces under intentional failures, while redacting sensitive values.

### Performance targets (indicative, not blanket guarantees)
- No N+1 queries on catalog/admin listings under seeded fixtures; pagination of large tables.
- Avoid client fetching all 90 daily records for every navigation when partial loading helps.
- Homepage/lesson responsive under representative dev hardware; benchmark with recorded test hardware and conditions.
- Largest images optimized, lazy load below fold, code editor doesn't block UI, heavy charts code split if sensible.
- Lighthouse targets **aspirational** on controlled desktop/mobile test environment: Performance >= 80, Accessibility >= 90 for representative learner screens; treat unmet target as a documented improvement, not automatic unqualified 'passed'.

## 8. Test methodology and evidence

Use `testing/QA_TEST_MATRIX.csv` as machine-readable source for cases. Expand it with actual route names, commands and evidence after repository audit.

**Required suites:**
1. Backend: Laravel/PHPUnit or Pest feature/unit, migrations/seed preservation, policies, duplicate XP, quiz grading, content workflow.
2. Frontend: TypeScript checks, lint, React functional tests, loading/validation state tests.
3. Browser: Playwright (if present or add suitable config) for primary learner and editor flows; screenshots desktop/mobile theme; keyboard operation.
4. Security negative tests: cross-user and cross-role access, forged requests, upload/Markdown sanitization, restricted lab runtime/proxy.
5. Integration: roadmap/module/quiz/lab/report events propagate to dashboard/progress once only; no mock stats.
6. Regression: previously working routes still render after Sprint 6.

**Seed strategy:** create fixtures for 1 learner A, learner B, editor, reviewer, admin, and disposable lab-only dummy users. Do not share real accounts/credentials or commit environment secrets. Use ephemeral DB for destructive testing.

**Evidence format per case:** `Test ID | preconditions | step | actual | expected | PASS/FAIL/BLOCKED/NOT RUN | date | evidence path | issue ID`. Capture failures with scrubbed screenshots and sanitized logs. On auth bugs, retain only minimal non-sensitive evidence.

**Strict reporting:** A test file being created is not a test passing. A screenshot is not proof of backend correctness. A local pass is not proof of public server safety. Record tested versions/commands.

## 9. Execution phases to avoid scope/context bloat

All tasks remain **one Sprint 6**, delivered in checkpoint batches inside the repository:

| Checkpoint | Tasks | Evidence output | Gate |
|---|---|---|---|
| A — Audit | Feature/route/schema inventory, baseline tests, risk register, backup verification | `docs/qa/00_AUDIT.md` | No destructive edits |
| B — Functional | Learner + CMS/Profile journeys, integration, notifications | `docs/qa/01_FUNCTIONAL.md` | J1–J6 pass or issue logged |
| C — Security | Core ASVS/WSTG checks, sandbox containment, negative authorization | `docs/qa/02_SECURITY.md` | No P0/P1 |
| D — Visual | V4/V5 theme, mobile, accessibility and layout | `docs/qa/03_VISUAL_A11Y.md` + screenshots | Key workflows usable |
| E — Release gate | Consolidated retests, backup/restore drill, outstanding bugs | `docs/qa/RELEASE_READINESS.md` | GO / NO-GO decision |

Keep checkpoint evidence and concise summaries on disk, not solely in Codex chat context. Commit in logical changes if the repository's workflow allows and the user has not forbidden commits; do not force-push.

## 10. Decision matrix for release

**GO (for planning Sprint 7 only):** All P0/P1 closed, tests executed with passing results, secure core/lab separation demonstrated, functional learner/admin flows verified, data restore rehearsal done, content editorial limitations labelled, UI usable across tested viewports. This triggers a **deployment planning task**, not permission to expose apps publicly.

**CONDITIONAL (content-only):** Core educational site secure and usable, but active lab runtime absent or not isolated: mark live labs disabled/unavailable; clearly disclose limitation; do not claim full lab support.

**NO-GO:** Authz/data leakage; broken migrations; grading/XP forge; core app reachable from lab; exposed production-style secrets; unbounded SSRF proxy; critical core paths broken; irrecoverable backup risk; missing evidence for mandatory checks.

### Sprint 6 final deliverables
- `docs/qa/00_AUDIT.md`
- `docs/qa/01_FUNCTIONAL.md`
- `docs/qa/02_SECURITY.md`
- `docs/qa/03_VISUAL_A11Y.md`
- `docs/qa/04_CONTENT_AUDIT.md`
- `docs/qa/RELEASE_READINESS.md`
- `docs/qa/DEFECT_REGISTER.csv`
- screenshots of key screens and feedback states
- tests/scripts added or updated, passing/failing commands and actual output summary
- `docs/qa/SPRINT7_DEPLOYMENT_PREREQS.md` (requirements **only**, no live hosting changes)

## 11. Scope restrictions and handoff

- Do **not** automatically begin Sprint 7 or touch aaPanel server, DNS, Cloudflare tokens, UFW or router settings.
- If current codebase lacks V5 CMS or Sprint 3 real labs, record accurately, prioritize blockers; do not invent implementation status.
- Always preserve source references; explain material corrections in PRD/change log.
- README should tell developer how to reproduce tests, assess limitations and approve readiness decision.
- Deployment later uses aaPanel home Ubuntu, Nginx, PHP-FPM, MySQL, and optional Cloudflare Tunnel; deliberately vulnerable labs stay on separately isolated host/VM, not aaPanel's core production host.

## 12. Official references (for engineering, not a claim of certification)

- OWASP Application Security Verification Standard 5.0.0: https://asvs.owasp.org/
- OWASP Web Security Testing Guide (stable 4.2): https://owasp.org/projects/web-security-testing-guide
- OWASP API Security: https://owasp.org/API-Security/
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/
- Laravel deployment documentation (consult installed version): https://laravel.com/docs/deployment
- WCAG 2.2: https://www.w3.org/TR/WCAG22/

End of PRD — Completion is determined by executed tests and evidence, never by this document alone.
