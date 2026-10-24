# Burp Proxy dan Repeater untuk Pemula

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

Burp Suite membantu membaca dan mengubah request aplikasi yang kamu punya izin uji. Proxy menangkap traffic browser, sedangkan Repeater mengirim ulang request yang dipilih setelah parameter diubah. Kerja efektif dimulai dengan hipotesis, bukan ribuan request acak.

## Analogi sederhana

Proxy seperti meja pemeriksaan surat, Repeater seperti ruang latihan untuk mengirim ulang satu surat yang sama.

## Contoh di VulnShop (data fiktif)

```http
GET /api/orders/101 HTTP/1.1
Host: shop.lab.test
Cookie: session=<akun-dummy>
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Tangkap satu request dari akun dummy. Kirim ke Repeater, ubah satu variabel, dan tulis perbedaan response. Hentikan pengujian jika scope tidak jelas.

## Cara mencegah / memperbaiki

Gunakan project scope, redaksi token sebelum membagikan bukti, rate limit, dan jangan memproksi traffic pribadi lain.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [PortSwigger Getting Started](https://portswigger.net/web-security/getting-started)
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
