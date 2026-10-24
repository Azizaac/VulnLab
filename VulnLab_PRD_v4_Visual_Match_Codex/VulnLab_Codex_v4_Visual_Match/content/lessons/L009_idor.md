# IDOR: Referensi Objek Tanpa Otorisasi

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

IDOR muncul saat referensi objek dapat dimanipulasi dan server tidak memeriksa izin atas objek tersebut. ID bisa berupa angka, UUID, nama file, bahkan slug. Mengacak ID membantu mengurangi tebakan, tetapi bukan mengganti object-level authorization.

## Analogi sederhana

Nomor tiket bukan bukti kepemilikan tiket. Mengetahui nomor order tidak berarti kamu boleh membukanya.

## Contoh di VulnShop (data fiktif)

```http
GET /api/orders/101 (akun A) → 200
GET /api/orders/101 (akun B) → seharusnya 403/404
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Di VulnShop, buat order milik A dan B, lalu periksa apakah setiap akun hanya mendapat datanya sendiri. Buktikan dampak hanya pada dua akun dummy itu.

## Cara mencegah / memperbaiki

Pada Laravel, batasi query ke resource yang diizinkan serta terapkan Policies/Gates. Tulis negative authorization tests untuk semua CRUD endpoint.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [OWASP IDOR Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html)
- [PortSwigger Access Control](https://portswigger.net/web-security/access-control)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
