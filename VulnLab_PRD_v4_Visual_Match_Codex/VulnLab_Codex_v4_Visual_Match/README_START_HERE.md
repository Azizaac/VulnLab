# VulnLab v4 — PRD matched to the EXACT latest owner-approved poster

This replaces the earlier UI specification; the owner wants the Codex app to resemble the **specific 7-panel VulnLab image**. The newest reference now lives at `design/visual-reference.png` and is the **authoritative** visual.

## What you get
- `MASTER_PRD.md` — new implementation PRD matching all seven page compositions.
- `design/visual-reference.png` — newest supplied visual reference (1672×941).
- `design/DESIGN_SYSTEM.md` — tokens/components and exact art direction.
- `design/SCREEN_SPECS.md` — seven layout blueprints matching panels 1–7.
- `design/VISUAL_ACCEPTANCE.md` — visual QA and required screenshot matrix.
- `CODEX_START_HERE.md` and `CODEX_BUILD_PROMPTS.md` — copy/paste Codex instructions.
- Original seeded content **preserved**: `content/lessons.json` 25 lessons; `content/quizzes/question_bank.json` 50 questions; `content/labs/labs.json` 8 lab design specs; `planning/roadmap_90_days.json` 90 days; 25 Markdown lesson files.
- Original `testing/QA_PLAN.md`, static validator, source/editorial guidance, screenshots from earlier prototype. `VulnLab_UI_Prototype_v3_LEGACY.html` is **not approved visual reference** (for functional UX exploration only).

## Steps
1. Extract this ZIP to the existing VulnLab repository (retain existing code, no destructive overwrites of source/data). Keep folder's docs/design/content organized.
2. In Codex attach/open `design/visual-reference.png` and provide `CODEX_START_HERE.md` first.
3. Run Sprint S0 and S1 prompts; visually check Home and Roadmap against image before implementing other pages.
4. Build S2–S5 sequentially, run tests and screenshot comparison. Do not replace frontend with a bitmap or use fake user progress.

## Important truth boundary
This is a detailed **design and build specification**, not a Laravel application already implemented, nor proof that expert editorial review / Docker lab isolation has been completed. The lessons carry the proper draft status. `content/labs/labs.json` describes exercises that must be implemented/tested safely before marked live.

## Static validation
`python3 testing/validate_bundle.py` — checks internal seed consistency. It does **not** test actual Laravel behavior or certify content accuracy.
