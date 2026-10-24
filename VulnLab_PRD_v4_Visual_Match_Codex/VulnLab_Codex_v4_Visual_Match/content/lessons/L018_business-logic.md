# Business Logic: Saat Aturan Toko Bisa Dilewati

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

Celah business logic muncul saat alur yang terlihat normal menghasilkan akibat yang melanggar aturan bisnis. Tidak semua masalah bisa dikenali scanner. Pelajari business invariant: stok tidak negatif, satu voucher per order, total server-calculated, tidak dapat membeli barang di bawah harga sah.

## Analogi sederhana

Kasir punya aturan satu voucher per pesanan. Jika aplikasi lupa menerapkannya di server, uang bisa salah dihitung.

## Contoh di VulnShop (data fiktif)

```http
order_total = sum(price_database × qty) - discount_server
# jangan percaya total dari frontend
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Pada VulnShop dummy, coba quantity nol, diskon bertumpuk dan perubahan order state yang tidak valid. Tulis aturan yang seharusnya terjadi sebelum mencoba.

## Cara mencegah / memperbaiki

Terapkan invariant di backend dan database, periksa transisi state, transaksi atomik, dan tes negatif.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [PortSwigger Business Logic](https://portswigger.net/web-security/logic-flaws)
- [OWASP API Security Top 10 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
