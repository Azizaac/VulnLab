# Login, Logout, dan Siklus Sesi

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

Aplikasi perlu mengatur kapan sesi dibuat, kapan diganti, kapan kedaluwarsa, dan kapan dibatalkan. Masalah muncul ketika sesi lama masih hidup setelah logout, reset password, atau perubahan hak istimewa. Pembatasan login juga perlu mempertimbangkan pengalaman pengguna dan penyalahgunaan.

## Analogi sederhana

Sesi seperti kartu akses sementara: diterbitkan, dipakai, diperbarui, dan dicabut.

## Contoh di VulnShop (data fiktif)

```http
POST /login → Set-Cookie: session=NEW_ID
POST /logout → session diinvalidasi
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Gunakan browser privat lab, login akun dummy, simpan observasi session, logout, lalu verifikasi request berikutnya meminta autentikasi ulang.

## Cara mencegah / memperbaiki

Rotasi session setelah autentikasi, batasi durasi, terapkan logout yang benar dan log kejadian secara aman tanpa menyimpan secret.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [MDN — HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)
- [PortSwigger Authentication](https://portswigger.net/web-security/authentication)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
