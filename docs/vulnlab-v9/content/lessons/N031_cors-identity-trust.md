# N031 — CORS: Siapa yang Boleh Membaca Respons?

**Tingkat:** Menengah · **Estimasi:** 24 menit · **Prasyarat:** L005, L004 · **Lab:** L014

## Target belajar
- Jelaskan akar masalah keamanan ini dengan kata-katamu sendiri.
- Kenali apa yang harus dibandingkan pada request/response di aplikasi training.
- Jelaskan satu perbaikan sisi server serta bukti minimal untuk laporan.

## Ringkasan untuk pemula
CORS adalah mekanisme browser yang mengatur kapan JavaScript dari satu origin boleh membaca respons origin lain. CORS bukan sistem autentikasi. Server harus secara sengaja memilih origin yang mendapat akses, terutama jika cookie atau kredensial dikirim.

## Analogi agar mudah diingat
Membolehkan tamu memasuki ruang tunggu berbeda dengan mengizinkan tamu membaca dokumen pribadi di meja resepsionis. Origin policy mengatur akses baca di browser, bukan hak bisnis pengguna. **Catatan:** analogi tidak menggambarkan seluruh detail browser, jaringan, atau kontrol aplikasi.

## Cara kerja teknis, langkah demi langkah
Browser mengirim Origin dan kadang preflight OPTIONS. Server membalas Access-Control-Allow-Origin serta header lain. Kombinasi origin yang terlalu permisif dan credentialed reads dapat membuat data yang seharusnya tidak dapat dibaca oleh halaman lain menjadi terekspos. Nilai wildcard tidak digunakan untuk credentialed CORS reads oleh browser modern; lihat kebijakan lengkap, bukan satu header.

## Contoh HTTP (data dan host fiktif)
```http
GET /api/me HTTP/1.1
Origin: https://reader.lab.test
Cookie: session=TRAINING_SESSION

HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://reader.lab.test
Access-Control-Allow-Credentials: true
```

Dalam latihan, perhatikan apakah respons aplikasi mendukung hipotesis atau justru menunjukkan kontrol keamanan berfungsi. Jangan menyimpulkan vulnerability hanya dari status HTTP; cocokkan dengan perubahan state dan hak akses objek/field dummy.

## Latihan terpandu
L014 memakai dua origin sintetis yang dipetakan ke fixture browser lokal. Bandingkan header, keterbacaan respons oleh JS, dan peran autentikasi. Jangan gunakan domain nyata sebagai origin pengujian.

## Cara memperbaiki dari sisi developer
Allowlist origin tepat, hindari memantulkan header Origin secara membabi buta, gunakan credential mode hanya bila diperlukan, set Vary: Origin bila dinamis, dan tetap terapkan autentikasi/otorisasi server.

## Kesalahan umum dan false positive
Header CORS yang aneh tanpa kredensial, data sensitif, atau primitive pembacaan lintas origin belum tentu vulnerability berdampak. Browser dan curl memiliki perilaku enforcement yang berbeda.

## Mini-tugas laporan
Tuliskan origin sintetis, kondisi cookie, header, dan apakah JS fixture benar-benar dapat membaca data dummy.

## Cek pemahaman
Selesaikan tiga soal N031 pada bank kuis, baca penjelasan jawaban. Jika jawaban salah, ulangi bagian teknis lalu bandingkan hasil mode *vulnerable* versus *secure* pada lab lokal. Menyelesaikan artikel tidak sama dengan membuktikan penguasaan.

## Sumber primer
- [CORS — referensi resmi](https://portswigger.net/web-security/cors)
- [MDN — referensi resmi](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview)

> Status editorial: `research_draft_unreviewed` · Disusun: 2026-10-27 · Peninjau independen: belum ada. Jangan tampilkan sebagai materi tersertifikasi.
