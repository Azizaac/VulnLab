# Seven Page UI Blueprints — v4, directly mapped to visual-reference.png

**Artwork interpretation:** the reference is a 1672×941 montage of seven desktop screens. Each panel illustrates **its own full page**. The layout below extracts the intent in functional desktop CSS. Do not copy garbled microscopic text: this spec provides canonical Indonesian labels.

## 0. Shared application shell
- Desktop header: near-white header in light; ink navy in dark; slim shield icon and `VulnLab` left; `Beranda · Roadmap · Modul · Lab · Progres · Catatan · Laporan` centered/left; search, optional functional notification, theme and avatar right. Blue underline for active page.
- Body starts directly under nav. Header height approx 56–64 px. Max width 1440px. Narrow typography and low card density. 12–20px natural grid gaps.
- Page-specific header links must preserve actual client-side navigation and focus, including mobile bottom-nav and `Lainnya` menu. Empty, loading, error, offline and first-user states are part of each page.
- `Roadmap`, `Lab`, and `Catatan` are illustrated in dark theme in the poster; they **must also support light theme** with contrast-appropriate palettes, while home, learning, progress, reports must likewise support dark.

## 1. Home — panel ① — `/dashboard`
**First impression:** inviting explorable classroom, not analytics. Light sky blue/violet hero image uses academy observatory at right, rocky landscape, clouds and curved blue star arc. At left large exact greeting **`Halo, Hacker Muda! 👋`**. Two explanatory lines: `Terus belajar, terus eksplorasi, dan jadilah lebih baik setiap hari. Dunia digital lebih aman dengan kamu di dalamnya.` Optional quote at upper right: `Skill hari ini, keamanan yang lebih baik untuk esok.`

**Placement:** illustrated banner upper ~42% of content height; search field over lower left of illustration `Apa yang ingin kamu pelajari hari ini?`. Below banner, horizontally aligned two panels: navy **`Lanjutkan Belajar`** (~60% width) with actual bar, lesson name and vivid CTA `Lanjutkan`; light **`Langkah Berikutnya`** (~40%) with exactly two next tasks, status circles and arrow. Below these, heading `Akses Cepat` and **four compact outlined action tiles** `Mulai Roadmap / Jelajahi Lab / Lihat Modul / Baca Catatan`, each with its own pastel circular icon, brief one-line description and working link.

**Logic:** new user shows `Mulai dari HTTP` and 0%; returning user shows real next lesson. Search handles real 25 lesson titles. No fake 60% defaults. Buttons real. Whole hero text HTML, illustration decorative and original.

## 2. Roadmap — panel ② — `/roadmap`
**First impression:** **deep midnight blue mountain adventure map** with star sky, glow at far mountain peak, lake/trees/tents/rock silhouettes; luminous cyan serpentine path running bottom-left → upper-right; 5 numbered circular stage markers with progress ring and stage labels.

**Hierarchy:** left upper heading **`Roadmap 90 Hari`**, subheading `Dari dasar hingga siap berburu bug bounty.` Right top segmented switch `90 Hari / 6 Bulan / 1 Tahun` but only functional selectable modes are shown; 90 days backed by seeded data. Five stage labels (grouping 90 days without discarding any daily tasks): `Dasar Keamanan Web`, `Eksplorasi Web`, `Advanced Topics`, `Bug Bounty Practice`, `Siap ke Dunia Nyata`. Stage nodes show locked/current/done and keyboard activation. **Right floating dark drawer** titled `Detail Tahap`: stage number, day range, concise outcomes, four or more checkable goals, bottom bright-blue `Lihat Modul di Tahap Ini →`.

**Content model:** 90 seeded days mapped to 5 stage segments (~day 1–18,19–36,37–54,55–72,73–90; update exact boundaries in stage config). Clicking stage exposes all actual days/tasks via drawer/list, with theory/practice/reflection and sources. Screenshot illustration remains aesthetic, overlay elements interactive HTML. On mobile, provide vertical journey with same 5 stages and expandable days, plus image header.

## 3. Learning Modules — panel ③ — `/learning/{slug}`
**First impression:** structured three-column course reader. Left white/pale-blue course outline `Web Security Fundamentals` and progress bar; numbered chapter rows and blue active lesson. Center article starts with breadcrumb `Web Security Fundamentals > SQL Injection > Jenis dan Teknik`, blue `3.2` step chip, title **`Jenis dan Teknik SQL Injection`**, short beginner-friendly introduction, duration badge and `Mudah` level badge. Tabs below `Materi / Contoh Kode / Referensi` (add Diskusi only if real capability). Code block inside dark navy editor-style card with copy control and basic syntax highlighting; footer purple-tinted `Quiz Cepat` callout/button. Bottom prev/next buttons, e.g. `Materi Sebelumnya` / `Lanjut ke Lab Praktik →` only if the linked lab is appropriate and actually available. Right box `Sumber Terpercaya` listing official OWASP, PortSwigger, MDN/MITRE **as appropriate to the current lesson** with external links.

**Critical:** SQL Injection is a screenshot sample, not the only lesson or a forced first page. All 25 seeded lessons open individually. Prose readable 680–760px center area. Answers for quiz remain server-side until submission. No invented verification badge; show real source citations and draft/review status. Narrow layout: lesson outline collapses to drawer, sources to accordion.

## 4. Lab Workspace — panel ④ — `/labs/{slug}`
**First impression:** dark, immersive security editor with right request/response diagnostics. Breadcrumb at top `Lab > Web > [Topic] > [Current lab]`. Clear lab title, difficulty (`Mudah / Menengah / Sulit`), real estimated duration. Main zone **~43:57**. Left pane with tabs `Deskripsi / Petunjuk / Solusi` (the full solution explicitly revealed only after confirmation or completion), `Tantangan` explanation, `Target` chip for **internal lab URL only**, step checklist under `Tujuan`, progressive `Hint (1/3)` yellow hint button, and bottom flag input + vivid `Kirim Flag`. Right pane request editor with Request/Response tabs, method dropdown, internal URL, `Send`, Header/Params/Body tabs, monospaced request editor, actual response status/latency and syntax-highlighted body.

**Status:** if sandbox not yet deployed, show workspace preview with `Sandbox belum berjalan` and disabled Send/Flag. Do not show fabricated 200 OK. A real running lab is isolated disposable dummy environment; answers verified server-side and cannot escape to external URLs. Mobile tabs break panes into `Instruksi`, `Request`, `Response`, `Flag`.

## 5. Progress — panel ⑤ — `/progress`
**First impression:** bright compact illustrated analytics without stale stats. Main title `Perkembangan Belajarmu`, subtitle `Setiap langkah kecil membawa dampak besar. Terus konsisten!`; filter real `7 Hari Terakhir`. Top row: streak white card with fire graphic and 7 weekday dots; journey progress card with blue mountain/flag illustration and authenticated roadmap percentage. Middle two balanced white cards: `Peta Skill` with accessible radar plus text score table, and `Aktivitas Mingguan` with grouped bars for real modules/labs/catatan. Bottom `Pencapaian Terbaru` small icon achievement cards.

**Data:** 0, no achievements, and explanatory empty state for new user; streak timezone Asia/Jakarta; visual values never hardcoded from screenshot. Cite metric definitions in UI tooltips. Each chart conveys data by text, not color alone. Dark theme restyles white surfaces.

## 6. Notes — panel ⑥ — `/notes`
**First impression:** dark Obsidian-like knowledge library. Top title `Catatan Saya`, short subtitle `Simpan pemikiran, temuan, dan referensi pentingmu.`, inline search field and bright blue `+ Catatan Baru`. Main two-column explorer: left note library approx 42% with nested category list `Semua, Web Security, Bug Bounty, Cheat Sheet, Tools, Personal, Arsip` + actual counts and selectable note title list with short excerpts, selection blue outlined. Right editor approx 58%, note title (e.g. `SQL Injection Notes` **as sample only**), chips `Web Security`, `SQLi`, `Payload`, `+ Tag`, `Edit/Preview`, Markdown editor with dark monospaced code fences, toolbar, link to associated lesson, bottom reference area.

**Backend:** create/update/delete notes, private authorization, optimistic version/409 conflict, autosave visible states `Menyimpan...` / `Tersimpan` / `Gagal menyimpan`. Sanitized markdown preview. On small screen show note list and editor as separate routes/panels with Back. Sample note titles only from actual user notes or explicit demo seed, never pretend to be user-owned data.

## 7. Reports — panel ⑦ — `/reports/{id}`
**First impression:** clean light report writing workspace with blue top action `+ Laporan Baru`. Heading **`Buat Laporan Bug Bounty`**, subheading `Susun laporan yang jelas, profesional, dan mudah dipahami.` Under heading status tabs (for locally evaluated training documents) `Draft / Sedang Ditinjau / Perlu Revisi / Selesai`. Main form approx 72%: input `Judul`, severity `Tingkat Keparahan`, `Ringkasan`, `Langkah untuk Reproduksi` textarea with numbered helpful placeholder, `Proof of Concept (PoC)` code textarea, side-by-side `Dampak` and `Rekomendasi`. Bottom `Simpan Draft` and `Evaluasi Laporan` / `Unduh Markdown` (depending real feature). Right narrow light-blue help section **`Tips Laporan yang Baik`** with checklist, and separate **`Status Laporan`** timeline reflecting LOCAL PRACTICE ONLY.

**Do not lie:** no button implying a report was submitted to HackerOne, and no fake acceptance/rejection by real programs. If simulation status references are displayed, label `Simulasi latihan`. The rubric grades clarity, reproducibility, evidence, impact, and mitigation without claiming a real bounty.

## 8. Cross-page states and content fidelity
All screens need states `loading / empty / partial / success / error`, and functional nav. No generic coming-soon. Technical lab unavailable state is allowed *and must say so*. Every CTA wired to a real route; disabling must have explanation. Hero and chart illustration are aesthetics, but not source of knowledge or progress.

## 9. Responsive implementation rules
At >=1280px, display full proportions. At 1024px, adjust columns without clipped sources or editor. Below 768px: header compact and bottom nav; home cards stack; roadmap transforms to vertical stage timeline/list; lesson sources fold into accordion and outline into expandable course list; lab uses workspace tabs; progress charts stack; notes become list/detail; reports help becomes collapsible. At 390x844, no horizontal page overflow or hidden primary submit button. Keyboard at 200% zoom remains operable.
