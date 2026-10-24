# Backend/Data Architecture from v3 — preserved in v4

## 6. Technology architecture
### Core app
`nginx (loopback:8088) -> Laravel PHP-FPM -> MySQL (private network)`; Laravel serves Inertia SSR optional and React TS assets built by Vite. MySQL not published to host unless a dedicated loopback dev port is absolutely necessary. All normal users and their progress live in core DB.

### Lab runtime, never combined with core
Separate **VulnShop** lab project and database, with unique seeded dummy records, separate Docker networks, no production credentials, no host filesystem mounts containing secrets, no docker.sock, no host networking, and **no outbound internet** as a default goal. Use Docker `internal:true` lab network for internal traffic and a deliberate loopback-bound entry gateway for permitted lab ports; verify egress and loopback behavior empirically. A narrow core-to-lab service route for session orchestration, if needed, must be isolated and authenticated. **No arbitrary URL fetch proxy.** The browser-lab client only targets allowlisted lab origin via backend gateway. Lab flags/state issued and checked server side; reset recreates fixtures. CSP/sandbox especially on XSS lesson. Protect core against SSRF from lab metadata.

### Start modes
`content-only` is default and safe: all learning, quiz, roadmap, notes and reports functional; lab instructions visible but executable labs unavailable. `labs-enabled` only after isolation test suite passes; build each lab in separate sprints. No remote production hosting of intentionally vulnerable systems.

## 7. DB schema (recommended migrations)
- `users`: id, name, email unique, password hash, timezone, theme, daily_target_minutes, created_at.
- `tracks`: id, slug unique, title, description, sort_order.
- `lessons`: id, track_id, slug unique, title, body_md longtext, level, duration, editorial_status, reviewed_at nullable, published_at nullable, source_version nullable, version, sort_order.
- `lesson_sources`: id, lesson_id, title, url, source_type, checked_at nullable.
- `lesson_prerequisites`: lesson_id, prerequisite_lesson_id composite unique (DAG; no cycles).
- `quiz_questions`: id, lesson_id, prompt, type, difficulty, explanation, points, status.
- `quiz_options`: id, quiz_question_id, label, body, is_correct boolean **server only**.
- `quiz_attempts`: id, user_id, lesson_id, submitted_at, score, max_score, passed boolean, attempt_number.
- `quiz_answers`: id, quiz_attempt_id, quiz_question_id, selected_option_id, is_correct.
- `lesson_progress`: user_id, lesson_id composite unique, visited_at, read_completed_at nullable, quiz_passed_at nullable, status; do not infer from scroll-only interactions.
- `roadmap_templates`: id, title, version; `roadmap_days`: template_id, day_number, week, phase, title, minutes, theory_action, practice_action, reflection_action, optional lesson_id/lab_id.
- `user_roadmap_days`: user_id, roadmap_day_id unique, completed_at nullable, evidence_note nullable, updated_at.
- `labs`: id, slug, title, difficulty, lesson_id nullable, spec_json, enabled boolean default false, reviewed_at nullable.
- `lab_sessions`: id UUID, user_id, lab_id, status, started_at, expires_at, finished_at, fixture_id, opaque verification reference; lab state lives outside core.
- `lab_completions`: user_id, lab_id unique, completed_at, verification_id, hint_count.
- `notes`: id, user_id, title, body_md, related_lesson_id nullable, related_lab_id nullable, tags_json, revision, updated_at; avoid secrets in logs.
- `reports`: id, user_id, title, lab_id nullable, summary, scope, steps_md, expected, observed, impact, evidence_md, remediation_md, severity_proposed, status, score nullable, feedback_json, revision, updated_at.
- `study_sessions`: id, user_id, started_at, ended_at, recorded_minutes (server bounded), source_type, source_id.
- `achievements`: id, code, title, criteria_json; `user_achievements`: user_id, achievement_id unique, awarded_at.
- `content_revisions`: id, lesson_id, reviewer_id nullable, change_summary, version, reviewed_at nullable, published_at nullable.

All user-specific queries are scoped to `Auth::id()` via Policies, not only frontend route guards. Migrations foreign-key indexed, seeders idempotent by slug/ID (upsert), and updates preserve progress tied to immutable identity.

## 8. API semantics
Main product: prefer Inertia form endpoints authenticated via Laravel sessions, CSRF-enabled. For interactive requests use `/api/v1/...` guarded by Laravel middleware and session auth/Sanctum if appropriate. API JSON error shape `{error:{code,message,details?}}`, validation uses 422.

| Endpoint | Method | Behavior |
|---|---|---|
| `/api/v1/roadmap` | GET | user day's template+state |
| `/api/v1/roadmap/days/{id}` | PATCH | complete/uncomplete own day with optimistic update |
| `/api/v1/lessons` | GET | published or locally previewable seed lessons |
| `/api/v1/lessons/{slug}` | GET | reader + source refs + sanitized markdown |
| `/api/v1/lessons/{slug}/read` | POST | explicit read completion, rate-limit |
| `/api/v1/lessons/{slug}/quiz` | GET | options but **never** correct flags/explanations before submission |
| `/api/v1/lessons/{slug}/quiz/attempts` | POST | server scores and returns feedback/explanation after submission |
| `/api/v1/labs` | GET | lab metadata, enabled status |
| `/api/v1/labs/{slug}/sessions` | POST | create isolated user-owned lab session if enabled |
| `/api/v1/labs/sessions/{uuid}/reset` | POST | only owner, reset dummy fixture |
| `/api/v1/labs/sessions/{uuid}/verify` | POST | server verifies lab state; never JS-only scoring |
| `/api/v1/notes` | GET/POST | list/create own notes |
| `/api/v1/notes/{id}` | GET/PATCH/DELETE | owner-only, revision conflict 409 |
| `/api/v1/reports` | GET/POST | list/create own report drafts |
| `/api/v1/reports/{id}` | GET/PATCH/DELETE | owner-only, sanitize evidence |
| `/api/v1/reports/{id}/evaluate` | POST | rubric evaluation, no fake real bounty grade |
| `/api/v1/progress` | GET | evidence-based learning metrics |
| `/api/v1/settings` | GET/PATCH | theme, timezone, daily minutes |

Hard requirements: owner checks, input validation, pagination/search bounds, idempotent scoring, CSRF, rate limits, no arbitrary HTTP proxy, safe Markdown render; answer keys are server-only. For `submit quiz`, map question+option ids to current lesson; ignore client-provided points. Avoid awarding duplicate XP on repeats.



Refer to `MASTER_PRD.md` for newer UI routing and exact visual requirements. These implementation details remain valid except where v4 explicitly supersedes them.
