# VulnLab v9 — UI Rescue, Learning Expansion & 20 Labs

This package is a **Codex implementation specification and content source drafts**, not an installed patch of your Laravel application.

## Start here

1. Make a Git commit/backup of your existing VulnLab repository first.
2. Extract this ZIP so **everything** is under `docs/vulnlab-v9/` within your existing repository. Do not replace `app/`, `routes/`, `resources/`, migrations or `.env`.
3. Inspect the `design/` images: `APPROVED_PRE_V8_ROADMAP.png` and `APPROVED_PRE_V8_DASHBOARD.png` are visual approvals; `REJECTED_V8_*` are examples to avoid. `ORIGINAL_V4_7SCREEN_REFERENCE.png` is a broader original concept reference.
4. Paste `CODEX_ONE_SHOT_PROMPT.md` into Codex (or tell Codex to read that file and execute it).
5. Ask Codex to show actual screenshots of restored Dashboard/Roadmap before proceeding if visual fidelity is uncertain.
6. Only after test gates, proceed to deeper content and lab roll-out. **No production/aaPanel deployment in this task**.

## Included

| File/folder | Purpose |
|---|---|
| `MASTER_PRD_V9.md` | Feature scope, UI and business requirements, delivery gates |
| `docs/VISUAL_SYSTEM_AND_SCREEN_SPEC.md` | Approved/rejected references, tokens and page-by-page visual QA |
| `docs/CONTENT_EDITORIAL_AND_IMPORT.md` | Versioning and safe import of lessons/quiz |
| `docs/LAB_RUNTIME_ACCEPTANCE.md` | 12 lab runtime contracts, safety, proof/secure mode/reset |
| `CODEX_ONE_SHOT_PROMPT.md` | One compact orchestration prompt |
| `content/lessons/*.md` | 10 authored lesson **drafts** |
| `content/quizzes/NEW_QUESTION_BANK.json` | 30 Q&A **drafts** |
| `content/LESSON_MANIFEST.json` | 10 planned lesson records and official references |
| `content/LESSON_ENRICHMENT_MATRIX.json` | Specific quality improvement plans for 25 original lessons |
| `content/labs/LAB_EXPANSION.json` | 12 detailed scenario **definitions**, NOT runnable code |
| `content/reference_only/` | Historical baseline for comparison only, never blindly import |
| `testing/V9_QA_MATRIX.csv` | Planned tests; none have been run against your repository |
| `testing/verify_package.py` | Local package integrity check only |

## Content counts are not runtime claims

10 learning paths can be fully correct. The plan is 25 existing + 10 new lessons (35) and 50 existing + 30 new quiz questions (80). Lab plan is 8 existing + 12 new (20). Whether those are **actually approved, published and playable** in your current application can only be established by Codex auditing the repository and running the DB/sandbox tests.

## Explicitly out of scope

- No aaPanel production deployment or changes to home server, DNS, firewall, Cloudflare.
- No testing of third-party targets without authorization.
- No mass reset/reseed of existing user data.
- No false claims of independent expert review, live lab or test coverage.
