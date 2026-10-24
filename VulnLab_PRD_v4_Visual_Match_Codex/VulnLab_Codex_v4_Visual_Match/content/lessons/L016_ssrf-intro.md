# SSRF: Server Diminta Mengakses Alamat Lain

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

Server-Side Request Forgery terjadi ketika aplikasi membuat request ke alamat yang dikendalikan pihak luar tanpa pembatasan yang cukup. Dampaknya bisa mencakup akses layanan internal. Di VulnLab, latihan hanya boleh mengarah ke hostname tiruan dalam jaringan Docker terisolasi.

## Analogi sederhana

Fitur preview URL seperti asisten yang diminta mengambil paket. Tanpa aturan, ia mungkin masuk ke ruangan yang seharusnya terlarang.

## Contoh di VulnShop (data fiktif)

```http
POST /lab/preview
{"url":"http://mock-service:8080/example"}
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Bandingkan URL yang masuk allowlist dengan yang tidak di lab. Jangan gunakan metadata cloud, alamat privat real, atau endpoint publik untuk latihan ini.

## Cara mencegah / memperbaiki

Batasi tujuan lewat allowlist, validasi redirect dan resolusi DNS, pertimbangkan egress firewall serta isolasi jaringan; blok akses ke aset internal sensitif.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [PortSwigger SSRF](https://portswigger.net/web-security/ssrf)
- [OWASP API Security Top 10 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
