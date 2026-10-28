# CODEX — VULNLAB UI/UX REDESIGN V8, ALL PAGES, ONE TASK

Continue the **existing** VulnLab Laravel + Inertia React/TypeScript repository. **Do not start a new app.**

Read `docs/ui-v8/MASTER_PRD_UI_V8.md` completely and inspect `docs/ui-v8/design/prototype.html` as the **visual and interaction reference**. Inspect screenshots under `docs/ui-v8/design/` and all current React pages, layout, Tailwind tokens, route bindings, tests and Sprint 6/7.1 work.

**User feedback:** the existing home UI has oversized hero + standalone full-width lesson/lab panels; roadmap mountain artwork consumes most of the viewport; too many generic bordered navy cards; tiny text and excessive vertical whitespace. Optimize the information hierarchy across **all menus**, not just home and roadmap.

## Visual direction

- Preserve VulnLab identity, **#74AAFF**, understated dark/light palette, top horizontal navigation. NO generic admin dashboard sidebar for learners and NO excessive neon/glow.
- Reconstruct functional React components; do not paste prototype HTML wholesale or use screenshot-as-background.
- Use existing auth/role/route/validation/store logic and actual database data. The prototype contains demonstrative figures and fake client actions solely for preview. **Never copy demo progress, XP, quiz grading, flag validation, session state or hardcoded notes into production.**
- Apply detailed page requirements to: Dashboard, Roadmap, Learning Modules/catalog/lesson, Labs catalog/workspace, Progress, Notes, Reports, Login, Register, Profile, Settings, Admin Studio.
- Ensure meaningful empty states, real loading and errors, accessible forms, consistent toasts and autosave statuses, responsive 320–1440px, 200% zoom, reduced motion, high-contrast states. Use actual server-confirmed feedback.

## Constraints

Preserve existing data, Laravel contracts, Inertia props, policies, curriculum content, lab isolation, reward logic, report status, admin editorial workflow, sessions, settings and security properties. No destructive schema changes or progress reset. No aaPanel/hosting deployment. Keep new components reusable and styles centralized. Do not implement unrelated features.

## Execution plan

1. Audit real repository and current visual debt. Output route-to-component inventory and data dependencies.
2. Implement theme tokens, learner AppShell, nav/search, shared controls and feedback patterns.
3. Redesign Dashboard and Roadmap; keep illustration compact and preserve actual progress definitions.
4. Redesign Modules and Labs workspace with existing backend interactions.
5. Redesign Progress, Notes, Reports, Profile and Settings.
6. Bring Login/Register and Admin Studio to the same consistent design system, preserving their workflows.
7. Run PHP tests, TypeScript, lint, build, unit/E2E/browser tests. Fix regressions.
8. Capture desktop 1440×900 and mobile 390×844 screenshots in dark/light for main routes, plus representative form success/error, lab and admin states. Compare screenshots with prototype, fix major spacing, contrast, layout and hierarchy mismatches.
9. Write `docs/ui-v8/IMPLEMENTATION_REPORT.md` with files changed, tests actually run/pass/fail, before/after comparison, known gaps, safety checks and final UI acceptance status.

**Stop only after implementing and validating the UI scope available in the repository.** If tooling or context limits block completion, preserve working changes and clearly enumerate remaining tasks in `IMPLEMENTATION_REPORT.md` instead of claiming completion.

START with repository audit. Never execute remote deployment.
