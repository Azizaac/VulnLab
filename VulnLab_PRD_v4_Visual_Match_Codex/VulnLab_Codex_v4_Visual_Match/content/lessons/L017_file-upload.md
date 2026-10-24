# Risiko File Upload

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

Upload dapat berbahaya bila aplikasi menilai ekstensi atau MIME yang dikirim browser sebagai bukti keamanan. Risiko mencakup penyimpanan file aktif pada lokasi yang dapat dieksekusi, path traversal, dan kebocoran data. Pengujian lab tidak memerlukan malware atau shell sungguhan.

## Analogi sederhana

Petugas penerima berkas harus memeriksa isi dan cara menyimpan, bukan hanya percaya nama file.

## Contoh di VulnShop (data fiktif)

```http
POST /lab/avatar
Content-Type: multipart/form-data
# hanya dummy image yang diizinkan
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Di lab, coba file teks yang dinamai `.jpg` dan lihat validasi server. Pakai file latihan biasa, bukan executable berbahaya.

## Cara mencegah / memperbaiki

Batasi tipe dan ukuran, verifikasi konten sesuai use case, simpan di luar executable webroot, acak nama server-side dan layani dengan header yang aman.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [PortSwigger File Upload](https://portswigger.net/web-security/file-upload)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
