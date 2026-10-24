# Recon, Scope, dan Pengujian Berizin

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

Scope adalah aset yang secara eksplisit diizinkan diuji beserta teknik dan batasannya. Recon pasif membantu memahami permukaan aplikasi. Pengujian aktif harus mematuhi policy: larangan automation, rate limits, akun pengujian, dan data pribadi. Domain mirip atau subdomain turunan tidak otomatis in-scope.

## Analogi sederhana

Bug bounty seperti latihan di lapangan yang batasnya ditandai jelas; keluar batas berarti melanggar aturan permainan.

## Contoh di VulnShop (data fiktif)

```http
Catatan target: domain_in_scope, exclusions, akun uji, metode diizinkan, request_limit, tanggal policy
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Simulasikan membaca scope policy dummy. Buat checklist keputusan "boleh/tidak boleh" sebelum memetakan endpoint. Jangan lakukan scanning internet untuk memenuhi tugas ini.

## Cara mencegah / memperbaiki

Patuhi program brief dan safe harbor, hentikan bila tidak yakin, gunakan akun milik sendiri dan bukti minimum.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [PortSwigger API Testing](https://portswigger.net/web-security/api-testing)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
