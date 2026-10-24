# Dasar REST API, JSON, dan Endpoint

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

Endpoint adalah lokasi sebuah API menerima permintaan, misalnya `/api/orders/101`. API biasanya menerima parameter dari path, query, header, atau body JSON. Saat menguji, petakan asal nilai dan bagaimana respons berubah. Tidak semua URL yang mengandung `/api` otomatis menggunakan prinsip REST secara ketat.

## Analogi sederhana

API seperti loket layanan untuk aplikasi: setiap loket memiliki alamat dan jenis layanan.

## Contoh di VulnShop (data fiktif)

```http
GET /api/orders/101
Accept: application/json

{"id":101,"status":"paid"}
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Buat tabel endpoint dari aplikasi dummy: path, method, jenis input, perlu login atau tidak, dan pemilik resource. Ini menjadi dasar API testing yang dapat diulang.

## Cara mencegah / memperbaiki

Validasi skema input di server, autentikasi yang tepat, otorisasi per objek, dan hindari pengungkapan properti rahasia dalam JSON.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [PortSwigger API Testing](https://portswigger.net/web-security/api-testing)
- [OWASP API Security Top 10 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
