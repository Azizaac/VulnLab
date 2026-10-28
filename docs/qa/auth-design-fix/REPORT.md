# Auth design correction — 28 October 2026

## Diagnosis and comparison

Before this update, `127.0.0.1:8088` returned the correct Inertia `Auth` route, but app and web containers created on 25 October contained an older Blade view and Vite bundle. The live page referenced `app-IzW4nORn.css` and `app-C2VXvbam.js`; the working tree had newer assets. Compose copies source and assets into its images rather than mounting the checkout. Nginx caches hashed assets, but the stale HTML and images were the observed cause; cache alone was not established as the cause.

The implementation now follows the v7.1 HTML's 52.5/47.5 desktop split, dark editorial panel, shield-shaped V mark, blue grid and mountain motif, three journey steps, form tabs, typography, input treatments and supporting footer. Compared with the prototype, the real registration form also contains the existing timezone and roadmap start-date fields, so it is taller. Mobile places the form first as requested by the design specification. The nonfunctional prototype-only back and password-reset links, simulated notice and consent control are not presented as working features. The artwork and exact spacing are not pixel-identical to the prototype.

## Live application

Recreated only `app` and `web` with the existing local labs overlay; the database container and volumes were not reset or migrated. Both live images share Vite manifest SHA-256 `9c044355aa58b65da4cffbe82ab3043ef3b32e049550d8caccfdb3315476c227`, and the live app's `Auth.tsx` and `auth.css` hashes match the checkout. The new live HTML references `app-DyOkqJbk.css` and `app-T4P8-su1.js`. A fresh browser context loaded both routes, themes and viewport sizes without horizontal overflow.

The current learner database lacks the Studio migrations introduced after commit `493f89a`. To avoid breaking that unrelated feature, the live image uses the compatible backend from `493f89a` plus the current auth component and styles. It does **not** contain the later Studio importer changes from the current branch. A full rebuild from current HEAD requires the separate database backup and migration verification described in [the expansion report](../EXPANSION_RELEASE_REPORT.md). The prior local images were retained as `vulnlab-auth-rollback:app-20261028` and `vulnlab-auth-rollback:web-20261028`.

## Evidence and tests

- [Live screenshots](live/) include viewport and full-page captures of both routes at 1440×900 and 390×844, in light and dark themes. Run `PLAYWRIGHT_BROWSERS_PATH=.tools/browsers node scripts/capture-auth-live.mjs` with the appropriate environment syntax to repeat the read-only browser capture.
- Auth feature suite: **8 passed, 85 assertions** on in-memory SQLite.
- Playwright auth suite on disposable SQLite: **12 passed, 3 intentionally skipped** (mutation flow limited to desktop and mobile). Includes registration, duplicate email, field focus, invalid and valid login, password clearing, loading and password visibility. Both themes, keyboard controls, automated axe and overflow were checked across five widths.
- Existing CSRF and keyboard focus browser test: **5 passed** on disposable SQLite.
- `npm run build` and `npm run lint`: **PASS**.
- Real screen-reader and physical-device tests were not run. Live screenshots used unauthenticated GETs; account mutation tests used a separate temporary database.
