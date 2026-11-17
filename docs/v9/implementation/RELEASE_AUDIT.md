# VulnLab V9 — Release Audit & Verification Report

**Tanggal Audit:** 2026-11-18 (`Asia/Jakarta`)  
**Branch:** `codex/2026-10-30-171111-v9-visual-recovery-content-and-labs`  
**Ruang Lingkup:** Pengembangan & QA lokal (`127.0.0.1` saja). Tidak ada perubahan pada aaPanel, DNS, Cloudflare Tunnel, firewall, DB produksi eksternal, maupun eksposur lab rentan ke internet publik.  
**Status Kesiapan:** **`LOCAL-GO`** untuk pengembangan lokal & 20 sandbox lab lokal terisolasi · **`PUBLIC-LAB NO-GO`** (sesuai kebijakan `AGENTS.md`: lab rentan wajib tetap lokal sampai ada VM/host terpisah dengan persetujuan operator).

---

## 1. Ringkasan Eksekutif & Akar Masalah yang Diselesaikan

1. **Pemulihan & Improvisasi Visual (Menggantikan Regresi V8 yang Ditolak):**
   - **Akar masalah:** Commit V8 sebelumnya meratakan identitas visual menjadi kotak-kotak gelap monoton, gunung segitiga poligon datar, orb milestone Roadmap yang meleset dari jalur bercahaya, puncak bendera yang tertutup panel kanan, banner kosong di halaman Profil, serta kotak kosong `Aktivitas terakhir` selebar halaman di Beranda.
   - **Solusi V9:** Menghadirkan tiga ilustrasi atmosferik lukisan digital bebas teks beresolusi tinggi (`public/images/v9/hero-observatory.jpg`, `roadmap-panorama.jpg`, `profile-banner.jpg`) yang dikomposisikan bersama elemen interaktif React semantik, SVG jalur ekspedisi bercahaya presisi (`JourneyArt.tsx`), dan sistem desain `resources/css/v9-design-system.css`.
   - **Hasil:**
     - **Beranda (`/dashboard`):** Hero observatorium malam proporsional di sisi kanan, kartu misi `Hari Ini` dengan zona waktu nyata, pita metrik 4 kolom beraksen warna, 4 pintasan utama, kartu sorotan `Lanjutkan Belajar`, dan strip panduan onboarding (tanpa kotak aktivitas kosong).
     - **Roadmap 90 Hari (`/roadmap`):** Panorama pegunungan malam berlapis dengan tenda ekspedisi bercahaya, 5 orb milestone berwarna (`1` biru aktif, `2` emerald, `3` cyan, `4` sky-blue, `5` violet) tepat di atas jalur cahaya menuju bendera puncak yang tidak tertutup, pil tahap kaca buram (`.v9-stage-pill`), serta panel `Detail Tahap` kaca buram (`.v9-stage-glass`) dengan tombol CTA jelas dan kontras lulus WCAG 2.2 AA pada semua ukuran layar & tema.
     - **Seluruh Halaman Lain:** Modul (`10 jalur belajar` terpisah jelas dari jumlah lesson), Lesson Reader (panel interaktif `"Belum paham? Lihat ringkasan sederhana & prasyarat"` + tautan lab terverifikasi runtime), Katalog Lab (sorotan `Rekomendasi Praktik Berikutnya`, chip `20 playable lokal`, filter `Ketersediaan`), Lab Workspace, Progres (8 domain kompetensi + pencapaian nyata), Catatan, Laporan, Login/Register split editorial, Profil (banner aurora), Settings, dan Admin Studio (`v9-studio-truth-bar` pemisah lesson tampil vs lab playable vs draft menunggu review).

2. **Ekspansi Materi & Bank Kuis Tanpa Menimpa Data Pembelajar:**
   - **25 pendalaman materi baseline (`L001`–`L025`)** diimpor sebagai revisi draft Studio baru (`Revisi 2`) melalui `V9LessonEnrichmentImporter` lengkap dengan analogi pemula, batas analogi, contoh HTTP nyata, perbandingan vulnerable vs secure, mitigasi Laravel, kesalahan umum/false positive, dan 3 cek mandiri tanpa nilai XP.
   - **10 materi ekspansi baru (`N026`–`N035`)** dan **30 soal kuis baru (`Q051`–`Q080` dalam 10 entri `quiz-N026`..`quiz-N035`)** diimpor secara idempoten melalui `ExpansionV71Importer` + `V9ContentImporter` sebagai draft Studio yang jujur menunggu review pakar manusia (`0` klaim palsu expert-reviewed). Kunci jawaban tetap tersimpan eksklusif di server dan tidak bocor pada endpoint pratinjau maupun bundel JS.

3. **Ekspansi 12 Lab Lokal Baru (`LAB009`–`LAB020`) = 20 Lab Lokal Playable:**
   - Seluruh 12 lab ekspansi diimplementasikan di arsitektur sandbox terisolasi (`sandbox/*.mjs`, `contracts.json`, `lab-routes.json`, `labs-v9.json`, `LabService.php`, `LabRuntimeRegistry.php`) dengan database SQLite per-sesi di `tmpfs`, tanpa akses jaringan eksternal/core DB, dan diverifikasi penuh (mode vulnerable, mode secure, validasi flag terikat sesi, penolakan flag salah, kedaluwarsa sesi, reset fixture tanpa menghapus XP, isolasi kepemilikan akun, isolasi jaringan, dan idempotensi XP).

---

## 2. Perbandingan Jumlah Konten & Lab (Sebelum vs Sesudah V9)

| Kategori | Sebelum V9 | Sesudah V9 (DB Lokal Aktif) | Keterangan Kejujuran Status |
|---|---:|---:|---|
| Jalur Belajar (`learning_paths` kursus tampil) | 10 | **10** | 10 jalur kurikulum bertahap (`modules` kursus = 10) |
| Materi Tampil ke Pembelajar (`lessons`) | 25 | **25** (`L001`–`L025`) | Tetap stabil; tidak mempublikasikan draft tanpa review manusia |
| Revisi Pendalaman Materi Baseline di Studio | 0 | **25** (`L001`–`L025` Rev. 2) | Tersimpan sebagai draft Studio siap ditinjau |
| Draft Materi Baru di Studio (`N026`–`N035`) | 0 | **10** | Berstatus `draft` di Studio; `/learning/:slug` mengembalikan `404` sebelum publish |
| Soal Kuis Aktif Pembelajar (`quiz_questions`) | 50 (`200` opsi) | **50** (`Q001`–`Q050`) | Attempt historis pembelajar tetap mengacu ke revisi asli |
| Soal Kuis Ekspansi di Studio (`Q051`–`Q080`) | 0 | **30** (10 paket kuis draft) | Terhubung ke `N026`–`N035` via `parent_lesson_entry_id`; kunci jawaban hanya di server |
| Total `content_entries` / `content_revisions` Studio | 80 / 80 | **100 / 125** | +20 entri ekspansi baru, +45 revisi draft V9 (`45` draft, `55` terbit) |
| Materi Lolos Review Pakar Independen (`reviewed_at`) | 0 | **0** | Jujur `0`; pemeriksaan AI/sumber tidak diklaim sebagai review pakar |
| Definisi Katalog Lab (`labs`) | 8 | **20** (`LAB001`–`LAB020`) | 8 baseline + 12 ekspansi V9 |
| Lab Lokal Terverifikasi & Playable (`127.0.0.1`) | 8 | **20 / 20** | Seluruh 20 lab memiliki bukti `lab_runtime_verifications` pada revisi runtime aktif |
| Lab Terekspos ke Internet Publik | 0 | **0** | Dilarang tanpa host/VM terpisah dan persetujuan eksplisit |

---

## 3. Bukti Pelestarian Data Pembelajar (0 Kehilangan / Perubahan)

Snapshot penuh sebelum perubahan disimpan di `.tools/v9-live-backup-20261118.sql` (`849.408` byte, SHA-256 `AE7C379A1EABEA4B8BCC46ACAD3D15ABC2C5B695074F47DD14F093E01A807BDA`). Verifikasi `php scripts/v9-audit.php` sebelum dan sesudah migrasi + impor membuktikan seluruh tabel data pembelajar identik byte-demi-byte:

| Tabel | Baris Sebelum | SHA-256 Sebelum | Baris Sesudah | SHA-256 Sesudah | Status |
|---|---:|---|---:|---|---|
| `users` (pembelajar `id=3`) | 1 | `d43c8edfbe10466d...` | 1 (+1 akun sistem non-learner `studio-v9-importer`) | Pembelajar `id=3` utuh (`XP`, profil, jadwal tidak tersentuh) | **UTUH** |
| `xp_transactions` | 5 | `dc431d2f79ffdc9a...` | 5 | `dc431d2f79ffdc9a...` | **IDENTIK** |
| `lesson_progress` | 1 | `79cf0b06d6f7e8a9...` | 1 | `79cf0b06d6f7e8a9...` | **IDENTIK** |
| `quiz_attempts` | 1 | `38544f0959768736...` | 1 | `38544f0959768736...` | **IDENTIK** |
| `lab_progress` | 3 | `0a4de972d73ca278...` | 3 | `0a4de972d73ca278...` | **IDENTIK** |
| `lab_sessions` | 3 | `9b8388756b93c7da...` | 3 | `9b8388756b93c7da...` | **IDENTIK** |
| `notes` | 0 | `4f53cda18c2baa0c...` | 0 | `4f53cda18c2baa0c...` | **IDENTIK** |
| `vulnerability_reports` | 0 | `4f53cda18c2baa0c...` | 0 | `4f53cda18c2baa0c...` | **IDENTIK** |

---

## 4. Matriks Verifikasi 20 Lab Lokal (`LAB001`–`LAB020`)

Revisi runtime sandbox terverifikasi: `c5ce96e48f3f7e4d892e71aa8b8971cb5335b77a1b5be25360eeff1e814b2677` (`docs/v9/implementation/local-lab-receipt.json`).

| Kode | Slug | Kesulitan / XP | Modul Sandbox | Vulnerable | Secure | Bukti Server & Anti-Duplikat XP | Reset & Expiry | Isolasi Sesi & Jaringan |
|---|---|---|---|---|---|---|---|---|
| `LAB001` | `order-idor` | Mudah · 50 XP | `sandbox/shop.mjs` | PASS | PASS | PASS | PASS | PASS |
| `LAB002` | `address-bola` | Mudah · 50 XP | `sandbox/shop.mjs` | PASS | PASS | PASS | PASS | PASS |
| `LAB003` | `search-xss` | Mudah · 50 XP | `sandbox/shop.mjs` + `verifier.mjs` | PASS | PASS | PASS | PASS | PASS |
| `LAB004` | `product-sqli` | Menengah · 100 XP | `sandbox/shop.mjs` | PASS | PASS | PASS | PASS | PASS |
| `LAB005` | `profile-mass-assignment` | Menengah · 100 XP | `sandbox/shop.mjs` | PASS | PASS | PASS | PASS | PASS |
| `LAB006` | `jwt-validation` | Menengah · 100 XP | `sandbox/shop.mjs` | PASS | PASS | PASS | PASS | PASS |
| `LAB007` | `admin-bfla` | Menengah · 100 XP | `sandbox/shop.mjs` | PASS | PASS | PASS | PASS | PASS |
| `LAB008` | `coupon-logic` | Sulit · 150 XP | `sandbox/shop.mjs` | PASS | PASS | PASS | PASS | PASS |
| `LAB009` | `password-reset-token-lifecycle` | Mudah · 50 XP | `sandbox/reset-token.mjs` | PASS | PASS | PASS | PASS | PASS |
| `LAB010` | `csrf-preferences` | Menengah · 100 XP | `sandbox/csrf-preferences.mjs` | PASS | PASS | PASS | PASS | PASS |
| `LAB011` | `path-traversal-receipts` | Menengah · 100 XP | `sandbox/traversal-receipts.mjs` | PASS | PASS | PASS | PASS | PASS |
| `LAB012` | `file-upload-validation` | Menengah · 100 XP | `sandbox/upload-validation.mjs` | PASS | PASS | PASS | PASS | PASS |
| `LAB013` | `graphql-object-access` | Sulit · 150 XP | `sandbox/graphql-auth.mjs` | PASS | PASS | PASS | PASS | PASS |
| `LAB014` | `cors-credential-boundary` | Menengah · 100 XP | `sandbox/cors-origin.mjs` | PASS | PASS | PASS | PASS | PASS |
| `LAB015` | `webhook-ssrf-fixtures` | Sulit · 150 XP | `sandbox/webhook-ssrf.mjs` | PASS | PASS | PASS | PASS | PASS |
| `LAB016` | `oauth-callback-state` | Menengah · 100 XP | `sandbox/oauth-state.mjs` | PASS | PASS | PASS | PASS | PASS |
| `LAB017` | `coupon-race` | Sulit · 150 XP | `sandbox/coupon-race.mjs` | PASS | PASS | PASS | PASS | PASS |
| `LAB018` | `api-property-auth` | Menengah · 100 XP | `sandbox/property-auth.mjs` | PASS | PASS | PASS | PASS | PASS |
| `LAB019` | `api-data-minimization` | Mudah · 50 XP | `sandbox/data-minimization.mjs` | PASS | PASS | PASS | PASS | PASS |
| `LAB020` | `multi-tenant-workspace` | Sulit · 150 XP | `sandbox/multi-tenant.mjs` | PASS | PASS | PASS | PASS | PASS |

---

## 5. Daftar File Utama yang Diubah / Ditambahkan

- **Aset Visual & Sistem Desain UI:**
  - `public/images/v9/hero-observatory.jpg`, `public/images/v9/roadmap-panorama.jpg`, `public/images/v9/profile-banner.jpg`
  - `resources/css/v9-design-system.css`, `resources/js/app.tsx`, `resources/js/components/JourneyArt.tsx`
  - `resources/js/pages/Dashboard.tsx`, `Roadmap.tsx`, `Learning.tsx`, `LessonReader.tsx`, `Labs.tsx`, `Profile.tsx`, `Studio.tsx`
- **Backend Core, Importer Konten & Integrasi Progres:**
  - `app/Http/Controllers/LearningController.php`, `app/Http/Controllers/StudioController.php`
  - `app/Services/LabService.php`, `app/Services/LabRuntimeRegistry.php`, `app/Services/V9LabCatalog.php`, `app/Services/ProgressService.php`, `app/Services/LearningEventService.php`
  - `app/Services/V9ContentImporter.php`, `app/Services/V9LessonEnrichmentImporter.php`, `app/Console/Commands/StudioImportV9.php`, `app/Console/Commands/LabsImportV9.php`
  - Migrasi aditif: `database/migrations/2026_11_16_000001_repair_content_import_records.php`, `database/migrations/2026_11_16_000002_create_lab_runtime_verifications.php`
  - Data katalog & materi: `database/data/labs-v9.json`, `database/data/lab-routes.json`, `database/data/v9-lesson-enrichment.json`, `database/data/v9-expansion-review.json`
- **Runtime Sandbox Terisolasi (`sandbox/`):**
  - `sandbox/common.mjs`, `sandbox/expansion.mjs`, `sandbox/contracts.json`
  - `sandbox/reset-token.mjs`, `csrf-preferences.mjs`, `traversal-receipts.mjs`, `upload-validation.mjs`, `graphql-auth.mjs`, `cors-origin.mjs`, `webhook-ssrf.mjs`, `oauth-state.mjs`, `coupon-race.mjs`, `property-auth.mjs`, `data-minimization.mjs`, `multi-tenant.mjs`
- **Pengujian & Skrip Verifikasi QA:**
  - `tests/Feature/V9LabRuntimeTest.php`, `V9ContentPreservationTest.php`, `V9LessonEnrichmentImportTest.php`, `ContainerConfigurationTest.php`, `QuizDraftLinkMigrationTest.php`
  - `tests/e2e/v9-roadmap-legibility.spec.ts`, `tests/e2e/v9-content.spec.ts`
  - `scripts/v9-scenarios.mjs`, `scripts/verify-v9-labs.mjs`, `scripts/v9-content-smoke.mjs`, `scripts/v9-audit.php`, `scripts/v9-query.php`

---

## 6. Hasil Eksekusi Pengujian Aktual

Seluruh perintah di bawah ini benar-benar dijalankan selama sesi V9 dan dilaporkan sesuai kenyataan:

| Suite / Perintah | Lingkungan | Hasil Aktual |
|---|---|---|
| `./vendor/bin/pint --test` | PHP 8.4 (`vulnlab-testing`) | **PASS** (`167` file PHP bersih) |
| `npm run lint` (`eslint` + `prettier --check`) | Node 24 | **PASS** (0 error, 0 warning) |
| `npm run build` (`tsc --noEmit && vite build`) | TypeScript 5.9 + Vite 7 | **PASS** (`2446` modul terbundel bersih) |
| `npm run test:unit` (`vitest run`) | Vitest 5 / JSDOM | **PASS** (`4` file, `11/11` test lulus) |
| `php artisan test` (SQLite `:memory:`) | PHP 8.4 + SQLite | **PASS** (`137 passed`, `3.216 assertions`, `0 failed`) |
| `npm run test:mysql` (PHPUnit penuh di MySQL 8.4 disposable) | PHP 8.4 + MySQL 8.4 | **PASS** (`137 passed`, `3.211 assertions`, `0 failed`) |
| `node scripts/v9-content-smoke.mjs` | MySQL 8.4 disposable | **PASS** (`restore_exact: true`, idempoten `25+20` dibuat lalu `45` unchanged, 14 tabel pembelajar utuh) |
| `node scripts/test-sandbox.mjs` | Sandbox Docker (`LAB001`–`LAB008`) | **PASS** (8/8 lab baseline lulus) |
| `node scripts/test-sandbox-transport.mjs` | Sandbox Runner (`127.0.0.1:8090`) | **PASS** (4/4 pemeriksaan batas transport lulus) |
| `node scripts/verify-v9-labs.mjs` | Sandbox Docker + PHPUnit (`LAB009`–`LAB020`) | **PASS** (12/12 lab ekspansi lulus 10 pemeriksaan + `14/14` test PHPUnit real-runner / `433` assertions) |
| `node scripts/check-lab-isolation.mjs` | Sandbox Network Boundary | **PASS** (seluruh probe ke core app, DB, host, metadata IP, dan canary diblokir) |
| `npm run test:concurrency` (`test-xp-concurrency.mjs`) | Pekerja paralel serentak | **PASS** (0 duplikasi XP pada submit paralel) |
| `node scripts/qa-restore.mjs` | Rehearsal restore backup DB | **PASS** (`current: PASS`, `pre_v5: PASS`, hash sumber tidak berubah) |
| `node scripts/qa-preflight.mjs` | Simulasi gangguan DB & kesiapan | **PASS** (`/up=200`, `/ready=503` saat DB mati tanpa bocor kredensial/stack trace) |
| `node scripts/qa-smoke.mjs` | Stack lokal aktif (`127.0.0.1:8088`) | **PASS** (`/up=200`, `/ready=200`, `/login=200`, `/.env=403`, CSP nonce aktif) |
| Playwright E2E Penuh (`npx playwright test --project=desktop`) | Chromium 156 + PHP 8.4 + Sandbox | **PASS** (`20/20` skenario lulus: `auth-expansion`, `journey`, `labs`, `learning`, `recovery-visual`, `sprint4`, `studio-expansion`, `v5-quiz`, `v5`, `v6` termasuk zoom 200%, `v8-reflow` 320/375/768/1024px, `v8-visual`, `v9-content`, `v9-roadmap-legibility`) |
| Playwright Multi-Viewport (`desktop`, `mobile`, `mobile360`, `mobile320`, `tablet`) | Chromium 156 | **PASS** (`26 passed`, `14 skipped` sesuai project guard masing-masing spec, `0 failed`) |
| Verifikasi E2E & Audit `axe-core` WCAG 2.2 AA V9 (`.tools/v9-full-e2e-screenshots.mjs`) | Chromium 156 (`1440px`, `1280px`, `720px` zoom 200%, `390px`, `320px`, `dark` & `light`) | **PASS** (`52/52` pemeriksaan `axe-core` + anti-overflow lulus, penyelesaian nyata `LAB013` GraphQL `+150 XP`, `43` screenshot baru tersimpan) |

---

## 7. Inventaris Screenshot Bukti Visual (`docs/v9/implementation/screenshots/`)

Seluruh screenshot diambil dari aplikasi yang benar-benar berjalan di Chromium terhadap data nyata:

- **Autentikasi:** `login-desktop-dark.png`, `login-desktop-light.png`, `login-mobile-dark.png`, `register-desktop-dark.png`, `register-mobile-dark.png`
- **Beranda (Dashboard):** `dashboard-desktop-dark.png`, `dashboard-desktop-light.png`, `dashboard-laptop-dark.png`, `dashboard-mobile-dark.png`, `dashboard-mobile-light.png`, `dashboard-mobile320-dark.png`
- **Roadmap 90 Hari:** `roadmap-desktop-dark.png`, `roadmap-desktop-light.png`, `roadmap-laptop-dark.png`, `roadmap-mobile-dark.png`, `roadmap-mobile-light.png`, `roadmap-mobile320-dark.png`
- **Modul & Lesson Reader:** `modules-desktop-dark.png`, `modules-desktop-light.png`, `modules-mobile-dark.png`, `lesson-desktop-dark.png`, `lesson-desktop-light.png`, `lesson-mobile-dark.png`
- **Katalog 20 Lab & Workspace Lab V9:** `labs-20playable-desktop-dark.png`, `labs-desktop-dark.png`, `labs-desktop-light.png`, `labs-mobile-dark.png`, `lab-workspace-v9-graphql-dark.png`
- **Progres, Catatan & Laporan:** `progress-desktop-dark.png`, `progress-desktop-light.png`, `progress-mobile-dark.png`, `notes-desktop-dark.png`, `notes-desktop-light.png`, `reports-desktop-dark.png`, `report-editor-desktop-dark.png`
- **Profil, Pengaturan & Admin Studio:** `profile-desktop-dark.png`, `profile-desktop-light.png`, `profile-mobile-dark.png`, `settings-desktop-dark.png`, `settings-desktop-light.png`, `studio-overview-desktop-dark.png`, `studio-overview-desktop-light.png`, `studio-editor-v9-draft-dark.png`, `content-studio-desktop.png`, `content-studio-mobile.png`, `content-studio-mobile320.png`, `content-studio-tablet.png`

---

## 8. Item Tersisa & Batasan Tata Kelola (Jujur & Transparan)

1. **Review Pakar Manusia di Admin Studio sebelum Publikasi Materi Baru:**
   - 10 materi baru (`N026`–`N035`), 30 soal kuis baru (`Q051`–`Q080`), dan 25 revisi pendalaman materi baseline (`L001`–`L025`) sudah tersimpan lengkap di Admin Studio (`/studio/content?status=draft`), namun sesuai aturan `AGENTS.md` §6 tidak dipublikasikan otomatis ke katalog pembelajar tanpa reviewer teknis manusia yang nyata (`reviewed_lessons = 0`). Setelah ditinjau dan dipublikasikan melalui alur Studio (`Draft → In Review → Approved → Published`), jumlah lesson tampil akan naik dari `25` menjadi `35` dan soal kuis aktif dari `50` menjadi `80`.
2. **Isolasi Infrastruktur untuk Lab Publik (Out-of-Scope & Tetap `NO-GO`):**
   - Seluruh **20 lab (`LAB001`–`LAB020`)** aktif dan playable secara lokal pada `127.0.0.1:8088` / `127.0.0.1:8090`. Sesuai instruksi, tidak ada perubahan yang dilakukan pada aaPanel, DNS, Cloudflare Tunnel, ataupun server publik; mengaktifkan lab rentan untuk publik tetap memerlukan host/VM terpisah dengan batas jaringan independen.
