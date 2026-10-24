# SQL Injection dan Query Berparameter

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

SQL injection terjadi saat data eksternal digabung secara tidak aman ke struktur query. Query berparameter menjaga pemisahan antara kode SQL dan nilai input. Menghapus tanda petik atau memblokir beberapa kata bukan mitigasi yang setara.

## Analogi sederhana

Pencarian database seperti mengisi formulir; input pengguna tidak boleh menjadi bagian dari instruksi SQL.

## Contoh di VulnShop (data fiktif)

```http
AMAN (Laravel): Product::where("name", $name)->first();
HINDARI: concatenating untrusted input in a raw SQL string
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Di lab SQLi dummy, amati perbedaan perubahan input pada query raw dan query builder. Hindari pengambilan database selain dataset latihan.

## Cara mencegah / memperbaiki

Gunakan parameterized query/query builder, least privilege DB dan validasi tipe, panjang dan bentuk input.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [PortSwigger SQL Injection](https://portswigger.net/web-security/sql-injection)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
