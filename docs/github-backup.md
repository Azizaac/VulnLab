# Backup GitHub dan branch setiap update

Repository private: [Azizaac/VulnLab](https://github.com/Azizaac/VulnLab).

Backup pertama dibuat pada 24 Oktober 2026 (Asia/Jakarta): `main` menyimpan snapshot aplikasi Sprint 0–3. Branch `codex/2026-10-24-github-backup` menambahkan aturan dan helper branch. Tag `backup/2026-10-24-sprint3` menunjuk snapshot awal pada `main`.

## Memulai update

Dari folder proyek, pastikan perubahan sebelumnya sudah di-commit, lalu:

```sh
npm run update:new -- perbaikan-labs
```

Helper membuat branch baru seperti `codex/2026-10-24-213045-perbaikan-labs`. Waktu mengikuti Asia/Jakarta; jika namanya sudah ada pada branch lokal atau remote yang sudah di-fetch, helper menambahkan nomor. Branch dimulai dari commit yang sedang dibuka, sehingga update sebelumnya yang belum digabung tetap terbawa. Helper menolak working tree yang belum bersih dan tidak menghapus perubahan.

Satu permintaan update memakai satu branch baru. Perbaikan yang masih bagian dari update yang sama tetap di branch tersebut. Branch lama disimpan agar setiap versi bisa dibuka kembali. Perubahan tidak langsung masuk `main`; penggabungan dilakukan jika diminta.

## Menyimpan update ke GitHub

Sesudah perubahan selesai dan pemeriksaan yang relevan lulus:

```sh
git status --short
git add <file-yang-diubah>
git diff --cached
git commit -m "Describe the update"
git push -u origin HEAD
git rev-parse HEAD
git ls-remote origin "refs/heads/<nama-branch>"
```

Ganti placeholder dengan file dan nama branch yang sebenarnya. Hash pada dua perintah terakhir harus sama. Commit lokal baru menjadi backup GitHub setelah push berhasil. Jangan force-push atau menghapus branch backup.

Untuk melihat versi lama tanpa mengubah file kerja, gunakan halaman branch/commit di GitHub atau `git show <branch>:<path>`. Simpan perubahan aktif sebelum berpindah branch.

## Isi backup

GitHub menyimpan source code, lockfile, konfigurasi contoh, tes, dokumentasi dan aset yang masuk Git. `.env`, token runner, database/data belajar, sesi, log, `node_modules`, `vendor`, serta hasil build dikecualikan. Backup kode ini tidak menyertakan akun, catatan pribadi atau progres belajar dalam MySQL; data itu memerlukan backup database terpisah.

## Status labs saat backup

Delapan lab sudah diimplementasikan. Pada 24 Oktober 2026, sandbox `shop`, `runner` dan `verifier` aktif, dan konfigurasi aplikasi utama menunjukkan labs aktif dengan runner `http://lab-runner:8090`. Pengujian ulang `node scripts/test-sandbox.mjs` lulus untuk delapan skenario melalui HTTP nyata, perbandingan mode aman, evidence, reset dan pembatasan sesi. Ini memeriksa runtime; hasil browser lengkap sebelumnya tercatat di `docs/sprint-3.md`.

Buka [labs lokal](http://127.0.0.1:8088/labs), pilih latihan dan tekan **Mulai lab** untuk membuat sesi. Sandbox perlu dijalankan lagi setelah Docker atau komputer dihentikan; langkahnya ada di [panduan isolasi lab](lab-isolation.md).
