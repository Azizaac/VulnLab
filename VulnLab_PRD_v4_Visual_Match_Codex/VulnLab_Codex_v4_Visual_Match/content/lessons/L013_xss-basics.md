# Cross-Site Scripting: Saat Input Jadi Script

> **Tujuan belajar:** memahami konsep, mengenali gejala di aplikasi dummy, dan menjelaskan satu tindakan pencegahan.

## Inti dalam 1 menit

XSS dapat muncul ketika input tidak tepercaya ditempatkan ke konteks output yang memungkinkan eksekusi JavaScript. Ada reflected, stored, dan DOM-based XSS. Pelajari perbedaan data (teks) dan kode (instruksi); mitigasi utamanya context-aware output encoding dan penggunaan API DOM yang aman.

## Analogi sederhana

Kolom komentar seharusnya memuat tulisan pengunjung, bukan instruksi yang dieksekusi browser.

## Contoh di VulnShop (data fiktif)

```http
Input nama produk: <b>Contoh</b>
Output aman: &lt;b&gt;Contoh&lt;/b&gt;
```

**Cara membaca contoh:** fokus pada siapa yang mengirim permintaan, objek yang diminta, serta keputusan yang seharusnya dibuat server. Nilai dan identitas yang digunakan di sini hanyalah data latihan.

## Praktik aman — amati, jangan menebak

Di lab, masukkan marker teks unik ke pencarian dan lihat bagaimana HTML dihasilkan. Gunakan contoh harmless yang disediakan lab dan jangan menguji website lain tanpa izin.

## Cara mencegah / memperbaiki

Default escaping template, textContent daripada innerHTML bila perlu teks, sanitasi HTML khusus konten kaya, dan CSP defense-in-depth.

## Cek pemahaman

Jawab dua pertanyaan di tab **Kuis**. Tulis satu kalimat dalam **Catatan** tentang apa yang baru kamu pahami; jika masih bingung, baca ulang contoh dan referensi, lalu coba lab terkait bila sudah tersedia.

## Referensi primer

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [PortSwigger XSS](https://portswigger.net/web-security/cross-site-scripting)

> Status editorial: **draft terkurasi berbasis dokumentasi resmi, belum ditinjau pakar independen**. Tanggal penyusunan: 2026-10-23.
