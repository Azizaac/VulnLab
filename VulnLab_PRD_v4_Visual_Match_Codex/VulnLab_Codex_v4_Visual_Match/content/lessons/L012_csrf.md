# CSRF dan Permintaan Berbasis Session

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

Cross-Site Request Forgery membuat browser pengguna yang sudah terautentikasi mengirim tindakan yang tidak mereka inginkan, ketika mekanisme autentikasi otomatis dikirim dan pertahanan CSRF tidak cukup. Risiko bergantung pada cookie, browser behavior, metode request, dan desain aplikasi.

## Analogi sederhana

Browser yang sudah login seperti petugas yang otomatis membawa kartu akses ke setiap meja.

## Contoh di VulnShop (data fiktif)

```http
POST /account/change-email
Cookie: session=...
X-CSRF-TOKEN: ...
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Bandingkan di lab request ubah preferensi dengan dan tanpa token CSRF. Pastikan tidak mencoba mengubah data orang lain.

## Cara mencegah / memperbaiki

Gunakan proteksi CSRF framework, SameSite cookies sesuai konteks, tidak menggunakan GET untuk aksi mengubah status, dan pertimbangkan origin checks.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [PortSwigger CSRF](https://portswigger.net/web-security/csrf)
- [MDN — HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
