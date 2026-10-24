# Codex Build Prompts — v4 approved poster layout

**Use `CODEX_START_HERE.md` first; prepend the following global contract to every sprint:**
```
Read MASTER_PRD.md, design/visual-reference.png, design/DESIGN_SYSTEM.md, design/SCREEN_SPECS.md and design/VISUAL_ACCEPTANCE.md. Use the image as the **primary UI composition reference**. This is one contact sheet of SEVEN INDIVIDUAL SCREENS, not a page to clone as a bitmap. Follow v4 over any v3 prototypes. Preserve existing backend/features/progress. Do not use a left admin sidebar. All 7 screens support light and dark. Real data only, no fake stats/responses. Intentionally vulnerable labs only within isolated dummy-only Docker lab environment. Run tests and provide real screenshot comparison and an honest status report.
```

### S0: Auth + shared UI + illustrated Home
```
Create shared TopNav with horizontal links Beranda/Roadmap/Modul/Lab/Progres/Catatan/Laporan; wordmark/shield, right controls, active underline, mobile bottom nav. Configure Laravel/Inertia React TypeScript/Tailwind/MySQL/Docker as needed after inspecting existing project. Build Home PANEL 1 from approved image: sky blue observatory/mountain hero, greeting Halo Hacker Muda, search bar, navy Lanjutkan Belajar with real data, next-two-tasks card, four shortcut tiles. Enable both themes globally. Use original SVG/art assets. Test login, theme persistence, 1440x900 and 390x844, attach screenshots.
```

### S1: Cinematic illustrated Roadmap 90 Hari
```
Implement PANEL 2: midnight-blue mountain atmosphere, glowing cyan ascending route with FIVE clickable numbered waypoint nodes, right Detail Tahap panel, working stage/day details and accessible list. Ingest exact 90-day 20/70/30 seed tasks idempotently; persist per-user checklist. Respect keyboard/mobile responsive vertical timeline and both themes. No generic stacked cards as desktop replacement. Screenshot and compare with image, run roadmap/progress/auth tests.
```

### S2: 3-column Learning Reader + real content + Notes
```
Implement PANEL 3 (left course outline, center lesson title/tabs/dark HTTP code card/Quiz Cepat, right actual source links), supporting catalog and 25 seeded draft lessons with factual sources and 50 questions from content files. Grading only on server, answer key not sent before submission, genuine completion states. Implement PANEL 6 dark Notes knowledge-library with left lists + right markdown editor, tags/search and autosave/ownership. Test both themes, mobile reader and list/editor transitions, source citations, quiz authorization and XSS sanitization.
```

### S3: Dark hands-on Lab workspace
```
Implement PANEL 4 with ~43/57 split instructions/request-response, actual tabs/hints/flag entry, HTTP editor, and real sandbox available/unavailable state. Load 8 lab metadata scenarios. Stand up isolated dummy-only VulnShop runtime starting with IDOR, allowlisted local endpoints and server-side state verification, no arbitrary URLs, no core access/egress or docker socket. Don't return fake HTTP 200 or mark solved by button alone. Validate lab isolation, request proxy and mobile workspace tabs; screenshot against poster.
```

### S4: Light Progress and report writing studio
```
Implement PANEL 5: streak dots, journey milestone mountain card, skill radar, activity bars, achievements, all real persisted evidence and local timezone. Implement PANEL 7: light structured training report form with right tips/status, genuine local rubric, autosave and Markdown export. No claims of real external program submission/approval. Test empty and populated data accounts, ownership, report export, radar accessible alternatives and screenshot parity in both themes.
```

### S5: Full visual QA + technical hardening
```
Capture 28 required screenshots. Compare each to matching panel using design/VISUAL_ACCEPTANCE.md and fix P0/P1 deviations. Verify every CTA, dark/light and mobile, keyboard, 200% zoom, editor flows, actual data, Laravel tests, TypeScript/lint/build, Playwright, CSP/CSRF, isolation probes, source editorial labels and seed validator. Generate docs/visual-qa.md with reference comparison and unresolved items; report exact commands/results and any incomplete feature. Do not claim pixel-perfect if not achieved.
```
