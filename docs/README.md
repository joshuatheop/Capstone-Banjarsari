# Dokumentasi PALUGADA

Sumber acuan aktif berada di folder ini. Dokumen root hanya pengarah; jangan membuat salinan aktif kedua.

| Dokumen | Versi/status terbaru | Fungsi |
|---|---|---|
| [PRD.md](PRD.md) | 1.0, 28 September 2026 | Baseline kebutuhan produk; tidak dinaikkan hanya karena perubahan dokumentasi |
| [Design.md](Design.md) | 1.9, 5 Oktober 2026 | UI, arsitektur akun, dokumentasi, dan database non-prod Supabase |
| [AUDIT.md](AUDIT.md) | Catatan sampai 5 Oktober 2026 | Hasil verifikasi dan keterbatasan implementasi |
| [Lukas Update.md](<Lukas Update.md>) | Catatan v1.8 | Update Lukas / Asricky |
| [Zik Update.md](<Zik Update.md>) | Catatan v1.9 | Update Zik / Zikri |
| [Theo Update.md](<Theo Update.md>) | Belum ada entri terverifikasi | Update Theo |

Versi Design adalah versi dokumen, bukan nomor rilis aplikasi. PRD mempertahankan versinya sendiri. Setiap update developer mencantumkan versi acuan; jangan menyatakan fitur sudah selesai hanya karena tertulis dalam PRD.

## Aturan setiap push pekerjaan baru

1. Tentukan developer aktif dan branch tujuan dari instruksi user. Jangan mengasumsikan setiap push menuju main.
2. Sebelum mengubah dokumen acuan, simpan versi sebelumnya secara utuh ke folder baru `history/YYYY-MM-DD-vX.Y/`. Jika nama sudah ada, gunakan suffix unik, misalnya `-02`; jangan menimpa arsip. Salin PRD, Design, dan AUDIT bersama agar konteks lengkap tersimpan.
3. Perbarui dokumen acuan yang terdampak, tanggal, dan nomor versinya. Tambahkan keputusan/audit baru; pertahankan bagian lama beserta konteks historisnya. Dokumen yang tidak berubah tidak harus naik versi.
4. Tambahkan entri baru di **akhir** file update developer yang sesuai. Jangan menghapus atau menulis ulang entri lama. Koreksi dibuat sebagai entri tambahan yang merujuk entri sebelumnya. Gunakan template di bawah.
5. Catat perubahan, file utama, validasi yang benar-benar dijalankan, hasilnya, serta batas/pekerjaan lanjutan. Cantumkan commit kode terkait bila sudah tersedia. Untuk commit dokumentasi yang sedang dibuat, gunakan judul commit yang dapat dicari melalui Git; jangan mengarang hash atau menambahkan commit baru hanya untuk memasukkan hash dirinya sendiri.
6. Review diff; commit dokumentasi bersama perubahan yang didokumentasikan, kemudian push ke branch yang diizinkan. Perbarui indeks versi di tabel atas dan indeks arsip bila berubah.

Aturan ini dijalankan oleh developer/agent sebelum commit dan push, bukan hook Git otomatis. Push ulang commit yang sama atau promosi commit yang sudah terdokumentasi ke branch lain tidak memerlukan duplikasi riwayat fitur. Jika ada pekerjaan baru, harus ada entri baru. Push gagal tidak boleh dicatat sebagai berhasil; hasil push dilaporkan setelah remote mengonfirmasi.

## Template entri update

```markdown
## YYYY-MM-DD — Judul update (ID unik / versi acuan)

- Developer:
- Branch tujuan:
- Acuan: PRD v..., Design v...
- Commit kode / judul commit yang disiapkan:
- Perubahan:
- File utama:
- Validasi dan hasil:
- Keterbatasan / tindak lanjut:
```

## Arsip

- [Baseline sebelum database non-prod Supabase — 5 Oktober 2026, Design v1.8](history/2026-10-05-v1.8/README.md): salinan utuh PRD v1.0, Design v1.8, dan AUDIT sebelum perubahan v1.9. Bersifat historis dan tidak menjadi sumber aktif.
- [Baseline sebelum penataan docs — 4 Oktober 2026, Design v1.7](history/2026-10-04-v1.7/README.md): salinan utuh dari commit `8753b4b`, mencakup PRD v1.0 dan seluruh audit sebelumnya. Arsip bersifat historis dan tidak menjadi sumber aktif.

Riwayat sebelum baseline tetap tersedia dalam Git. Riwayat kontribusi Theo tidak diklaim tanpa bukti; entri Zik pertama mencatat pekerjaan database non-prod 5 Oktober 2026.
