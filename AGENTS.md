# VULNLAB — MASTER PRD & CODEX PROJECT MEMORY (CANONICAL)

> **Versi konsolidasi:** 2026-11-12 · **Cakupan:** keputusan PRD awal, v1.1, v2, v3, v4/v4.1, v5, Sprint 6, Sprint 7 planning, ekspansi v7.1, v8 yang DITOLAK, dan v9.  
> **Tujuan file ini:** satu sumber acuan proyek untuk Codex di root repository (`AGENTS.md`). Ini adalah **konsolidasi keputusan dan persyaratan**, bukan klaim bahwa seluruh fiturnya sudah selesai.  
> **Aturan prioritas:** kode/database/test yang benar-benar ada = fakta implementasi; keputusan produk **terbaru yang disetujui** dalam dokumen ini = target; PRD/ilustrasi lama yang bertentangan = riwayat, bukan instruksi aktif.

## 0. Instruksi tetap untuk setiap sesi Codex (WAJIB)

1. **Kerjakan repository VulnLab yang ADA.** Jangan `create-project` ulang, ganti stack, rewrite backend, hapus desain yang disetujui, atau mengganti seluruh aplikasi karena tugas UI.
2. **Baca kondisi nyata sebelum mengubah apa pun:** `composer.json`/`composer.lock`, `package.json`/lockfile, route Laravel, Inertia pages, models, migrations, policy, seeder, admin CMS, runner, tests, Git diff/history, database dan frontend yang benar-benar sedang disajikan. Jangan menganggap draft PRD = fitur berjalan.
3. **Jaga data:** jangan `migrate:fresh`, `db:wipe`, `DROP`, `truncate`, seed ulang user, menyetel XP secara manual, menimpa revisi materi/soal yang sudah memiliki attempt, atau `git reset --hard`. Migrasi harus additive/forward-safe; buat snapshot sebelum perubahan data dan uji restore pada database disposable.
4. **Jangan menyentuh hosting** (aaPanel Ubuntu rumah, DNS, Cloudflare Tunnel, firewall, domain, production DB, atau Docker host live) tanpa permintaan dan persetujuan spesifik. Pengembangan/QA hanya di lingkungan lokal atau staging yang sudah diizinkan. Jangan mengaktifkan vulnerable labs di server aplikasi utama.
5. **Keamanan inti dan latihan dipisah ketat.** Laravel core (auth, penilaian, XP, CMS, user data) wajib aman. Celah sengaja hanya pada lab terisolasi dengan dummy data, scope endpoint terbatas, bukan core/production.
6. **Jangan mengarang hasil:** tidak ada progress fiktif, respons HTTP lab palsu, data statistik dummy dalam produksi, claim expert-reviewed tanpa reviewer, atau klaim test/deployment sudah PASS bila belum dieksekusi. Bedakan `planned`, `draft`, `imported`, `published`, `runtime-verified`, `learner-visible`.
7. **Jangan memaksa satu eksekusi terlalu besar.** Boleh satu instruksi multi-tahap, tetapi implementasikan per slice yang bisa dites; simpan `docs/implementation/CONTINUE_HERE.md` bila perlu agar sesi berikutnya bisa lanjut tanpa kehilangan konteks.
8. **Rilis tanpa bukti = NO-GO.** Jalankan suite yang relevan (Laravel SQLite + MySQL, ESLint, TS/Vite, Vitest, Playwright, QA runner/isolation). Laporkan perintah dan PASS/FAIL/SKIP/NOT RUN sesuai kenyataan.
9. **Prioritas visual paling baru:** pulihkan desain **pre-V8** yang disetujui (V4 illustrated roadmap dan komposisi premium). Desain V8 yang berupa gunung poligon datar, garis putus-putus sederhana, dan halaman kotak besar kosong **DITOLAK**. Jangan memakai V8 sebagai desain target.
10. Bahasa UI dan materi untuk pembelajar: **Bahasa Indonesia natural, mudah dibaca, akurat**, istilah teknis dijelaskan, referensi resmi dicantumkan. Kode/komentar internal boleh English. Keluaran QA/penjelasan perubahan sebaiknya Bahasa Indonesia.

## 1. Identitas dan visi produk

- **Nama:** VulnLab, platform belajar cybersecurity dan Bug Bounty Web & API; bukan sekadar toko web rentan.
- **Target utama:** pembelajar pemula–menengah dengan dasar web development; latihan sekitar **2 jam/hari**, ingin mampu hunting legal pada program bug bounty berbayar. Pendapatan dari bounty tidak dijamin.
- **Nilai produk:** `Pelajari konsep → Lihat contoh HTTP → Kerjakan kuis → Praktik pada lab lokal berizin → Catat temuan → Tulis laporan → Ukur kemampuan nyata → Lanjut roadmap`.
- **USP:** kurikulum sumber tepercaya yang mudah dipahami, guided hands-on dengan secure-vs-vulnerable comparison, progres berbasis bukti, dan workflow laporan yang realistis.
- **Pengguna:** learner, author/editor, technical reviewer/publisher, admin/operator. Semua izin divalidasi **server-side**.
- **Non-goals:** mesin hacking ke domain sembarang; scanner massal/internet; lab yang terhubung DB produksi; website penuh konten AI tanpa review; XP hanya karena melihat halaman; badge yang mengklaim sertifikasi profesional; laporan internal yang diklaim sebagai payout eksternal.

## 2. Status proyek dan kebenaran data (jangan berasumsi)

- **QA historis 25 Okt 2026 (laporan Codex, bukan audit independen):** Laravel 12.70.1/PHP 8.4.27/React 19/MySQL 8.4.13/Node 24.19.0/Chromium 156; loopback lokal. Dilaporkan 103 backend test PASS di SQLite, 103 di MySQL (masing-masing 2.106 assertions), 11 unit frontend PASS, 48 kombinasi browser PASS setelah retest, 8/8 lab lokal lulus, 0 open P0/P1. **Tidak membuktikan perubahan v7.1–v9 atau server saat ini lulus.** Verifikasi versi, commit dan tests aktual.
- Pengguna kemudian melihat **10 modul dan 8 lab** serta menolak hasil visual V8. Target ekspansi: **10 learning paths, 35 published lessons, 80 available quiz questions, 20 playable local labs**. 10 paths ≠ 10 lessons. Draft/manifest bukan published atau playable.
- Status domain/host yang mungkin sudah aktif tidak otomatis mengizinkan public labs. Pada awal tugas audit branch/commit, local vs hosted runtime, count per editorial/runtime status, dan database yang digunakan. Jangan menganggap desain/prototype berarti kode final berjalan.


## 3. Teknologi, codebase, dan pemisahan sistem

**Stack yang dipertahankan:** Laravel 12 (atau versi aktual di lockfile), PHP, Inertia + React + TypeScript, Tailwind CSS, MySQL 8.x, Vite, Docker Compose lokal untuk dev/lab, UI components reusable. Jangan membuat aplikasi Node frontend terpisah bila frontend Inertia sudah dipakai. Pakai library aktual yang sudah terinstal bila sesuai.

**Arsitektur logis:**

```text
Browser (React/Inertia, horizontal learner nav)
        | Laravel routes + authenticated server actions
Laravel secure CORE: Auth/RBAC, Learning/CMS, Quiz grading,
 Roadmap, Notes, Reports, Progress/XP, Lab orchestration API
        |                          |
      Core MySQL              private runner ADAPTER (allowlisted)
      Core storage                 |
                         Isolated training VM/containers
                         Vulnerable + Secure VulnShop fixtures
                         Dummy DB, session-bound verifier/reset
```

- `APP_DEBUG=false`, safe cookies/CSRF/CSP, protected private evidence, secure Markdown; never include flags or answer keys in the built JS bundle.
- HTTP request console in labs **bukan proxy generik**. Allowlist lab endpoint tertentu; reject arbitrary host, redirect keluar, metadata IP dan internal services; batasi size/timeouts, auth, rate limit, dan concurrency.
- Vulnerable training services: private Docker networks, no Docker socket, no privileged container, no core DB, no host mounts/secrets, restricted outbound traffic, resource/PID/time limits, isolated per-session dummy fixtures; stronger VM/host separation before any public lab access.
- Backend progress, flag validation, quiz grading, XP, achievement, role/publish transitions adalah authoritative server events; frontend menampilkan saja.
- API/DB/field/route harus disesuaikan ke **yang sudah ada**; tabel pada PRD adalah logical contract, bukan instruksi menambah tabel duplikat.

## 4. Navigasi dan peta halaman (fitur akhir)

**Learner top navigation (horizontal):** Beranda `/dashboard`, Roadmap `/roadmap`, Modul `/modules`, Lab `/labs`, Progres `/progress`, Catatan `/notes`, Laporan `/reports`. Toolbar: search, theme toggle, notification, profile dropdown. Di mobile pakai drawer/compact menu. Profil `/profile`, Settings `/settings/*` dan Admin Studio `/studio/*` hanya sesuai otorisasi. Path aktual boleh beda jika route existing stabil; jangan membuat duplikasi tanpa migrasi/redirect yang jelas.

**Beranda:** hero ilustrasi premium compact (maks ~1/3 viewport awal), CTA resume berbasis prerequisite, aktivitas hari ini, angka ringkas lesson/lab/XP/roadmap dari DB, rekomendasi relevan; onboarding untuk akun baru, tanpa KPI palsu atau kartu kosong.

**Roadmap:** 90 hari × 120 menit (20 teori/70 praktik/30 catatan); 5 milestone ×18 hari dengan dependensi/status nyata di peta pegunungan malam detail + jalur bercahaya. Panel tahap ringkas, checklist & kalender 90 hari terpisah, persistensi per user/timezone. Self-check tidak memberi XP; perubahan jadwal tidak menghapus progress.

**Modul:** 10 paths dengan sections, durations, prerequisites, review status dan progress. Reader: TOC collapsible, artikel ~680–760px, panel sources/labs. Setiap lesson: tujuan, analogi, HTTP dummy, mekanisme, false positive, mitigasi, kuis server-side, lab/notes, sumber, “Belum paham”, previous/next.

**Labs:** katalog search/filter/difficulty/status/availability/prereq/XP; workspace instructions/hints kiri + HTTP request/response/history kanan; real session/reset/proof/secure comparison. Benar → modal XP server, salah → inline error, offline → 503/retry tanpa fake success.

**Progres:** summary, aktivitas 7/30/90 hari, real time-on-task bila tercatat, streak per timezone, competency/radar (Web, Auth, Access Control, API, Injection, Business Logic, Recon, Reporting), XP ledger, level, achievements, empty states. Kemampuan berdasarkan bukti kuis/lab/report, bukan klik membaca.

**Catatan:** knowledge workspace private: buat/edit/hapus/cari/tag/pin, Markdown aman dengan preview, tautan ke lesson/lab, autosave/debounce, status “Belum disimpan/Menyimpan/Tersimpan/Gagal”, konflik versi, retry, jangan hilangkan draft karena network error; jangan toast tiap autosave.

**Laporan:** builder laporan latihan (bukan submit eksternal): daftar + filter, draft/editor/review/status, type/CWE, target lab dummy, severity, summary, repro steps, expected vs actual, sanitized PoC/evidence, impact, remediation, refs, Markdown + export aman. Status internal: Draft → Ready for Review → Under Internal Review → Needs Revision / Accepted for Practice → Archived. Panduan reviewer dan quality rubric; tidak menyebut “diterima HackerOne” tanpa integrasi nyata.

**Login/Register/Reset:** implementasi auth Laravel yang sudah ada; desain split/editorial dari v7.1, dua kolom seimbang, form terlihat tanpa scroll tidak perlu, `#74AAFF` sebagai aksen, jangan banner navy polos raksasa. Field-level validation, password visibility, forgot/reset, secure sessions, generic response untuk akun tidak ada, loading/submission protection, mobile & light/dark.

**Profile:** avatar, nama tampilan, username, bio singkat, joined date, skill/XP/achievement berdasarkan data nyata, edit aksesibel, personalisasi/privacy; tidak membocorkan catatan atau report privat.

**Settings:** Account, Security (ubah password, reauth, session revocation, 2FA jika benar didukung), Appearance (light/dark/system), Learning (timezone, target belajar), Notifications, Privacy & Data (export dan alur penghapusan yang dapat diaudit). Perubahan privat wajib terotorisasi dan diberi konfirmasi jelas.

**Admin Studio (terpisah dari UI learner):** dashboard editorial, module/lesson CMS, Quiz Builder, lab catalog metadata + hint/publish state, Roadmap Builder, review queue, user/role management, revision history/audit. Admin tidak otomatis dapat membaca Notes/Reports pribadi milik learner. CMS tidak boleh mengunggah kode runtime lab arbitrer atau memasang container dari UI.

## 5. Desain & aturan visual FINAL (memperbaiki regresi V8)

- **Sumber visual disetujui:** V4 original seven-screen poster dan screenshot **pre-V8** Dashboard/Roadmap. **V8 flattened redesign DITOLAK**. Jangan mengacu gambar “rejected V8” sebagai tujuan. Jika artwork lama tidak tersedia di repo, cek Git history/asset, lalu laporkan gap; jangan diam-diam mengganti dengan puncak segitiga generik.
- Learner memakai top navbar horizontal, **bukan admin sidebar generik**. Admin boleh punya layout editorial sendiri bila meningkatkan efisiensi. Setiap halaman punya identitas fungsional (reading/editor/lab/report) bukan template kartu statistik berulang.
- Dark premium, clean dan profesional: primary accent `#74AAFF` **secukupnya**, background awal `#071525`, secondary `#0D1C30`, elevated `#11243D`, text `#E8F1FF`, muted `#9CB0CC`; sesuaikan contrast secara nyata. Light mode tetap didukung; untuk teks kecil di latar putih, gunakan biru yang lebih gelap daripada `#74AAFF`.
- Tipografi minimal 16px body, usahakan 14px+ untuk teks sekunder; jelas, modern, tidak terlalu kecil. Responsive 320/390/768/1280/1440px; focus-visible, keyboard navigation, 200% zoom, reduced motion, `aria-live` notifications, color contrast WCAG AA sesuai konteks.
- Hero/illustration berfungsi sebagai suasana, jangan mengambil seluruh viewport. Kartu hanya bila membentuk unit informasi; hindari full-width empty boxes, whitespace berlebihan, ikon/glow ramai, gradient neon, border pada semua elemen, dan fake static status.
- Roadmap punya ilustrasi pegunungan malam **berlapis/detail**, 5 checkpoint di jalur sinar bercahaya, panel tahap + kalender/checklist terpisah; jangan mengganti jadi grafik poligon datar/garis putus-putus. Interaksi milestones harus real React/semantic buttons di atas artwork, bukan screenshot dengan hotspot palsu.
- UX feedback global: toast yang terlihat jelas untuk action penting (success/error/warning/info), validation inline di form, focus field invalid, loading states, disabled duplicate submits, confirm destructive actions, lab completion modal, quiz result detail, retry saat gagal. Success hanya setelah response server berhasil. Error 401/403/404/422/429/500/503 dan offline harus human-friendly tanpa stack trace.
- Capture **screenshot browser aplikasi yang berjalan** desktop dan mobile sebelum/selepas perubahan. Asset prototype/demo tidak otomatis mewakili implementasi. Lakukan visual comparison sebelum menyatakan UI selesai.

## 6. Learning engine: sumber, materi, kuis, editorial

**Sumber primer:** [OWASP API](https://owasp.org/API-Security/), [WSTG](https://owasp.org/www-project-web-security-testing-guide/), [Cheat Sheets](https://cheatsheetseries.owasp.org/), [PortSwigger](https://portswigger.net/web-security), [MITRE CWE](https://cwe.mitre.org/), [MDN HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/); Laravel docs jika relevan. Wajib URL, versi/tanggal review, dukungan klaim, lisensi; tulis konten original, jangan salin panjang.

**Editorial:** Research Draft → Editor Revision → Technical Review → Published, reviewer nyata. AI + URL reachable ≠ expert review. Draft diberi label dan tidak dipublikasi otomatis; DB/structured files + seeder idempotent, bukan artikel hardcoded React; revisi lama tetap untuk quiz attempts.

**Template lesson lengkap (bukan judul doang):** tujuan/prasyarat; ringkasan sederhana; analogi dan batas analogi; cara kerja; request/response dummy; apa yang diamati di lab; vulnerable vs secure behavior; contoh mitigasi; kesalahan umum dan false-positive; latihan kecil; >=3 soal dengan alasan jawaban; rujukan; catatan/refleksi; latihan laporan jika relevan. Berikan pilihan “Belum paham”.

**Target konten berdasar v9:** 10 learning paths; 25 lesson baseline **L001–L025** harus tetap terjaga; tambahan **N026–N035** menjadi 35 lesson jika benar-benar lolos review/publish; baseline 50 quiz items + 30 baru **Q051–Q080** menjadi 80 jika lolos review. Jangan mengubah ID lama atau mencoba menggabungkan `module` dan `lesson`.

**25 baseline lesson (judul intisari; wajib cek slug/ID asli sebelum import):**

| ID | Fokus | ID | Fokus |
|---|---|---|---|
| L001 | Browser–server | L002 | HTTP methods |
| L003 | HTTP status & headers | L004 | Cookies & sessions |
| L005 | Same-origin & CORS | L006 | REST API/JSON |
| L007 | Authentication vs authorization | L008 | Session lifecycle |
| L009 | IDOR | L010 | BOLA |
| L011 | BFLA | L012 | CSRF |
| L013 | XSS | L014 | SQL Injection |
| L015 | Input validation | L016 | SSRF |
| L017 | File upload | L018 | Business logic |
| L019 | Burp Proxy/Repeater | L020 | JWT |
| L021 | Mass assignment | L022 | GraphQL |
| L023 | Recon & authorized scope | L024 | Vulnerability reporting |
| L025 | Laravel remediation | — | — |

**10 expansion lesson:** N026 Reset Password Token Lifecycle; N027 CSRF & SameSite; N028 Path Traversal; N029 Safe File Upload; N030 GraphQL Object Authorization; N031 CORS Identity/Trust; N032 SSRF Webhook Boundaries; N033 OAuth State/Redirect URI; N034 Race Condition (Coupon/Stock); N035 API Object Property Authorization & Data Minimization.

**Kurikulum bertahap:** Fundamentals → HTTP/Cookies/Auth → Access Control (IDOR/BOLA/BFLA) → XSS/SQLi/CSRF → API/JWT/GraphQL/Mass Assignment → Business Logic/Race/SSRF/Upload → Burp/Recon → Responsible Reporting/Laravel Fixes → Real Hunting hanya pada program yang mengizinkan. Roadmap 90 hari harus menyarankan lesson/lab sesuai prasyarat dan hasil belajar, bukan membuka semua tanpa logika.

**Quiz contract:** pertanyaan/opsi dan penjelasan terikat ke revision; server menyimpan answer key dan mengoreksi; attempt immutable dengan score, pass mark, timestamp, revision; feedback jelas; retry diperbolehkan tanpa XP berulang; jawaban benar tidak dibundel JS sebelum grading.

## 7. Hands-on labs: 8 baseline + 12 ekspansi

**VulnShop** = toko dummy terisolasi (product, user/order/address, admin, coupon, profile API), bukan core. Tiap lab: manifest, prereq, objective, langkah, 3 hints, dummy accounts, request nyata, vulnerable-vs-secure, server proof, reset, root cause/fix, XP & report link.

**8 baseline labs (ID/slug sebenarnya harus dicocokkan di repo; topik ini merupakan target minimum):** (1) IDOR Order API; (2) BOLA Address/Profile API; (3) BFLA Admin Function; (4) Mass Assignment Profile; (5) Reflected XSS Search Rendering; (6) SQLi Product Search; (7) Business Logic Coupon Checkout; (8) URL Preview / bounded SSRF dummy. Jika nama katalog lokal berbeda, mapping ke existing runtime, jangan membuat duplikat.

**12 ekspansi v7.1/v9:**

| ID | Judul lab | Level / fokus |
|---|---|---|
| L009 | Password Reset — One-time Token | Easy / replay, expiry, akun dummy |
| L010 | CSRF — Profile Preferences | Medium / session dan CSRF protection |
| L011 | Path Traversal — Receipt Downloads | Medium / synthetic files, path policy |
| L012 | File Upload — Type Confusion | Medium / safe content handling |
| L013 | GraphQL — Nested Object Authorization | Hard / nested access |
| L014 | CORS — Credentialed Origin Read | Medium / origin & credentials |
| L015 | SSRF — Webhook Mock Destinations | Hard / strict allowlist, no egress |
| L016 | OAuth — State & Callback | Medium / callback/redirect validation |
| L017 | Race Condition — Coupon Redemption | Hard / controlled concurrency fixture |
| L018 | API — Object Property Authorization | Medium / field-level policy |
| L019 | API — List Data Minimization | Easy / bounded response disclosure |
| L020 | Multi-Tenant — Shared Workspace | Hard / 2 fake organizations |

**Lab states:** `draft` → `validated-local` → `published-for-local`. Playable **hanya** setelah vulnerable+secure+proof+reset+ownership+network containment PASS pada versi runtime; catat last_verified. Bedakan `planned` vs `playable`; busy → 503/retry.

**Lab runner policies:** bound body/time/concurrency, disabled external redirects, private internal service allowlist, per-user session auth/ownership, anti-abuse, no host/cross-network access, ephemeral dummy DB. Lab bisa dijalankan di Docker/VM lokal untuk belajar; untuk akses publik gunakan **host/VM terpisah** dengan independent boundary & human approval. Jangan expose Docker socket/runner control plane, service debug, flags, credentials, or metadata.

**Proof and XP:** validator server menggunakan session-bound opaque proof, bukan menerima `solved: true` dari frontend. Flags tidak ditanam di JS. Reset menghapus dummy fixture sesi tetapi tidak menghapus mastery/XP historis. XP hanya sekali per lab ID/revisi sesuai policy, transaksi/idempotent.

## 8. Progress, rewards, laporan, dan analitik

- **Source of truth:** event/attempt/solve/ledger server; bukan angka tertulis di React. Simpan explicit user/timezone/revision dan mapping ke roadmap activity; jangan satu tugas memberi reward dua kali.
- **XP yang direncanakan:** first lesson completion +10; first quiz pass +20; easy lab +50; medium lab +100; hard lab +150; accepted internal practice report +50. Tidak ada XP untuk membuka halaman, cek roadmap, autosave, mengulang kuis, atau mengirim flag salah.
- `xp_transactions` ledger dengan unique source/event keys, transaction-safe, concurrency-safe dan audit history. Level server-derived, formula eksplisit dan terdokumentasi; jangan izinkan set XP dari request client.
- Streak hanya meaningful learning actions, sekali per hari lokal user, tidak dari login saja; handle timezone midnight dan DST jika berlaku.
- Achievements: first lesson, HTTP Explorer, first quiz, first lab, five API labs, ten meaningful notes, seven-day streak, first accepted internal report. Unlock idempotent, tidak mengklaim sertifikasi eksternal.
- Kompetensi mencakup Web, Auth, Access Control, API, Injection, Business Logic, Recon, Reporting berdasarkan bukti penilaian (read vs quiz pass vs lab solve vs report), bisa menjelaskan rumusnya. Charts/filter 7/30/90/all time dan empty state.
- Report builder harus menyimpan user ownership, revision, internal review, safe attachment, export Markdown/printable HTML (PDF bila sudah didukung), sanitasi file/secret, audit status, dan rubric reproducibility/impact/evidence/mitigation.

## 9. Admin CMS, profil, settings, dan privasi

**Roles (map ke existing RBAC):** learner = baca published/buat catatan sendiri; author/editor = draft/edit materi; reviewer = review/publish sesuai policy dan bukan otomatis superuser; admin/operator = kelola user/studio/setting sesuai izin terbatas. Setiap action backend Laravel Gate/Policy + audit, role display UI saja tidak cukup.

**CMS workflow:** content list/search/filter; lesson rich Markdown editing+preview; sources/citations; prerequisite map; revision diff/history; reviewer comments; quiz question versioning & grading privacy; publish atomik; rollback ke published revision secara aman. Lab CMS hanya mengelola metadata/hints/scope/status; **tidak** meng-upload kode executable runner. Roadmap Builder menjaga history dan tidak memutus plan existing.

**Profile:** avatar upload aman (MIME, size, private/public reviewed), display name, username unique, bio, progress/achievement, privacy toggles. Hindari inferensi skill palsu dan data pribadi berlebihan.

**Settings:** akun, preferensi bahasa (ID utama), tema, timezone `Asia/Jakarta` default, target waktu 120 menit, notifikasi, ganti password/reauth/session revocation, 2FA hanya jika implementasi nyata, export data, permintaan deletion yang diproses aman. Menghapus account tidak boleh merusak audit progress orang lain; penghapusan permanen perlu proses operator jelas. Admin tidak otomatis boleh membaca notes/reports privat.

**OWASP safeguards:** CSRF, XSS sanitization (HTML/Markdown), auth/session fixation defenses, server-side authorization, brute-force/rate limit, secure upload, safe CSV/PDF exports, no leaked source/keys, CSP, generic auth errors, protected file paths. Link sumber harus tervalidasi; backend fetch URL bebas dilarang agar bukan SSRF.

## 10. Database & logical API contract

**Logical entities (reuse yang ada):** `users`, `profiles/user_preferences`, `roadmap_plans`, `roadmap_days/tasks/completions`, `learning_paths/modules`, `lessons/lesson_revisions/lesson_sources`, `prerequisites`, `questions/question_versions/choices/attempts`, `notes/note_tags`, `labs/lab_catalog_revisions/lab_runtime_registry`, `lab_sessions/lab_attempts/lab_progress/lab_events`, `learning_activity_events`, `xp_transactions`, `achievements/user_achievements`, `skill_assessments`, `reports/report_evaluations/report_evidence`, `editorial_reviews`, `audit_logs`. Nama tabel aktual bisa berbeda; gunakan mapping/migration additive, jangan duplikasi struktural.

**Routes/actions:** existing `/login`, `/register`, `/password/*`, `/dashboard`, `/roadmap`, `/modules`, `/labs`, `/progress`, `/notes`, `/reports`, `/profile`, `/settings/*`, `/studio/*`. API mutasi wajib Laravel validation, Policy/RBAC, CSRF/session, ownership, rate limits; beberapa worker jobs optional, tidak perlu membuat service baru bila route existing cukup.

**Data invariants:**
- One owner per private record; cross-user access harus 403/404 dengan zero disclosure.
- Published lesson revision immutable for pinned quiz attempts; publish new revision instead of overwriting old.
- Unique award key per user/reward/source, and unique per-user milestone completion as appropriate.
- Imported content does not automatically change previous learner mastery or award XP.
- Study schedule changing start date/timezone does not erase prior completed tasks.
- Lab publication requires runtime verification for exact version, not mere lab manifest.
- User upload, report evidence, and private exports stored non-executable/protected.
- Frontend progress/status derived from committed server state; failures roll back and show understandable feedback.

## 11. QA, accessibility, editorial, and release gates

**Jalankan hanya perintah yang benar-benar ada pada repository/relevan, lalu laporkan hasil aktual:**

```bash
php artisan test --compact
npm run test:mysql
npm run lint
npm run build
npm run test:unit
npx playwright test
npm run test:concurrency
node scripts/test-sandbox.mjs
node scripts/test-sandbox-transport.mjs
node scripts/check-lab-isolation.mjs
node scripts/qa-restore.mjs
node scripts/qa-preflight.mjs
node scripts/qa-smoke.mjs
```

- Hasil Sprint 6 bersifat historis; jalankan ulang suite terkait pada **commit aktual**. Absen/unavailable = `NOT RUN`, bukan PASS.
- Screenshot: 1440×900, 1280×800, 768, 390×844, 320; kedua tema, keyboard, reduced motion, 200% zoom, dan bandingkan **pre-V8 yang disetujui**.
- E2E positif/negatif: auth/CSRF/roles, roadmap/timezone, lessons/quizzes, notes failure/ownership, labs proof/reset/isolation/503, XP concurrency, reports/export, CMS editorial, profile/settings.
- Security: authz/IDOR core, session, CSP/Markdown/upload, secret leakage, lab network/host denial, Docker privilege; restore fixture pada schema disposable.
- Editorial: 25 legacy materi tetap aman, 10 baru + 30 pertanyaan dengan penjelasan/sumber dan status review akurat; answer key tidak ke client; jangan mengarang review.
- Performance: hindari N+1, payload/asset besar, polling mahal; tampilkan pengukuran nyata.
- Release gate: 0 P0/P1, no data loss, verified core/security/lab isolation, reproducible tests, daftar P2/P3. **GO for planning ≠ GO for deployment.**


## 12. Hosting terakhir: aaPanel Ubuntu rumah / Sprint 7

- Hosting **setelah** UI/konten/labs/QA diterima; deployment menyentuh aaPanel, DNS, firewall, DB atau Tunnel memerlukan persetujuan eksplisit. Planning/read-only bukan izin deploy.
- Core: Laravel PHP-FPM/Nginx aaPanel dari `public/`, React/Inertia Vite build, MySQL user khusus, private storage; `APP_DEBUG=false`, persistent secret `APP_KEY`, HTTPS cookies, trusted hosts/proxies, CSP, anti-leak.
- Connectivity: Cloudflare Tunnel + Access untuk private beta (jika disetujui), tanpa membuka admin, SSH, MySQL, `.env`, backup atau runner. Audit port/kapasitas agar layanan rumah lain tidak terganggu.
- Ops: inventaris versi/port, rehearsal LAN/staging, migrasi disposable, fixed commit, monitoring/logs/scheduler/queue bila ada, encrypted off-host DB/file backup, restore drill dan rollback test. Git bukan backup learner data.
- **Public labs NO-GO** sampai runner ditempatkan di VM/host terpisah dengan private control plane, deny-by-default egress, dummy DB dan test abuse/isolasi; private beta core tampilkan status lab unavailable tanpa memalsukan keberhasilan.
- Release gates: compatibility dan secrets, Nginx `public/`, core smoke + auth/RBAC, off-host restore, HTTPS/tunnel negatives, 0 P0/P1, lab tidak publik, dan persetujuan operator terdokumentasi.


## 13. Prioritas perkembangan terbaru & konflik yang sudah diputuskan

1. Data/security dulu; **restore pre-V8** Dashboard/Roadmap berilustrasi premium; lalu selaraskan seluruh halaman lain tanpa rewrite backend.
2. Audit counts: 10 paths; 25+10 lessons; 50+30 questions; 8+12 labs. Impor/version/publish terpisah dari runtime verify. Tampilkan jumlah actual, jangan manipulasi angka.
3. Perkaya 25 materi lama lewat revision; review 10 baru/30 quiz; pertahankan historical attempts/XP.
4. Bangun 12 lab baru lokal per batch 2–4; tiap lab harus pass vulnerable/secure/proof/reset/isolation sebelum playable.
5. Full QA setelah v9. Hosting paling akhir, perlu approval.

**Keputusan mengikat:** V8 flatten UI **ditolak**; sidebar admin generik untuk learner **ditolak**; 10 modules ≠ hanya 10 lessons; 20 kartu lab ≠ 20 runtimes; URL reachable ≠ expert review; Sprint 7 planning GO ≠ production authorization; “selesai” hanya saat bukti implementasi/QA tersedia.


## 14. Protokol kerja Codex dan laporan akhir

Awal: audit branch/commit, code/DB counts/runner/current browser; baseline tests & safety snapshot; rencanakan slice yang teruji. Edit minimal sesuai scope, jalankan tests setiap slice. Kalau konteks habis, tulis `docs/implementation/CONTINUE_HERE.md` berisi commit, pekerjaan selesai, tests terakhir, kekurangan, langkah/rollback berikutnya.

Akhir: (1) root cause dan perubahan; (2) files/migrations + data preservation; (3) before/after jumlah path/lesson/quiz/lab menurut status; (4) screenshot browser real dark/light mobile/desktop vs approved pre-V8; (5) test commands, environment, PASS/FAIL/SKIP/NOT RUN, isolation+restore evidence; (6) defects/risks; (7) status eksplisit local-dev/local-RC/planning/staging/private beta/production.

**Instruksi final:** Ini memori spesifikasi tunggal. Jika tugas belum jelas, audit dan laporkan fakta tanpa edit/deploy. Jika tugas sudah jelas, kerjakan sesuai scope dan jangan mulai hosting tanpa izin.
