# Membaca Status Code dan Header HTTP

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

2xx menandakan request diproses sukses; 3xx mengarah ke pemindahan; 4xx menandakan masalah pada permintaan atau akses; 5xx menunjukkan kesalahan sisi server. 401 lazimnya butuh autentikasi, 403 berarti ditolak, 404 tidak ditemukan; implementasi dapat sengaja memakai 404 untuk menyembunyikan keberadaan resource.

## Analogi sederhana

Status code mirip tanda pada formulir: diterima, perlu login, dilarang, atau bermasalah.

## Contoh di VulnShop (data fiktif)

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json
Cache-Control: no-store

{"message":"Akses ditolak"}
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Amati Content-Type, Set-Cookie, Authorization, Cache-Control dan Location. Jangan menganggap kode 200 selalu berarti aksi berhasil: baca response body juga.

## Cara mencegah / memperbaiki

Kirim respons konsisten, hindari membocorkan stack trace dan data sensitif; jangan pernah memasukkan token asli ke tangkapan layar laporan.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [MDN — HTTP Overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
