# Broken Function Level Authorization

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

Broken Function Level Authorization berarti pengguna dapat memanggil fungsi yang seharusnya dibatasi untuk role atau hak tertentu. Ini berbeda dari BOLA: BOLA berfokus pada kepemilikan objek; BFLA berfokus pada boleh-tidaknya menggunakan fungsi. Keduanya bisa terjadi bersamaan.

## Analogi sederhana

Petugas dan pemilik toko sama-sama login, tetapi hanya pemilik boleh mengubah stok global.

## Contoh di VulnShop (data fiktif)

```http
POST /api/admin/products/8/publish
# user biasa → 403
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Buat role `customer` dan `admin` di lab. Periksa apakah endpoint admin menolak akun customer walaupun tombol publish tidak terlihat di UI.

## Cara mencegah / memperbaiki

Gunakan authorization policy di backend untuk setiap fungsi; default deny; tes matriks role x tindakan.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [OWASP API Security Top 10 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
