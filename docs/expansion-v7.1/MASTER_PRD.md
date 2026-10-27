# VULNLAB — MASTER PRD v7.1: Labs Expansion, Auth Experience & Deep Learning

**Product:** VulnLab · Web & API Bug Bounty Learning Platform  
**Status:** New development specification, **not a statement that the app was changed**  
**Version/date:** 7.1 / 27 October 2026  
**Stack:** **Existing** Laravel 12 + Inertia React 19 + TypeScript + Tailwind + MySQL 8.4; isolated local Docker lab runner.  
**Authority:** Keep V4 learner identity, V5 Admin Studio/profile/setting model, V6 tested workflows and data; v7.1 supersedes only Login/Register visuals, additional lab/lesson content and their integration.  
**Hosting:** **PAUSED**. No aaPanel/DNS/Cloudflare/firewall/public lab changes in this package.  
**Brand palette:** #74AAFF accent; restrained and precise, **no neon glow** or generic admin-dashboard rework.

## A. Product intention

VulnLab must take a learner through **Understand → Observe → Practice → Explain → Fix → Report**. Existing 25 lessons, 50 quiz questions, 8 real local labs and completed learner data remain in place. Add a **12-lab expansion** and **10 advanced-but-readable lessons with 30 knowledge questions**, plus deepen the 25 existing lessons through an editorial enrichment backlog. This yields **20 defined labs, 35 lessons and 80 questions as a target catalog**, not a promise that any new sandbox is implemented or tested. Lessons that fail review stay draft/unpublished. No artificial progress or rewarded completion.

### Success criteria
1. Login/Register feel like a first-class product experience and work with **existing Laravel authentication**, accessibility and security controls preserved.
2. Every new lesson has an original Indonesian explanation, prerequisites, clear mechanics, request/response examples, lab connection, repair recipe, assessment and traceable primary references.
3. Every new lab has a working isolated local runtime (not mocked), guided explanation, safe reset, real response and server-side proof/flag verification; only mark a lab `available` after E2E tests.
4. CMS editors can draft/review/publish the new material, and version updates do not corrupt existing learner attempts or XP.
5. No sandbox access to the main app database/host metadata/public Internet; labs remain unavailable publicly until separate-host clearance.

## B. Scope, priority and delivery increments

| Slice | Deliverable | Gate |
|---|---|---|
| E0 Audit & backup | Map models/routes/seeders/runner, baseline test results, test-only DB backup | No existing data changed |
| E1 Auth redesign | `/login`, `/register`, reset/verify states, both themes; real integration | Auth E2E + accessibility + negative tests pass |
| E2 Deep learning | 10 new lessons, 30 explanatory questions; add depth to 25 current lessons | Verified sources + server grading + reviews |
| E3 Lab expansion Wave A | L009–L012 local runtime, proofs, reset, UI guides | 4 real working labs + isolation proof |
| E4 Lab expansion Wave B | L013–L016 same contracts | 8 new fully working labs total |
| E5 Lab expansion Wave C | L017–L020 same contracts | 12 new labs fully working |
| E6 Regression / editorial | Re-run existing V6 test matrix + new cases; visual compare | Final readiness report |

**Do not implement all 12 runtimes before validating the first two.** Use one Codex task/session if desired but checkpoint tests/commits and record incomplete work. Make no readiness claim without command results.

## C. Authentication redesign contract

See `design/AUTH_UI_DESIGN_SPEC.md` and `design/auth-preview.html`.

- Student app navigation stays a **horizontal navbar**. Auth page is a focused split editorial layout, **not a boxed dashboard**.
- Desktop: left ~52% story panel (restrained grid; compact blue motif; education outcome; course statistics only if real or removed), right ~48% form. Mobile: form first, collapsible/short illustration. Fixed max width and ample whitespace.
- Copy is human and plain Indonesian; no invented testimonials or user numbers.
- Dark base: `#0B111B`; elevated surface `#111D2D`; stroke `#28364A`; text `#F5F8FF`; muted `#98A8BF`; brand `#74AAFF`. Light theme: canvas `#F7F9FC`; surface `#FFFFFF`; text `#122033`; stroke `#DDE5F1`; brand `#397ED8` for accessible text contrast while decorative accent stays `#74AAFF`.
- Flat accents, restrained 12–16px corner radii, **no bright outer glows**, small microinteractions only; system/Inter/Plus Jakarta Sans fallback.
- Functional forms: email+password login, remember me, forgot password, register display name, username (if in schema), email, password+confirmation, agreement checkbox to available policy. Show/hide password and clear inline validation.
- Keep existing login guards, rate limits, CSRF, session regeneration, generic credential errors, password hashing, email verification requirements. No browser storage of credentials or tokens.
- Password strength indicator is advisory: enforce actual server policy and avoid arbitrary character-class requirements without documented policy. Support paste/password managers and UTF-8. No unsafe password reflection in analytics.
- Real states: idle/loading/success/error; never toast success before server confirmation. Screen reader alerts, keyboard navigation, no layout shifts. Preserve errors and safe fields, **never preserve passwords across unsuccessful network retries**.
- Register throttling, duplicate-email generic handling when appropriate, password-reset token expiry and token nonlogging; email links route to actual configured backend only.
- No social login button unless provider is configured and working. A faux `Sign in with Google` is forbidden.

## D. New guided labs (incremental IDs L009–L020)

New labs are **additive**, distinct from existing 8; preserve old IDs and solve histories. Detailed structured definitions are in `content/labs/LAB_EXPANSION.json`.

| ID | Lab | Level | Primary lesson | Security constraint |
|---|---|---|---|---|
| L009 | Password Reset Token Lifecycle | Easy | N026 | Dummy mailbox, no real email delivery |
| L010 | CSRF — Profile Preferences | Easy | N027 | Same-origin fixture, no external pages |
| L011 | Path Traversal — Download Receipts | Medium | N028 | Read allowlisted fixture files only |
| L012 | File Upload — Type Confusion | Medium | N029 | Non-executable quarantine directory |
| L013 | GraphQL — Object Access | Medium | N030 | Fixed schema, owned dummy tenants |
| L014 | CORS — Trust Boundaries | Medium | N031 | Synthetic origins, no live sites |
| L015 | Webhook SSRF — Local Mock Service | Hard | N032 | Network-denied mock hosts, no metadata/host access |
| L016 | OAuth Redirect & State | Hard | N033 | Fake local identity provider, no third-party credentials |
| L017 | Race Condition — Coupon Redemption | Hard | N034 | Bounded concurrency, fixture transaction only |
| L018 | API Property Authorization | Medium | N035 | Object property policy on dummy data |
| L019 | Pagination & Excessive Data Exposure | Easy | N035 | Synthetic data and capped responses |
| L020 | Tenant Boundary — Shared Workspace | Hard | N030 | Two fake organizations, isolated dataset |

Every lab has these content states: `draft`, `validated-local`, `published-for-local`. **Published** cannot be granted based on seed existence. Only admin/reviewer can authorize catalog publication; runtime implementations are versioned in the dedicated lab code and are **not uploaded as executable CMS text**.

### Lab contract
- `manifest`: slug, immutable lab_key, content_revision, runtime_revision, source URLs, objectives, prerequisites, skill weights, level, time estimate, safe target routing, no secrets.
- `setup`: create a fresh isolated fixture for the learner's own session, issue opaque session ID, assign max lifetime, worker budget.
- `exercise`: allow only the predefined endpoint fixtures, bound request sizes and timeouts, redirects never followed to arbitrary hosts. The API viewer returns real sanitized network results.
- `validator`: verify **server-side** achievement conditions, not client-submitted `solved=true`; unique, session-bound proof, constant-time comparison where appropriate.
- `reset`: reset **session data only**, keep learning history and XP ledger.
- `secure mode`: demonstrate the same request with authorization/input validation added; response must show the difference.
- `hints`: 3 graduated explanations; reveal only what is authorized in that session; hints do not award XP.
- `report`: link to user-owned practice report template once solved.
- `availability`: return clear `503 LAB_UNAVAILABLE` if runner missing/busy; never substitute a fake success payload.

### Isolation must-haves
Separate Docker/VM network, hard CPU/memory/PIDs/timeouts, read-only root when possible, minimal capabilities, no Docker socket, no privileged mode, no host secrets, no outgoing internet, no access to aaPanel/prod database/redis, no host metadata. On production host, **do not expose lab runtimes**. Particularly SSRF, file upload and traversal labs require synthetic allowlisted fixtures and explicit isolation test evidence.

## E. Editorial design and curriculum deepening

See `content/LESSON_ENRICHMENT_MATRIX.json` for **all existing 25 lessons** and the file `content/lessons/NEW_LESSONS.md` for 10 complete additional lessons. Structured 30 questions in `content/quizzes/NEW_QUESTION_BANK.json`.

Each lesson MUST have:
1. **Learning objective & prerequisites** (plain language).
2. **Analogy**, explicitly labeled imperfect where relevant.
3. **Mechanism**, step by step on synthetic HTTP.
4. **Safe lab activity** and what to observe.
5. **Developer fix**, Laravel-specific where useful; contrast vulnerable vs secure conceptually.
6. **Pitfall and false positive** (why a suspicious response is not always a vulnerability).
7. **3+ assessment items** with explanations (published from server without the key until grading).
8. **Source citations** with exact trusted URL, access/review date, content version, license note.
9. **Common learner confusion**, 'Belum paham' link and related prerequisite.
10. **Report writing micro-task** for medium/hard lessons.

**Quality gates:** A lesson cannot be `reviewed` just because AI wrote it or an HTTP source responds. URL uptime does not equal factual accuracy. Draft → Editor revision → Technical reviewer → Publish, with audit log/revision ID. Non-reviewed content must carry a visible `Draf / Belum ditinjau` status to staff and remain invisible to learners until approved.

### Content model compatibility
- Do not mutate past published lesson revisions that have associated attempts. Introduce `lesson_revision_id` or map to existing revision table; quiz attempts pin `question_revision_id`.
- Seed content by **stable slug and content version**, NOT destructive `truncate()`/`updateOrCreate()` over revised published content. Preserve answers and XP history.
- Existing 25 lessons and 50 quiz questions retain their IDs; assign new lessons `N026..N035` and new questions `Q051..Q080`, mapping actual IDs safely on import.
- Link new labs to lessons only after installed/available local runtime; optional lab gate cannot block theory completion if sandbox is unavailable.

## F. Functional learner flows

### Login/Register
Arrival → Login/Register toggle → inline validation → server authentication/registration → redirect to intended local page or onboarding → first roadmap. Expired session: clear explanatory error and re-login. Password reset: request → acknowledge without leaking account existence → valid one-time reset → invalidate previous sessions as configured. Test every flow in both themes.

### Lessons
Catalog → check prerequisites → read example → short diagnostic quiz → optional local lab → explanation and secure fix → progress recorded from authoritative events → related practice report. `Read`, `Quiz passed`, `Lab solved`, and `Skill demonstrated` always distinct.

### Labs
Catalog → check runtime availability → start fixture → target-specific HTTP viewer → hints → server-side verify → completion dialog → written explanation → remediation example → report draft. Safe empty/error states at every step.

## G. Data/API contract (map to existing actual schema before migration)

### Proposed additive tables/fields, only if equivalents do not exist
- `lesson_revisions (id, lesson_id, revision, status, markdown, citations_json, objectives_json, checksum, reviewed_by, published_at)`
- `lab_catalog_revisions (id, lab_id, version, title, objectives_json, hints_json, source_refs_json, status)`
- `lab_runtime_registry (lab_id, runtime_version, availability_state, last_verified_at, verification_evidence_uri)`
- `lab_session_events (id, session_id, actor_id, event_type, occurred_at, payload_redacted_json)`
- quiz revisions can use **existing** `question_versions` or equivalent; do not duplicate tables blindly.

### Route/API compatibility
- Reuse existing Laravel auth and Inertia routes (`GET/POST /login`, `/register`, password reset/verify); do not introduce `/api/auth` duplications unnecessarily.
- Catalog `GET /labs` + lab start/send/hint/verify/reset endpoints should be adapted to existing routes, never allow arbitrary URL proxying.
- CMS create/update/review/publish must check editor/reviewer/admin policies server-side.
- New learner progress and XP triggered by authoritative event handlers and idempotent unique keys.

### Access controls
Learners cannot open staff drafts, change lab runtime metadata, read other user's sessions, access other users' notes, reports, XP, or lab flags. Editors may draft content but cannot alter runtime executable code. Only reviewers with correct role can publish. Admin never obtains production lab/host root authority through CMS.

## H. Visual/interaction contract

- Auth UI obeys `design/AUTH_UI_DESIGN_SPEC.md`; font sizes min 14px inputs, 16px body; contrast WCAG AA for text/controls. `#74AAFF` is a **decorative/brand accent**, not automatically readable small text on white. Use darker semantic blue for text on light theme.
- Maintain V4 header, mountain roadmap, module three-column reading experience, dark lab workspace and knowledge editor, V5 Studio; do not global-retheme unrequested pages.
- Feedback toast: bold, succinct, accessible. Inline errors stay beside fields. Avoid success notifications on each autosave tick.
- Light/dark toggle persists using existing safe preference mechanism. Respect `prefers-reduced-motion`.

## I. QA & release acceptance

Each slice needs reproducible evidence and no P0/P1 regressions:
- PHP/SQLite + MySQL tests; frontend `lint`, `build`, `test:unit`; Playwright desktop, 320/390px mobile, keyboard, 200% zoom, both themes, timeouts/offline.
- Authentication: good/bad credentials, login throttling, CSRF, session regeneration, logout, register duplicated email, password reset and email verification (if configured), generic responses, redirect safety, password managers, localizable server 422 feedback.
- Content: stable slugs/versions, 25 existing lessons untouched, quiz answer confidentiality, 10 new lessons and 30 new questions imported, citations resolve, source text license attribution, reviewed status enforced, old attempts still valid.
- Lab: 12 manifests, each runtime executed and verified independently with fixture exploit/secure/proof/reset; negative tests, lab owner isolation, no duplicate XP, network policy blocked, no host resources accessed, proper 503.
- Performance: no unexpected catalog N+1, safe maximum request sizes, no slow unauthenticated endpoints.
- A11y: labels, focus states, errors, screen readers as available; missing real screen-reader/real-device coverage must be explicitly NOT RUN.
- Restore: test migrations on disposable snapshot; check pre/post learner table counts and hashes; never operate on production data.

### Hard release gates
**Auth UI** can ship only after real Laravel flows pass. **Any new lab** can be marked enabled locally only with real isolated runtime verification. **Public lab hosting stays NO-GO** absent separate host evaluation and human approval. **No aaPanel deployment in this expansion.**

## J. Engineering output required from Codex

Deliver:
1. Repo audit, migration compatibility matrix, backup confirmation.
2. Login/Register screenshots at 1440 and 390 widths, both themes; functional E2E results.
3. Published vs draft lesson counts, 25 existing content revisions preserved, new lesson sources/reviewer statuses.
4. Lab manifest count vs actually working/verified lab count **distinct**, with serial/full test evidence.
5. Commands, timing and actual PASS/FAIL/SKIP/NOT RUN; defects and fixes.
6. Explicit next steps for staging/aaPanel planning **without performing hosting**.

