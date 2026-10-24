# Cookies, Session, dan Identitas Login

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

HTTP bersifat stateless, jadi aplikasi perlu mekanisme mengingat keadaan login. Cookie dapat membawa session ID; server menghubungkannya dengan identitas pengguna. Atribut HttpOnly, Secure, dan SameSite memiliki peran berbeda; satu atribut saja tidak membuat sesi otomatis aman.

## Analogi sederhana

Cookie session seperti nomor penitipan barang; nilainya mengacu pada sesi, bukan password mentah.

## Contoh di VulnShop (data fiktif)

```http
Set-Cookie: vulnlab_session=abc123; HttpOnly; SameSite=Lax; Path=/
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Login ke akun dummy, lihat header Set-Cookie. Logout lalu perhatikan perubahan cookie dan apakah session lama masih berlaku. Jangan menyalin session milik orang lain.

## Cara mencegah / memperbaiki

Regenerasi session ID saat login, lakukan invalidasi saat logout, set cookie flags sesuai konteks dan lindungi request perubahan status dari CSRF.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [MDN — HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
