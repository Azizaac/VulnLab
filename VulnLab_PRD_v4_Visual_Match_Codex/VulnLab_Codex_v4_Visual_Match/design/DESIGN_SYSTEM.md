# VULNLAB DESIGN SYSTEM v4 — POSTER MATCH CONTRACT

## Absolute UI instruction
The art in `visual-reference.png` is the approved high-level visual target. Recreate the **seven distinct page designs** from the poster. Do not replace their composition with a standard dashboard or use a screenshot as a fake webpage. Build real semantically accessible components.

## Brand
- Blue **geometric hexagonal shield** emblem with deep blue interior and vivid cyan facets; vector SVG component `BrandMark` authored locally; SVG logo must not be the screenshot crop.
- Brand name `VulnLab` next to icon, approximately 20–25 px, bold (800), with blue accent available on `Lab` ending (optional if readable).
- Desktop marketing/header strapline where space allows: `Belajar. Bereksperimen. Temukan Celah. Jadilah Lebih Aman di Dunia Digital.`
- Tagline motifs `Same Curiosity / Safer Tomorrow` may appear in marketing masthead only, not as a random brand claim.
- Icon system: Lucide React; consistent 18–20px; avoid OS emoji as main action icons.

## Tokens (CSS variables; accessible colors on real backgrounds)
| Variable | Light | Dark |
|---|---|---|
| `--page` | `#F4F8FE` | `#061426` |
| `--surface` | `#FFFFFF` | `#0C1E36` |
| `--surface-alt` | `#EBF4FF` | `#112946` |
| `--surface-elev` | `#FFFFFF` | `#132F51` |
| `--text` | `#10233C` | `#F0F6FF` |
| `--muted` | `#627693` | `#A0B7D4` |
| `--border` | `#D5E4F3` | `#284567` |
| `--primary` | `#0879FF` | `#3097FF` |
| `--primary-hover` | `#0068E8` | `#58AEFF` |
| `--cyan` | `#2ACBFF` | `#42DFFF` |
| `--violet` | `#9254FF` | `#AC80FF` |
| `--teal` | `#13C8AB` | `#36E8D3` |
| `--success` | `#138F64` | `#44D6A0` |
| `--warning` | `#CC7C14` | `#FFBF55` |
| `--danger` | `#C93D56` | `#FF7E94` |

Use #021329–#06172D navy for dramatic road/lab/notes backgrounds and the reference's electric-blue highlights. Validate contrast independently (especially cyan on white). Avoid visual flourishes that reduce legibility.

## Typography and physical dimensions
- Headings: **Plus Jakarta Sans** 700–800, fallback system sans. Body: **Inter** or Plus Jakarta Sans 400–600, code: ui-monospace SFMono/JetBrains Mono fallback. Acquire fonts via allowed package/web setup; use fallbacks offline and respect licensing.
- H1 30–36px desktop and 26px mobile; H2 22–25px; body 14–16px with 1.5–1.7 line-height; small labels 12–13px. **Do not mimic tiny or garbled poster text.**
- Content desktop canvas max 1440px; 16–28px horizontal pad; top nav 58px; large section radius 14–20px; small cards 10–14px; gap grid 12–20px; pill button radius 10px; primary buttons blue with subtle highlight.
- Light cards white with thin pale-blue borders, faint shadow; dark surfaces layered navy with desaturated blue boundaries. Roadmap art, dark lab, and dark notes are major showcase surfaces.
- Use an **8px spacing scale** (4/8/12/16/24/32/40/48), with proportions chosen to match screenshot.

## Shared React components
`BrandMark`, `TopNav`, `MobileBottomNav`, `GlobalSearch`, `ThemeToggle`, `AvatarMenu`, `PrimaryButton`, `OutlinedButton`, `Badge`, `SectionTitle`, `HeroIllustration`, `ContinueLearningCard`, `NextStepCard`, `QuickAccessTile`, `PathIllustration`, `StageNode`, `StageDetailDrawer`, `CourseOutline`, `LessonTabs`, `HTTPCodePanel`, `TrustedSourcesPanel`, `QuickQuiz`, `LabInstructionsPanel`, `HintStack`, `HttpRequestComposer`, `HttpResponseViewer`, `FlagSubmit`, `JourneyMilestoneCard`, `SkillRadar`, `WeeklyActivityChart`, `NoteList`, `MarkdownNoteEditor`, `BugReportForm`, `ReportQualityTips`, `ReportStatusTracker`.

## Major page identity / expected composition
1. **Home:** mostly light, blue-white illustrated landscape behind friendly greeting, navy `Lanjutkan Belajar`, pale next-steps overlay and four compact action tiles.
2. **Roadmap:** immersive night mountain backdrop within a large section, **five ascending blue glowing numbered stage nodes** linked by cyan path, right dark `Detail Tahap` drawer.
3. **Learning:** light, left course table-of-contents rail (~23%), center lesson & HTTP preview (~54%), right verified sources rail (~23%).
4. **Lab:** dark, left guided instructions (~43%) and right HTTP workspace (~57%), each with purposeful dark borders.
5. **Progress:** light background; first row streak + journey mountain card, second row radar + chart, third row achievement chips.
6. **Notes:** dark editor; left nested category and note list ~42%, right large Markdown text editor ~58%, rich tags and safe syntax highlighting.
7. **Reports:** light two-column form ~72% and help/status ~28%, no generic full-page table.

## Illustration production
- The road map **mountains and river-like glowing path** are essential. Implement using custom licensed/original SVG layers (night sky, moon, distant mountains, foreground trees, path and 5 waypoint rings) or a purpose-created original image **behind** the interactive React nodes. Do NOT crop the full poster to fake functioning UI. Prefer an original scene tailored to content. Maintain a non-illustrated accessible list alternate.
- Home mountain/observatory/cartoon academy hill illustration in soft blue/purple/sky colors, text overlays separate and accessible. Lab dark sky/glow near header may be done via gradients; no illustration blocking code.
- Progress mini mountain/flag can reuse the stage map art motif as a small background image.

## Motion/accessibility/responsiveness
120–220ms transitions, reduced-motion switch, visible 3px focus ring, WCAG 2.2 AA target, 44px mobile hit areas, no content lost at 200% zoom. Landscape art decorative `aria-hidden=true`; waypoint buttons have accessible stage name/status/percent. All charts have text/tables as equivalents. Dark/light app-wide; page-specific reference themes do not override user choice. Mobile no horizontal overflow; labs use `Instruksi / Request / Response` tabs and path becomes a vertical list or accessible scrollable map.

## Anti-patterns
**Forbidden:** left admin sidebar, large generic KPI grid on home, stacked identical stat cards on every page, all-white boring roadmap, purely decorative roadmap without functional nodes, the whole collage as CSS background, fake live HTTP responses, hard-coded streak/skill/progress, fake leaderboard/awards, fake third-party report approvals, unreviewed materials labelled verified, dead menus, coming-soon as finished feature.
