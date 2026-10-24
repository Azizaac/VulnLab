# Same-Origin Policy dan CORS

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

Same-Origin Policy membatasi interaksi skrip antar-origin. CORS adalah mekanisme berbasis header untuk memberi izin akses tertentu antar-origin. CORS bukan mekanisme login maupun izin membaca objek dalam API; endpoint tetap perlu authentication dan authorization sendiri.

## Analogi sederhana

Origin ibarat alamat gedung: protokol, hostname, dan port harus cocok untuk dianggap alamat yang sama.

## Contoh di VulnShop (data fiktif)

```http
Origin: https://learn.lab.test
Access-Control-Allow-Origin: https://learn.lab.test
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Bandingkan dua origin lokal dummy. Lihat kapan browser menolak akses response dan kapan server tetap memproses request. Jangan menyebut kesalahan CORS hanya karena request tidak dapat dibaca browser.

## Cara mencegah / memperbaiki

Batasi allowed origins sesuai kebutuhan; jangan menganggap konfigurasi CORS menggantikan pemeriksaan identitas dan hak akses.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [MDN — HTTP Overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
