# Content publishing, learning quality, and migration safety

## Terms and expectations

- **Learning path / module:** an ordered bundle; 10 paths is a valid product count and does not mean only 10 lessons exist.
- **Lesson:** one taught unit; target 25 legacy + 10 new = 35 published only after review.
- **Question:** server-graded item; 50 legacy + 30 new = 80 authored; published count may be smaller.
- **Lab manifest:** a definition. **Playable lab:** a definition backed by proven isolated runtime and approval; target 8 legacy + 12 new = 20 playable local.

## Drafts in this package

`content/LESSON_MANIFEST.json` = 10 new lessons, source metadata, preres and status. `content/lessons/*.md` = all new readable drafts. `content/quizzes/NEW_QUESTION_BANK.json` = 30 questions with explanations. `content/LESSON_ENRICHMENT_MATRIX.json` = 25 improvement plans (NOT revised final text). `content/labs/LAB_EXPANSION.json` = 12 lab definitions (NOT implemented runtimes). `content/reference_only` = historical V4 data for diff/spot-check **never blindly import over live DB**.

## Publishing process

1. Compute local current counts grouped by status and stable slug, including question revision count and lab runtime registry.
2. Inspect studio roles and content revisions. Generate a comparison report for N026..N035, Q051..Q080, L009..L020. If stable slugs already exist, do not duplicate them.
3. Add draft new lessons and questions through current Studio schema, mapping stable source IDs to DB-generated IDs. Idempotent migrations/seeds; no `truncate()`.
4. Check accuracy against official primary reference for EACH lesson (URL alone insufficient). Document reviewer identity and date; preserve editorial status when review absent.
5. Publish reviewed texts only after all sections, example, explanation, quiz and context test pass.
6. Version existing published lessons rather than rewriting their recorded version; preserve pinned quiz attempts and progress.
7. Run learner account tests for visibility; verify that unpublished content is invisible to learners while staff can preview it.
8. Show two honest indicators: `Published lessons` and `Playable local labs` with `Drafts pending review` separately in Studio.

## Deep lesson template (must apply to all lessons)

- Learning objective (2 concise sentences)
- Preflight: prerequisites, timing, difficulty, WSTG/API/CWE mapping
- "Kenapa ini penting?" plain Indonesian context
- Friendly analogy (note its limits)
- Mechanism illustrated using request/response on fake endpoints and dummy data
- Guided inquiry: observe → hypothesize → test → interpret → fix
- False-positive/common confusion section
- Secure Laravel pattern with clear boundary (auth policy, validated data, parameter binding, etc.)
- Reflection prompt + micro report
- 3–5 quiz questions (partially from existing bank) with explanations after grading
- Official source references, editorial status, version, review date
- "Belum paham" quick recap and link to prerequisite

**Quality gate**: aim for a focused 10–15 minute lesson, not artificially inflated text or copied PortSwigger text. Flag unsupported claims. Use 5–10 lines of meaningful code and explanation; no code dumped for appearance. Rating of user competency must derive from graded quizzes or verified labs, not mere page open.

## Trustworthy sources (all official)

- OWASP API Security: https://owasp.org/API-Security/
- OWASP API top 10 edition 2023: https://owasp.org/API-Security/editions/2023/en/0x11-t10/
- OWASP WSTG stable: https://owasp.github.io/www-project-web-security-testing-guide/stable/
- OWASP Cheat Sheets: https://cheatsheetseries.owasp.org/
- PortSwigger Web Security Academy: https://portswigger.net/web-security
- MITRE CWE: https://cwe.mitre.org/
- MDN HTTP docs: https://developer.mozilla.org/en-US/docs/Web/HTTP

Avoid inferring expertise from status codes or a live URL. Preserve attribution/license obligations when quoting/deriving content; explain original paraphrase. Check validity and link topic-specific chapters.
