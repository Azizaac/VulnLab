# VulnLab Test Plan & Release Gates

These are REQUIRED tests for Codex to implement and actually run, **not tests already executed against an app**. Static seed validation is available separately as `validate_bundle.py`.

## Test commands (adjust to actual repository)
- `composer test` or `php artisan test` — PHPUnit/Pest API feature tests
- `npm run typecheck` — TypeScript strict validation
- `npm run lint` — ESLint and formatting
- `npm run build` — production Vite build
- `npx playwright test` — cross-browser e2e once configured
- `python3 testing/validate_bundle.py` — package seed validation
- `docker compose config` — Docker config validation
- `docker compose ps` + loopback/egress probes — isolation verification

## Required automated test matrix
| ID | Type | Scenario | Expected outcome |
|---|---|---|---|
| AUTH-01 | Feature | User registers and logs in | Redirect to dashboard; private session |
| AUTH-02 | Feature | Anonymous access `/notes`, `/reports`, `/progress` | Redirect/401 |
| AUTH-03 | Security | CSRF invalid on state-changing request | Rejected |
| AUTH-04 | Security | User A GET/PATCH notes of user B | 403/404, no changes |
| AUTH-05 | Security | User A GET/PATCH report of user B | 403/404, no changes |
| CONTENT-01 | Seed | Import lesson seed twice | 25 distinct lessons, no duplicate |
| CONTENT-02 | Seed | Import quiz seed twice | 50 distinct questions, four unique options each |
| CONTENT-03 | API | Fetch quiz before attempt | No answer key, `is_correct` or explanation |
| CONTENT-04 | API | Submit wrong answer then right | Server scores, feedback after submission |
| CONTENT-05 | API | Forged client correct/points field | Ignored; score stays server-generated |
| CONTENT-06 | Reader | Any lesson opens with official source links | URLs present, badges honest |
| CONTENT-07 | Security | Untrusted Markdown HTML and javascript link | Escaped/sanitized in reader, notes and reports |
| ROADMAP-01 | Seed | Import roadmap 90-day template twice | Exactly 90 days, no duplicate |
| ROADMAP-02 | Feature | User completes day and reloads | Saved and reflected on dashboard |
| ROADMAP-03 | Security | User attempts update another user's day | Rejected |
| ROADMAP-04 | Feature | Next lesson unlocked based on prerequisites | Correct route, no fake completion |
| PROG-01 | Feature | Empty new user | 0 completed without fabricated 35% |
| PROG-02 | Feature | Quiz passed but lab unavailable | Theory passed; lab remains incomplete |
| PROG-03 | Feature | Streak crosses midnight Asia/Jakarta | Correct local calendar dates |
| PROG-04 | Integrity | Replaying quiz submission | No duplicated XP/achievement |
| NOTES-01 | Feature | Autosave note | Reload retains latest content |
| NOTES-02 | Feature | Revision conflict | Returns 409 with refresh guidance |
| REPORT-01 | Feature | Draft report, export markdown | Contains real saved sections, no secrets |
| REPORT-02 | Quality | Rubric incomplete report | Useful feedback; not falsely approved |
| LAB-01 | Security | Inactive lab start | Reject with clear unavailable state |
| LAB-02 | Security | Session owner mismatch | Reject, no cross-session leakage |
| LAB-03 | Security | Attempt arbitrary external URL in request editor | Reject before network call |
| LAB-04 | Isolation | Lab network egress to public internet | Blocked, verified via probe |
| LAB-05 | Isolation | Host services/core DB from lab | Unreachable, no core secrets or docker.sock |
| LAB-06 | Behavior | IDOR lab vulnerable vs secure | Vulnerable dummy behavior vs secure 403/404 |
| LAB-07 | Behavior | Reset lab | Recreates fixtures and invalidates previous flags |
| LAB-08 | Security | Guess/forge flag in browser | Cannot mark solved without server state |
| UI-01 | E2E | Navigation across 7 screens | No coming soon/404 |
| UI-02 | E2E | Theme light/dark persisted | Correct CSS and contrast |
| UI-03 | E2E | Mobile 390px, desktop 1440px | No horizontal overflow, buttons reachable |
| UI-04 | A11y | Keyboard route, quiz, tabs, modal | Proper focus and accessible feedback |
| UI-05 | Visual | Main shell design | Horizontal navigation; no permanent left sidebar |
| SEC-01 | Feature | Logout and reuse old session | Authenticated access denied |
| SEC-02 | Feature | Rate limit quiz/spam and lab reset | Meaningful 429 |

## Manual acceptance scenarios
1. Register as learner, switch dark/light, complete HTTP lesson with 2 answers correct, refresh; record `read` and `quiz_passed` separately.
2. Answer quiz incorrectly first: feedback and retry available, mastery unchanged until pass.
3. View sources drawer, click official OWASP or PortSwigger links; no fabricated `reviewed_at`.
4. Disable lab runtime and open its catalog: instructions available with honest unavailable status; cannot solve by button-only click.
5. Launch enabled lab only after isolation suite passes, use dummy A/B, reset and verify secure behavior; no data persists outside fixture.
6. Create note with markdown and untrusted HTML string; preview must escape unsafe markup.
7. Create structured report with sanitized evidence; export Markdown; another user cannot read it.
8. Navigate entire site by keyboard at 200% zoom in both themes.

## Evidence Codex must attach to completion report
- Tests exact commands + pass/fail counts, not "all fine".
- DB imported counts and idempotency result.
- screenshots mobile/desktop light/dark, list issues.
- lab network isolation probe commands and outputs.
- residual risks/unimplemented functionality with next-sprint plan.

## Content editorial validation (manual + automated)
- No missing source URLs, titles, editorial statuses, or answer explanation.
- Questions have one correct answer and all option texts unique.
- Every lesson has introduction, safe example, guidance, remediation and references.
- No copying third-party course content or implied certification.
- Review source link redirects and conceptual quality before public publication.


## v4 additional visual QA gate
For every one of the seven screens in both themes at desktop 1440×900 and mobile 390×844, capture real screenshots and compare against the **matching numbered poster region** in `design/visual-reference.png`. Verify that Home illustration, 5-node glowing dark Roadmap, 3-column Learning, dark split Lab, light Progress charts, dark Notes editor and light Reports form all match specified composition. Record deviations in `docs/visual-qa.md`. See `design/VISUAL_ACCEPTANCE.md`.
