# VulnLab — UI/UX Redesign v8: Learning-first Refinement

**Status:** Siap sebagai spesifikasi implementasi Codex; **belum** diterapkan pada Laravel repository pemilik.

**Cakupan:** Seluruh pengalaman siswa, autentikasi, profil, pengaturan, serta Admin Studio. **Tidak ada perubahan logika bisnis dan tidak ada deployment aaPanel.**

**Referensi utama:** `design/prototype.html` dan screenshot-screenshot di `design/`. Dua screenshot sebelum redesain dari pengguna memperlihatkan hero sangat besar, rangkaian panel progres terpisah, roadmap artwork yang menguasai viewport, dan teks sekunder yang terlalu kecil. Prototype v8 mengganti struktur tersebut tanpa membuang identitas VulnLab.

## 1. Ringkasan keputusan produk

VulnLab adalah *learning product*, bukan SaaS analytics atau template admin. Antarmuka harus mengurangi *time to next meaningful action*: seorang siswa setelah login langsung tahu **apa yang dipelajari berikutnya, mengapa, dan di mana membuka latihan**. Jangan membuat pengguna membandingkan enam angka/progress bar untuk memilih tindakan.

**Masalah saat ini (berdasarkan screenshot):**
1. Beranda: hero setinggi beberapa ratus piksel dengan ilustrasi dekoratif; dua panel besar hanya memberi metrik `1/25 lesson` dan `3 lab / 180 XP`. Tiga area CTA bersaing: hero, kartu lab, dan lanjut belajar.
2. Roadmap: gambar gunung memenuhi hampir seluruh layar desktop; timeline dan panel tahap hanya overlay di atasnya; klik node dan status terkunci butuh kejelasan.
3. Semua halaman: dominasi satu warna navy, border pada hampir semua blok, terlalu banyak ruang kosong yang tidak menambah fokus; informasi kecil sulit dipindai.
4. Progress: `1/270 aktivitas = 0,4%` terasa mengintimidasi ketika pengguna sebenarnya sudah mengerjakan 3 lab. Perlu konteks bahwa `aktivitas roadmap`, `materi`, dan `lab` adalah pengukuran terpisah.
5. Desain baru harus memperbaiki konsistensi feedback sukses/error, navigasi, form, empty states, dan mobile.

**UX principles:** One prominent action per viewport; content before decoration; compact but breathable; clear type hierarchy; high-contrast accessible UI; progressive disclosure; honest real-data metrics; no false "mastery" inferred from pageviews.

## 2. Non-goals dan hard constraints

- Jangan membangun ulang aplikasi; semua perubahan di layer UI/UX, view-model atau adapter tipis bila perlu.
- Laravel 12/React 19/Inertia/TypeScript/MySQL/Docker tetap dipakai. Gunakan repo aktual sebagai sumber kebenaran teknis.
- Jangan ubah API contract, routes publik, auth/session, Laravel policy, model data, status editorial, XP ledger, tabel, migration, status lab atau flag validation hanya demi visual.
- Jangan hardcode statistik demo pada produksi; nilai prototype adalah **contoh visual**. Nilai produksi harus bersumber dari response server yang sudah ada.
- Jangan menaruh endpoint lab rentan atau eksekusi Docker pada aplikasi utama; jangan membuka lab publik.
- Jangan melakukan hosting, DNS, aaPanel, Cloudflare Tunnel, atau firewall pada sprint ini.
- Jangan gunakan screenshot/mockup sebagai `background-image` untuk halaman produksi. Bangun komponen DOM/React nyata dan ilustrasi sebagai asset dekoratif terpisah.
- Jangan me-reset progres, mengubah perhitungan mastery/XP, mengganti primary keys, atau menimpa materi yang sudah diterbitkan.

## 3. Design system

### 3.1 Brand and modes

Aksen inti **#74AAFF**. Gaya **calm technical editorial**: rapi seperti produk developer premium, bukan neon gaming, tidak memakai seluruh konten dalam kartu statistik generik. Top horizontal nav dipertahankan dari aplikasi sekarang, **tanpa sidebar admin global pada learner**. Side panel **kontekstual** untuk daftar modul/catatan/editor diperbolehkan.

| Token | Dark | Light | Maksud |
|---|---|---|---|
| `--bg` | `#071423` | `#F6F8FC` | Canvas |
| `--surface` | `#0D1B2B` | `#FFFFFF` | Surface utama |
| `--surface-2` | `#102239` | `#F2F6FC` | Elevated interactive |
| `--surface-3` | `#152B44` | `#E8EFF9` | Hover/selected |
| `--text` | `#EDF4FD` | `#152238` | Teks utama |
| `--muted` | `#9DB2CE` | `#526782` | Teks sekunder |
| `--border` | `#27415C` | `#DCE5F1` | Border subtle |
| `--accent` | `#74AAFF` | `#3473C7` | CTA/link/focus |
| `--success` | `#54D0AC` | `#087A5D` | Status berhasil |
| `--warning` | `#F4B96B` | `#9D6029` | Status perhatian |
| `--danger` | `#ED8797` | `#BB4D64` | Error |

Mengapa accent light lebih gelap? `#74AAFF` kurang kontras untuk teks kecil di atas putih. **Identitas warna tetap #74AAFF**, tetapi interactive foreground light memerlukan shade aksesibel. Terapkan pemeriksaan WCAG 2.2 AA warna aktual dengan tool, jangan hanya berasumsi.

### 3.2 Typography & spacing

- Font produksi: prefer font yang sudah ada dalam repository; jangan unduh / mengganti font tanpa alasan. Fallback `Inter, Segoe UI, system-ui`. Body 14–16px yang terbaca; metadata 12–13px; teks 11px hanya untuk decorative/meta bukan instruksi inti.
- Heading desktop: H1 30–36px, H2 19–24px, H3 16–19px; huruf tebal dipakai hemat. Reading width 65–75 karakter; line height 1.55–1.7 pada artikel.
- Content max width 1280–1328px, gutters 24px desktop/16px mobile. Skala spacing 4/8/12/16/20/24/32/40/48.
- Radius utama 12–16px; shadow minimal; border hanya membantu grouping, bukan setiap paragraf.
- Button height min 40px, tap target ideal 44×44px; keyboard focus jelas. Disabled, loading, hover, active dan error punya state sendiri.
- Efek gradient dan glow hanya pada hero/roadmap dekoratif; **hindari neon, blur tebal dan banyak ikon ornamental**. Animasi 150–200ms, matikan bila `prefers-reduced-motion`.

### 3.3 Navigation / accessibility

Navbar: Beranda, Roadmap, Modul, Lab, Progres, Catatan, Laporan. Aksi kanan: search (keyboard shortcut optional), light/dark, Settings, avatar/Profile. Beri active underline hanya pada route aktif, bukan tergantung hover. Admin Studio hanya muncul untuk role berizin. Pada mobile: horizontal scroll nav accessible atau menu yang benar-benar bisa dipakai; tidak boleh terpotong tanpa cara menemukan menu lain.

Wajib: semantic landmarks, heading order, label/description pada form, live region sesuai jenis feedback, focus setelah navigasi/dialog, keyboard support, code scroll horizontal, responsif pada 320/375/390/768/1024/1440px, zoom 200%, tes dark/light, empty/loading/error.

## 4. Information architecture: spesifikasi tiap halaman

### 4.1 Beranda — `/dashboard`

**Tujuan:** keputusan belajar dalam 5 detik.
- Top: hero **maksimal 260–300px**; sisi kiri headline + deskripsi + 1 CTA utama "Lanjutkan Belajar" dan secondary "Lihat Roadmap". Sisi kanan ilustrasi pegunungan sangat ringan, **bukan konten pokok**. Hero tidak boleh menelan satu viewport.
- Di samping hero: "Hari ini" berupa 3–4 prioritas actionable, bukan semua 270 checklist. Sumber prioritas diambil dari roadmap + prerequisite + unfinished lessons/labs; tidak mengarang tugas.
- Di bawah: **satu strip ringkasan kompak** untuk materi selesai, lab solved, XP, hari roadmap. Tiap metrik punya definisi dan tautan detail.
- "Lanjutkan dari terakhir" sebagai satu blok utama dengan level, judul, status tersimpan, CTA. "Langkah berikutnya" memuat satu lesson dan satu lab berdasarkan eligibility.
- Jika belum membuat roadmap: gunakan satu empty-state ber-CTA "Buat Roadmap 90 Hari"; **jangan duplikat form di dashboard dan roadmap**. Jika data belum ada, tampilkan `—`, bukan angka fantasi.
- Jangan tampilkan box besar full-width untuk "1/25 lesson" dan "3 lab".

### 4.2 Roadmap — `/roadmap`

**Tujuan:** lihat posisi dan tindakan berikutnya, bukan menikmati gambar besar.
- Landscape gunung tetap sebagai identitas, tapi ubah menjadi **banner dekoratif 140–180px** di desktop (mobile 80–120px).
- Timeline 5 tahap ditempatkan **di bawah artwork** dalam komponen terstruktur yang selalu bisa dibaca. Tiap tahap: nama, rentang hari, state (`active`, `available`, `locked`, `completed`), actual completion dari server.
- Sebelah kanan: panel tahap dipilih dengan 2–4 tugas prioritas, prerequisite, CTA nyata. Jangan sembunyikan progress behind artwork.
- Pengukuran: roadmap aktivitas ditampilkan sebagai `n/270`, namun sederhanakan konteks ke "hari ini" dan `n/90 days completed` agar pemula tidak merasa zero progress ketika labs sudah solved.
- Interaksi: klik stage mengganti detail tanpa mengubah status server; tahap terkunci boleh dilihat informasinya tetapi CTA disabled disertai alasan/prerequisite. No false unlock/XP.
- Weekly schedule, adjust date/timezone, tasks table diletakkan setelah initial fold atau di collapsible section; tidak muncul sebagai form panjang di atas.

### 4.3 Modul — `/modules`, `/modules/{slug}`, lesson view

**Tujuan:** nyaman membaca, cepat memahami, dan mengerjakan kuis.
- Catalog: headline sederhana, filter jalur/tingkat, modul ditampilkan sebagai list atau grid editorial dengan indikator prasyarat dan progres; jangan grid 12 dashboard stats.
- Lesson view desktop: left chapter list 200–240px, center article min 600px jika viewport cukup, right references rail 200–220px opsional; pada layar kecil sidebar chapter menjadi drawer/collapse dan sources menjadi accordion.
- Article: objective, analogi, konseptual, real HTTP request, common pitfall, mitigasi, 1–3 checkpoint interaktif, pembahasan, sumber + tanggal editorial review. Copy code button. Code block bergaya developer dengan overflow, **tidak menjalankan payload real di production**.
- Kuis melalui backend, tidak menaruh answer key pada bundle frontend sebelum submission; hasil quiz punya panel feedback, retry dan penjelasan sesuai kebijakan konten.
- Marked-read, quiz-passed, lab-solved adalah status berbeda. Pembelajaran dari OWASP/PortSwigger/MDN harus mencantumkan URL spesifik yang valid; gunakan materi asli dari database.

### 4.4 Lab — `/labs` dan `/labs/{slug}`

**Tujuan:** tahu skill yang diuji lalu bisa praktik dengan aman.
- Catalog: filter + searchable, clean lab tile dengan level, perkiraan durasi, prerequisite, status, CTA. Card density medium, hindari gradien penuh setiap tile.
- Workspace: split 38/62 desktop; area kiri scenario / tujuan / progress step / hints/flag; kanan HTTP editor / response / history / environment status. Minimum horizontal scroll untuk raw request, tidak membuat body melebar.
- Tampilkan status yang benar: start, starting, running, unavailable, expired, solved; response 200/4xx/503 **ditampilkan sebagai data nyata dari backend**, bukan dikarang client.
- Submit flag sukses -> completion dialog jelas (actual XP), invalid -> inline dekat field, rate limited -> cooldown. Reset harus punya confirm dialog. Workspace pada tablet/mobile menjadi tabs "Instruksi" dan "HTTP".
- Jangan mengubah sandbox isolation, restriction, allowlist, flags, data dummy atau runner contracts.

### 4.5 Progres — `/progress`

**Tujuan:** memahami skill yang dibuktikan dan kegiatan yang dilakukan.
- Strip ringkas: completed lessons/quizzes, labs solved, XP, active days. Batasi empat metrik di atas fold.
- Activity trend + skill evidence dibagi dua area; filter 7/30/90 hari, tooltips, empty-state, render as accessible chart/table.
- Tidak boleh menyebut persentase kompetensi dari konten dibaca saja. Bedakan knowledge/practice, jelaskan rumus dari backend. Small streak/achievements section di bawah, bukan 8 cards.

### 4.6 Catatan — `/notes`

**Tujuan:** simpan konsep, eksperimen, dan referensi, temukan ulang.
- Desktop: searchable notes list pada rail kiri 260–300px; Markdown editor + toolbar minimal di kanan; note title, tag, lesson/lab link, last saved status.
- Autosave: status `Unsaved → Saving → Saved` inline dekat judul, tidak toast terus-menerus. Konflik save, offline dan retry memiliki pesan jelas; jangan menghapus draft yang gagal disimpan.
- Markdown preview sanitasi; akses sesuai owner. Mobile list dan editor ditampilkan bertahap, bukan dua kolom sempit.

### 4.7 Laporan — `/reports`

**Tujuan:** belajar menulis bug report berkualitas.
- Kiri tabs/filter Draft / Internal Review / Accepted for Practice, tengah report builder terstruktur, kanan tips singkat yang bisa ditutup.
- Urutkan field: title, category/CWE, lab, severity, summary, reproduction, expected, actual, evidence, impact, remediation, references. Auto-save and validation yang terlihat jelas; export Markdown/HTML/PDF sesuai fitur server yang ada.
- Gunakan istilah **"Review Internal VulnLab"**, bukan diterima program HackerOne/Bugcrowd kecuali ada verifikasi integrasi nyata.

### 4.8 Login/Register/Forgot Password

- Tetap desain v7.1: split editoral premium dengan sisi informasi dan form, **hindari kolom kosong sangat besar**. Kiri menampilkan benefit konkret dan kode dekoratif hanya bila berguna; kanan memiliki form di tengah dengan label, password toggle, pesan field-level, redirect dan recovery.
- Responsive: informasi panjang disembunyikan atau dilipat pada mobile; prioritas form. Gunakan `#74AAFF` hanya tombol/focus/highlights; tidak semua teks berwarna biru.
- Tidak ubah rate limit, session, authentication, CSRF, registration safeguards.

### 4.9 Profil — `/profile`; Settings — `/settings`

- Profile: banner kecil, avatar, bio, badges, XP, mini skills, edit profile; jangan copy user data ke dashboard.
- Settings: navigasi kontekstual untuk Account, Security, Preferences, Notifications, Privacy & Data; real validation dan backend save. Protected reauthentication pada sensitive actions, jangan tampilkan password/token.

### 4.10 Admin Studio — `/admin`

- Gaya sama (brand/token/type) tetapi utilitarian editorial: content queue, lesson editor, quiz builder, lab metadata, roadmap CMS, user roles, review history. Sidebar konteks admin boleh jika mempermudah kerja editor, tetapi learner tetap nav horizontal.
- Gunakan tabel efektif dengan search/filter/pagination/status. Draft/review/publish harus tetap melalui authorization & audit trail. Jangan membuat UI yang seolah-olah admin bisa memodifikasi runtime executable lab langsung.

## 5. Reusable components / implementation architecture

Prefer existing component library and Tailwind design tokens. Do not install new UI library purely for visuals.

| Component | Responsibility |
|---|---|
| `AppShell` | Sticky top nav, active route, user menu, theme, search |
| `PageHeading` | Consistent kicker, H1, description, context actions |
| `ProgressSummaryStrip` | Compact real metrics with link to definitions |
| `ContinueLearningPanel` | One resume CTA, driven by current recommendation |
| `RoadmapStageTimeline` | Semantic stage navigation and optional locked reasons |
| `RoadmapDailyPlan` | Prioritized day tasks and correct progress |
| `LessonLayout` / `ReferenceRail` | Responsive article reading with primary sources |
| `LabCatalogFilters` / `LabWorkspaceSplit` | Catalog + safe runner client UI |
| `EvidenceSkillChart` / `ActivityChart` | Assessment-derived skills and learning events |
| `NotesWorkspace` / `AutosaveIndicator` | Note list, editor, save lifecycle |
| `ReportBuilder` / `ReportWritingHints` | Secure structured report authoring |
| `FormField` / `Toast` / `ConfirmationDialog` | Accessible feedback consistent across pages |
| `ProfileHeader` / `SettingsSections` | Learner identity and settings |
| `AdminContentTable` / `EditorialStatusTag` | Editorial CRUD & status clarity |

Styling must be centralized via CSS custom props or Tailwind token config. No fixed demo copy/values in production components. Do not add screenshot images as backgrounds. Illustration may use accessible SVG marked decorative (`aria-hidden`) and not carry critical text.

## 6. Mapping & integration into existing application

1. **Audit actual source**: route names, Inertia page components, layouts, controllers and props, color vars, existing states, responsive breakpoints; document findings before changes.
2. Introduce new design tokens and shared UI components; keep route contracts unchanged.
3. Refit learner global shell, home and roadmap. Build and screenshot compare against `design/prototype.html`.
4. Refit modules and labs, ensuring module grading and lab runner still use real backend.
5. Refit progress, notes, reports, profile/settings and admin.
6. Refit auth screens to same tokens without modifying security flow.
7. Run regression/security tests, add browser screenshot tests, inspect viewport and zoom, fix regressions.

**Data/contract policies:** no destructive migration; no reseed existing users; no duplicate XP; no fake statuses; no unauthorized note/report access; admin private learner notes remain inaccessible without established approval; lab endpoints remain only in isolated runner. Any missing existing API field must be presented as empty/disabled state, not fabricated.

## 7. Acceptance criteria / Definition of Done

- [ ] All 7 main menu routes redesigned + login/register + profile/settings + admin overview/editor at least.
- [ ] User can understand main action on Dashboard without scrolling.
- [ ] Roadmap scene ≤180px desktop and doesn't overlay essential text; timeline/stage is keyboard navigable.
- [ ] `1/270` checklist, `1/25` lesson, `3/8` lab numbers never conflated; explanations present.
- [ ] No static/mock numbers on production UI; all depend on backend real data.
- [ ] Content remains 25+ curriculum/quiz database records; no lesson overwrite or progress reset.
- [ ] Validations, async state, autosave, error/success feedback are visible and consistent.
- [ ] Light and dark mode contrast checked, focus states, 320px/390px/768px/1440px and 200% zoom tested.
- [ ] No horizontal page overflow; HTTP/code editors scroll within their areas.
- [ ] No auth/authorization/security policy regression, no elevated privileges, no public lab runner.
- [ ] Relevant PHP/Vitest/TypeScript/E2E tests executed and actual logs reported.
- [ ] Before/after screenshots delivered for every main page; remaining visual differences explicitly listed.
- [ ] Hosting/aaPanel left untouched.

## 8. Testing evidence and release gate

`qa/UI_QA_MATRIX.csv` lists manual/automated scenarios. Use actual authenticated accounts and local fixtures. Include keyboard-only, reduced motion, 200% zoom, field errors, dark/light, Safari/Firefox if available, Playwright Chromium otherwise. Preserve owner isolation for user-generated notes/reports. Check regression against Sprint 6 readiness tests and additional lab/content expansion if already implemented. **Do not call a page "done" merely because CSS looks cleaner.**

**Expected outputs from Codex:** `docs/ui-v8/IMPLEMENTATION_REPORT.md`, screenshot folder, test command/result table, visual-diff notes, remaining P1/P2 issues, and recommendation on whether this redesign passes RC UI gate.
