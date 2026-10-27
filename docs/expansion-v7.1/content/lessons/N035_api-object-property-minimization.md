# N035 — API Object Property Authorization & Data Minimization

**Tingkat:** Menengah · **Estimasi:** 30 menit · **Prasyarat:** L010, L021 · **Lab:** L018, L019

## Target belajar
- Jelaskan akar masalah keamanan ini dengan kata-katamu sendiri.
- Kenali apa yang harus dibandingkan pada request/response di aplikasi training.
- Jelaskan satu perbaikan sisi server serta bukti minimal untuk laporan.

## Ringkasan untuk pemula
Otorisasi API tidak berhenti pada pertanyaan “bolehkah pengguna membuka objek ini?”. Server juga harus memutuskan field apa yang boleh dilihat dan diubah pengguna. Field `is_admin`, `internal_notes`, atau data identitas berbeda hak aksesnya dari `display_name`.

## Analogi agar mudah diingat
Kamu diizinkan membaca kartu peserta acara, tetapi bukan berarti boleh melihat semua catatan panitia yang tersimpan dalam baris database yang sama. **Catatan:** analogi tidak menggambarkan seluruh detail browser, jaringan, atau kontrol aplikasi.

## Cara kerja teknis, langkah demi langkah
BOLA memeriksa pemilik/objek; object-property authorization memeriksa tiap atribut penting. Mass assignment terjadi ketika input diterapkan terlalu luas pada model, sedangkan excessive data exposure muncul saat response memuat atribut internal. Pagination yang baik membatasi jumlah data dan tetap menerapkan kebijakan akses per item. Dalam GraphQL, pemilihan field harus tetap melewati field-level permission.

## Contoh HTTP (data dan host fiktif)
```http
PATCH /api/profile HTTP/1.1
Content-Type: application/json

{"display_name":"Learner A"}

HTTP/1.1 200 OK
{"id":101,"display_name":"Learner A"}
```

Dalam latihan, perhatikan apakah respons aplikasi mendukung hipotesis atau justru menunjukkan kontrol keamanan berfungsi. Jangan menyimpulkan vulnerability hanya dari status HTTP; cocokkan dengan perubahan state dan hak akses objek/field dummy.

## Latihan terpandu
L018 membandingkan field yang boleh diedit oleh learner dengan field internal yang hanya boleh diubah admin dummy. L019 membandingkan jumlah/jenis field pada hasil list dengan page_size dibatasi. Gunakan dua akun fixture dan catat expected/actual.

## Cara memperbaiki dari sisi developer
Gunakan Form Request validation dengan allowlist field, explicit DTO/API Resource serialization, policies per objek dan atribut, batas pagination maksimal dan pengujian role-matrix lintas semua route.

## Kesalahan umum dan false positive
Sebuah field bernama `is_admin` di response tidak otomatis menunjukkan eskalasi hak akses tanpa bukti keputusan server berubah. Data tambahan tak sensitif juga tidak selalu berdampak sama dengan PII.

## Mini-tugas laporan
Pisahkan klaim read exposure, unauthorized write, dan efek business logic; bukti harus menunjukkan field/data dummy dan hak akses yang sebenarnya.

## Cek pemahaman
Selesaikan tiga soal N035 pada bank kuis, baca penjelasan jawaban. Jika jawaban salah, ulangi bagian teknis lalu bandingkan hasil mode *vulnerable* versus *secure* pada lab lokal. Menyelesaikan artikel tidak sama dengan membuktikan penguasaan.

## Sumber primer
- [API3 — referensi resmi](https://api-security.owasp.org/editions/2023/en/0xa3-broken-object-property-level-authorization/)
- [API — referensi resmi](https://owasp.org/API-Security/)

> Status editorial: `research_draft_unreviewed` · Disusun: 2026-10-27 · Peninjau independen: belum ada. Jangan tampilkan sebagai materi tersertifikasi.
