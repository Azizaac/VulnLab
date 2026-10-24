# HTTP Methods: GET, POST, PUT, PATCH, DELETE

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

GET biasanya membaca resource; POST sering membuat atau menjalankan aksi; PUT mengganti representasi; PATCH memperbarui sebagian; DELETE meminta penghapusan. Namun aplikasi bisa salah memakai method, jadi lihat juga efek aktual dan izin. GET idealnya tidak menimbulkan perubahan penting pada server.

## Analogi sederhana

Method adalah kata kerja pada surat perintah: lihat, buat, ubah, atau hapus.

## Contoh di VulnShop (data fiktif)

```http
GET /api/products
POST /api/orders
PATCH /api/orders/101
DELETE /api/notes/8
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Di API dummy, bandingkan status untuk GET dan PATCH. Uji satu endpoint dengan akun yang berhak dan akun yang tidak berhak—bukan data milik orang sungguhan.

## Cara mencegah / memperbaiki

Validasi method yang diizinkan, otorisasi pada setiap aksi, dan idempotensi sesuai kebutuhan; jangan bergantung pada method sebagai kontrol akses.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [MDN — HTTP Overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview)
- [PortSwigger API Testing](https://portswigger.net/web-security/api-testing)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
