# VulnLab — 10 Pendalaman Materi Baru (N026–N035)


---

> Konten original berbahasa Indonesia berdasarkan referensi resmi. **Status: research draft / belum direview pakar independen**. Publikasi harus mengikuti alur Admin Studio. Semua endpoint di bawah adalah **fixture training**, bukan target nyata.


---

# N026 — Reset Password: Token, Waktu Kedaluwarsa, dan Kebocoran Akun

**Tingkat:** Pemula · **Estimasi:** 22 menit · **Prasyarat:** L007, L008 · **Lab:** L009

## Target belajar
- Jelaskan akar masalah keamanan ini dengan kata-katamu sendiri.
- Kenali apa yang harus dibandingkan pada request/response di aplikasi training.
- Jelaskan satu perbaikan sisi server serta bukti minimal untuk laporan.

## Ringkasan untuk pemula
Alur reset password terlihat sederhana, tetapi sebenarnya menyentuh identitas pengguna, token sementara, dan sesi login. Server perlu memperlakukan tautan reset seperti kunci sekali pakai: hanya pemegangnya yang dapat menggunakannya, waktunya terbatas, dan sesudah dipakai kunci tidak berlaku lagi.

## Analogi agar mudah diingat
Bayangkan resepsionis mengirim tiket penggantian kunci kamar. Resepsionis tidak mengumumkan siapa yang punya kamar itu, tiket kedaluwarsa, dan satu tiket tidak bisa digunakan berkali-kali. **Catatan:** analogi tidak menggambarkan seluruh detail browser, jaringan, atau kontrol aplikasi.

## Cara kerja teknis, langkah demi langkah
Ketika seseorang meminta reset, backend menghasilkan token acak yang tidak dapat ditebak. Sistem mengirim token melalui kanal terpisah yang dimiliki pengguna, mencatat masa berlaku, dan saat tautan dipakai melakukan validasi yang independen dari input browser. Token sekali pakai sebaiknya tidak tersimpan dalam log biasa. Pesan permintaan reset dibuat serupa untuk email terdaftar maupun tidak, sehingga formulir tidak menjadi alat enumerasi akun.

## Contoh HTTP (data dan host fiktif)
```http
POST /forgot-password HTTP/1.1
Content-Type: application/json

{"email":"learner-a@lab.test"}

HTTP/1.1 200 OK
{"message":"Jika akun terdaftar, petunjuk akan dikirim."}
```

Dalam latihan, perhatikan apakah respons aplikasi mendukung hipotesis atau justru menunjukkan kontrol keamanan berfungsi. Jangan menyimpulkan vulnerability hanya dari status HTTP; cocokkan dengan perubahan state dan hak akses objek/field dummy.

## Latihan terpandu
Di mailbox dummy L009, minta token untuk dua akun fiktif. Periksa apakah respons permintaan akun ada/tidak tetap netral; gunakan tautan sekali lalu coba ulang. Catat juga apa yang terjadi ketika waktu token fixture dipercepat hingga lewat masa berlaku.

## Cara memperbaiki dari sisi developer
Gunakan fasilitas reset password Laravel dengan token acak, masa berlaku terbatas, limit permintaan, event audit tanpa token, rotasi/invalidasi token setelah digunakan, dan opsi mengakhiri sesi lain sesuai kebijakan. Pastikan host reset link dikendalikan konfigurasi server.

## Kesalahan umum dan false positive
Pesan yang berbeda bukan satu-satunya indikasi enumerasi; perbedaan waktu yang konsisten bisa relevan. Sebaliknya, kegagalan login setelah reset bisa berasal dari sesi yang memang sudah diputus secara aman.

## Mini-tugas laporan
Tulis dua langkah reproduksi dengan akun dummy dan hasil yang benar-benar terbukti; jangan menempelkan token reset asli dalam laporan.

## Cek pemahaman
Selesaikan tiga soal N026 pada bank kuis, baca penjelasan jawaban. Jika jawaban salah, ulangi bagian teknis lalu bandingkan hasil mode *vulnerable* versus *secure* pada lab lokal. Menyelesaikan artikel tidak sama dengan membuktikan penguasaan.

## Sumber primer
- [RESET — referensi resmi](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [AUTH — referensi resmi](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

> Status editorial: `research_draft_unreviewed` · Disusun: 2026-10-27 · Peninjau independen: belum ada. Jangan tampilkan sebagai materi tersertifikasi.


---

# N027 — CSRF dan SameSite: Kenapa Browser Mengirim Cookie?

**Tingkat:** Pemula · **Estimasi:** 24 menit · **Prasyarat:** L004, L012 · **Lab:** L010

## Target belajar
- Jelaskan akar masalah keamanan ini dengan kata-katamu sendiri.
- Kenali apa yang harus dibandingkan pada request/response di aplikasi training.
- Jelaskan satu perbaikan sisi server serta bukti minimal untuk laporan.

## Ringkasan untuk pemula
CSRF terjadi ketika aplikasi menerima perubahan penting dari browser yang sedang login tanpa bukti bahwa permintaan itu benar-benar dimaksudkan pengguna. Cookie autentikasi biasanya ikut terkirim otomatis sesuai aturan browser; itulah alasan CSRF perlu dipikirkan pada permintaan yang mengubah state.

## Analogi agar mudah diingat
Seorang petugas mengenali pelanggan dari kartu langganan, tetapi tidak mengecek apakah instruksi yang diterimanya memang dikirim pelanggan tersebut. Identitas yang valid tidak selalu berarti niat yang valid. **Catatan:** analogi tidak menggambarkan seluruh detail browser, jaringan, atau kontrol aplikasi.

## Cara kerja teknis, langkah demi langkah
Pada form dengan cookie sesi, server seharusnya memeriksa token anti-CSRF atau mekanisme lain sesuai arsitektur, memeriksa origin bila tepat, dan menggunakan SameSite sebagai defense-in-depth. SameSite=Lax/Strict membantu mengurangi beberapa skenario, tetapi tidak menjadi pengganti seluruh kontrol ketika ada subdomain/flow khusus. JSON API berbasis token bearer berbeda profil risikonya dari form berbasis cookie.

## Contoh HTTP (data dan host fiktif)
```http
POST /api/preferences HTTP/1.1
Cookie: session=TRAINING_SESSION
Content-Type: application/x-www-form-urlencoded

theme=dark

HTTP/1.1 419 Page Expired
```

Dalam latihan, perhatikan apakah respons aplikasi mendukung hipotesis atau justru menunjukkan kontrol keamanan berfungsi. Jangan menyimpulkan vulnerability hanya dari status HTTP; cocokkan dengan perubahan state dan hak akses objek/field dummy.

## Latihan terpandu
L010 menyediakan halaman fixture yang dapat mengirim form hanya ke aplikasi training lokal. Bandingkan request berisi token dan request tanpa token lalu amati perubahan data dummy. Jangan gunakan situs pihak ketiga sebagai origin.

## Cara memperbaiki dari sisi developer
Aktifkan middleware CSRF Laravel pada routes yang menggunakan sesi, validasi mutasi pada backend, atur SameSite dan Secure cookie, audit Origin/Referer sesuai kebutuhan, serta jangan memakai GET untuk aksi yang mengubah data.

## Kesalahan umum dan false positive
HTTP 419 tidak otomatis membuktikan aplikasi aman terhadap seluruh CSRF; lihat cakupan route dan metode autentikasinya. Jangan mengasumsikan tiap request lintas origin berarti CSRF berhasil.

## Mini-tugas laporan
Tuliskan kebutuhan sesi, jenis aksi yang berubah, dan bukti data dummy sebelum/sesudah pengujian.

## Cek pemahaman
Selesaikan tiga soal N027 pada bank kuis, baca penjelasan jawaban. Jika jawaban salah, ulangi bagian teknis lalu bandingkan hasil mode *vulnerable* versus *secure* pada lab lokal. Menyelesaikan artikel tidak sama dengan membuktikan penguasaan.

## Sumber primer
- [CSRF — referensi resmi](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [WSTG — referensi resmi](https://owasp.org/www-project-web-security-testing-guide/)

> Status editorial: `research_draft_unreviewed` · Disusun: 2026-10-27 · Peninjau independen: belum ada. Jangan tampilkan sebagai materi tersertifikasi.


---

# N028 — Path Traversal: Menjaga File Tetap di Direktori yang Benar

**Tingkat:** Menengah · **Estimasi:** 27 menit · **Prasyarat:** L002, L015 · **Lab:** L011

## Target belajar
- Jelaskan akar masalah keamanan ini dengan kata-katamu sendiri.
- Kenali apa yang harus dibandingkan pada request/response di aplikasi training.
- Jelaskan satu perbaikan sisi server serta bukti minimal untuk laporan.

## Ringkasan untuk pemula
Aplikasi sering punya fitur unduh invoice, gambar, atau dokumen. Bila nama atau path file digabung langsung dari input pengguna, aplikasi dapat memilih file di luar direktori yang diizinkan. Kontrol keamanannya bukan sekadar melarang teks tertentu; server harus menentukan sendiri file apa yang boleh diakses.

## Analogi agar mudah diingat
Petugas gudang mendapat nomor resi untuk mencari satu kotak. Jika petugas membiarkan pelanggan menulis lokasi rak bebas, orang itu bisa mencoba membuka gudang lain. **Catatan:** analogi tidak menggambarkan seluruh detail browser, jaringan, atau kontrol aplikasi.

## Cara kerja teknis, langkah demi langkah
Path adalah struktur direktori, bukan identitas akses. Decode, normalisasi separator, simbol path relatif, dan symlink dapat memengaruhi hasil path akhir. Strategi aman: gunakan ID file di database, otorisasi file berdasarkan pemilik, kemudian resolve ke direktori yang dikendalikan server. Jika path diperlukan, validasi hasil path kanonis tetap berada dalam root izin dan hindari race.

## Contoh HTTP (data dan host fiktif)
```http
GET /api/receipts/101/download HTTP/1.1
Host: files.lab.test

HTTP/1.1 200 OK
Content-Type: application/pdf

[synthetic invoice fixture]
```

Dalam latihan, perhatikan apakah respons aplikasi mendukung hipotesis atau justru menunjukkan kontrol keamanan berfungsi. Jangan menyimpulkan vulnerability hanya dari status HTTP; cocokkan dengan perubahan state dan hak akses objek/field dummy.

## Latihan terpandu
Dalam L011, gunakan pemilih nama file fixture yang telah disediakan. Coba variasi nama yang diizinkan, tidak ditemukan, dan di luar folder fixture; amati apakah file berbeda dapat diakses dan apakah data dummy pengguna lain ditolak.

## Cara memperbaiki dari sisi developer
Pertahankan mapping UUID/ID dokumen → file di sisi server, gunakan storage abstraction Laravel, cek policies kepemilikan sebelum streaming, pilih nama unduhan yang aman dan jangan merangkai path mentah pengguna.

## Kesalahan umum dan false positive
Response 404 bisa terjadi karena file hilang atau karena akses disembunyikan; perlu membandingkan dengan fixture kontrol. Jangan memakai file sistem host nyata sebagai target lab.

## Mini-tugas laporan
Tunjukkan identitas file dummy dan batas akses yang dilanggar, tanpa mengekstrak file sensitif host.

## Cek pemahaman
Selesaikan tiga soal N028 pada bank kuis, baca penjelasan jawaban. Jika jawaban salah, ulangi bagian teknis lalu bandingkan hasil mode *vulnerable* versus *secure* pada lab lokal. Menyelesaikan artikel tidak sama dengan membuktikan penguasaan.

## Sumber primer
- [TRAVERSAL — referensi resmi](https://portswigger.net/web-security/file-path-traversal)
- [WSTG — referensi resmi](https://owasp.org/www-project-web-security-testing-guide/)

> Status editorial: `research_draft_unreviewed` · Disusun: 2026-10-27 · Peninjau independen: belum ada. Jangan tampilkan sebagai materi tersertifikasi.


---

# N029 — File Upload: MIME, Ekstensi, dan Penyimpanan Aman

**Tingkat:** Menengah · **Estimasi:** 28 menit · **Prasyarat:** L015, L017 · **Lab:** L012

## Target belajar
- Jelaskan akar masalah keamanan ini dengan kata-katamu sendiri.
- Kenali apa yang harus dibandingkan pada request/response di aplikasi training.
- Jelaskan satu perbaikan sisi server serta bukti minimal untuk laporan.

## Ringkasan untuk pemula
Memeriksa ekstensi `.jpg` di browser tidak membuat upload aman. Server harus memvalidasi konten, ukuran, tipe yang diperbolehkan, dan lokasi penyimpanan. File yang boleh diunggah juga tidak otomatis boleh dijalankan sebagai program.

## Analogi agar mudah diingat
Petugas menerima paket bertuliskan “buku”. Label luar dapat keliru, sehingga barang perlu diproses berdasarkan aturan gudang dan tidak langsung ditempatkan di ruang kontrol listrik. **Catatan:** analogi tidak menggambarkan seluruh detail browser, jaringan, atau kontrol aplikasi.

## Cara kerja teknis, langkah demi langkah
Aplikasi bisa berbeda membaca ekstensi, MIME yang dinyatakan klien, dan isi file. Penyerang dapat mengunggah nama yang menyerupai gambar namun isinya berbeda. Setelah file disimpan, ancaman juga bergantung pada apakah storage dapat diakses publik, dieksekusi, atau diproses oleh konverter rentan.

## Contoh HTTP (data dan host fiktif)
```http
POST /api/avatar HTTP/1.1
Content-Type: multipart/form-data; boundary=LAB

--LAB
Content-Disposition: form-data; name="avatar"; filename="sample.png"
Content-Type: image/png

[fixture bytes]
--LAB--
```

Dalam latihan, perhatikan apakah respons aplikasi mendukung hipotesis atau justru menunjukkan kontrol keamanan berfungsi. Jangan menyimpulkan vulnerability hanya dari status HTTP; cocokkan dengan perubahan state dan hak akses objek/field dummy.

## Latihan terpandu
Pada L012, unggah tiga dummy fixture: gambar valid, file yang label MIME-nya tidak cocok, dan berkas terlalu besar. Lihat validasi server, lokasi preview, dan penolakan tipe. Tidak ada executable upload maupun eksekusi script.

## Cara memperbaiki dari sisi developer
Gunakan allowlist tipe dan ukuran, deteksi file sebenarnya di server, ubah nama menjadi ID acak, simpan di storage non-eksekusi, akses dengan controller terotorisasi, dan proses dengan library aman sesuai jenis file.

## Kesalahan umum dan false positive
Perbedaan ekstensi dan MIME tidak selalu langsung dapat dieksploitasi; bukti dampak memerlukan jalur interpretasi file yang nyata. Dalam lab ini bukti dibuat dengan file dummy, bukan shell web.

## Mini-tugas laporan
Rekam jenis file, pemeriksaan yang dilewati, dan apakah aplikasi memperlakukan fixture secara salah; jangan klaim remote code execution tanpa bukti.

## Cek pemahaman
Selesaikan tiga soal N029 pada bank kuis, baca penjelasan jawaban. Jika jawaban salah, ulangi bagian teknis lalu bandingkan hasil mode *vulnerable* versus *secure* pada lab lokal. Menyelesaikan artikel tidak sama dengan membuktikan penguasaan.

## Sumber primer
- [UPLOAD — referensi resmi](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [WSTG — referensi resmi](https://owasp.org/www-project-web-security-testing-guide/)

> Status editorial: `research_draft_unreviewed` · Disusun: 2026-10-27 · Peninjau independen: belum ada. Jangan tampilkan sebagai materi tersertifikasi.


---

# N030 — GraphQL: Query Fleksibel, Izin Tetap Harus Ketat

**Tingkat:** Menengah · **Estimasi:** 30 menit · **Prasyarat:** L022, L009 · **Lab:** L013, L020

## Target belajar
- Jelaskan akar masalah keamanan ini dengan kata-katamu sendiri.
- Kenali apa yang harus dibandingkan pada request/response di aplikasi training.
- Jelaskan satu perbaikan sisi server serta bukti minimal untuk laporan.

## Ringkasan untuk pemula
GraphQL memungkinkan klien meminta field spesifik dalam satu query, tetapi izin membaca field dan objek tetap harus diputuskan server. Menyembunyikan tombol atau membatasi satu query di frontend tidak menjamin resolver lain aman.

## Analogi agar mudah diingat
Perpustakaan menyediakan katalog yang bisa menyaring bab buku. Kebebasan mencari bab tidak berarti boleh melihat koleksi arsip yang hanya untuk anggota tertentu. **Catatan:** analogi tidak menggambarkan seluruh detail browser, jaringan, atau kontrol aplikasi.

## Cara kerja teknis, langkah demi langkah
Resolver mengambil data per objek dan per field. Periksa autentikasi, otorisasi objek dan property, serta limit kedalaman/biaya query sesuai kebutuhan. Relasi lintas tenant dan nested resolvers sering membutuhkan konteks pemilik yang diteruskan dengan benar, bukan hanya pemeriksaan pada root query.

## Contoh HTTP (data dan host fiktif)
```http
POST /graphql HTTP/1.1
Content-Type: application/json

{"query":"query { myOrders { id status } }"}
```

Dalam latihan, perhatikan apakah respons aplikasi mendukung hipotesis atau justru menunjukkan kontrol keamanan berfungsi. Jangan menyimpulkan vulnerability hanya dari status HTTP; cocokkan dengan perubahan state dan hak akses objek/field dummy.

## Latihan terpandu
Dalam L013, jalankan query terhadap order dummy dari akun A dan B. Dalam L020, bandingkan workspace milik dua tenant dummy. Validasi bahwa tiap resolver menolak objek di luar izin.

## Cara memperbaiki dari sisi developer
Terapkan Laravel policies/domain authorization di service atau resolver untuk setiap objek/field, gunakan dataloader aman, limit query depth/cost, dan audit mutation terpisah.

## Kesalahan umum dan false positive
Schema introspection yang aktif bukan otomatis kerentanan; konteks dan data sensitif yang terbuka penting. Jangan menyamakan error resolver dengan bypass akses.

## Mini-tugas laporan
Cantumkan field/resolver, identitas objek dummy dan hasil expected-versus-actual yang menunjukkan batas tenant.

## Cek pemahaman
Selesaikan tiga soal N030 pada bank kuis, baca penjelasan jawaban. Jika jawaban salah, ulangi bagian teknis lalu bandingkan hasil mode *vulnerable* versus *secure* pada lab lokal. Menyelesaikan artikel tidak sama dengan membuktikan penguasaan.

## Sumber primer
- [GRAPHQL — referensi resmi](https://portswigger.net/web-security/graphql)
- [API — referensi resmi](https://owasp.org/API-Security/)

> Status editorial: `research_draft_unreviewed` · Disusun: 2026-10-27 · Peninjau independen: belum ada. Jangan tampilkan sebagai materi tersertifikasi.


---

# N031 — CORS: Siapa yang Boleh Membaca Respons?

**Tingkat:** Menengah · **Estimasi:** 24 menit · **Prasyarat:** L005, L004 · **Lab:** L014

## Target belajar
- Jelaskan akar masalah keamanan ini dengan kata-katamu sendiri.
- Kenali apa yang harus dibandingkan pada request/response di aplikasi training.
- Jelaskan satu perbaikan sisi server serta bukti minimal untuk laporan.

## Ringkasan untuk pemula
CORS adalah mekanisme browser yang mengatur kapan JavaScript dari satu origin boleh membaca respons origin lain. CORS bukan sistem autentikasi. Server harus secara sengaja memilih origin yang mendapat akses, terutama jika cookie atau kredensial dikirim.

## Analogi agar mudah diingat
Membolehkan tamu memasuki ruang tunggu berbeda dengan mengizinkan tamu membaca dokumen pribadi di meja resepsionis. Origin policy mengatur akses baca di browser, bukan hak bisnis pengguna. **Catatan:** analogi tidak menggambarkan seluruh detail browser, jaringan, atau kontrol aplikasi.

## Cara kerja teknis, langkah demi langkah
Browser mengirim Origin dan kadang preflight OPTIONS. Server membalas Access-Control-Allow-Origin serta header lain. Kombinasi origin yang terlalu permisif dan credentialed reads dapat membuat data yang seharusnya tidak dapat dibaca oleh halaman lain menjadi terekspos. Nilai wildcard tidak digunakan untuk credentialed CORS reads oleh browser modern; lihat kebijakan lengkap, bukan satu header.

## Contoh HTTP (data dan host fiktif)
```http
GET /api/me HTTP/1.1
Origin: https://reader.lab.test
Cookie: session=TRAINING_SESSION

HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://reader.lab.test
Access-Control-Allow-Credentials: true
```

Dalam latihan, perhatikan apakah respons aplikasi mendukung hipotesis atau justru menunjukkan kontrol keamanan berfungsi. Jangan menyimpulkan vulnerability hanya dari status HTTP; cocokkan dengan perubahan state dan hak akses objek/field dummy.

## Latihan terpandu
L014 memakai dua origin sintetis yang dipetakan ke fixture browser lokal. Bandingkan header, keterbacaan respons oleh JS, dan peran autentikasi. Jangan gunakan domain nyata sebagai origin pengujian.

## Cara memperbaiki dari sisi developer
Allowlist origin tepat, hindari memantulkan header Origin secara membabi buta, gunakan credential mode hanya bila diperlukan, set Vary: Origin bila dinamis, dan tetap terapkan autentikasi/otorisasi server.

## Kesalahan umum dan false positive
Header CORS yang aneh tanpa kredensial, data sensitif, atau primitive pembacaan lintas origin belum tentu vulnerability berdampak. Browser dan curl memiliki perilaku enforcement yang berbeda.

## Mini-tugas laporan
Tuliskan origin sintetis, kondisi cookie, header, dan apakah JS fixture benar-benar dapat membaca data dummy.

## Cek pemahaman
Selesaikan tiga soal N031 pada bank kuis, baca penjelasan jawaban. Jika jawaban salah, ulangi bagian teknis lalu bandingkan hasil mode *vulnerable* versus *secure* pada lab lokal. Menyelesaikan artikel tidak sama dengan membuktikan penguasaan.

## Sumber primer
- [CORS — referensi resmi](https://portswigger.net/web-security/cors)
- [MDN — referensi resmi](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview)

> Status editorial: `research_draft_unreviewed` · Disusun: 2026-10-27 · Peninjau independen: belum ada. Jangan tampilkan sebagai materi tersertifikasi.


---

# N032 — SSRF pada Webhook: Ketika Server Mengikuti URL

**Tingkat:** Lanjutan · **Estimasi:** 32 menit · **Prasyarat:** L016, L006 · **Lab:** L015

## Target belajar
- Jelaskan akar masalah keamanan ini dengan kata-katamu sendiri.
- Kenali apa yang harus dibandingkan pada request/response di aplikasi training.
- Jelaskan satu perbaikan sisi server serta bukti minimal untuk laporan.

## Ringkasan untuk pemula
Webhook berguna untuk mengirim notifikasi ke layanan lain. Risikonya muncul jika server bebas mengunjungi alamat dari input pengguna, termasuk alamat jaringan yang seharusnya tidak diakses. Di sistem latihan, kita pelajari batas kepercayaan tanpa memakai jaringan nyata.

## Analogi agar mudah diingat
Seseorang meminta kurir kantor mengirim surat ke alamat yang ditulisnya. Kurir harus punya daftar area yang diizinkan, bukan sekadar memastikan alamat terlihat rapi. **Catatan:** analogi tidak menggambarkan seluruh detail browser, jaringan, atau kontrol aplikasi.

## Cara kerja teknis, langkah demi langkah
URL perlu dipahami secara kanonis, tujuan akhir request diperiksa setelah DNS resolution dan setiap redirect, alamat privat/link-local/metadata diblokir, protokol dibatasi, dan konektivitas keluar dikendalikan firewall. URL filtering aplikasi saja tidak cukup untuk membatasi semua jalur; jaringan harus menjadi lapisan pertahanan kedua.

## Contoh HTTP (data dan host fiktif)
```http
POST /api/webhooks/test HTTP/1.1
Content-Type: application/json

{"destination":"http://sink.lab.invalid/echo"}

HTTP/1.1 202 Accepted
```

Dalam latihan, perhatikan apakah respons aplikasi mendukung hipotesis atau justru menunjukkan kontrol keamanan berfungsi. Jangan menyimpulkan vulnerability hanya dari status HTTP; cocokkan dengan perubahan state dan hak akses objek/field dummy.

## Latihan terpandu
L015 hanya menerima empat host fixture dalam jaringan mock terisolasi. Amati mana yang berlabel approved atau blocked oleh validator. Tidak boleh ada request ke host, router, metadata atau internet.

## Cara memperbaiki dari sisi developer
Jangan menjadi proxy URL arbitrer. Terapkan allowlist host/protocol dan outbound network policy, blok redirect keluar scope, DNS rebind protections, timeout/size caps, dan audit log yang menyamarkan rahasia.

## Kesalahan umum dan false positive
Respons status 202 hanya menunjukkan permintaan ditampung; cek log fixture yang disediakan untuk bukti network target. Jangan pernah mencoba IP metadata nyata untuk latihan ini.

## Mini-tugas laporan
Laporkan perpindahan ke destination fixture yang tidak semestinya, tanpa menyebut kemampuan mengakses server internal nyata.

## Cek pemahaman
Selesaikan tiga soal N032 pada bank kuis, baca penjelasan jawaban. Jika jawaban salah, ulangi bagian teknis lalu bandingkan hasil mode *vulnerable* versus *secure* pada lab lokal. Menyelesaikan artikel tidak sama dengan membuktikan penguasaan.

## Sumber primer
- [SSRF — referensi resmi](https://portswigger.net/web-security/ssrf)
- [API — referensi resmi](https://owasp.org/API-Security/)

> Status editorial: `research_draft_unreviewed` · Disusun: 2026-10-27 · Peninjau independen: belum ada. Jangan tampilkan sebagai materi tersertifikasi.


---

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


---

# N034 — Race Condition: Ketika Dua Request Berebut Stok

**Tingkat:** Lanjutan · **Estimasi:** 29 menit · **Prasyarat:** L018, L006 · **Lab:** L017

## Target belajar
- Jelaskan akar masalah keamanan ini dengan kata-katamu sendiri.
- Kenali apa yang harus dibandingkan pada request/response di aplikasi training.
- Jelaskan satu perbaikan sisi server serta bukti minimal untuk laporan.

## Ringkasan untuk pemula
Bug race condition muncul ketika dua operasi melihat state yang sama sebelum salah satunya menguncinya. Dalam transaksi e-commerce, kupon sekali pakai atau stok terbatas bisa berubah salah bila validasi dan penyimpanan tidak dilakukan atomik.

## Analogi agar mudah diingat
Dua kasir melihat stok terakhir yang sama di layar, lalu keduanya menjual barang tersebut sebelum persediaan diperbarui. Keduanya membuat keputusan dari keadaan yang sudah tidak valid. **Catatan:** analogi tidak menggambarkan seluruh detail browser, jaringan, atau kontrol aplikasi.

## Cara kerja teknis, langkah demi langkah
Masalahnya bukan sekadar request cepat; ia ada pada urutan baca–cek–tulis yang tidak atomik. Perbaikan dapat menggunakan transaksi database, row-level locking, unique constraint, atomic update, dan idempotency keys sesuai operasi. Logging concurrency harus tidak menuliskan rahasia.

## Contoh HTTP (data dan host fiktif)
```http
POST /api/coupons/redeem HTTP/1.1
Content-Type: application/json

{"code":"LAB-ONE-TIME","order_id":101}
```

Dalam latihan, perhatikan apakah respons aplikasi mendukung hipotesis atau justru menunjukkan kontrol keamanan berfungsi. Jangan menyimpulkan vulnerability hanya dari status HTTP; cocokkan dengan perubahan state dan hak akses objek/field dummy.

## Latihan terpandu
L017 memiliki tombol “Kirim dua permintaan serentak” dengan batas maksimal 2–3 fixture calls. Bandingkan final redeemed_count dan invoice dummy saat insecure/secure mode. Tanpa stress traffic, flood atau request ke produksi.

## Cara memperbaiki dari sisi developer
Gunakan transaction/lock database pada resource yang benar, constraint unik `coupon_id + customer_id` jika aturan bisnis sesuai, dan proses mutasi idempoten untuk request terulang.

## Kesalahan umum dan false positive
Dua respons 200 tidak otomatis berarti double-spend berhasil; periksa state akhir. Jangan mengklaim dampak finansial nyata dari kupon fixture.

## Mini-tugas laporan
Tampilkan dua request terkontrol, response serta state akhir dummy, lalu rekomendasi operasi atomik.

## Cek pemahaman
Selesaikan tiga soal N034 pada bank kuis, baca penjelasan jawaban. Jika jawaban salah, ulangi bagian teknis lalu bandingkan hasil mode *vulnerable* versus *secure* pada lab lokal. Menyelesaikan artikel tidak sama dengan membuktikan penguasaan.

## Sumber primer
- [RACE — referensi resmi](https://portswigger.net/web-security/race-conditions)
- [API — referensi resmi](https://owasp.org/API-Security/)

> Status editorial: `research_draft_unreviewed` · Disusun: 2026-10-27 · Peninjau independen: belum ada. Jangan tampilkan sebagai materi tersertifikasi.


---

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
