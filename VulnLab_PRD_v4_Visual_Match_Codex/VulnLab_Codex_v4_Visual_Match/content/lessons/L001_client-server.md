# Cara Browser dan Server Berkomunikasi

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

Web bekerja dengan pola request–response. Ketika membuka halaman, browser bisa meminta HTML, CSS, gambar, dan data API secara terpisah. Satu halaman dapat menghasilkan banyak request. Sebagai calon bug hunter, kamu perlu tahu request mana yang benar-benar membuat perubahan di server.

## Analogi sederhana

Browser seperti pengunjung restoran, server seperti dapur. Browser memesan halaman, server menyiapkan jawaban.

## Contoh di VulnShop (data fiktif)

```http
GET /products HTTP/1.1
Host: shop.lab.test
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Buka Developer Tools → Network di aplikasi latihan lokal. Reload halaman dan amati URL, method, status, dan body. Catat mana request halaman dan mana request data. Jangan menyimpulkan keamanan hanya dari tampilan UI.

## Cara mencegah / memperbaiki

Server harus memvalidasi setiap input dan memeriksa izin di server, walaupun tombol di frontend sudah disembunyikan.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [MDN — HTTP Overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
