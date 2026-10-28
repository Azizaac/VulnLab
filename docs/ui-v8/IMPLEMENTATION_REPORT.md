# UI v8 implementation and verification

The redesign is implemented in the existing Laravel/Inertia application. The [repository audit](REPOSITORY_AUDIT.md) maps routes to components and data sources. The v8 kit is retained under `docs/ui-v8`; its sample values and client-only actions are not used as production data.

## Changes and visual comparison

- Shared theme tokens and compact horizontal navigation use the existing theme and account preferences. The mobile navigation and permission-gated Studio access remain available.
- Dashboard presents a compact hero, today's server-supplied tasks, a summary strip and recommendations. Roadmap uses a 170px decorative banner, a separate keyboard-operable stage timeline and the existing plan/task controls. Checklist, lesson, lab and XP measurements remain distinct.
- Learning and lab catalogs use compact headings, filters and real records; the lesson reader and lab workspace retain their existing grading and sandbox controls. Empty courses are handled without inventing question totals.
- Progress, Notes and Reports use denser workspaces with real activity and save state. Profile, Settings and Studio keep their current identity, security, privacy and editorial actions, with more compact layouts. Authentication retains the existing v7.1 form and security flow.
- [Before screenshots](screenshots/before/) were captured from the saved pre-v8 commit; [after screenshots](screenshots/after/) use the redesigned checkout. Both use fresh synthetic accounts and disposable SQLite fixtures at 1440×900 and 390×844 in light and dark themes. Each folder includes Dashboard, Roadmap, catalog and detail views, Progress, Notes, Reports and editor, Profile, Settings, Studio and editor, Login and Register. They are full-page captures taken at those viewport sizes; independent fixture identities and timestamps differ.

The layout follows the prototype's proportions and hierarchy rather than reproducing its demo data. Lab tiles and registration are taller because they retain real prerequisite, status and planning fields. The production lesson and report flows remain separate routes instead of the prototype's sample single-screen editor. Actual artwork, wording and content density are not pixel-identical to the prototype.

## Checks run

| Check | Result |
| --- | --- |
| PHP `artisan test`, in-memory SQLite | PASS: 115 tests, 2,247 assertions. |
| `npm run build`, `npm run lint` | PASS after changes. |
| `npm run test:unit` | PASS: 4 files, 11 tests. |
| Playwright visual capture | PASS at desktop and mobile, both themes, with no horizontal overflow across the captured routes. |
| Playwright regression, desktop/mobile | Initial pass exposed changed selectors and navigation timing; the affected tests were corrected and rerun. Dashboard, Roadmap, all eight existing lab scenarios, reports, account and Studio flows passed on their subsequent runs. Learning/notes autosave and Studio role editing passed in the final targeted rerun. |
| Learning/lab contrast and reflow | PASS: four routes at 1440, 390 and 320 pixels in both themes, with axe WCAG 2.1 A/AA smoke checks, plus real search, read and server-graded quiz on disposable data. |
| Chromium zoom, keyboard, CSP and reduced motion | PASS: desktop security and real 200% zoom, plus 320px security/reflow; 3 passed, 1 deliberately skipped duplicate zoom test. |
| Additional v8 reflow | PASS: 14 authenticated routes at 320, 375, 768 and 1024px in both themes. The first run found 768px header overflow; navigation was made horizontally scrollable and the complete check passed on rerun. An earlier browser run also hit a transient `ERR_NO_BUFFER_SPACE`; a bounded retry was added for that specific error. |
| Real screen reader, physical device, Safari and Firefox | NOT RUN. Automated accessibility checks do not replace these. |
| MySQL migration/restore | NOT RUN for this UI-only update. No production or learner DB migrations were run. |

All mutation tests used a newly created temporary SQLite database; real sandbox tests used temporary lab sessions. No learner database reset, Docker volume removal, aaPanel deployment, public lab exposure or server infrastructure change was performed. The updated application source has not been deployed to the separately running local Docker app.

## Remaining review

Visual comparison still needs human review with representative existing learner data, a real screen reader and physical mobile devices. Automated browser checks cannot establish full WCAG compliance or pixel identity. The v7.1 content and runtime expansion remains a separate incomplete workstream; this UI update does not publish its drafts or implement new labs. Treat the UI release gate as **pending human accessibility and visual review**, not as a production deployment approval.
