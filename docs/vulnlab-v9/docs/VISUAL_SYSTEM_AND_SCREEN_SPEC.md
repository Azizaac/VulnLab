# V9 Visual system & screen fidelity specification

## Reference hierarchy

1. **APPROVED**: `design/APPROVED_PRE_V8_ROADMAP.png` — detailed illustrated mountain/map, glowing winding path, milestone nodes, contextual panel. Restore illustration and interaction without hardcoding screenshots as application UI.
2. **APPROVED**: `design/APPROVED_PRE_V8_DASHBOARD.png` — stronger illustrated hero and purposeful learning modules. Keep hierarchy but fix oversized plan-builder and empty blocks.
3. **APPROVED**: `design/ORIGINAL_V4_7SCREEN_REFERENCE.png` — composition of modules/lab/notes/progress/reports; use conceptually, text may be imperfect generated imagery.
4. **REJECTED**: `design/REJECTED_V8_DASHBOARD.png`, `design/REJECTED_V8_ROADMAP.png`. Do NOT rebuild either of these screenshots or flat jagged mountain charts.

If repository has layered SVG/PNG mountain illustration assets, prefer restoring those. If missing, report asset gap explicitly. New illustration needs separate human user approval; do not invent a bland generic mountain placeholder and claim fidelity.

## Tokens (dark)

| Token | Color | Rule |
|---|---|---|
| `--bg` | `#071525` | Main canvas |
| `--panel` | `#0E2138` | Content |
| `--panel-raised` | `#13304E` | Lifted surfaces with sparing usage |
| `--border` | `#254567` | Delicate 1px border |
| `--brand` | `#74AAFF` | Blue brand accents |
| `--brand-strong` | `#3B89F5` | Buttons where contrast appropriate |
| `--text` | `#EDF4FF` | Main text |
| `--muted` | `#AEC1D9` | Supporting text |
| `--success` | `#4CC9A2` | Positive states |
| `--warning` | `#F2BC60` | Attention |
| `--danger` | `#FA7777` | Errors |

Light mode must use near-white surfaces, near-ink foreground, and a darker blue for text and solid buttons. #74AAFF alone is NOT suitable as small text on white; verify WCAG contrast. Use tokenized semantic colors, no blanket `!important` override. Font system/Plus Jakarta Sans if installed; do not ship bundled font files without rights; fallback remains consistent.

- Radius: 12px standard, 18px illustrated hero, 10px input. Use deliberate 8/12/16/24/32 spacing scale.
- Navbar height 64px; desktop content 1240–1360px max width; reading column ~720px; hero height ~260–360px depending page.
- Mobile: 390px and 320px supported; 16px minimum primary body; cards stack; code horizontal scroll; accessible drawer; no overlapping fixed headers.
- Motion: 120–220ms transitions; glow only for active roadmap path and badges; respect reduced motion.
- Focus-visible ≥2px, keyboard access for cards and all tabs. Text and controls should meet AA. Never rely on color alone.

## Layout priorities

**Dashboard:** meaningful hero + day panel, compact stats strip (not giant tiles), resume content, actions. The reading journey must be visible above fold without scrolling through large decorative areas.

**Roadmap:** detailed panorama and luminous path are NON-NEGOTIABLE. Five steps are data-driven DOM controls layered over artwork, not baked screenshot. Panel may overlay panorama on desktop and become bottom sheet/mobile section. Daily tasks below with date filters and explicit pre-req.

**Modules:** avoid huge wallpaper; use navigable contents rail, comfortable reading center and citations right, with responsive collapses. Terse goals first, 1 illustrative example per lesson, quiz and related lab easily found.

**Labs:** unlike standard dashboard, workspace needs technical density and clarity. Equal split or 42/58 on wide screens, syntax-highlighted HTTP response, strict target selector, stage progress.

**Progress:** chart and skill competency must display meaningful breakdown; recent events and streak states visible; no fake zeros.

**Notes:** comfortable editor, tags and preview; autosave near title. Reports: structured guided writing panel with contrast and sufficient form field width.

**Auth/Profile/Settings/Admin:** editorial auth split from v7.1, detailed profile stats; settings list with logical sections; staff admin uses content workbench with workflow and previews; only staff can enter Studio.

## Visual review process

At first commit, capture old current 1440x900/390x844. Restore only Dashboard and Roadmap before touching other routes; show screenshots and a per-requirement note: 'art present?', 'path luminous?', 'panel readable?', 'mobile equivalent?', 'visible real resume?'. Then adjust other pages. Prefer preserving existing functionality over matching literal generated text. Quality gate requires screenshot evidence, not subjective "looks nice".
