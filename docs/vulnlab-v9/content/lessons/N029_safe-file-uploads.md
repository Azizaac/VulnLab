# N029 — File Upload: MIME, Ekstensi, dan Penyimpanan Aman

**Tingkat:** Menengah · **Estimasi:** 28 menit · **Prasyarat:** L015, L017 · **Lab:** L012

## Target belajar
- Jelaskan akar masalah keamanan ini dengan kata-katamu sendiri.
- Kenali apa yang harus dibandingkan pada request/response di aplikasi training.
- Jelaskan satu perbaikan sisi server serta bukti minimal untuk laporan.

## Ringkasan untuk pemula
Memeriksa ekstensi `.jpg` di browser tidak membuat upload aman. Server harus memvalidasi konten, ukuran, tipe yang diperbolehkan, dan lokasi penyimpanan. File yang boleh diunggah juga tidak otomatis boleh dijalankan sebagai program.

## Analogi agar mudah diingat
Petugas menerima paket bertuliskan “buku”. Label luar dapat keliru, sehingga barang perlu diproses berdasarkan aturan gudang dan tidak langsung ditempatkan di ruang kontrol listrik. **Catatan:** analogi tidak menggambarkan seluruh detail browser, jaringan, atau kontrol aplikasi.

## Cara kerja teknis, langkah demi langkah
Aplikasi bisa berbeda membaca ekstensi, MIME yang dinyatakan klien, dan isi file. Penyerang dapat mengunggah nama yang menyerupai gambar namun isinya berbeda. Setelah file disimpan, ancaman juga bergantung pada apakah storage dapat diakses publik, dieksekusi, atau diproses oleh konverter rentan.

## Contoh HTTP (data dan host fiktif)
```http
POST /api/avatar HTTP/1.1
Content-Type: multipart/form-data; boundary=LAB

--LAB
Content-Disposition: form-data; name="avatar"; filename="sample.png"
Content-Type: image/png

[fixture bytes]
--LAB--
```

Dalam latihan, perhatikan apakah respons aplikasi mendukung hipotesis atau justru menunjukkan kontrol keamanan berfungsi. Jangan menyimpulkan vulnerability hanya dari status HTTP; cocokkan dengan perubahan state dan hak akses objek/field dummy.

## Latihan terpandu
Pada L012, unggah tiga dummy fixture: gambar valid, file yang label MIME-nya tidak cocok, dan berkas terlalu besar. Lihat validasi server, lokasi preview, dan penolakan tipe. Tidak ada executable upload maupun eksekusi script.

## Cara memperbaiki dari sisi developer
Gunakan allowlist tipe dan ukuran, deteksi file sebenarnya di server, ubah nama menjadi ID acak, simpan di storage non-eksekusi, akses dengan controller terotorisasi, dan proses dengan library aman sesuai jenis file.

## Kesalahan umum dan false positive
Perbedaan ekstensi dan MIME tidak selalu langsung dapat dieksploitasi; bukti dampak memerlukan jalur interpretasi file yang nyata. Dalam lab ini bukti dibuat dengan file dummy, bukan shell web.

## Mini-tugas laporan
Rekam jenis file, pemeriksaan yang dilewati, dan apakah aplikasi memperlakukan fixture secara salah; jangan klaim remote code execution tanpa bukti.

## Cek pemahaman
Selesaikan tiga soal N029 pada bank kuis, baca penjelasan jawaban. Jika jawaban salah, ulangi bagian teknis lalu bandingkan hasil mode *vulnerable* versus *secure* pada lab lokal. Menyelesaikan artikel tidak sama dengan membuktikan penguasaan.

## Sumber primer
- [UPLOAD — referensi resmi](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [WSTG — referensi resmi](https://owasp.org/www-project-web-security-testing-guide/)

> Status editorial: `research_draft_unreviewed` · Disusun: 2026-10-27 · Peninjau independen: belum ada. Jangan tampilkan sebagai materi tersertifikasi.
