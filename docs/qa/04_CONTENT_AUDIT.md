# Sprint 6 — cybersecurity content audit

Reviewed the versioned 25 starter lesson bodies/enrichment, all 50 questions with their keys/explanations, eight lab scenarios/contracts/mitigations, and the source inventory on 25 October 2026. This is an **agent-assisted technical/editorial review**, not independent human expert approval. No approval dates or human credentials were fabricated.

The learner database inventory independently confirms 25 lessons / 50 questions / 8 labs / 90 roadmap days. `python scripts/qa-content.py` checks unique IDs/slugs, complete quiz links, one valid single-choice key per question, explanations, HTTPS sources, acyclic prerequisites, lab links and 90 complete 120-minute day definitions. See [content-results.json](content-results.json).

## Per-lesson review

Every row was checked for concept/analogy, safe local example/practice, mitigation, prerequisite placement, quiz consistency and source relevance. The structural checks do not establish factual accuracy by themselves; the technical reading is a separate review. All starter labels remain unreviewed by an independent expert.

| ID | Material | Technical review / correction | Human approval |
| --- | --- | --- | --- |
| L001 | Cara Browser dan Server Berkomunikasi | Concept, local practice, mitigation and quiz explanations reviewed; no critical factual defect found. | Not independently approved |
| L002 | HTTP Methods: GET, POST, PUT, PATCH, DELETE | Concept, local practice, mitigation and quiz explanations reviewed; no critical factual defect found. | Not independently approved |
| L003 | Membaca Status Code dan Header HTTP | Concept, local practice, mitigation and quiz explanations reviewed; no critical factual defect found. | Not independently approved |
| L004 | Cookies, Session, dan Identitas Login | Concept, local practice, mitigation and quiz explanations reviewed; no critical factual defect found. | Not independently approved |
| L005 | Same-Origin Policy dan CORS | CORS explanation coherent; broad reference should be made more specific. | Not independently approved |
| L006 | Dasar REST API, JSON, dan Endpoint | Clarified request versus JSON response with separate HTTP messages. | Not independently approved |
| L007 | Authentication vs Authorization | Concept, local practice, mitigation and quiz explanations reviewed; no critical factual defect found. | Not independently approved |
| L008 | Login, Logout, dan Siklus Sesi | Concept, local practice, mitigation and quiz explanations reviewed; no critical factual defect found. | Not independently approved |
| L009 | IDOR: Referensi Objek Tanpa Otorisasi | Concept, local practice, mitigation and quiz explanations reviewed; no critical factual defect found. | Not independently approved |
| L010 | BOLA: IDOR pada Resource API | Concept, local practice, mitigation and quiz explanations reviewed; no critical factual defect found. | Not independently approved |
| L011 | Broken Function Level Authorization | Concept, local practice, mitigation and quiz explanations reviewed; no critical factual defect found. | Not independently approved |
| L012 | CSRF dan Permintaan Berbasis Session | Concept, local practice, mitigation and quiz explanations reviewed; no critical factual defect found. | Not independently approved |
| L013 | Cross-Site Scripting: Saat Input Jadi Script | Concept, local practice, mitigation and quiz explanations reviewed; no critical factual defect found. | Not independently approved |
| L014 | SQL Injection dan Query Berparameter | Parameterized queries correct; example fence language is a minor editorial improvement. | Not independently approved |
| L015 | Input Validation: Bentuk dan Makna | Concept, local practice, mitigation and quiz explanations reviewed; no critical factual defect found. | Not independently approved |
| L016 | SSRF: Server Diminta Mengakses Alamat Lain | Concept, local practice, mitigation and quiz explanations reviewed; no critical factual defect found. | Not independently approved |
| L017 | Risiko File Upload | Concept, local practice, mitigation and quiz explanations reviewed; no critical factual defect found. | Not independently approved |
| L018 | Business Logic: Saat Aturan Toko Bisa Dilewati | Concept, local practice, mitigation and quiz explanations reviewed; no critical factual defect found. | Not independently approved |
| L019 | Burp Proxy dan Repeater untuk Pemula | Repeater practice is controlled/local; use a more specific Repeater reference in future editorial revision. | Not independently approved |
| L020 | JWT: Header, Payload, Signature | Concept, local practice, mitigation and quiz explanations reviewed; no critical factual defect found. | Not independently approved |
| L021 | Mass Assignment dan Properti Terlarang | Concept, local practice, mitigation and quiz explanations reviewed; no critical factual defect found. | Not independently approved |
| L022 | GraphQL: Query, Mutation, dan Authorization | Concept, local practice, mitigation and quiz explanations reviewed; no critical factual defect found. | Not independently approved |
| L023 | Recon, Scope, dan Pengujian Berizin | Concept, local practice, mitigation and quiz explanations reviewed; no critical factual defect found. | Not independently approved |
| L024 | Menulis Laporan Bug yang Bisa Direproduksi | Concept, local practice, mitigation and quiz explanations reviewed; no critical factual defect found. | Not independently approved |
| L025 | Memperbaiki Temuan di Laravel | Clarified Gate facade versus the optional controller authorization trait. | Not independently approved |

## Material corrections

L006 previously put a GET request and JSON body in one block without an HTTP response separator. The additive note explicitly identifies JSON as the response body and shows request and `200 OK` response separately. [MDN GET](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/GET) supports this distinction.

L025 used `$this->authorize()` without explaining its controller trait prerequisite. This repository's base controller does not include that trait; the clarification uses the existing application's `Gate::authorize('view', $order)` pattern and explains that a registered policy still must enforce object permissions. See [Laravel authorization](https://laravel.com/docs/12.x/authorization) and the locally installed `Illuminate/Auth/Access/AuthorizesRequests.php` / Gate implementation.

`config/content-errata.php` applies only to the SHA-256 of the exact original starter body. It adds sanitized explanatory content; it does not update learner rows, original text, approval records or editorial revisions. A changed editorial body automatically stops receiving the annotation. A backend regression test verifies both behaviors.

## Sources, quizzes and labs

Fresh HTTPS link checks reached **24/24 distinct learning references** and **8/8 lab references**. See [learning-source-check.json](../learning-source-check.json) and [lab-source-check.json](../lab-source-check.json). Reachability is not source endorsement or proof of every claim. Official MDN/OWASP/Laravel documentation was consulted for the corrections and security review; PortSwigger/MITRE references in the retained curriculum remain attributed. Existing source/credit records were preserved; no external article or proprietary training content was imported wholesale.

The two additional clarification links also returned HTTP 200; see [errata-source-results.json](errata-source-results.json). Corrected code examples appear in both the material annotation and the existing code-example tab; browser regressions verify them.

All 50 key/explanation pairs were read, including Q015–Q022 in a separate focused pass. Questions remain single-choice, two per starter lesson. A minor awkward Indonesian wording remains in Q0042; it is logged as P3 rather than silently changing already issued quiz presentations. Some reference links are broad overviews (notably CORS, the PHP SQL example fence and Burp Repeater); an editor can refine them through the existing review workflow.

The eight lab explanations align with observed vulnerable and secure behavior: order IDOR, address BOLA, search XSS, product SQL injection, profile mass assignment, JWT validation, admin BFLA and coupon business logic. XSS success depends on execution in the separate verifier, not string reflection alone. Scope is owned dummy applications/data; no instructions to attack unapproved targets were introduced.

Readiness counts: **0 missing lesson bodies**, **2 explanatory corrections added**, **25 materials technically read by the agent**, **0 new independent human approvals**. All 25 retain honest editorial limitations. No lesson is presented as certified, and no genuine learner progress or original source text was overwritten.
