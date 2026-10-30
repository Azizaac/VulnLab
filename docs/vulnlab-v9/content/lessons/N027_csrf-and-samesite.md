# N027 — CSRF dan SameSite: Kenapa Browser Mengirim Cookie?

**Tingkat:** Pemula · **Estimasi:** 24 menit · **Prasyarat:** L004, L012 · **Lab:** L010

## Target belajar
- Jelaskan akar masalah keamanan ini dengan kata-katamu sendiri.
- Kenali apa yang harus dibandingkan pada request/response di aplikasi training.
- Jelaskan satu perbaikan sisi server serta bukti minimal untuk laporan.

## Ringkasan untuk pemula
CSRF terjadi ketika aplikasi menerima perubahan penting dari browser yang sedang login tanpa bukti bahwa permintaan itu benar-benar dimaksudkan pengguna. Cookie autentikasi biasanya ikut terkirim otomatis sesuai aturan browser; itulah alasan CSRF perlu dipikirkan pada permintaan yang mengubah state.

## Analogi agar mudah diingat
Seorang petugas mengenali pelanggan dari kartu langganan, tetapi tidak mengecek apakah instruksi yang diterimanya memang dikirim pelanggan tersebut. Identitas yang valid tidak selalu berarti niat yang valid. **Catatan:** analogi tidak menggambarkan seluruh detail browser, jaringan, atau kontrol aplikasi.

## Cara kerja teknis, langkah demi langkah
Pada form dengan cookie sesi, server seharusnya memeriksa token anti-CSRF atau mekanisme lain sesuai arsitektur, memeriksa origin bila tepat, dan menggunakan SameSite sebagai defense-in-depth. SameSite=Lax/Strict membantu mengurangi beberapa skenario, tetapi tidak menjadi pengganti seluruh kontrol ketika ada subdomain/flow khusus. JSON API berbasis token bearer berbeda profil risikonya dari form berbasis cookie.

## Contoh HTTP (data dan host fiktif)
```http
POST /api/preferences HTTP/1.1
Cookie: session=TRAINING_SESSION
Content-Type: application/x-www-form-urlencoded

theme=dark

HTTP/1.1 419 Page Expired
```

Dalam latihan, perhatikan apakah respons aplikasi mendukung hipotesis atau justru menunjukkan kontrol keamanan berfungsi. Jangan menyimpulkan vulnerability hanya dari status HTTP; cocokkan dengan perubahan state dan hak akses objek/field dummy.

## Latihan terpandu
L010 menyediakan halaman fixture yang dapat mengirim form hanya ke aplikasi training lokal. Bandingkan request berisi token dan request tanpa token lalu amati perubahan data dummy. Jangan gunakan situs pihak ketiga sebagai origin.

## Cara memperbaiki dari sisi developer
Aktifkan middleware CSRF Laravel pada routes yang menggunakan sesi, validasi mutasi pada backend, atur SameSite dan Secure cookie, audit Origin/Referer sesuai kebutuhan, serta jangan memakai GET untuk aksi yang mengubah data.

## Kesalahan umum dan false positive
HTTP 419 tidak otomatis membuktikan aplikasi aman terhadap seluruh CSRF; lihat cakupan route dan metode autentikasinya. Jangan mengasumsikan tiap request lintas origin berarti CSRF berhasil.

## Mini-tugas laporan
Tuliskan kebutuhan sesi, jenis aksi yang berubah, dan bukti data dummy sebelum/sesudah pengujian.

## Cek pemahaman
Selesaikan tiga soal N027 pada bank kuis, baca penjelasan jawaban. Jika jawaban salah, ulangi bagian teknis lalu bandingkan hasil mode *vulnerable* versus *secure* pada lab lokal. Menyelesaikan artikel tidak sama dengan membuktikan penguasaan.

## Sumber primer
- [CSRF — referensi resmi](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [WSTG — referensi resmi](https://owasp.org/www-project-web-security-testing-guide/)

> Status editorial: `research_draft_unreviewed` · Disusun: 2026-10-27 · Peninjau independen: belum ada. Jangan tampilkan sebagai materi tersertifikasi.
