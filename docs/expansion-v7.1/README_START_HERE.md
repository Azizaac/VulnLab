# VulnLab v7.1 Expansion Kit — Mulai di Sini

**Tujuan:** tambah materi dan 12 guided labs, serta redesign Login/Register dengan warna **#74AAFF** yang premium, tidak glowing/neon. **Tidak ada hosting ke aaPanel dalam paket ini.**

## Isi

- `MASTER_PRD.md`: requirement produk, integrasi, keamanan, DoD, roadmap.
- `CODEX_IMPLEMENTATION_PROMPT.md`: satu prompt lengkap untuk Codex.
- `design/AUTH_UI_DESIGN_SPEC.md`: token warna, layout, validasi, teks UI, dan kriteria aksesibilitas.
- `design/auth-preview.html`: prototype visual *offline* (bukan form login sungguhan).
- `design/preview-*.png`: screenshot hasil render preview untuk UI comparison.
- `content/lessons/NEW_LESSONS.md` + 10 `N026_*.md`: 10 draf materi mendalam, bahasa Indonesia, referensi primer.
- `content/LESSON_ENRICHMENT_MATRIX.json`: rencana spesifik pendalaman untuk **25** materi lama.
- `content/LESSON_MANIFEST.json`: metadata, referensi dan status editorial 10 materi baru.
- `content/quizzes/NEW_QUESTION_BANK.json`: **30** pertanyaan, kunci *server-side* dan pembahasan.
- `content/labs/LAB_EXPANSION.json`: **12** tambahan lab terdefinisi L009–L020, belum otomatis menjadi executable.
- `testing/TEST_MATRIX.csv`: scenario pengujian Codex.
- `testing/validate_package.py`: validasi konten paket; `testing/test_auth_preview.py`: smoke UI prototype.
- `testing/LOCAL_PACKAGE_QA.md`: hasil tes yang **benar-benar** dijalankan untuk dokumen/prototype saja.

## Target katalog (bukan status implementasi)

| Sebelum ekspansi | Tambahan target | Target total |
|---|---|---|
| 25 materi lama | 10 materi mendalam baru | 35 materi |
| 50 soal kuis | 30 soal penjelasan baru | 80 soal |
| 8 lab lokal | 12 skenario baru | 20 lab |

**Penting:** 12 lab baru baru berupa desain/metadata sampai Codex membuat runner lokal dan mengujinya; materi baru masih `research_draft_unreviewed`, bukan publikasi pakar.

## Instruksi memakai di repository yang sudah ada

1. Backup/snapshot repository dan database development (non-destruktif).
2. Extract ZIP dan taruh foldernya sebagai `docs/expansion-v7.1/` di repo VulnLab; **jangan menimpa** kode aplikasi.
3. Pastikan sumber lama V4/V5/V6 masih ada untuk kompatibilitas.
4. Buka Codex di root repo, suruh membaca `docs/expansion-v7.1/CODEX_IMPLEMENTATION_PROMPT.md`.
5. Minta Codex mengerjakan checkpoint E0→E1→E2→E3→E4→E5→E6 dalam repo yang sama, tidak perlu menyalin PRD lagi.
6. Kirim hasil audit dan screenshot login/register + daftar lab benar-benar runnable sebelum keputusan hosting.

## Lisensi & kredibilitas

Isi pelajaran disusun original dari dokumentasi keamanan resmi. Jangan menyalin artikel/diagram pihak ketiga ke website tanpa pemeriksaan lisensi. Editorial reviewer harus memeriksa fakta, keakuratan contoh, dan framing dampak sebelum publish. **Reachable source URL is not an expert sign-off.**

## Browser preview

Buka `design/auth-preview.html` di browser lokal. Form tidak melakukan login, tidak mengirim atau menyimpan data. Ini hanya untuk menilai desain. Saat diimplementasikan, setiap kontrol harus dihubungkan ke route Laravel asli.
