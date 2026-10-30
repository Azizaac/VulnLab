# 12 additional labs — scenario and acceptance contract

**All tests run only on isolated local dummy fixtures. Public target testing, arbitrary SSRF or privilege on main app are forbidden.** The associated manifest (`content/labs/LAB_EXPANSION.json`) starts as `draft_not_implemented`. Do not flip availability manually.

| Lab | Scenario under test | Learner's evidence | Secure-mode contrast | Isolation special case |
|---|---|---|---|---|
| L009 Password reset | Expired/reused token mishandling in fake account workflow | Fake user tries same token twice within own fixture | Reject token after use, enforce expiry | No real email delivery; private fake mailbox |
| L010 CSRF | Profile preference update accepts a controlled cross-site fixture | Dummy user sees unapproved preference change | CSRF token/Origin/SameSite defenses | Synthetic local origin only |
| L011 Path traversal | Receipt download uses unsafe path on synthetic tree | Fixture file outside fake receipt folder becomes visible | Canonical allowlisted path selection | No host mount and no secrets |
| L012 File upload | Backend trusts declared content type in test images | Invalid synthetic file reaches staging only | Content validation & restricted storage | Non-executable quarantine, size cap |
| L013 GraphQL BOLA | Object resolver skips tenant/user authorization | Other owned dummy account's object appears | Resolver enforces ownership | Fixed query schema and fixture tenants |
| L014 CORS | Over-permissive origin policy on fake account fixture | Synthetic origin receives non-sensitive dummy data | Origin allowlist and credentials rules | No external origin/browser exfil |
| L015 SSRF webhook | Fake webhook fetch accepts untrusted synthetic destination | Controlled simulator records request to wrong mock service | Strict URL/host policy | NO host metadata, no public outbound, no 127.0.0.1 host service |
| L016 OAuth redirect/state | Simulated authorization flow lacks state/redirect binding | Local fake user crosses own authorization state | Verify state+redirect binding+PKCE where relevant | Fake identity provider, no real SSO |
| L017 Coupon race | Two bounded concurrent fake redemption actions exceed limit | Duplicate dummy coupon use recorded | Atomic DB transaction and idempotency | Cap concurrency/rate and run on disposable DB |
| L018 API property auth | User updates protected property in dummy profile | Protected field changes incorrectly | Field-level authorization rules | No production user fields |
| L019 Pagination exposure | List response leaks excessive fixture properties | Unneeded dummy fields visible | Explicit response DTO + limit | Response size cap |
| L020 Cross-tenant access | Team member sees fake org B workspace | Dummy org data crosses boundary | Scope every query by org+role | Dedicated fake organizations |

For **each** lab create documented objective, false-positive caveat, 3 progressive hints, trigger, verification condition, session-bound flag/proof, `vulnerable` response, `secure` response, reset data, mitigation, learner report prompt and 10 tests (baseline, trigger, secure contrast, proof, wrong proof, expiry, reset, ownership, network denial, repeat XP). No hardcoded proof visible to client before validation. Revision/availability evidence stored in runtime registry.

Implementation order: L009/L010 → L011/L012 → L013/L014 → L015/L016 → L017/L018 → L019/L020. Each pair has independent working checkpoints. Users see `Coming soon (not playable)` if missing/failed runtime. Never mark completed on clicking lab.
