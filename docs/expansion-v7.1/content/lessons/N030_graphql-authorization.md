# N030 — GraphQL: Query Fleksibel, Izin Tetap Harus Ketat

**Tingkat:** Menengah · **Estimasi:** 30 menit · **Prasyarat:** L022, L009 · **Lab:** L013, L020

## Target belajar
- Jelaskan akar masalah keamanan ini dengan kata-katamu sendiri.
- Kenali apa yang harus dibandingkan pada request/response di aplikasi training.
- Jelaskan satu perbaikan sisi server serta bukti minimal untuk laporan.

## Ringkasan untuk pemula
GraphQL memungkinkan klien meminta field spesifik dalam satu query, tetapi izin membaca field dan objek tetap harus diputuskan server. Menyembunyikan tombol atau membatasi satu query di frontend tidak menjamin resolver lain aman.

## Analogi agar mudah diingat
Perpustakaan menyediakan katalog yang bisa menyaring bab buku. Kebebasan mencari bab tidak berarti boleh melihat koleksi arsip yang hanya untuk anggota tertentu. **Catatan:** analogi tidak menggambarkan seluruh detail browser, jaringan, atau kontrol aplikasi.

## Cara kerja teknis, langkah demi langkah
Resolver mengambil data per objek dan per field. Periksa autentikasi, otorisasi objek dan property, serta limit kedalaman/biaya query sesuai kebutuhan. Relasi lintas tenant dan nested resolvers sering membutuhkan konteks pemilik yang diteruskan dengan benar, bukan hanya pemeriksaan pada root query.

## Contoh HTTP (data dan host fiktif)
```http
POST /graphql HTTP/1.1
Content-Type: application/json

{"query":"query { myOrders { id status } }"}
```

Dalam latihan, perhatikan apakah respons aplikasi mendukung hipotesis atau justru menunjukkan kontrol keamanan berfungsi. Jangan menyimpulkan vulnerability hanya dari status HTTP; cocokkan dengan perubahan state dan hak akses objek/field dummy.

## Latihan terpandu
Dalam L013, jalankan query terhadap order dummy dari akun A dan B. Dalam L020, bandingkan workspace milik dua tenant dummy. Validasi bahwa tiap resolver menolak objek di luar izin.

## Cara memperbaiki dari sisi developer
Terapkan Laravel policies/domain authorization di service atau resolver untuk setiap objek/field, gunakan dataloader aman, limit query depth/cost, dan audit mutation terpisah.

## Kesalahan umum dan false positive
Schema introspection yang aktif bukan otomatis kerentanan; konteks dan data sensitif yang terbuka penting. Jangan menyamakan error resolver dengan bypass akses.

## Mini-tugas laporan
Cantumkan field/resolver, identitas objek dummy dan hasil expected-versus-actual yang menunjukkan batas tenant.

## Cek pemahaman
Selesaikan tiga soal N030 pada bank kuis, baca penjelasan jawaban. Jika jawaban salah, ulangi bagian teknis lalu bandingkan hasil mode *vulnerable* versus *secure* pada lab lokal. Menyelesaikan artikel tidak sama dengan membuktikan penguasaan.

## Sumber primer
- [GRAPHQL — referensi resmi](https://portswigger.net/web-security/graphql)
- [API — referensi resmi](https://owasp.org/API-Security/)

> Status editorial: `research_draft_unreviewed` · Disusun: 2026-10-27 · Peninjau independen: belum ada. Jangan tampilkan sebagai materi tersertifikasi.
