# N034 — Race Condition: Ketika Dua Request Berebut Stok

**Tingkat:** Lanjutan · **Estimasi:** 29 menit · **Prasyarat:** L018, L006 · **Lab:** L017

## Target belajar
- Jelaskan akar masalah keamanan ini dengan kata-katamu sendiri.
- Kenali apa yang harus dibandingkan pada request/response di aplikasi training.
- Jelaskan satu perbaikan sisi server serta bukti minimal untuk laporan.

## Ringkasan untuk pemula
Bug race condition muncul ketika dua operasi melihat state yang sama sebelum salah satunya menguncinya. Dalam transaksi e-commerce, kupon sekali pakai atau stok terbatas bisa berubah salah bila validasi dan penyimpanan tidak dilakukan atomik.

## Analogi agar mudah diingat
Dua kasir melihat stok terakhir yang sama di layar, lalu keduanya menjual barang tersebut sebelum persediaan diperbarui. Keduanya membuat keputusan dari keadaan yang sudah tidak valid. **Catatan:** analogi tidak menggambarkan seluruh detail browser, jaringan, atau kontrol aplikasi.

## Cara kerja teknis, langkah demi langkah
Masalahnya bukan sekadar request cepat; ia ada pada urutan baca–cek–tulis yang tidak atomik. Perbaikan dapat menggunakan transaksi database, row-level locking, unique constraint, atomic update, dan idempotency keys sesuai operasi. Logging concurrency harus tidak menuliskan rahasia.

## Contoh HTTP (data dan host fiktif)
```http
POST /api/coupons/redeem HTTP/1.1
Content-Type: application/json

{"code":"LAB-ONE-TIME","order_id":101}
```

Dalam latihan, perhatikan apakah respons aplikasi mendukung hipotesis atau justru menunjukkan kontrol keamanan berfungsi. Jangan menyimpulkan vulnerability hanya dari status HTTP; cocokkan dengan perubahan state dan hak akses objek/field dummy.

## Latihan terpandu
L017 memiliki tombol “Kirim dua permintaan serentak” dengan batas maksimal 2–3 fixture calls. Bandingkan final redeemed_count dan invoice dummy saat insecure/secure mode. Tanpa stress traffic, flood atau request ke produksi.

## Cara memperbaiki dari sisi developer
Gunakan transaction/lock database pada resource yang benar, constraint unik `coupon_id + customer_id` jika aturan bisnis sesuai, dan proses mutasi idempoten untuk request terulang.

## Kesalahan umum dan false positive
Dua respons 200 tidak otomatis berarti double-spend berhasil; periksa state akhir. Jangan mengklaim dampak finansial nyata dari kupon fixture.

## Mini-tugas laporan
Tampilkan dua request terkontrol, response serta state akhir dummy, lalu rekomendasi operasi atomik.

## Cek pemahaman
Selesaikan tiga soal N034 pada bank kuis, baca penjelasan jawaban. Jika jawaban salah, ulangi bagian teknis lalu bandingkan hasil mode *vulnerable* versus *secure* pada lab lokal. Menyelesaikan artikel tidak sama dengan membuktikan penguasaan.

## Sumber primer
- [RACE — referensi resmi](https://portswigger.net/web-security/race-conditions)
- [API — referensi resmi](https://owasp.org/API-Security/)

> Status editorial: `research_draft_unreviewed` · Disusun: 2026-10-27 · Peninjau independen: belum ada. Jangan tampilkan sebagai materi tersertifikasi.
