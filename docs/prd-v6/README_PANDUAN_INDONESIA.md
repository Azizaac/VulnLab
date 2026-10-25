# VulnLab — Sprint 6 Final QA & Security Audit

**Tahap saat ini:** finalisasi website, bukan hosting. **Tahap berikutnya setelah lulus audit:** Sprint 7 Deployment aaPanel Home Server.

## Apa yang dikerjakan?

1. Audit seluruh fitur dari Beranda hingga Admin Studio dan Pengaturan.
2. Periksa roadmap 90 hari, materi dan sumber kredibel, quiz, notes, labs, XP, laporan.
3. Perbaiki notifikasi berhasil/gagal, validasi form, error state dan pengamanan data.
4. Bandingkan UI dengan V4 (pengguna) dan V5 (Admin, Profile, Settings); cek desktop/mobile dan dua tema.
5. Uji pemisahan laboratorium cybersecurity dari Laravel utama.
6. Tulis laporan nyata tentang tes yang dijalankan dan kelayakan untuk Sprint 7.

## Cara menggunakan ZIP

1. **Backup/commit project VulnLab lokal** dan simpan cadangan database development.
2. **Extract ZIP di root repo**; file akan masuk `docs/prd-v6/`.
3. Buka folder repo yang sama di Codex.
4. Salin isi `docs/prd-v6/CODEX_SHORT_PROMPT.txt` ke Codex (jangan tempel seluruh PRD panjang).
5. Codex harus membaca dokumen, melakukan audit dulu, lalu memperbaiki masalah dan menjalankan tes.
6. Setelah itu baca `docs/qa/RELEASE_READINESS.md`; pilih lanjut Sprint 7 hanya jika bukti tes mendukung.

**Catatan penting:** 121 test case dalam matriks adalah **rancangan skenario yang harus dieksekusi**; semua berstatus `NOT RUN` sampai Codex benar-benar mengujinya pada aplikasi milikmu. ZIP bukan hasil audit website.

## Batasan

- Jangan jalankan migrate:fresh, db:wipe, docker compose down -v pada database berisi data.
- Jangan aktifkan lab rentan di aaPanel/host utama atau internet.
- Jangan menyerahkan API key, cookie, database dump, atau password dalam hasil tes.
- Jika aplikasi lab belum siap, tampilkan status tidak tersedia yang jujur dan laporkan sebagai scope yang belum siap.

## Ringkasan dokumen

| File | Kegunaan |
|---|---|
| `MASTER_PRD_SPRINT6_FINAL_QA.md` | Spesifikasi finalisasi lengkap |
| `CODEX_SHORT_PROMPT.txt` | Prompt efisien konteks |
| `CODEX_SPRINT6_FULL_PROMPT.md` | Prompt alternatif detail |
| `testing/QA_TEST_MATRIX.csv` | 121 kasus uji terstruktur |
| `templates/RELEASE_READINESS_TEMPLATE.md` | Template keputusan GO/NO-GO |
| `templates/DEFECT_REGISTER_TEMPLATE.csv` | Registrasi bug |
| `references/` | PRD V5 dan gambar UI V4/V5 |
