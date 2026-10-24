# Authentication vs Authorization

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

Seseorang bisa berhasil login tetapi tetap tidak berhak melihat invoice milik pengguna lain. Pemisahan konsep ini sangat penting: banyak API rentan karena hanya memeriksa apakah permintaan membawa session valid, tetapi tidak memeriksa apakah pengguna mempunyai hak atas objek.

## Analogi sederhana

Authentication menjawab "kamu siapa?"; authorization menjawab "kamu boleh melakukan apa?".

## Contoh di VulnShop (data fiktif)

```http
User A login → GET /api/orders/101 (milik A) = 200
User B login → GET /api/orders/101 (milik A) = 403
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Buat dua akun dummy. Uji resource milik A dan milik B; bandingkan response. Pastikan tidak ada objek pribadi nyata di lab.

## Cara mencegah / memperbaiki

Terapkan deny-by-default, policy per objek/aksi, dan pengujian role dari sisi server; jangan percaya role yang ditulis sendiri oleh browser.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [MITRE CWE-862 Missing Authorization](https://cwe.mitre.org/data/definitions/862.html)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
