# Sprint 6 — security checkpoint

This is an agent-assisted local application review using selected requirements from [OWASP ASVS 5.0.0](https://asvs.owasp.org/) and the [WSTG 4.2 methodology](https://wstg.owasp.org/v4.2/). It is **not** an ASVS level assessment, compliance certification, independent pentest, Docker escape test or public-production approval. Unlisted requirements were not assessed. No external vulnerability targets were scanned.

## Requirements actually checked

| Requirement subset | Method/evidence | Result and limits |
| --- | --- | --- |
| Authentication validation and throttling | `AuthTest`; browser valid/invalid login, registration and password change | Server validation, hashing, normalized email, default learner role and independent rate-limit buckets checked. Email delivery/TOTP not configured. |
| Session rotation and termination | Auth/controller tests, V5 account browser workflow, V6 history workflow | Rotation, logout, epoch invalidation/suspension and other-session revocation checked. Inertia history encrypted; auth transitions clear its key/history. This cannot erase screenshots or data a user has copied. |
| CSRF and browser cookies | Real browser POST without token, config review | Missing token rejected. HttpOnly, SameSite=Lax and Docker session encryption configured. Secure cookies/HSTS require future HTTPS; local HTTP is intentionally loopback. |
| Object authorization | Notes/Report/Lab/Roadmap/StudioAndAccount tests with second owners and staff roles | Private reads/writes/exports/evidence/attempts denied to other users. Admin/reviewer privileges do not grant private note/report access. |
| Privilege and editorial boundaries | Studio workflow/RBAC tests and four-role browser journey | Forged roles/rewards, editor publication, self/contributor review, missing review checks and stale writes rejected. Published pointer changes atomically; draft data/key fields absent from learner DTOs. |
| Validation and parameterized data access | Laravel FormRequests/ContentSchema, negative payloads, query review | Strict nested metadata and request contracts; prepared Eloquent/query-builder values. No raw request-controlled shell, SQL identifiers or executable CMS payloads found. This is not exhaustive fuzzing. |
| Output encoding/sanitization | NotesTest, ReportTest, SafeMarkdown unit tests, core CSP browser injection | CommonMark strips active HTML/unsafe links/remote images; DOMPurify repeats client protection. Lab HTML displayed as code. Nonced script policy blocks a real nonce-free inline script. |
| Response headers | FinalQaTest, real browser response checks | CSP, object/base/form/frame restrictions, nosniff, frame DENY, referrer and permissions policies. Authenticated responses are no-store. Export HTML retains its stricter sandbox CSP. Inline styles remain allowed for existing React/Radix styles. |
| Private uploads/files | Report and account tests | MIME/content/extension/size/count limits, private paths, owner-bound short-lived evidence URLs, safe avatar re-encoding and export redaction/expiry checked. No upload code execution path added. |
| Reward integrity | Progress/Learning/Lab/Report tests, two-process MySQL races | Server computes outcomes and first rewards; idempotent submissions and row locks/unique constraints prevent duplicate XP. Flag race uses deterministic fixture runner proof; separate eight-lab tests validate real runtime proof. |
| Secrets/error/log protection | Header/DTO tests, real DB-outage fixture, `qa-log-scan.mjs` | Generic errors, no raw DB exception from readiness, no configured secret or concrete flag in examined logs. Scope/count recorded in `log-scan-results.json`; not an audit of unrelated systems. |
| Dependency review | Fresh Composer audit and npm audit | No advisories reported by the configured registries on the QA date. This is not a guarantee against undisclosed vulnerabilities or future advisories. |
| Data lifecycle | Private export/deletion/session tests, two restore rehearsals | Reauthentication, typed deletion confirmation, grace/cancel, expiry and operator guard tested on fixtures. Source learner records remain unchanged. Off-host retention/access policies remain future operations work. |

## Training containment

`node scripts/check-lab-isolation.mjs` inspects the actual running containers and performs controlled TCP probes from both vulnerable shop and verifier. [lab-isolation-check.json](../lab-isolation-check.json) records the date, checks and observed routes.

- Shop/verifier join only the internal training bridge. Neither can resolve/connect to the core DB/app/web listeners, core web address, owned host web/runner listeners or metadata address.
- An owned canary on a separate bridge is reachable from its positive control and unreachable from shop/verifier. No public target is needed to test the routing boundary. Blocking the core web listener also prevents `/studio` HTTP access; no actual aaPanel host was contacted.
- Nonroot users, read-only roots, capability drops, no-new-privileges, memory/CPU/PID limits, no mounts/sockets/core credentials and absence of vulnerable host ports were inspected. Runner publishing is `127.0.0.1:8090`; core web is loopback. No Docker volumes were removed.
- The core adapter only accepts two fixed local runner origins; redirects are disabled. Training requests select enumerated endpoint/method/header/body contracts. Arbitrary URLs, alternate hosts/IPs, metadata/LAN targets and redirects are rejected by negative tests before fetching. Browser verifier networking is blocked and sandbox CSP disallows outbound resources.
- Fixture resets rotate generation/flag without removing persistent solve/XP history. Browser tests now stop only sessions they created; training tests must run **serially** because the verifier intentionally accepts one render at a time.

Residual risk: all services share the local Docker daemon/kernel. The Chromium verifier runs with `--no-sandbox` inside its restricted container; this is not a guarantee against a browser/container escape. There is a trusted runner edge/control network by design. Public labs require a separately approved host/VM containment and operations review. A busy verifier safely returns 503 without issuing success/XP; it has no production-scale queue or availability guarantee.

## Readiness and production boundary

`/up` remains process liveness. `/ready` is session/cache-independent and checks a real database query and writable framework/log directories. `qa-preflight.mjs` launches an isolated HTTP app with an unavailable DB and database session/cache settings: **`/up` 200, `/ready` 503**, sanitized JSON. It never stops the learner DB. Storage capacity, SMTP, scheduler and runner readiness are not implied by that endpoint.

The local configuration has debug off and populated private secrets. Production TLS, secure cookies, proxy trust, secret rotation, scheduler/monitoring, off-host backups and independent review remain prerequisites, not executed deployment work. See [SPRINT7_DEPLOYMENT_PREREQS.md](SPRINT7_DEPLOYMENT_PREREQS.md).

The final secret scan caught an additional QA-harness defect: Playwright's JSON reporter serialized an explicitly supplied runner token into an **ignored local report**. No source commit or public evidence contained it. The config now inherits the token through Laravel's private `.env`/process environment instead of embedding it in reporter-visible configuration. Archived reporter configuration values were redacted without changing test outcomes or rewriting application logs. The complete desktop lab suite was rerun with the new config, and the final local log scan is clean. Raw traces and SQL backups remain private and must never be published.
