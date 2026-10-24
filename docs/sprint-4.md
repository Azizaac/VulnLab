# Sprint 4 Combined — implementation and validation

24 October 2026, Asia/Jakarta. Branch `codex/2026-10-24-sprint4-combined`. This is the Sprint 4 addendum implementation; Sprint 5 and public/aaPanel deployment are outside this delivery.

## Delivered behavior

- `/progress`: lifetime summary plus 7/30/90/all local-date activity filters, lesson/quiz/lab/report event chart, accessible table, eight evidence dimensions with published denominators, illustrated 90-day journey, timezone streak and eight locked/unlocked achievement cards. Empty accounts show zero/no assessment and a useful lesson CTA. Verified attention/session minutes are displayed as **Belum dilacak**.
- `/reports`, `/reports/create`, `/reports/{id}`, `/reports/{id}/edit`: private searchable/paginated practice reports; structured Indonesian form, autosave with version conflict detection, preserved edits and retry after connection failure, safe preview, archive/delete confirmations, six-dimension internal completeness evaluation, authenticated Markdown/printable HTML exports.
- Evidence: private local disk outside webroot; randomized filenames; signed, owner-authorized downloads; real MIME/signature validation for PNG/JPEG/UTF-8 TXT/LOG; maximum 5 MiB per file, five files, 20 MiB aggregate. HTML/SVG/executable or disguised files are rejected. Nginx/PHP limits include multipart headroom. Original names are display metadata, not storage paths. Text evidence and exports redact common credential/flag patterns; images must be sanitized by the author before upload. Export files do not embed private attachments.
- Shared feedback: at most three deduplicated toasts, success dismissal after five seconds, persistent actionable failures, dismissal controls, ARIA status/alert semantics, normalized errors, inline field errors/focus, pending buttons, confirmation dialogs and saved-state indicator. Notes retain their existing serialized autosave and conflict handling without success-toast spam. Labs show a server-confirmed result dialog with actual new XP (zero on a repeated reward), a report CTA, and wrong-flag errors beside the retained input. Quizzes show score, correct answer count, explanations and actual XP delta.

All existing horizontal V4 navigation, account themes, modules, roadmap URLs and sandbox request boundaries are retained. Progres/Laporan now have working desktop links and entries under mobile **Lainnya**.

## Data and reward rules

The analytics migration adds `learning_activity_events`, `xp_transactions`, `achievements`, `user_achievements` and a per-user versioned backfill marker. Existing `xp_events`, quiz attempts, lesson progress and lab progress remain intact. The report migration adds `vulnerability_reports`, `report_evaluations` and `report_evidence`. No existing table is replaced, reseeded destructively or reset.

Trusted domain handlers write qualified events and rewards under a user row lock plus database uniqueness constraints. A first completed lesson awards 10 XP, passed quiz 20, validated lab its existing 50/100/150 award, accepted internal practice report 50. Historical lab credits import exactly once. Opening pages, checklist review, failed attempts, logins and notes give no XP. Ten non-empty owned notes can unlock Note Master without reward XP.

The centralized level formula is `floor(sqrt(total_xp/100))+1`; its next threshold is `100*level²`. Streak counts distinct UTC events converted to the account's IANA calendar, ending today or yesterday. Skill knowledge contributes at most 40 points and practical evidence at most 60; missing practice is explicitly unassessed. Reporting practice uses stored internal rubric evidence, with its limitations displayed.

Report states are `draft`, `ready_for_review`, `under_internal_review`, `needs_revision`, `accepted_for_practice`, `archived`, always labelled **Latihan Internal**. Submission alone awards nothing. The policy-controlled deterministic evaluator requires a solved linked lab, at least 20/24 total and at least 3/4 in every dimension. It discloses that length/structure are completeness proxies and do not verify technical accuracy, severity, impact or expert review. Client-supplied scores, owner, acceptance, paths and reward fields are prohibited. Report URLs are inert text; no remote fetch or external submission exists.

## Preserving learner records

A private full MySQL dump and SHA-256 hashes of 34 pre-existing durable tables were saved under ignored `.tools` before migration. The localhost application images were rebuilt, services recreated with their existing volumes, and only `php artisan migrate --force` applied. Hash comparison after migration confirmed every original durable table unchanged, including users, roadmap plans/items, lessons, attempts, lab sessions/progress, notes and old XP. Test suites use in-memory SQLite, a separate `e2e.sqlite`, or randomly named disposable MySQL schemas. Private backups and database contents are excluded from Git.

## Actual verification

The checkpoint contains the complete command/result matrix and repaired failures:

- Full Laravel SQLite and MySQL 8.4 suites: **72 passed / 1,724 assertions** each.
- Two real simultaneous PHP containers, twelve completion deliveries: exactly **30 XP, two reward rows, two events, two achievements**; disposable schema removed.
- Frontend unit suite: **9 passed**. TypeScript/Vite production build, ESLint/Prettier, PHP Pint and strict Composer validation passed.
- Eight real sandbox scenarios, four transport checks and Docker isolation probes passed. The vulnerable shop/verifier could not connect to the core database by name/address or the tested external TCP endpoint.
- Local rebuilt app `/login` returned **HTTP 200**; Compose configuration passed; running PHP reports `upload_max_filesize=5M`, `post_max_size=6M`.
- Browser validation covered **24 unique cases** across four viewports. The full run had sixteen existing cases and four new Sprint 4 cases passing; four legacy selectors failed after toast integration. After fixes, the focused Learning/Notes + Sprint 4 matrix passed **8/8**, including all four previously failing cases. See `SPRINT4_PROGRESS.md` for precise runs. New screenshots cover empty/evidenced Progress and Reports in both themes at all four widths.

## Visual review and practical limits

The source poster and V4 specifications remain the design references. Actual screenshots in `docs/screenshots/sprint4/` cover Progress (empty and real evidence) and Reports in both themes at desktop/mobile/tablet widths. The implemented screens retain the poster's horizontal brand/navigation, bright editorial report form, narrower guidance/status column, skill radar, activity chart, streak card, mountain journey and achievement ribbon. Additional required fields and evidence explanations make the pages taller than the contact-sheet examples. Mountain art is original SVG; no claim of pixel-identical concept art is made.

Automated axe and keyboard/reflow checks supplement visual inspection; they do not constitute a complete manual screen-reader audit. PDF is available through the browser's print dialog; a standalone server PDF renderer was not added. Minutes remain untracked, educational content remains draft, and internal completeness evaluation remains explicitly automated. The existing local sandbox isolation limitations from Sprint 3 continue to apply. These are disclosed scope boundaries, not fabricated completion metrics or expert verification.
