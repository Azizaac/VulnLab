# N032 — SSRF pada Webhook: Ketika Server Mengikuti URL

**Tingkat:** Lanjutan · **Estimasi:** 32 menit · **Prasyarat:** L016, L006 · **Lab:** L015

## Target belajar
- Jelaskan akar masalah keamanan ini dengan kata-katamu sendiri.
- Kenali apa yang harus dibandingkan pada request/response di aplikasi training.
- Jelaskan satu perbaikan sisi server serta bukti minimal untuk laporan.

## Ringkasan untuk pemula
Webhook berguna untuk mengirim notifikasi ke layanan lain. Risikonya muncul jika server bebas mengunjungi alamat dari input pengguna, termasuk alamat jaringan yang seharusnya tidak diakses. Di sistem latihan, kita pelajari batas kepercayaan tanpa memakai jaringan nyata.

## Analogi agar mudah diingat
Seseorang meminta kurir kantor mengirim surat ke alamat yang ditulisnya. Kurir harus punya daftar area yang diizinkan, bukan sekadar memastikan alamat terlihat rapi. **Catatan:** analogi tidak menggambarkan seluruh detail browser, jaringan, atau kontrol aplikasi.

## Cara kerja teknis, langkah demi langkah
URL perlu dipahami secara kanonis, tujuan akhir request diperiksa setelah DNS resolution dan setiap redirect, alamat privat/link-local/metadata diblokir, protokol dibatasi, dan konektivitas keluar dikendalikan firewall. URL filtering aplikasi saja tidak cukup untuk membatasi semua jalur; jaringan harus menjadi lapisan pertahanan kedua.

## Contoh HTTP (data dan host fiktif)
```http
POST /api/webhooks/test HTTP/1.1
Content-Type: application/json

{"destination":"http://sink.lab.invalid/echo"}

HTTP/1.1 202 Accepted
```

Dalam latihan, perhatikan apakah respons aplikasi mendukung hipotesis atau justru menunjukkan kontrol keamanan berfungsi. Jangan menyimpulkan vulnerability hanya dari status HTTP; cocokkan dengan perubahan state dan hak akses objek/field dummy.

## Latihan terpandu
L015 hanya menerima empat host fixture dalam jaringan mock terisolasi. Amati mana yang berlabel approved atau blocked oleh validator. Tidak boleh ada request ke host, router, metadata atau internet.

## Cara memperbaiki dari sisi developer
Jangan menjadi proxy URL arbitrer. Terapkan allowlist host/protocol dan outbound network policy, blok redirect keluar scope, DNS rebind protections, timeout/size caps, dan audit log yang menyamarkan rahasia.

## Kesalahan umum dan false positive
Respons status 202 hanya menunjukkan permintaan ditampung; cek log fixture yang disediakan untuk bukti network target. Jangan pernah mencoba IP metadata nyata untuk latihan ini.

## Mini-tugas laporan
Laporkan perpindahan ke destination fixture yang tidak semestinya, tanpa menyebut kemampuan mengakses server internal nyata.

## Cek pemahaman
Selesaikan tiga soal N032 pada bank kuis, baca penjelasan jawaban. Jika jawaban salah, ulangi bagian teknis lalu bandingkan hasil mode *vulnerable* versus *secure* pada lab lokal. Menyelesaikan artikel tidak sama dengan membuktikan penguasaan.

## Sumber primer
- [SSRF — referensi resmi](https://portswigger.net/web-security/ssrf)
- [API — referensi resmi](https://owasp.org/API-Security/)

> Status editorial: `research_draft_unreviewed` · Disusun: 2026-10-27 · Peninjau independen: belum ada. Jangan tampilkan sebagai materi tersertifikasi.
