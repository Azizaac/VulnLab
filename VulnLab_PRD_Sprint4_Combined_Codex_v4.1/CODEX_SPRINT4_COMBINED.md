# CODEX — Implement VulnLab Sprint 4 Combined

Continue the existing VulnLab repository. **Do not rebuild from scratch and do not deploy to aaPanel.**

Read in order:
1. `MASTER_PRD.md`
2. `design/visual-reference.png` and design specifications
3. `PRD_SPRINT4_COMBINED.md` (normative Sprint 4 addendum)
4. Existing Laravel/Inertia React implementation, migrations and tests

Implement **Sprint 4 Combined** as described in the addendum:
- Real Progress analytics: verified events, lesson/quiz/lab counts, study-time integrity, charts, streak, skill evidence and achievements.
- Transaction-safe, idempotent XP ledger and server-side levels.
- Practice Bug Bounty Reports: secure private CRUD, practice-only status/review, Markdown and print exports, optional tested PDF.
- Global UX Feedback: clear success/error toasts, inline validation, loading states, completion modal, quiz results, retry, notes autosave state, accessible confirmation dialogs.
- Maintain existing V4 visual fidelity, mobile responsiveness, light and dark themes, horizontal navigation.
- Preserve all user data, existing routes, authentication, Roadmap, Modules, Notes, Labs and progress.

Audit Sprint 3 before relying on it; do not fake labs, scores or verification. Use current models where possible; design safe additive migrations. Make all XP, scores, lab completion and report evaluation server-authoritative. Don't allow leaked private report evidence, arbitrary remote fetches or untrusted HTML.

**Execution order:** inspect -> checkpoint at `docs/SPRINT4_PROGRESS.md` -> shared UX foundation -> events/XP -> Progress -> Reports -> cross-page feedback -> testing and screenshot comparisons. Commit/checkpoint progress if needed to resume efficiently without repeatedly re-reading large specifications.

**Acceptance:** complete all P0 items in `PRD_SPRINT4_COMBINED.md`, execute relevant tests, fix introduced regressions, compare Progress/Reports against V4 reference in desktop/mobile light/dark, and report actual executed commands, results, missing coverage, and blockers. Never claim an unexecuted test passed.

Finish with Sprint 4 readiness report. **Do not start Sprint 5, aaPanel, Cloudflare Tunnel, or hosting.**
