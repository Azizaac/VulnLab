# BOLA: IDOR pada Resource API

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

Broken Object Level Authorization adalah risiko API saat endpoint menerima object ID dan melakukan operasi tanpa izin objek yang memadai. BOLA bisa terjadi pada pembacaan, pembaruan, maupun penghapusan. Ini berkaitan erat dengan IDOR, tetapi menggunakan kerangka risiko API.

## Analogi sederhana

BOLA berarti loket API memeriksa nomor paket, tetapi lupa memeriksa apakah paket itu milik pemesan.

## Contoh di VulnShop (data fiktif)

```http
PATCH /api/addresses/88
{"city":"Solo"}
# hanya pemilik alamat yang boleh mengubah
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Di lingkungan dummy, buat dua alamat dan bandingkan operasi baca dan ubah dari pemilik vs akun lain. Jangan melakukan perubahan pada aset dunia nyata.

## Cara mencegah / memperbaiki

Gunakan objek yang di-scope ke authenticated principal dan jalankan policy per object + action; buat tes 403 terhadap akses lintas akun.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [OWASP API1:2023 BOLA](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/)
- [OWASP API Security Top 10 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
