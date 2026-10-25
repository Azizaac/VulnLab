# VULNLAB V5 — TEST PLAN & ACCEPTANCE MATRIX

**Rule:** Codex must execute tests, capture pass/fail/skip with command output, and report remaining risks. No hosting to aaPanel until later after independent full release QA. Avoid accidentally testing or scanning non-lab public targets.

## Gate 0 — Baseline regression check before edits
- Record branch/commit status, dependency versions, environment, migration snapshot, existing failing tests and known blocked features.
- Create a new working branch where possible. Make a database backup/snapshot before structural migrations.
- Re-run current Laravel/Pest/PHPUnit test suite, TypeScript check, build, existing E2E/smoke tests. Keep output in `docs/V5_IMPLEMENTATION_STATUS.md`.
- No destructive migrations, hardcoded admin password, stale feature replacement, clearing user activity.

## Acceptance matrix

| ID | Scenario | Expected | Test level |
|---|---|---|---|
| AUTH-01 | learner visits `/studio` | 403 / authorized not found, no studio data | Feature/E2E |
| AUTH-02 | learner POSTs content publish URL | 403, no DB mutation | Feature |
| AUTH-03 | editor attempts approve own revision | denied by default | Feature |
| AUTH-04 | editor posts `role=admin` or `xp=99999` via update | ignored/rejected, data unchanged | Security |
| AUTH-05 | admin changes user role after recent reauth | success, audit written | Feature/E2E |
| AUTH-06 | admin role change without reauth | denied | Feature |
| AUTH-07 | last admin attempts self-demotion | protected | Feature |
| AUTH-08 | reviewer tries private notes/reports of user | denied; no data leak | Security |
| CMS-01 | new lesson draft saved | revision persisted | Integration |
| CMS-02 | content source missing | publish blocked with field-level feedback | Integration |
| CMS-03 | non-HTTPS/malformed source URL | validation error without server fetch | Security |
| CMS-04 | editor previews draft | authorized preview only | Feature |
| CMS-05 | reviewer requests changes | revision state moves, comments stored | Feature |
| CMS-06 | reviewer approves revision | approved but not auto-published unless authorized | Feature |
| CMS-07 | publisher publishes approved revision | latest public reader shows exact revision | E2E |
| CMS-08 | learner fetches unpublished revision | no draft content leaked | Security |
| CMS-09 | editor opens stale version and saves | explicit 409 or equivalent conflict, draft retained | Concurrent |
| CMS-10 | published material updated | old published view remains until new approved revision | Integration |
| CMS-11 | lesson revision published | prior lesson progress/quiz attempts intact | Regression |
| CMS-12 | archive lesson | hidden as policy but history preserved | Regression |
| CMS-13 | malicious Markdown script/event URL | sanitized reader and studio preview | Security |
| CMS-14 | 2 prerequisites create cycle | rejected with understandable UI error | Unit/Feature |
| QUIZ-01 | malformed quiz with 0 correct answers | validation rejected | Feature |
| QUIZ-02 | user loads quiz attempt | payload has no answer key/private feedback | Security |
| QUIZ-03 | learner submits manipulated score | server disregards, grades canonical version | Security |
| QUIZ-04 | published quiz version changes | old attempts/rewards remain valid | Regression |
| LAB-01 | editor modifies instructions/hints only | sandbox runtime config unchanged | Security |
| LAB-02 | metadata submission tries arbitrary URL/command | denied; no proxy or shell execution | Security |
| LAB-03 | sandbox unavailable | UI says unavailable, no fake HTTP response | E2E |
| LAB-04 | edit lab metadata | prior solves and XP unchanged | Regression |
| ROAD-01 | roadmap template revision published | new users get new revision | Feature |
| ROAD-02 | template revision published | current enrolled learner tasks untouched | Regression |
| ROAD-03 | stage reordered | keys/order stable and persisted | E2E |
| PROF-01 | user edits display name, username, bio | saved, reloaded, field errors localized | Feature/E2E |
| PROF-02 | username duplicate / reserved / invalid | clear inline errors | Feature |
| PROF-03 | User B edits User A profile | 403/no mutation | Security |
| PROF-04 | upload JPG/PNG/WebP valid | safe asset saved | Feature |
| PROF-05 | upload SVG/HTML/polyglot/too large | rejected, previous avatar remains | Security |
| PROF-06 | new account visits profile | no fake XP/achievements | E2E |
| PREF-01 | select dark/light/system | immediate correct display, persisted after refresh | E2E |
| PREF-02 | timezone Asia/Jakarta -> UTC | display derived correctly, UTC event history intact | Unit/E2E |
| PREF-03 | locale preference | changes supported translations, no incomplete mixed strings | E2E |
| PREF-04 | privacy profile disabled | non-owner receives no private data | Security |
| SEC-01 | wrong current password | change denied, safe feedback | Feature |
| SEC-02 | correct password + new confirmation | new password works, old invalid | Feature |
| SEC-03 | password/role/email sensitive change without reauth | denied appropriately | Security |
| SEC-04 | TOTP 2FA enrollment | only enabled after verified code, if implemented | Security |
| SEC-05 | 2FA recovery code displayed | only after proper reauth, never in logs | Security |
| SEC-06 | revoke other sessions | sessions invalidated, current handled intentionally | Feature/E2E |
| SEC-07 | security emails/preferences | only opt-out allowed channels toggled | Feature |
| DATA-01 | export account data | self-only, private link, excludes secrets/others | Integration |
| DATA-02 | export file link expires | cannot download after expiry | Security |
| DATA-03 | delete account without confirmation/reauth | denied | Security |
| UX-01 | form 422 Inertia errors | near fields, focus first error, values preserved | E2E/A11y |
| UX-02 | successful manual save | visible toast after server response only | E2E |
| UX-03 | failed autosave | draft kept, retry offered, no fake success | E2E |
| UX-04 | toast in mobile dark theme | readable, nonblocking, accessible live region | Visual/A11y |
| UX-05 | keyboard-only modal/reorder use | accessible with visible focus | A11y |
| UX-06 | 390x844 profile/settings | no horizontal clipping; controls usable | Visual |
| REG-01 | V4 dashboard/roadmap | still works, data retained | Regression |
| REG-02 | V4 lessons/quizzes | previously completed status retained | Regression |
| REG-03 | V4 labs/XP | no duplicate rewards | Regression |
| REG-04 | V4 notes and reports | private, CRUD, autosave existing work intact | Regression |
| REG-05 | app does not connect to live third-party targets | local lab sandbox only | Security |

## Recommended automated suites
**Laravel Feature tests:** `AdminStudioAuthorizationTest`, `ContentRevisionLifecycleTest`, `ContentPublishPolicyTest`, `QuizPayloadSecurityTest`, `LabMetadataBoundaryTest`, `RoadmapRevisionPreservationTest`, `UserProfileTest`, `AccountSettingsTest`, `SecurityReauthenticationTest`, `DataExportPrivacyTest`.

**Frontend tests:** `ContentEditorValidation`, `QuizBuilder`, `AdminReviewActions`, `ProfileForm`, `ThemeSwitcher`, `SaveStatus`, `ConfirmModal`, `NotesRegression`.

**Browser/E2E:** 
1. Editor drafts → reviewer approves → admin publishes → learner reads.
2. Learner edits Profile → refresh → updates persist; switches theme on phone.
3. User A cannot access User B settings or any private field.
4. Admin tries role management without reauth, then with reauth; audit trail.
5. Lab metadata edits never expose secret flag / executable runner config.

## Visual screenshot matrix
- `/studio` desktop 1440x900 light, 390x844 dark.
- `/studio/content/{id}/edit` desktop 1440x900 light + dark, mobile 390x844.
- `/studio/reviews` desktop light.
- `/profile` desktop 1440x900 light and mobile 390x844 dark.
- `/settings/general`, `/settings/appearance`, `/settings/security` desktop and mobile; test errors, loading, save toasts, disabled actions.
- Existing V4 learner seven screens quickly smoke-tested in both themes.

## QA reporting template
```
V5 QA RESULT
Environment:
Commit:
Laravel version / PHP / Node / MySQL:
Migration status:
Tests run (commands):
Passed / Failed / Skipped:
Known pre-existing failures:
New regressions:
Authorization/security checks:
Screenshots:
Content editorial flow:
Profile/settings flow:
Unfinished/deferred features (2FA/export/notifications if unavailable):
Hosting: NOT ATTEMPTED
```

## Stop conditions
Stop or block progression if any of these remain: learner can manage content/roles; content draft publicly leaks; private notes readable across accounts; password change without verification; untrusted Markdown executes scripts; admin CMS can edit sandbox runtime/secrets; user progress erased; migrations destructive; tests not runnable and Codex claims completion anyway.
