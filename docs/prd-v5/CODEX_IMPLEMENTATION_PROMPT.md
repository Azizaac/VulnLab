# Codex — One-Paste Handoff: VulnLab V5 Admin Studio + Profile/Settings

> Put this file and the V5 package in the **existing VulnLab repository**. If a file with the same name exists, preserve the old file and choose a clear namespace. This instruction is intended to be pasted into Codex as **one request**. Hosting is deferred.

```text
VULNLAB — IMPLEMENT SPRINT 5: ADMIN CMS + PROFILE & SETTINGS

You are working in the existing Laravel + Inertia React + TypeScript + MySQL VulnLab repository. DO NOT rebuild it and DO NOT deploy it to aaPanel or any public host.

READ FIRST:
- PRD_V5_ADMIN_PROFILE_SETTINGS.md
- UI_UX_DESIGN_SPEC.md
- DATABASE_API_RBAC.md
- QA_ACCEPTANCE_TESTS.md
- references/MASTER_PRD_V4.md
- references/PRD_SPRINT4_COMBINED_V4_1.md
- references/visual-reference-v4.png
- current source code, migrations, routes, auth implementation, tests, and UI components

V5 EXTENDS V4; it does not replace learner pages or edit the vulnerable lab runner. Existing V4 behavior, data, notes, reports, quizzes, progress, XP and lab isolation are authoritative. The HTML preview is layout-only, never a runtime source of truth. Inspect and map existing tables/permissions first; avoid duplicate entities or incompatible auth systems.

GOAL:
Implement a production-quality internal VulnLab Studio CMS, complete learner Profile & Settings, accessible feedback/validation, source provenance, content workflows, RBAC, and real tests.

DELIVERY ORDER:
A. Audit repository and write the existing→required compatibility map. Run baseline tests. Back up dev database before significant migrations.
B. Add server-side role policies/authorization, safe additive migrations, editorial revision versioning, publisher/reviewer separation, audits.
C. Admin Studio overview + content list + lesson editor + source/review workflow + versioned publish. Seed existing lessons into the approved content model without losing existing references or user progress.
D. Quiz builder, lab *metadata-only* Studio, roadmap template versioning and guarded user management. No executable container code or flag secrets editable in Studio.
E. Learner Profile, Settings tabs (general, appearance, notifications, security, privacy, data), safe avatar upload, change-password reauth, sessions, account export/delete lifecycle. Implement 2FA only if auth stack supports a fully functioning secure flow; otherwise document/defer it and do not show an inert enable toggle.
F. Integrate existing toast/form validation UX across new pages, mobile/dark/light states. Follow V4 visual identity: horizontal learner navigation, navy/cyan/violet tones, illustrated Profile hero. Studio is a creator workspace with a top bar and local tabs, NOT a generic admin dashboard sidebar.
G. Add tests in QA_ACCEPTANCE_TESTS.md, run Laravel tests, TS/build checks and browser/E2E when possible. Fix regressions. Verify admin policies, correct-answer confidentiality, no draft leaks, no notes/XP mutation, lesson/roadmap progress preserved.

QUALITY GATES:
- Real MySQL state, no fake UI data or nonfunctional switches.
- Preserve original 25 lessons/50 quizzes/8 lab definitions if present; verify counts from actual repo and report any missing items.
- Source links include reviewer metadata; avoid invented credibility or unverified “expert reviewed” badges.
- Editing published material creates a draft revision. Publishing only after review and permission check; old completion retained.
- Learner/Editor cannot grant themselves roles; all important changes audited; no admin API bypass.
- Private profile by default; timezone and theme preference persist; security-sensitive changes require reauthentication.
- Inertia form errors handled according to the installed Inertia version; do not duplicate toast providers.
- Account export private and excludes passwords/2FA/session tokens/other user's data.
- Lab runtime stays separate; no Docker socket, arbitrary URL proxy or production database accessible to sandbox.
- Do not claim any tests pass unless actually executed; do not claim V5 done with dead links or demo data.

WORK WITHIN ONE TASK but commit/record progress at each stage. If time/context is limited, finish a coherent stage and write docs/V5_IMPLEMENTATION_STATUS.md including completed vs pending features and exact test results; DO NOT fabricate completion. Do not auto-start deployment/full hosting.

FINAL OUTPUT:
Files/migrations changed; route/role matrix; finished pages; sample successful editor→reviewer→publish flow; user profile/security flows; actual test commands/results; desktop/mobile screenshots and differences from V4; known defects; steps to resume. Mark aaPanel hosting as deferred.

START by inspecting codebase, not by generating a second Laravel skeleton.
```
