# VulnLab UI/UX Redesign v8 — Codex Kit

This kit is an **additive design spec**, not a replacement Laravel application. Your screenshots of the previous dark UI drove a simplification pass: one primary action, compact roadmap, better typographic hierarchy, less stacked navy-card clutter.

## What's included

- `MASTER_PRD_UI_V8.md` — complete all-menu UX requirements, functional contracts and acceptance criteria.
- `CODEX_SINGLE_RUN_PROMPT.md` — one paste-ready prompt for the existing Codex project.
- `design/prototype.html` — fully self-contained **visual/UI interaction prototype** with 12 screens. All counts, flags, quizzes and notes in this HTML are illustrative. **It is not an authenticated app and does not execute real labs.**
- `design/preview-*.png` — browser screenshots when available.
- `design/theme-tokens.css` — suggested design tokens.
- `qa/UI_QA_MATRIX.csv` — structured review checklist.

## How to use

1. Extract the entire `VulnLab_UI_Redesign_v8/` directory into your **existing** repository as `docs/ui-v8/`.
2. Open `docs/ui-v8/design/prototype.html` in a normal browser. Switch top navigation, theme, selected roadmap stage, labs and notes, and inspect layout. No server is needed for its visuals.
3. Give Codex `docs/ui-v8/CODEX_SINGLE_RUN_PROMPT.md`. Alternatively paste its contents into Codex.
4. Ask Codex to save before/after screenshots and actual test results in the repository. Review each page before touching deployment.

## Important

- Codebase was **not available to this prototype creator**, so it cannot establish which components, routes, or frontend tests currently exist.
- No Laravel migrations, credentials, routes, sandbox or aaPanel configurations are included or changed.
- Browser checks on prototype concern only front-end demo navigation/visuals, not real backend or lab safety.
