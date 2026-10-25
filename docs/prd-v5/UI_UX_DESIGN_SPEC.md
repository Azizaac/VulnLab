# VULNLAB V5 — UI/UX & INTERACTION SPECIFICATION

**Visual priority:** student-facing screens follow V4 illustrated academy (`references/visual-reference-v4.png`). V5 is an extension, not a student redesign. The Admin Studio looks like a **premium editorial creator workspace** (similar level of polish to V4 learning experience), not a legacy data-grid dashboard. Light and dark themes supported in every admin/user settings screen.

## A. Design tokens

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--surface` | `#F8FAFF` | `#0B1224` | Canvas |
| `--surface-raised` | `#FFFFFF` | `#121C32` | Panels/forms |
| `--surface-soft` | `#EDF4FF` | `#1B2941` | Hover/active sections |
| `--ink` | `#17223B` | `#EBF3FF` | Main text |
| `--ink-muted` | `#6E7D96` | `#9EAFCB` | Secondary |
| `--brand` | `#3469E8` | `#6B9CFF` | Primary actions |
| `--cyan` | `#1AB6D2` | `#4BD4E9` | Accent/roadmap |
| `--violet` | `#7654D7` | `#AB91FF` | Achievements and editorial |
| `--success` | `#13866B` | `#4BD4A4` | Confirmed success |
| `--error` | `#CB3E53` | `#FB7F91` | Error/destructive |
| `--warning` | `#B77917` | `#F7BD64` | Review attention |
| `--border` | `#DAE4F2` | `#25344F` | Subtle separators |

**Font:** keep current V4 font where available; fallback Inter/system UI. Use 14–16px body, 13px metadata, 24–34px page title, 1.5 line-height for long Indonesian lessons, 40–70ch reading width. Radius: 10px inputs, 14px panels, 18–24px large hero cards. Icon style: Lucide outline consistent 18–22px. Responsive desktop max-width 1480px, gutter 28–36px; tablet 20px; mobile 16px.

**Global header:** preserve existing student navbar on `/dashboard`, `/roadmap`, `/learning`, `/labs`, `/progress`, `/notes`, `/reports`. On `/studio`, use same shield wordmark and top chrome with a contextual `Studio` badge and return-to-learning link. Do not append every admin tab to learner navbar.

**Themes:** system/light/dark; prevent white flash on first paint; use selected theme across Studio and Profile Settings; route tests in both themes. No text baked into illustrations. Visual references describe compositions, not exact tiny labels in concept art.

## B. Studio overview — `/studio`

Desktop composition:
```
┌───────────────────────────────────────────────────────────────────────┐
│ ◈ VulnLab   Studio / Overview              Search  ◐   Avatar       │
├───────────────────────────────────────────────────────────────────────┤
│ Overview  Konten  Kuis  Lab  Roadmap  Review  Pengguna  Audit          │
├───────────────────────────────────────────────────────────────────────┤
│ KONTEN & PEMBELAJARAN                 [+ Materi Baru] [Lihat situs]     │
│ Kelola materi yang mudah dipahami dan kredibel                        │
│ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ ┌───────────────┐      │
│ │Draft  12    │ │Review   3   │ │Terbit   25 │ │Perlu revisi 2 │      │
│ └─────────────┘ └─────────────┘ └────────────┘ └───────────────┘      │
│ ┌─────────────────────────────┐ ┌─────────────────────────────────┐   │
│ │ Antrean Review              │ │ Quick actions                   │   │
│ │ IDOR: Access Control  ...   │ │ Tambah Materi / Kuis / Lab     │   │
│ │ JWT dan Cookies       ...   │ │ Periksa sumber & referensi      │   │
│ └─────────────────────────────┘ └─────────────────────────────────┘   │
│ Perubahan terbaru (auditable list)                                    │
└───────────────────────────────────────────────────────────────────────┘
```
Numbers shown above are **layout examples only**. Runtime must show real DB counts, 0 if empty.

**User interactions:** `+ Materi Baru` navigates editor with unsaved-draft protection. Status chip opens filtered list. Review queue item opens diff view if authorized. Skeleton loading / actionable error / zero data states. Search scopes only permitted studio content.

## C. Content list and editor

**Content List `/studio/content`:** spacious 2-line rows instead of dense enterprise grid; search at top, segment `Semua / Draft / Review / Terbit`, filter path, sortable `Diubah terakhir`, content kind pills; prominent main CTA. Each row: title, short description, category, editor, source count, status, modified date, ellipsis actions. Default 20/page. Mobile transforms into vertical content rows/cards.

**Editor `/studio/content/{id}/edit`:** left contextual chapter tree (220–260px), main Markdown editor/blocks (flexible 580–760px), right source/quality rail (280–320px). At 1100px hide quality rail behind drawer; at 768px collapse chapter tree into button.
```
┌────────────────────────────────────────────────────────────────────────────┐
│ ‹ Kembali   Editor Materi — IDOR ...    ○ Perubahan belum disimpan   [...] │
│                                      [Pratinjau] [Simpan] [Kirim Review]│
├───────────────┬─────────────────────────────────────┬─────────────────────┤
│ BAB / LESSON  │ [Judul]  [Ringkasan]                │ SUMBER & QUALITY    │
│ • Pendahuluan │ [Tujuan pembelajaran]               │ OWASP - Checked     │
│ • Teori       │ ┌────────────────────────────────┐  │ CWE - Optional      │
│ • Praktik     │ │ Markdown content / code block  │  │ Relevansi & lisensi │
│ • Kuis        │ │                                 │  │ [Add source]        │
│ + tambah      │ └────────────────────────────────┘  │ Review checklist    │
└───────────────┴─────────────────────────────────────┴─────────────────────┘
```
**States:** Draft autosave; validation below field; reviewer request with actionable feedback; stale-version conflict dialog showing changed revision; publishing success opens published view. Use browser warning only for real unsaved changes.

**Source checker** flags missing official references, unreviewed date, broken format, copyrighted-media license missing. These are **validation heuristics**, not verification of factual accuracy.

## D. Quiz Builder `/studio/quizzes`
- Subnav question banks: `Semua soal`, `Per modul`, `Butuh review`.
- Two-column layout: left question list and filters (36%), right form + preview (64%); right switches `Tulis Soal` / `Lihat sebagai Murid`.
- Input prompt; 2–6 choice rows; radio marks correct answer **in instructor view only**; explanation for right and wrong; source link; tags, difficulty, passing threshold.
- Actions `Simpan draft`, `Preview`, `Kirim review`. During learner preview, answer marks must be hidden, not just CSS-obscured in DOM.
- Validation near questions and options; duplicate options and zero correct answer blocked.

## E. Lab Metadata Studio `/studio/labs`
- Card/table hybrid with title, difficulty, sandbox readiness status, related lesson, editorial status.
- Editor tabs: `Informasi`, `Instruksi`, `Petunjuk`, `Hubungan Modul`, `Sumber`, `Riwayat`.
- Show bright security boundary notice: `Kelola konten pembelajaran saja. Kode runner dan flag tidak dapat diedit di sini.`
- Only allow preapproved `runner_key` selected from read-only registry; cannot create external arbitrary endpoints.
- Lab unavailable renders learner CTA `Belum tersedia` not fake request/response.

## F. Roadmap Builder `/studio/roadmaps`
- Visual stage chips resembling V4 mountain milestones, but editor canvas is clean for usability.
- Split `Template stages` vs `Task detail`; add stage/task; reorder with accessible buttons; select prerequisites and linked canonical content.
- Show `Dipakai oleh 33 siswa` only when actual aggregate available. Warning: `Menerbitkan versi baru tidak mengubah rencana belajar yang sedang berjalan`.
- Preview learner roadmap current vs proposed new revision; publish with confirmation; no forced data migration.

## G. Review & User Management
**Editorial Review `/studio/reviews`:** document comparison (old published vs pending), sources panel, checkboxes for Accuracy/Clarity/Safety/References/License; textarea reviewer notes; buttons `Minta revisi` and `Setujui`; separate `Publikasikan` for publisher. No self-approval by default.

**Users `/studio/users`:** table search with user name/email, role, account status, verified, joined date; edit role behind sensitive reauth dialog and permission. User detail `Ringkasan belajar` aggregates only, no direct links into private Notes or Reports. Audit log page separate with filter actor/event/target/date.

## H. User Profile — `/profile`
A visually distinctive student profile with v4 mountains and badges, **not generic settings form**.
```
┌────────────────────────────────────────────────────────────────┐
│ ◈ VulnLab      Beranda Roadmap Modul ...              Avatar  │
├────────────────────────────────────────────────────────────────┤
│  [soft cyan and violet mountains backdrop]                     │
│   ◉ Avatar   Nama Tampilan       [Edit Profil]                   │
│              @username · Mulai belajar Okt 2026                │
│   Level 1 (verified)  XP 0   Hari belajar 0                      │
├───────────────────────┬────────────────────────────────────────┤
│ Skill yang berkembang │ Pencapaian & aktivitas terakhir       │
│ Radar / Evidence      │ Completed modules / labs / badges     │
└───────────────────────┴────────────────────────────────────────┘
```
**Data integrity:** if user hasn't completed any module, show 0. No fake follower count, titles or XP. Avatar fallback initials, but never display sensitive email publicly unless in own settings. Profile private by default; no public profile links.

## I. Settings — six tabs and screen states
Desktop: horizontal pill tabs under heading `Pengaturan Akun`, or on wide view a narrow **within-settings section navigator** plus right form. Neither is global app sidebar. Mobile: scrollable tabs/dropdown that is keyboard accessible.

1. `Umum`: avatar uploader with crop preview/clear action, display name, username, bio, email verification status (email change separate), language, timezone. Save section button; visible rules and retry.
2. `Tampilan`: 3 illustrated theme radio cards `Sistem`, `Terang`, `Gelap`; accessibility controls (reduced motion, font density optional) with mini preview; apply immediately and store server-confirmed preference.
3. `Notifikasi`: actual channels only; if reminder scheduler not operational show informative disabled state, never fake sent success; email opt-in copy.
4. `Keamanan`: password current/new/confirm with show/hide and strength rules, 2FA setup panel if installed, `Lihat kode pemulihan` only after reauth and careful display, active sessions with `Keluar dari perangkat lain`. One sensitive action at a time; confirm dialogs.
5. `Privasi`: profile default private, opt-in visibility only if public features built, analytics minimal-data setting; privacy explanations understandable by beginners.
6. `Data & Akun`: export download request/status/history, confirm deletion with password/reauth, exact implications and audit retention; red destructive section separated visually.

**Feedback:** big readable toast at desktop top-right and mobile safe-area; inline 422 validation and save indicator; use `role=status` for success and `role=alert` for errors; no toast storms from autosave; focus error; loading disabled submit; modal trap focus and ESC close when safe.

## J. Route map / navigation
```
VulnLab Learner (existing horizontal topbar)
  Beranda | Roadmap | Modul | Lab | Progres | Catatan | Laporan
                                                 └─ Avatar
                                                     ├─ Profil Saya
                                                     ├─ Pengaturan
                                                     │   ├─ Umum
                                                     │   ├─ Tampilan
                                                     │   ├─ Notifikasi
                                                     │   ├─ Keamanan
                                                     │   ├─ Privasi
                                                     │   └─ Data & Akun
                                                     ├─ Studio (authorized only)
                                                     └─ Keluar
VulnLab Studio (protected topbar + local section tabs)
  Overview | Konten | Kuis | Lab | Roadmap | Review | Pengguna | Audit
```

## K. Component inventory
`AcademyTopNav`, `StudioTopNav`, `StudioSectionTabs`, `ProfileHero`, `AvatarEditor`, `FormSection`, `ThemeSelector`, `NotificationPreferenceRow`, `SecurityActivityList`, `SessionRow`, `DangerZone`, `SourceCitationPicker`, `QualityChecklist`, `RevisionTimeline`, `ContentStatusChip`, `ContentTree`, `MarkdownComposer`, `PreviewAsLearner`, `QuestionEditor`, `ChoiceEditor`, `LabMetadataForm`, `ReviewDiff`, `RoleGuardDialog`, `LoadingButton`, `FormFieldError`, `ToastProvider`, `ConfirmDialog`, `SaveStatusIndicator`, `EmptyState`, `ErrorState`, `PermissionDenied`.

**Implementation reuse:** if Sprint 4 already created similar components, refactor/wrap them instead of introducing competing toast form modal libraries.

## L. Interaction contract & states

| Action | Idle | Loading | Success | Error |
|---|---|---|---|---|
| Save content draft | `Simpan` | `Menyimpan...` | Inline `Tersimpan` + optional toast on manual save | Keeps text, retry, conflict if stale |
| Submit review | `Kirim Review` | Sending + disabled | Queue confirmation | Inline unmet criteria |
| Publish | Confirmation dialog | Server request | Toast + published route | No optimistic public state |
| Change theme | Current selected | Saving preference subtle | Preview confirmed | Revert UI if save failed |
| Change password | Input form | Updating + disabled | Clear inputs + toast + updated session state | Preserve safe fields, no secret in toast |
| Avatar upload | Preview | Progress bar | Image updates | Restore previous image + error |
| Delete account | 2 confirmations | Async request | Status and logout as appropriate | No false deletion success |
| Role modification | Reauth modal | Updating | Audit event + success | 403 or validation, state unchanged |

## M. Responsive & accessibility
Breakpoints: 1440+ full editor 3 columns; 1024–1439 collapse secondary rail to drawer; 768–1023 topbar condenses; 360–767 touch-first form stack, 44px min interactive controls, no horizontal page scroll; long code blocks scroll inside. Keyboard: visible focus, accessible roles & labels, ESC on dialogs, arrow navigation where expected, no inaccessible drag-only ordering. WCAG AA contrast target; do not communicate only by color, respect OS reduced motion. Localize copy in Indonesian with real validation errors. Test with long usernames, empty avatar and long lesson references.

## N. Visual acceptance
- V4 student pages remain visually consistent with original seven-screen reference, not reimagined.
- Profile hero looks like member's academy journey, not generic admin form.
- Studio prioritizes editorial quality actions over arbitrary vanity metrics.
- Content editor supports 3-column desktop and drawer mobile pattern.
- All settings forms show meaningful status/errors/confirmations.
- No lorem ipsum / fake sample XP, reviews, statuses in runtime.
- Provide Codex screenshots at desktop 1440x900 and mobile 390x844 in both themes for `/studio`, `/studio/content/{id}/edit`, `/profile`, `/settings/general`, `/settings/security`.
