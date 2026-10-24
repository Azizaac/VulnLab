# JWT: Header, Payload, Signature

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

JWT sering memiliki tiga bagian base64url dipisahkan titik. Payload tidak otomatis rahasia; signature digunakan untuk memverifikasi integritas dan asal token sesuai algoritme/key yang tepat. Kesalahan konfigurasi dan validasi klaim dapat membuka masalah autentikasi.

## Analogi sederhana

JWT mirip kartu klaim yang ditandatangani; isi kartu dapat dibaca tetapi harus diverifikasi sebelum dipercaya.

## Contoh di VulnShop (data fiktif)

```http
header.payload.signature
{"sub":"dummy-user-1","exp":1893456000}
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Dekode token **dummy** dan temukan claim `sub`, `exp`, dan audience. Jangan pernah menempel token produksi pada decoder daring.

## Cara mencegah / memperbaiki

Validasi signature di server, batasi algoritme yang diterima, issuer/audience/expiry, lindungi key dan hindari data sensitif di payload.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [PortSwigger JWT attacks](https://portswigger.net/web-security/jwt)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
