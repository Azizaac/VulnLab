# N028 — Path Traversal: Menjaga File Tetap di Direktori yang Benar

**Tingkat:** Menengah · **Estimasi:** 27 menit · **Prasyarat:** L002, L015 · **Lab:** L011

## Target belajar
- Jelaskan akar masalah keamanan ini dengan kata-katamu sendiri.
- Kenali apa yang harus dibandingkan pada request/response di aplikasi training.
- Jelaskan satu perbaikan sisi server serta bukti minimal untuk laporan.

## Ringkasan untuk pemula
Aplikasi sering punya fitur unduh invoice, gambar, atau dokumen. Bila nama atau path file digabung langsung dari input pengguna, aplikasi dapat memilih file di luar direktori yang diizinkan. Kontrol keamanannya bukan sekadar melarang teks tertentu; server harus menentukan sendiri file apa yang boleh diakses.

## Analogi agar mudah diingat
Petugas gudang mendapat nomor resi untuk mencari satu kotak. Jika petugas membiarkan pelanggan menulis lokasi rak bebas, orang itu bisa mencoba membuka gudang lain. **Catatan:** analogi tidak menggambarkan seluruh detail browser, jaringan, atau kontrol aplikasi.

## Cara kerja teknis, langkah demi langkah
Path adalah struktur direktori, bukan identitas akses. Decode, normalisasi separator, simbol path relatif, dan symlink dapat memengaruhi hasil path akhir. Strategi aman: gunakan ID file di database, otorisasi file berdasarkan pemilik, kemudian resolve ke direktori yang dikendalikan server. Jika path diperlukan, validasi hasil path kanonis tetap berada dalam root izin dan hindari race.

## Contoh HTTP (data dan host fiktif)
```http
GET /api/receipts/101/download HTTP/1.1
Host: files.lab.test

HTTP/1.1 200 OK
Content-Type: application/pdf

[synthetic invoice fixture]
```

Dalam latihan, perhatikan apakah respons aplikasi mendukung hipotesis atau justru menunjukkan kontrol keamanan berfungsi. Jangan menyimpulkan vulnerability hanya dari status HTTP; cocokkan dengan perubahan state dan hak akses objek/field dummy.

## Latihan terpandu
Dalam L011, gunakan pemilih nama file fixture yang telah disediakan. Coba variasi nama yang diizinkan, tidak ditemukan, dan di luar folder fixture; amati apakah file berbeda dapat diakses dan apakah data dummy pengguna lain ditolak.

## Cara memperbaiki dari sisi developer
Pertahankan mapping UUID/ID dokumen → file di sisi server, gunakan storage abstraction Laravel, cek policies kepemilikan sebelum streaming, pilih nama unduhan yang aman dan jangan merangkai path mentah pengguna.

## Kesalahan umum dan false positive
Response 404 bisa terjadi karena file hilang atau karena akses disembunyikan; perlu membandingkan dengan fixture kontrol. Jangan memakai file sistem host nyata sebagai target lab.

## Mini-tugas laporan
Tunjukkan identitas file dummy dan batas akses yang dilanggar, tanpa mengekstrak file sensitif host.

## Cek pemahaman
Selesaikan tiga soal N028 pada bank kuis, baca penjelasan jawaban. Jika jawaban salah, ulangi bagian teknis lalu bandingkan hasil mode *vulnerable* versus *secure* pada lab lokal. Menyelesaikan artikel tidak sama dengan membuktikan penguasaan.

## Sumber primer
- [TRAVERSAL — referensi resmi](https://portswigger.net/web-security/file-path-traversal)
- [WSTG — referensi resmi](https://owasp.org/www-project-web-security-testing-guide/)

> Status editorial: `research_draft_unreviewed` · Disusun: 2026-10-27 · Peninjau independen: belum ada. Jangan tampilkan sebagai materi tersertifikasi.
