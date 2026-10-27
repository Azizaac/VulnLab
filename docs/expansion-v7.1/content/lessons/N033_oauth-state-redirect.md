# N033 — OAuth: State, Redirect URI, dan Identitas

**Tingkat:** Lanjutan · **Estimasi:** 30 menit · **Prasyarat:** L007, L008 · **Lab:** L016

## Target belajar
- Jelaskan akar masalah keamanan ini dengan kata-katamu sendiri.
- Kenali apa yang harus dibandingkan pada request/response di aplikasi training.
- Jelaskan satu perbaikan sisi server serta bukti minimal untuk laporan.

## Ringkasan untuk pemula
OAuth memungkinkan aplikasi mendapatkan otorisasi melalui penyedia identitas, tetapi implementasi redirect dan hubungan request dengan sesi sangat penting. `state` dan validasi callback membantu melindungi alur yang dibuka oleh browser; token juga perlu diverifikasi di tempat yang tepat.

## Analogi agar mudah diingat
Saat menitipkan dokumen ke kurir, kamu memberi nomor resi yang hanya cocok dengan permintaanmu. Bila petugas menerima paket tanpa mencocokkan nomor, dokumen bisa dikaitkan dengan orang yang salah. **Catatan:** analogi tidak menggambarkan seluruh detail browser, jaringan, atau kontrol aplikasi.

## Cara kerja teknis, langkah demi langkah
Klien memulai auth request dengan redirect URI yang terdaftar dan nilai state terkait sesi. Pada callback, klien mengecek state dan menukar code melalui back-channel yang tepat; validasi redirect URI harus sesuai kebijakan penyedia. OpenID Connect menambah pemeriksaan nonce/ID token jika menggunakannya; keduanya jangan dicampur menjadi aturan generik tanpa konteks.

## Contoh HTTP (data dan host fiktif)
```http
GET /authorize?client_id=training-app&response_type=code&redirect_uri=https%3A%2F%2Fclient.lab.test%2Fcallback&state=RANDOM_SESSION_BOUND_VALUE
```

Dalam latihan, perhatikan apakah respons aplikasi mendukung hipotesis atau justru menunjukkan kontrol keamanan berfungsi. Jangan menyimpulkan vulnerability hanya dari status HTTP; cocokkan dengan perubahan state dan hak akses objek/field dummy.

## Latihan terpandu
L016 menggunakan identity provider dummy. Jalankan login biasa, lihat state tersimpan di sesi, kemudian uji callback dummy dengan state tidak sesuai dan catat penolakan. Tidak perlu akun Google atau provider sungguhan.

## Cara memperbaiki dari sisi developer
Gunakan implementasi OAuth/OIDC yang dipelihara, exact redirect allowlist, state yang divalidasi ke sesi, PKCE pada flow yang sesuai, token signature/issuer/audience checks dan session rotation.

## Kesalahan umum dan false positive
OAuth dan OIDC bukan sinonim; protokol otorisasi dan autentikasi berbeda. Penilaian suatu redirect harus berdasarkan spesifikasi flow, bukan hanya penampilan URL.

## Mini-tugas laporan
Gunakan callback fixture yang bersih, redaksi code/token, dan jelaskan dampak account linking jika benar-benar terkonfirmasi.

## Cek pemahaman
Selesaikan tiga soal N033 pada bank kuis, baca penjelasan jawaban. Jika jawaban salah, ulangi bagian teknis lalu bandingkan hasil mode *vulnerable* versus *secure* pada lab lokal. Menyelesaikan artikel tidak sama dengan membuktikan penguasaan.

## Sumber primer
- [OAUTH — referensi resmi](https://portswigger.net/web-security/oauth)
- [AUTH — referensi resmi](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

> Status editorial: `research_draft_unreviewed` · Disusun: 2026-10-27 · Peninjau independen: belum ada. Jangan tampilkan sebagai materi tersertifikasi.
