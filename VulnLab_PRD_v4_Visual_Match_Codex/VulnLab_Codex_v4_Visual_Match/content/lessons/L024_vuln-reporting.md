# Menulis Laporan Bug yang Bisa Direproduksi

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

Laporan yang baik memisahkan langkah reproduksi, observed/expected behavior, bukti minimum, dampak terverifikasi, severity rationale, dan saran perbaikan. Judul perlu menyebut jenis masalah dan komponen; jangan melebih-lebihkan dampak atau mengklaim data orang lain telah diekspos jika belum teruji secara aman.

## Analogi sederhana

Laporan vulnerability seperti resep masakan: orang lain harus bisa mengulangnya dari instruksi yang jelas.

## Contoh di VulnShop (data fiktif)

```http
Title: IDOR di endpoint detail order dummy
Expected: akun B ditolak
Actual: akun B menerima detail order A
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Tulis laporan latihan berdasarkan temuan lab yang kamu buat dengan dua akun dummy. Sensor cookie/session/token sebelum menyertakan request dan screenshot.

## Cara mencegah / memperbaiki

Gunakan struktur yang konsisten, lampirkan request/response yang disanitasi, sertakan scope, waktu, serta rekomendasi akar penyebab.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
