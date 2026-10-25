# START HERE — VulnLab Sprint 6 (Final QA, Security Audit, UI Polish)

**This package is an ADDENDUM for the EXISTING VulnLab repository. It is NOT a new app skeleton.** The learner-facing design stays V4; Admin/Profile/Settings follow V5. Hosting aaPanel remains Sprint 7 **after** release readiness review.

## Folder placement

Copy/extract this complete directory into your repository at:

`docs/prd-v6/`

Then run Codex with the short prompt in `CODEX_SHORT_PROMPT.txt`. The full prompt in `CODEX_SPRINT6_FULL_PROMPT.md` is optional for agents needing explicit detailed instructions. Do not paste both: save context by making Codex read the PRD.

## Contents

- `MASTER_PRD_SPRINT6_FINAL_QA.md`: release gates, test workflows, security review, visual system, editorial content checks, isolation, evidence.
- `testing/QA_TEST_MATRIX.csv`: executable scenario inventory (tests expected to become actual tests after codebase audit).
- `templates/RELEASE_READINESS_TEMPLATE.md`: evidence-based GO/NO-GO report.
- `templates/DEFECT_REGISTER_TEMPLATE.csv`: issue format.
- `CODEX_SHORT_PROMPT.txt`: copy-and-run prompt.
- `CODEX_SPRINT6_FULL_PROMPT.md`: alternate detailed agent prompt.
- `references/`: V4 visual poster and V5 Admin/Profile references. V5 PRD included for self-contained context.

## BEFORE asking Codex to make changes

1. Check Git working tree; commit or backup existing changes according to normal workflow.
2. Create a backup of the development DB when practical (do not upload it to chat or git).
3. Place files at `docs/prd-v6` and ensure screenshot references are accessible to Codex.
4. Use the same repo containing the working Dashboard, Roadmap, Modules, Notes, Labs, Reports and Admin Studio.
5. Do not connect to aaPanel, Cloudflare or any live domain for this sprint.

## Meaning of this deliverable

This is a **ready-to-implement QA specification**, not the result of having run tests against your codebase. Codex must inspect and test the application and produce reports of what actually works. Bugs found should be fixed and retested. If major functionality is absent, declare that accurately and provide a follow-up task; don't invent success.
