# N026 — Reset Password: Token, Waktu Kedaluwarsa, dan Kebocoran Akun

**Tingkat:** Pemula · **Estimasi:** 22 menit · **Prasyarat:** L007, L008 · **Lab:** L009

## Target belajar
- Jelaskan akar masalah keamanan ini dengan kata-katamu sendiri.
- Kenali apa yang harus dibandingkan pada request/response di aplikasi training.
- Jelaskan satu perbaikan sisi server serta bukti minimal untuk laporan.

## Ringkasan untuk pemula
Alur reset password terlihat sederhana, tetapi sebenarnya menyentuh identitas pengguna, token sementara, dan sesi login. Server perlu memperlakukan tautan reset seperti kunci sekali pakai: hanya pemegangnya yang dapat menggunakannya, waktunya terbatas, dan sesudah dipakai kunci tidak berlaku lagi.

## Analogi agar mudah diingat
Bayangkan resepsionis mengirim tiket penggantian kunci kamar. Resepsionis tidak mengumumkan siapa yang punya kamar itu, tiket kedaluwarsa, dan satu tiket tidak bisa digunakan berkali-kali. **Catatan:** analogi tidak menggambarkan seluruh detail browser, jaringan, atau kontrol aplikasi.

## Cara kerja teknis, langkah demi langkah
Ketika seseorang meminta reset, backend menghasilkan token acak yang tidak dapat ditebak. Sistem mengirim token melalui kanal terpisah yang dimiliki pengguna, mencatat masa berlaku, dan saat tautan dipakai melakukan validasi yang independen dari input browser. Token sekali pakai sebaiknya tidak tersimpan dalam log biasa. Pesan permintaan reset dibuat serupa untuk email terdaftar maupun tidak, sehingga formulir tidak menjadi alat enumerasi akun.

## Contoh HTTP (data dan host fiktif)
```http
POST /forgot-password HTTP/1.1
Content-Type: application/json

{"email":"learner-a@lab.test"}

HTTP/1.1 200 OK
{"message":"Jika akun terdaftar, petunjuk akan dikirim."}
```

Dalam latihan, perhatikan apakah respons aplikasi mendukung hipotesis atau justru menunjukkan kontrol keamanan berfungsi. Jangan menyimpulkan vulnerability hanya dari status HTTP; cocokkan dengan perubahan state dan hak akses objek/field dummy.

## Latihan terpandu
Di mailbox dummy L009, minta token untuk dua akun fiktif. Periksa apakah respons permintaan akun ada/tidak tetap netral; gunakan tautan sekali lalu coba ulang. Catat juga apa yang terjadi ketika waktu token fixture dipercepat hingga lewat masa berlaku.

## Cara memperbaiki dari sisi developer
Gunakan fasilitas reset password Laravel dengan token acak, masa berlaku terbatas, limit permintaan, event audit tanpa token, rotasi/invalidasi token setelah digunakan, dan opsi mengakhiri sesi lain sesuai kebijakan. Pastikan host reset link dikendalikan konfigurasi server.

## Kesalahan umum dan false positive
Pesan yang berbeda bukan satu-satunya indikasi enumerasi; perbedaan waktu yang konsisten bisa relevan. Sebaliknya, kegagalan login setelah reset bisa berasal dari sesi yang memang sudah diputus secara aman.

## Mini-tugas laporan
Tulis dua langkah reproduksi dengan akun dummy dan hasil yang benar-benar terbukti; jangan menempelkan token reset asli dalam laporan.

## Cek pemahaman
Selesaikan tiga soal N026 pada bank kuis, baca penjelasan jawaban. Jika jawaban salah, ulangi bagian teknis lalu bandingkan hasil mode *vulnerable* versus *secure* pada lab lokal. Menyelesaikan artikel tidak sama dengan membuktikan penguasaan.

## Sumber primer
- [RESET — referensi resmi](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [AUTH — referensi resmi](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

> Status editorial: `research_draft_unreviewed` · Disusun: 2026-10-27 · Peninjau independen: belum ada. Jangan tampilkan sebagai materi tersertifikasi.
