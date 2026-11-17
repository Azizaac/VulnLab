# V9-D: draft konten dan preservasi

Status: implementasi lokal, impor dibuktikan pada SQLite disposable dan salinan MySQL; belum diterapkan ke database learner. Tidak ada izin reviewer/publisher atau role learner yang diubah. Tidak ada publikasi otomatis.

## Perubahan

- `database/data/v9-lesson-enrichment.json`: 25 addendum L001–L025, ID/slug dicocokkan dengan baseline. Naskah lama tetap di depan; pengayaan hanya pada revisi draft Studio. Masing-masing memuat mekanisme, HTTP dummy, latihan pengamatan, false positive, contoh perbaikan, refleksi, dan recap. Tiga cek diri adalah latihan tak bernilai, bukan tambahan soal pada bank aktif.
- `database/data/v9-expansion-review.json`: tujuan, ringkasan, contoh teknis, pemetaan 30 sumber soal, hasil pencocokan klaim dengan sumber primer, dan catatan editorial untuk N026–N035. Pemeriksaan dilakukan AI; tidak ada review ahli independen.
- `studio:import-v9 <editor-id>` memakai workflow dan audit Studio, crosswalk jalur belajar stabil, hash sumber/data, transaksi, dan proteksi konflik editor. Impor ulang identik tidak membuat revisi/soal/XP tambahan.
- Importer v7.1 dipakai ulang karena payload kit sama. Mode V9 membaca kit V9 dan metadata pemeriksaan; perintah v7.1 tetap mempertahankan kontraknya.
- Migrasi forward-only memperbaiki tabel `content_import_records` jika hilang. Tabel/provenance yang sudah ada tidak dihapus, termasuk saat rollback repair.

## Crosswalk draft baru

| ID | Jalur yang sudah ada |
|---|---|
| N026, N027, N033 | Authentication & Authorization |
| N028, N029, N031, N032 | Web Security Fundamentals |
| N030, N035 | API Security Fundamentals |
| N034 | Business Logic Vulnerabilities |

## Temuan editorial

- Q072: pilihan benar tetap, penjelasan draft dikoreksi. OAuth `state` mengikat callback ke flow/sesi dan membantu mencegah CSRF; pencegahan mix-up multi-provider juga memerlukan pengikatan issuer/authorization server atau callback terpisah (RFC 9700 §4.4.2). Kit sumber tidak diubah.
- Q070: URL manifest adalah root OWASP API Security, terlalu umum untuk klaim network-layer. Metadata mencatat sumber tambahan API7/SSRF dan gap rujukan soal; tetap perlu keputusan reviewer sebelum publikasi.
- Metadata lisensi lengkap disimpan pada provenance. Field lisensi Studio dibatasi 180 karakter; label ringkas mengarahkan reviewer ke provenance tanpa membuang atribusi aslinya.
- Semua tanggal pemeriksaan adalah pemeriksaan AI, bukan tanggal persetujuan manusia. Hak distribusi/adaptasi dan ketentuan sumber tetap perlu ditinjau manusia.

## Bukti yang telah dijalankan

`node scripts/v9-content-smoke.mjs` PASS: snapshot database lokal dipulihkan ke schema acak milik invokasi; data, metadata kolom, constraints, dan keys dibandingkan. Setelah migrasi/import, 14 tabel sumber/learner yang dipantau tetap identik. Database sumber juga tetap identik. Rincian: `content-smoke-results.json`.

Hasil salinan: 25 draft pengayaan + 10 draft lesson baru + 10 bank draft (30 soal); 45 revisi draft; 0 review independen. Impor kedua: 45 unchanged. Jumlah aktif tetap 25 lesson/50 soal/8 lab; jangan menyebut 35 lesson terbit atau 80 soal aktif.

`node scripts/v9-run-e2e.mjs tests/e2e/v9-content.spec.ts --project=desktop --project=mobile --project=mobile320` PASS: 3 test. Editor melihat addendum, metadata, contoh teknis dan pratinjau tanpa answer key; URL lesson baru tetap 404, reader baseline tidak berubah. Screenshot real browser tersimpan di `screenshots/content-studio-*.png`.

Batas: database learner belum menerima impor; actor editor perlu dipilih operator sebelum penerapan. Full regression dan 12 runtime ekspansi belum tercakup oleh bukti slice ini.
