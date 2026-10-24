# Input Validation: Bentuk dan Makna

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

Validasi yang baik memeriksa sintaks seperti tipe/panjang serta semantik seperti range, hubungan antar-field dan nilai yang diizinkan. Pastikan validasi diterapkan pada server, karena validasi browser dapat dilewati. Validasi tidak menggantikan otorisasi, encoding, atau parameterisasi query.

## Analogi sederhana

Form pesanan bukan sekadar menerima angka; kuantitas nol atau minus juga tak masuk akal secara bisnis.

## Contoh di VulnShop (data fiktif)

```http
quantity: integer|min:1|max:20
price: server-calculated, bukan dikirim sebagai nilai terpercaya
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Di lab coba jumlah produk negatif, harga dari browser, dan field tak dikenal. Lihat apakah aplikasi menolak atau menghitung ulang dari database.

## Cara mencegah / memperbaiki

Allowlist field, aturan business invariant, skema JSON, limit ukuran request, dan jangan percaya nilai harga dari client.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP API Security Top 10 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
