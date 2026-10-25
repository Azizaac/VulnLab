# VulnLab Sprint 7 — Deployment Planning Pack

This pack is for **planning only** following the user-supplied Sprint 6 local release-readiness report.

1. Extract the contents into `docs/prd-v7/` in the **existing** VulnLab repository.
2. Give Codex this one instruction: `Read docs/prd-v7/MASTER_PRD_SPRINT7.md and docs/prd-v7/CODEX_PROMPT_SPRINT7.md. Follow the Codex prompt. Plan deployment only; do not deploy or touch my home server.`
3. Review the generated `docs/deploy/` deliverables and inventory gaps.
4. Only after review and explicit approval should execution be planned for a separate operation.

Core app: Laravel 12 + Inertia React/MySQL via aaPanel; Cloudflare Tunnel + Access for limited private beta. Lab runtimes remain local until separately hosted and security-approved. No real keys or passwords belong in Git.
