# VULNLAB — PRODUCT REQUIREMENTS DOCUMENT v5.0
## Admin Studio, Content CMS, User Profile & Settings — Implementation Contract

**Product:** VulnLab · Cybersecurity Learning Academy · Indonesia-first  
**Document version:** 5.0 · 24 Oktober 2026  
**Delivery phase:** Sprint 5 — Admin CMS & Account Experience  
**Status:** **Ready for engineering implementation; not proof of completed software**  
**UI source of truth for learner experience:** `references/visual-reference-v4.png` + existing V4/V4.1 PRD  
**Implementation stack:** Existing Laravel + Inertia React + TypeScript + Tailwind + MySQL  
**Release policy:** No public hosting/deployment in this sprint. Existing V4 learning/lab experience must remain functional. 

## 0. Executive decision
VulnLab currently has learning modules and notes; administration and profile/settings are under-specified. Build a complete, database-driven content management and account experience **without rewriting working learning features**. The content editor is an **internal, protected admin application** served by the **same Laravel monolith**, not a public CMS that can mutate sandbox code. The learner application **keeps its horizontal header, mountain roadmap, illustrated home, interactive labs and light/dark system**. A user-avatar menu leads to a polished Profile and Settings experience. An admin-only `Studio` entry leads to a modern editorial workspace.

**Design decision:** Reuse Inertia React and the existing design system for `/studio` rather than assuming Filament is already installed. If a compatible admin package is already present, the engineer must first document the tradeoff and avoid duplicate UX/data models. **No mandatory new Laravel UI framework** for this sprint.

### Problems solved
1. Learning content cannot be sustainably maintained by editing seeders/React files.
2. Editors need quality-control workflows, source provenance, previews, version history and publishing.
3. Quiz builders need safe authoring/assessment with correct answer confidentiality.
4. Lab metadata and hints need management without touching intentionally vulnerable container code.
5. Learners need real Profile, Preferences, Security, Notifications, Privacy and Data controls.
6. Admin privileges, user-owned notes/reports/progress, and published content need clear policy boundaries.
7. Feedback should be noticeable and actionable instead of a tiny banner at the top.

### Non-goals / hard boundaries
- **No hosting to aaPanel or Cloudflare Tunnel yet.** Deployment is the **final later phase**.
- Do not rebuild V4 screens or swap the existing architecture.
- No external live HackerOne/Bugcrowd posting or real third-party targets.
- The CMS edits **catalog metadata, tutorial text, hints, citations, difficulty and relationships**, but **never arbitrary Python/PHP/container commands, live target URLs, exploit code deployed on main host, Docker sockets, secrets, or server-executed user HTML**.
- No public user administration, public leaderboard or public profiles by default.
- No claims that content is expert-reviewed until a reviewer signs off.

## 1. Personas and navigation

| Persona | Goal | Allowed scope |
|---|---|---|
| Learner (`learner`) | Follow roadmap, labs, quizzes, notes, reports, personal account | Self-owned data and published material |
| Content Editor (`editor`) | Author lessons, quizzes, sources and non-executable lab descriptions | Create/edit drafts, cannot publish or manage user privileges |
| Content Reviewer (`reviewer`) | Check accuracy, references, readability and safety | Review/approve or request revision; publish only if explicitly granted |
| Platform Admin (`admin`) | Manage content, roles, catalog and operational controls | All administrative tools with policy and audit trail; cannot bypass isolation or view secrets |

**Default new user role:** `learner`. Distinguish `admin` account permission from sandbox training accounts; do not reuse lab dummy admin accounts for the core app.

**Learner navigation:** `Beranda · Roadmap · Modul · Lab · Progres · Catatan · Laporan` plus search, theme, notifications (only if functional), and avatar menu. Avatar dropdown: `Profil Saya`, `Pengaturan`, `Keamanan`, and `Keluar`, with `Admin Studio` only if authorized.

**Studio navigation:** `/studio` overview, `Konten`, `Kuis`, `Lab`, `Roadmap`, `Pengguna`, `Review`, `Audit`, `Pengaturan Studio` (last only if implemented). Desktop uses **top bar + workspace tabs**, with a **context tree only inside the editor page**, never a generic oversized admin sidebar. Mobile uses accessible tab navigation and drawers.

## 2. Core success metrics and launch gates
- Admin can create an original lesson, attach **real source URL(s)**, send for review, publish, and observe it in learner catalog **without code changes**.
- Editor cannot self-publish or change roles; reviewer cannot view private learner notes; learner receives **403** for all admin routes/APIs.
- Admin quiz editing retains correct-answer privacy: learners only receive allowed prompts/choices, and server grades attempts.
- Admin can edit lab *metadata* and hints, never sandbox runnable implementation or raw validation secrets.
- User can edit profile and preferences, change password (with confirmation), manage sessions, and request/export personal data via authenticated flows.
- Privacy preferences are applied server-side, not only hidden client-side.
- UI supplies visible validation, loading, success/error toasts and confirmation modals, with keyboard/screen-reader support.
- All affected features have tests executed, not just written. Source metadata and content versions are auditable.

## 3. Features & acceptance criteria

### F1 — Admin Studio Overview `/studio`
**Purpose:** Give administrators a reliable at-a-glance editorial view, not invented productivity numbers.

**UI:** Branded dark-navy header + light cards; page intro `Kelola pembelajaran VulnLab`, high-priority action `+ Materi Baru`; status counters: `Draft`, `Menunggu Review`, `Terbit`, `Perlu Perbaikan`; review queue with author, last edit, due date if actual; recently updated content table; quick actions for source checks/quiz/lab; audit activity preview. For all analytics use real DB counts; empty states with `Mulai buat materi`.

**Rules:** Only roles with `studio.access`. Preview mode calls policy checks. Counters scoped to authorized content if editing is per-team. Never show private learner reports or notes in broad dashboards.

**Acceptance (F1):** Unauthorized role → 403; counts match DB; empty table usable; navigation works desktop/mobile; no fake graphs.

### F2 — Course/Module/Lesson CRUD `/studio/content`
**Entities:** Learning Path → Module → Lesson → Lesson Blocks / References / Tags / Prerequisites. Map to existing DB rather than duplicate models.

**List view:** searchable, sortable, paginated and filterable by path, difficulty, editorial state, reviewer, last update; row actions `Edit`, `Preview`, `Duplicate draft`, `Archive`, with permission-specific visibility. Bulk archive/publish only if safely supported and audited.

**Editor:** structured lesson metadata (title, slug, summary, audience, estimated minutes, difficulty, expected outcomes, prerequisites, tags, related quiz/lab). Author-friendly Markdown with code syntax preview; optional structured blocks `paragraph | analogy | HTTP example | warning | exercise | remediation | source`. Responsive right rail `Sources & Quality Checks`: canonical source URL, authoring origin, fetched/verified date if actually checked, MITRE CWE/OWASP references when relevant, license notes, review status. Never claim auto fact-check by simply parsing a URL.

**Validation:** canonical slug unique in path/locale, nonempty title/outcomes/body, at least one valid relevant reference for security technical claims, realistic estimated duration >0, prerequisites cannot form cycles, status transitions role-protected, no accidental duplicate lesson IDs.

**Content UX:** autosave drafts with a visible `Menyimpan… / Tersimpan / Gagal menyimpan` status; explicit `Kirim Review` and later `Publikasikan` separate from autosave; preview on a test-only learner rendering route; no unreviewed content published by accident. Resolve collisions with `version` / `updated_at` optimistic concurrency and an edit conflict dialog.

**Acceptance (F2):** Author can create/edit/draft; reviewer approves; publisher publishes; learner sees published revision only; prior completion remains attached to stable lesson ID; draft not visible to learners; no rendered unsafe HTML/JS; audit records created.

### F3 — Editorial workflow and version history
Canonical workflow: `draft → in_review → changes_requested → approved → published → archived` with `approved → changes_requested` only by authorized reviewer. A published lesson may have a **new unpublished revision** being edited while the old published revision remains readable. On publish, atomically advance `published_revision_id` (or equivalent). Never alter history in place. Each revision stores authorship and referenced sources; reviewer notes linked to revision.

**Actions:** Save draft, preview, submit for review, approve, request changes, publish (if `content.publish`), archive, revert by copying old revision into a **new draft**. Support scheduled publication later only if scheduler configured/tested. Reviews are explicit; no AI self-certification.

**Acceptance (F3):** Learner never sees drafts; version rollback does not erase lesson completions; unauthorized transition → 403; simultaneous saves do not silently overwrite.

### F4 — Quiz Builder `/studio/quizzes`
Questions tied to course/lesson by stable IDs; single-choice first (MVP), multiple-choice optional gated. Fields: stem, answers (2–6), correct answer(s) server-only, explanation for right/wrong, difficulty, source references, passing score, randomization policy, version, review state. Live preview can show instructor-only answer key, but learner payload must never contain it before grading; no hidden flag in HTML hydration.

**Workflow:** create question bank → attach to lesson → preview attempt → review/publish linked revision. Reject quiz without at least one correct answer; choices must be distinct and nonempty; if multiple-answer mode not supported, do not expose it.

**Learner impact:** attempts retain submitted question/revision reference; changing a published question must not retroactively rewrite past scores; server-side grading; new version affects future attempts per documented rules.

**Acceptance (F4):** Editor can draft, reviewer approves, learner sees no answer keys; quizzes grade server-side; old attempts remain valid; no privilege escalation via API.

### F5 — Lab Catalog & Metadata Management `/studio/labs`
Admin can manage title, category, objective, difficulty, duration, lesson links, three hints, instructions, trusted references, local-only safety scope text, and visibility status. **No fields for shell commands or arbitrary executable payload**, no editable Docker Compose, no secrets, no arbitrary URL proxying, no auto-launch of live public targets. Technical vulnerabilities remain stored as reviewed code in isolated VulnShop project and deployed separately only after security review.

**Safety gate:** lab with missing verified runner ID/allowed environment must appear `Belum tersedia` to learner, not return fake HTTP success; for local exercises it can remain hidden until runner is confirmed. Hints may not leak validation flags. Changing metadata cannot grant XP or solve attempts.

**Acceptance (F5):** Lab metadata edits persist, user-facing catalog updates only on publish, validation secret never returned in admin list API, container stays isolated, old solves remain.

### F6 — Roadmap Builder `/studio/roadmaps`
CRUD learning paths/roadmap templates, stages, task types (`theory`, `practice`, `reflection`, `quiz`, `lab`, `report`), suggested durations, prerequisites, unlock rule, source module/lesson/lab links, ordering via keyboard-accessible reorder or up/down controls, draft/preview/publish. Existing 90-day plans remain **user instances** of a **versioned roadmap template**.

**Safe migration rule:** On template publish, **do not reset or rewrite existing 90-day user plan completion**. New enrollments use new template revision; existing users see a controlled optional `Lihat pembaruan roadmap` notice and non-destructive upgrade only if validated.

**Acceptance (F6):** Admin can update next cohort roadmap; currently enrolled user's task history remains; prerequisites cycle rejected; unlocking based on validated user milestones.

### F7 — User management `/studio/users`
Admin can search users by verified identity fields, view account status and aggregate progress, disable/reactivate accounts according to policy, initiate account review, and assign roles with explicitly separate `users.manage_roles` permission plus current password/2FA reauth. Never directly edit learner quiz scores, lab flags, XP, notes, or private report bodies. The administrative detail page shows aggregate course progress, user role, join date, last activity if available, verification status, and account state. Individual private notes, sessions, evidence and reports are protected unless distinct audited support access is implemented (out of v5 scope).

**No public registration to editor/admin.** First admin provisioned using protected operator CLI / deployment command, not a web request; initial role assignment is audited. No hidden hardcoded master account.

**Acceptance (F7):** Editor cannot see user management; role escalation tested server-side; user disable revokes future authentication according to session policy; audit logs redact secrets.

### F8 — User Profile `/profile`
**Profile header:** avatar, display name, optional unique username, join date, current level and earned XP (real), `Edit Profil` CTA; skill emphasis, recent verified milestones, earned badges (if implemented). Includes list of recently completed modules/labs and `Lanjutkan Belajar`. A profile is **private by default**; no `/u/{username}` public profile until explicit privacy feature is built and consented to.

**Editable fields:** display name required (2–60 chars), username optional (`a-z0-9_`, 3–24, unique, reserved name blocklist), bio optional max 280, avatar png/jpeg/webp with strict MIME/size checks, crop preview client-side where available. Email change requires a verified confirmation workflow; do not quietly accept new email as verified. Phone, birthdate, street address, real name not required.

**Acceptance (F8):** User edits persist after refresh; upload rejects malicious content; other user profile edit → 403; accomplishments are computed; all content readable mobile.

### F9 — Settings `/settings/*`
**Information architecture (mobile-friendly tabs):**
1. **Umum** `/settings/general`: name, username, bio, locale (`id` default, `en` optional if complete), timezone (`Asia/Jakarta` default), date/time display; save per-section.
2. **Tampilan** `/settings/appearance`: theme `system | light | dark`, text density and reduced motion; theme persists on account, applied immediately without hydration flash; previews respect accessibility.
3. **Notifikasi** `/settings/notifications`: email for course updates (opt-in), in-app notifications, reminder preference; switches only shown if actual delivery exists. Delivery respects per-user preferences; safety/security emails cannot be silently disabled when legally/operationally required.
4. **Keamanan** `/settings/security`: change password with current password check + strong validation, recent reauth for sensitive actions; email verification status, optional TOTP 2FA + recovery codes if auth stack supports implementation, active sessions/device list and revoke others, important login history without exposing raw IP publicly. TOTP enrollment is not marked enabled until code verified; recovery codes shown once and securely stored hashed/encrypted per supported auth mechanism. Rate-limit login/password/2FA flows.
5. **Privasi** `/settings/privacy`: default private profile, opt-in leaderboard visibility if leaderboard exists, privacy-friendly analytics preference where applicable, download data information; privacy setting enforced on backend.
6. **Data & Akun** `/settings/data`: export self-owned profile/notes/reports/progress with async status if necessary, revoke sessions, delete-account request with explicit confirmation and recent reauth, documented retention/anonymization of audit records, cancellation if jobs are queued. Use safe authenticated confirmation and non-destructive export first.

**Access:** all pages require authentication and ownership. Save feedback is field-level plus toast. Sensitive actions need confirmation dialog and reauth. Some features may be conditional on current auth/email infrastructure, but do not display dead toggles; document deferred items explicitly.

**Acceptance (F9):** Changed theme persists and renders all learner routes; timezone changes future calculations without rewriting UTC history; changes are per-user; session revocation works; validation errors obvious; account deletion cannot execute accidentally.

### F10 — Global feedback integration
Reuse Sprint 4 notification components if already implemented. Avoid creating a second provider. Standard feedback taxonomy: `success`, `error`, `warning`, `info`, `loading`, `confirm` with action title, contextual description, safe retry; inline field errors and first invalid focus; async submit lock. Inertia forms have redirect-backed error handling; existing API/XHR may use 422 JSON; normalize both without double toasts.

**Examples:** `Materi tersimpan sebagai draft`, `Menunggu pemeriksaan editor`, `Materi berhasil diterbitkan`, `Tidak dapat menyimpan perubahan—versi ini telah diperbarui orang lain`, `Password berhasil diperbarui`, `Format avatar tidak didukung`, `Perubahan belum tersimpan`. Background autosave updates subtle indicator instead of spamming toast.

### F11 — Search, editorial quality and lifecycle
Server-side full-text search for published material and authorized studio content with pagination, locale-awareness and no leakage of draft snippets. Course details include verified-source metadata: title, official publisher, URL, accessed/reviewed date if checked, relation to OWASP/MITRE, editorial revision. On unpublished/deleted sources, keep history; do not silently fake credibility. Content archive soft/hide only, preserving existing learner progress and report references.

## 4. User journeys (complete)

### J1 — Author publishes an IDOR lesson
1. Sign in as editor → `/studio/content` → `+ Materi Baru`.
2. Fill title `IDOR: Saat Identitas Objek Tidak Dicek`, path `Access Control`, outcome, difficulty, 15 minutes.
3. Write original Indonesian learning material with dummy accounts A/B and code examples.
4. Add OWASP access-control reference and MITRE CWE mapping; leave license information if reused media.
5. Autosave draft, validate sources, Preview as learner.
6. Click `Kirim Review` → revision locked from arbitrary changes until returned or new draft created.
7. Reviewer checks technical accuracy, harmful scope, clarity and citations, then approves or requests changes.
8. Publisher publishes. Learners see the new revision on next catalog fetch; existing progress not reset.

### J2 — Learner customizes account
1. From V4 navbar avatar → `Profil Saya` → profile hero with factual XP and badges.
2. `Edit Profil` opens `/settings/general`. Change display name and bio; see inline rules; Save success toast.
3. Go to `Tampilan`; switch light/dark, persist with user preference and OS fallback.
4. Go to `Keamanan`; change password after current password verification; optionally enable 2FA with confirmation.
5. Go to `Data & Akun`; request export or deletion confirmation, with separate authorization.

### J3 — Admin edits a lab safely
1. Admin opens Studio → Labs → IDOR challenge.
2. Changes Indonesian description and hint, links official source and lesson.
3. Preview with sandbox unavailable state if runner off.
4. Submit metadata draft for approval/publish.
5. Confirm no live endpoints, no secrets, no Docker executable config edited and existing solve history unchanged.

### J4 — Concurrent content edit
1. Editor A opens revision 3; editor B updates version to 4.
2. Editor A submits stale version 3 → `409 conflict` or equivalent domain response.
3. UI shows diff/refresh and option to copy unsaved text; A's modifications not silently overwritten.
4. Editor resolves and saves a new revision with audit trail.

## 5. UI detail and design handoff
See `UI_UX_DESIGN_SPEC.md` and `prototype/VulnLab_Admin_Profile_Preview.html` (a **nonfunctional local preview**, not an app replacement). This PRD mandates these screens:

| Route | Primary interface | Main action |
|---|---|---|
| `/studio` | Editorial overview + review queue + recent revisions | Create lesson |
| `/studio/content` | Search/filter table + statuses | New content |
| `/studio/content/{id}/edit` | Tree + Markdown editor + source QA rail | Save Draft / Submit Review |
| `/studio/quizzes` | Question bank + answer/explanation panel | Add question |
| `/studio/labs` | Challenge catalog + metadata editor | Edit lab metadata |
| `/studio/roadmaps` | Versioned stages, reorder list, preview | Publish roadmap revision |
| `/studio/users` | User table + roles, status with guarded actions | View user |
| `/studio/reviews` | Revision diff and editorial checklist | Approve / Request Changes |
| `/studio/audit` | Filterable log with redacted payloads | Investigate changes |
| `/profile` | Learner profile hero, awards, activity | Edit Profile |
| `/settings/general` | Profile details, locale, timezone | Save Changes |
| `/settings/appearance` | Theme & accessibility | Apply Theme |
| `/settings/notifications` | Channel preferences | Save Preferences |
| `/settings/security` | Password, 2FA (conditional), sessions | Update Security |
| `/settings/privacy` | Visibility & consent | Save Privacy |
| `/settings/data` | Export/download + delete account safeguards | Request export |

## 6. Server architecture and integration boundaries
`Laravel auth session → Policies/Gates → Controllers/FormRequests → Services → existing Models + additive schema → Inertia React screens`.

Prefer existing Sanctum/Fortify/Breeze/Jetstream authentication and reuse server-rendered errors. Do not install incompatible auth stacks in parallel. For CMS editor prefer React markdown editor and preview, **sanitize rendered HTML on server or render through a strict safe renderer**, use CSP; store raw Markdown for editing and sanitize for display. Block untrusted `<script>`, event attributes, `javascript:` links, HTML embeds and unsafe images. All storage private by default except sanitized published cover/avatars under validated public path.

**Lab isolation boundary:** core Admin Studio contains only catalog metadata; runner secrets/session flags live in secured runner layer. No direct Docker socket, no arbitrary command execution via CMS, no network to lab management path from public client except authenticated allowlisted application logic.

## 7. Roles & permissions (authorization matrix)

Legend: `✓` allowed if owner/conditions; `—` forbidden; `R` read only; `A` audited sensitive action.

| Action | learner | editor | reviewer | admin |
|---|---|---|---|---|
| View published lessons | ✓ | ✓ | ✓ | ✓ |
| Manage own profile/preferences/notes | ✓ | ✓ | ✓ | ✓ |
| Access Studio | — | ✓ | ✓ | ✓ |
| Create/edit draft lesson/quiz | — | ✓ | R | ✓ |
| Submit editorial review | — | ✓ | — | ✓ |
| Approve/reject revision | — | — | ✓ | ✓ |
| Publish approved revision | — | — | only if explicitly granted | ✓ |
| Edit lab *catalog* metadata | — | ✓ (draft) | R | ✓ |
| Change lab executable code/secrets | — | — | — | — |
| Edit roadmap template | — | ✓ (draft) | R | ✓ |
| Manage user status | — | — | — | A |
| Grant/remove roles | — | — | — | A + reauth + guardrails |
| View another user's private notes/reports | — | — | — | — by default |
| Review internal learner report | — | — | ✓ if separate permission | ✓ if explicitly assigned |
| View sanitized audit logs | — | — | R if assigned | ✓ |

**Policy:** least privilege, deny by default, explicit policy/Gate on every operation **including API**, no UI-only checks, no mass assignment of `role`, `is_admin`, `xp`, `email_verified_at`, `review_status`, `published_revision_id`. Record authz denials safely. Reviewer should not approve own content by default; requires different actor unless explicit audited override.

## 8. Content provenance, editorial controls and source quality
- Content is original Indonesian explanation derived from official sources (OWASP WSTG/Cheat Sheets/API Security, PortSwigger Academy, MITRE CWE, MDN), not an unlicensed verbatim copy.
- Editorial UI stores `source_url`, `publisher`, `title`, `last_checked_at` and `license_notes`; validate absolute HTTPS URLs but **do not fetch arbitrary supplied URLs server-side** as that can become SSRF. Admin may open references in browser or use a future isolated vetted indexing service.
- Review rubric: correctness, developer-facing remediation, beginner readability, technical example sanity, data safety, scope limitation, source relevance, dated review, copyright/asset provenance.
- `source_url` is a citation, not proof itself. Reviewer checks actual claim against official source; `last_reviewed_at` set only at sign-off.
- If official reference changes, mark affected content `review_due` after scheduled policy window; warn, do not silently alter published lesson.

## 9. Exports, destructive operations, and privacy
- Self-service data export is owner-only, rate-limited, authenticated, does not contain hashed passwords, OTP secrets, recovery codes, live tokens, session identifiers, other users' data, or sandbox validation secrets.
- If exports are generated async, use expiring signed download and private storage; remove after retention period. Don't pretend export finished on request submission.
- Account deletion: explain what's removed, what is retained for minimal audit/abuse/legal needs, revoke sessions, queue safe deletion, handle ownership references/soft deletes, no destructive immediate cascade without impact analysis. Require password/reauth and `DELETE` confirmation phrase.
- Privacy default: off for public profile/leaderboard. Account/notification preferences never exposed in public learner props.
- Avatar stored with unpredictable filename, strict file type/size, non-executable paths, and normalized safe dimensions; remove stale objects safely after successful replacement.

## 10. Delivery increments (run in current repo, single Codex handoff)

| Phase | Output | Exit gate |
|---|---|---|
| A. Audit | Inspect existing schema/auth/roles/lessons/quiz/lab UI | Publish concise compatibility map before edits |
| B. Policies & schema | Add roles, policies, versioning, audit logging safely | Auth tests + migrations pass |
| C. Admin Content | Overview, list/editor, workflow, preview | Draft→review→publish E2E passes |
| D. Quiz/Lab/Roadmap Studio | Admin metadata CRUD, relationships | Correct data rendering; no secret leak |
| E. Profile & Settings | Profile header, edit, theme, notifications, security/privacy/data | Persistence and ownership tests pass |
| F. Integration & polish | Toasts, error states, visual match V4, responsive, QA | See QA acceptance suite |

**If token/context budget is exhausted:** finish a coherent subset, run tests, write `docs/V5_IMPLEMENTATION_STATUS.md` with files changed, migrations, passing/failing tests, incomplete tasks, no fake success claims. Codex can resume from repository state without re-pasting this entire specification.

## 11. Release gate — no hosting yet
User can manually test every F1–F11 flow with two standard learners, an editor, reviewer, and admin test accounts in development; all automatic tests green or documented blockers; no destructive change to prior progress, notes/reports/labs; responsive/mobile keyboard access; no secrets exposed; editorial/personal features work, not just static design. **No aaPanel public deployment before subsequent Full QA/Security Review sprint is passed.**

## 12. Sign-off acceptance stories
- [ ] A brand-new learner has zero XP and no fabricated accomplishments.
- [ ] Admin can create/read/update draft content with structured sources and real save feedback.
- [ ] Publishing requires appropriate approval; drafts never leak to learners.
- [ ] Admin edits published lesson by creating revision, not rewriting historical snapshot.
- [ ] Learner progress persists when lesson/roadmap content gets a new revision.
- [ ] Quiz answer keys absent from learner initial API payload and hydration props.
- [ ] Lab catalog metadata editable, but flags, commands, docker/runtime config never exposed.
- [ ] `learner` and `editor` role escalation attempts rejected on server.
- [ ] Login session & 2FA changes genuinely enforced (or clearly not exposed until implemented).
- [ ] Profile name, bio, avatar, theme and timezone persist through refresh/login.
- [ ] Security settings require recent reauthentication for sensitive actions.
- [ ] Session revocation, privacy defaults, data export/deletion confirm safely.
- [ ] Validation errors contextual, errors visible, autosave handles conflicts.
- [ ] All V4 learner pages still work with consistent light/dark theme.
- [ ] Responsive admin and profile pages pass accessible keyboard navigation.
- [ ] Automated tests actually executed, results logged; hosting remains deferred.

## References (engineering & editorial)
- OWASP Authorization Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP IDOR Prevention — https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html
- OWASP Session Management Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- OWASP File Upload Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- OWASP Web Security Testing Guide — https://owasp.org/www-project-web-security-testing-guide/
- OWASP API Security — https://owasp.org/API-Security/
- MITRE CWE — https://cwe.mitre.org/
- Inertia forms & validation (match installed version) — https://inertiajs.com/forms
- Laravel docs (match installed version) — https://laravel.com/docs
