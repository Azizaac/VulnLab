# Mass Assignment dan Properti Terlarang

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

Mass assignment muncul ketika properti request secara luas disalin ke model tanpa aturan field. Risiko bukan sekadar field tersembunyi; setiap field yang boleh diperbarui perlu ditentukan sesuai aktor dan operasi. Properti response juga perlu diperhatikan agar data internal tidak bocor.

## Analogi sederhana

Form edit alamat hanya meminta kota, tapi user mencoba menyelipkan kolom "role=admin".

## Contoh di VulnShop (data fiktif)

```http
PATCH /api/profile
{"city":"Solo","role":"admin"}
# role harus diabaikan/ditolak untuk user
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Di lab, lihat apakah penambahan field yang tidak muncul di UI mengubah data model. Semua data menggunakan akun dummy.

## Cara mencegah / memperbaiki

Gunakan Form Request validation dan field allowlist / DTO yang eksplisit, Policies, dan tes bahwa field istimewa tidak berubah.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [OWASP API Security Top 10 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
