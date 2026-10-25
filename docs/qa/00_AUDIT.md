# Sprint 6 — audit checkpoint

Started 25 October 2026 (Asia/Jakarta) on `codex/2026-10-25-072442-sprint6-final-qa`, based on V5 commit `feb859edb36a`. This is the existing Laravel/Inertia application. The supplied V6 packet is retained in `docs/prd-v6`; it is a specification, not evidence or authorization to deploy. Sprint 7 is out of scope.

## Baseline actually inspected

- Read the Sprint 6 master and all 121 supplied matrix cases, V4/V5 reference images, repository instructions, route registrations, schema/migrations, dependency manifests, test configuration, existing services and prior QA evidence.
- Fresh backend baseline: **96 passed, 1,950 assertions** (77.92 s).
- Fresh TypeScript/Vite build passed (17.48 s); ESLint/Prettier passed; frontend baseline **9 tests passed** in three files.
- Fresh desktop browser baseline: **9 tests passed**, approximately 3.2 minutes; this was executed again rather than inferred from V5 history.
- Before application edits, a private consistent MySQL dump and original-column hashes for **50 durable tables** were captured in ignored `.tools/v6/`. Cache/jobs/sessions/migration bookkeeping are not learner content. No learner database reset or reseed was performed.
- Docker core and all three training services were observed running. The gateway binds loopback only. Existing `/up` is Laravel process liveness; it does not currently prove database readiness.

## Existing implementation inventory

| Area | Observed implementation | Audit focus |
| --- | --- | --- |
| Authentication/accounts | Learner registration, session regeneration, four roles, epoch invalidation, reauth, private settings/avatar/export/deletion | Negative requests, malformed input, sessions, recovery and defaults |
| Roadmap | 90-day snapshots, 20/70/30-minute baseline, versioned future templates, verified assessment tasks | Dates, prerequisites, rescheduling, idempotency and agreement with dashboard |
| Learning | 25 seeded starter lessons, 50 questions, server grading and pinned quiz presentations | Current database counts, editorial labels, factual/source review and answer confidentiality |
| Notes/reports | Private ownership policies, revision conflicts, autosave, sanitized previews/exports, internal-practice evaluation | Failure/retry, private evidence and no invented external acceptance |
| Labs | Eight actual local runtimes, fixed request contracts, per-session fixtures, real evidence and first-solve rewards | Runner failure, redirects, forbidden targets, concurrent rewards and stronger containment probes |
| Studio | Typed revisions, contributor-separated review, atomic publication, role/user/audit tools | Current-revision filtering, field feedback and public/legacy behavior |
| Visuals | Existing V4 horizontal shell/art and V5 editorial/profile/settings styles | Both themes, 320/390/768/1440 widths, zoom, keyboard and reduced motion |

## Initial findings (before fixes)

| ID | Severity | Finding | Planned verification |
| --- | --- | --- | --- |
| S6-001 | P2 | `/up` alone remains healthy without checking DB readiness | A separate dependency-aware, session-independent readiness response; real failure test |
| S6-002 | P2 | Core responses lack a tested CSP; host PHP responses also rely on Nginx-only security headers | Per-response script nonce, matching Blade/Vite tags, browser violation checks and security headers |
| S6-003 | P2 | JSON request helper has no deadline; hung responses leave a form saving indefinitely | Bounded request/body timeout, retained draft and explicit retry tests |
| S6-004 | P2 | Studio path/search/difficulty filters can match old revision data; path filter ignores linked quiz/lab/module kinds | Fixture with revised titles/relationships, current-revision filter regression |
| S6-005 | P2 | Existing isolation probe covers DB and one external address but not core HTTP/admin, host gateway or metadata destinations | Expanded local containment probes with a positive control; no third-party vulnerability scanning |
| S6-006 | P2 | Automated coverage has not demonstrated all routes at 320px or actual 200% browser zoom | Focused responsive/keyboard/zoom walkthrough and screenshots |

No ASVS/WCAG compliance or independent pentest certification is claimed. Source reachability is distinct from technical review and human editorial approval. Conditional email reset/verification, TOTP and reminder integrations remain unavailable and must be represented honestly.

At checkpoint A the release disposition was **UNDECIDED**. Completed corrections, retests, restore evidence and the final disposition are now recorded in [RELEASE_READINESS.md](RELEASE_READINESS.md).
