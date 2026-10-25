# VulnLab PRD v5.0 — Admin Studio + Profile & Settings

**Version:** 5.0 / 24 October 2026  
**Goal:** implement the missing admin content management and full learner account/settings experience **in the existing V4 application**.  
**Hosting:** **NOT YET**. aaPanel at home is reserved for the final deployment stage after QA and separation of intentionally vulnerable labs.

## Package files
- **`MASTER_PRD_V5_COMPLETE.md`** — single-file combined PRD with product, design, database/API/security and QA specification.
- **`PRD_V5_ADMIN_PROFILE_SETTINGS.md`** — standalone product requirements, user journeys, roles, features and acceptance criteria.
- **`UI_UX_DESIGN_SPEC.md`** — design tokens, wireframes, responsive design, interactions and visual QA.
- **`DATABASE_API_RBAC.md`** — additive schema proposals, endpoints, permissions, content versioning and security architecture.
- **`QA_ACCEPTANCE_TESTS.md`** — executable test plan and release checks.
- **`CODEX_SHORT_PROMPT.txt`** — shortest recommended Codex handoff (references the comprehensive single-file PRD).
- **`CODEX_IMPLEMENTATION_PROMPT.md`** — detailed one-paste engineering prompt alternative.
- **`prototype/VulnLab_Admin_Profile_Preview.html`** — standalone interactive **frontend-only preview** (sample data, no database, no actual persistence). Do not deploy as the app.
- **`references/`** — frozen V4 poster and applicable prior PRDs/design notes, so Codex receives full design context.

## How to use
1. Keep your existing VulnLab Git repository and database. Make a branch/backup.
2. Extract files to a project docs folder (e.g., `docs/prd-v5/`) without replacing source code.
3. Open `prototype/VulnLab_Admin_Profile_Preview.html` in browser for visual reference; test tabs, theme and mock form states. These are simulated interactions only.
4. Open Codex on the existing repo and paste the text from `CODEX_SHORT_PROMPT.txt` (paths assume that you copied this entire package to `docs/prd-v5/`). **Do not ask Codex to read both the combined PRD and every duplicated section unless needed.**
5. Codex should audit first, preserve installed tech, implement in phases, run tests and write clear status; do not let it declare success purely from UI screenshots.
6. After V5 is working, next step **Final QA / Security Audit / UI polish**; only after that **aaPanel deployment**.

## Specification precedence
- V5: only Admin Studio, content editing/versioning, Profile, Settings and related access/security flows.
- V4: existing seven student-facing pages and visual direction.
- V4.1: Progress/XP/Reports and global feedback already designed/implemented in prior sprint.
- Actual existing code/data: preserve working behavior unless a proven security defect requires a well-tested fix.

## What “ready for Codex” means
The documents are ready for coding. They are **not** a claim that admin functionality, 2FA, export, emails, or production hosting already exist. Security-sensitive features must be implemented and tested before becoming visible to learners.
