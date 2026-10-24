# Codex — START HERE (v4, newest image match)

## Authoritative instructions
1. Load `design/visual-reference.png` using image capability; it is the **actual owner-approved target image**, not a generic moodboard.
2. Read `MASTER_PRD.md`, `design/DESIGN_SYSTEM.md`, `design/SCREEN_SPECS.md`, `design/VISUAL_ACCEPTANCE.md`, `CODEX_BUILD_PROMPTS.md`, then content/roadmap/testing and architecture docs.
3. Inspect current repo first. **Keep working Laravel functionality, users, DB migrations, lesson/quiz/roadmap records and progress**, adjusting frontend screens and UI components non-destructively.
4. Implement one sprint at a time. First implement app shell and a visually high-fidelity **Home**; next dark **Roadmap**; then remaining five screens. Screenshot and compare after **each** page. Avoid doing everything in a huge unverified commit.
5. Never build seven tiny static mini-screens or use poster image as the webpage background. Build real React app pages with working routes and semantic HTML.
6. Use generated logo/illustrations derived from **original SVG/graphics authored for this product**, not screenshot-cropped controls; React node overlays on roadmap.
7. UI and content are separate: seed 25 complete starter lessons, 50 quizzes, 8 safe lab specs and 90-day plans unchanged; preserve draft editorial honesty and server-side scoring.
8. Run and log tests, build, screenshots. If an environment lacks necessary assets/runtimes, report what was blocked; don't fabricate passes.

## First prompt — paste into Codex with the ZIP extracted
```
Read CODEX_START_HERE.md and MASTER_PRD.md, then inspect design/visual-reference.png and the v4 design docs. This newest seven-screen poster is the visual target. Implement S0 and S1 only: genuine Laravel + Inertia React TS horizontal-navigation shell, full light/dark support, and high-fidelity Beranda and illustrated Roadmap pages matching the image's color, layout, spacing, imagery and interactive composition. Preserve all existing backend behavior/user data. Do NOT use left admin sidebar, generic dashboard cards or a screenshot as the entire UI. Roadmap must have a visible glowing illustrated 5-stage path and real 90-day activities; all values must come from data. Include seeders/migrations/tests, compare desktop/mobile screenshots to the poster, run tests, and report actual results. Do not implement vulnerable endpoints in core app.
```
