# Memperbaiki Temuan di Laravel

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

Laravel menyediakan middleware, Form Requests, Policies dan query builder untuk membangun kontrol aman. Perbaikan perlu menutup root cause, bukan hanya satu contoh input. Setelah patch, tambah tes regresi: role yang berhak tetap bisa, role yang tidak berhak ditolak, dan validasi input buruk tidak merusak data.

## Analogi sederhana

Memperbaiki satu order view bukan sekadar menutup tombolnya; kunci pintu harus ada di sisi server.

## Contoh di VulnShop (data fiktif)

```http
$this->authorize("view", $order);
# pastikan policy memvalidasi akses ke objek
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Simulasikan memperbaiki endpoint order dummy: bandingkan sebelum/sesudah terhadap akun A dan B dan jalankan PHPUnit/Pest feature tests.

## Cara mencegah / memperbaiki

Gunakan Policy/Gate, parameter binding, validasi ketat, query parameterized dan integration tests. Jangan mencampur vulnerability code ke core app.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
