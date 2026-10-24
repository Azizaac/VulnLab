# GraphQL: Query, Mutation, dan Authorization

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

GraphQL memisahkan query dan mutation, dengan schema yang menjelaskan tipe/operasi. Walau terlihat memakai satu endpoint, authorization tetap perlu berlaku pada setiap resolver, objek, dan field. Introspection sendiri tidak otomatis merupakan vulnerability; nilai risikonya bergantung konteks.

## Analogi sederhana

GraphQL seperti daftar belanja custom: klien memilih field yang ingin diminta dari satu layanan.

## Contoh di VulnShop (data fiktif)

```http
query { order(id: "101") { id total } }
# hanya milik pengguna yang berizin
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Di GraphQL dummy, bandingkan field yang dapat diakses oleh account A/B. Periksa output berlebihan tanpa mengambil data nyata.

## Cara mencegah / memperbaiki

Lakukan auth per resolver/field/object, batasi kompleksitas serta kedalaman query, dan berikan error yang tidak membocorkan rahasia.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [PortSwigger GraphQL API vulnerabilities](https://portswigger.net/web-security/graphql)
- [OWASP API Security Top 10 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
