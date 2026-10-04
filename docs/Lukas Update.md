# Lukas Update

Developer: **Lukas / Asricky**. Catatan append-only; tambahkan entri di akhir. Acuan dan aturan versi: [indeks dokumentasi](README.md).

## 2026-10-04 — Baseline arsitektur akun (Design v1.7)

- Developer: Asricky.
- Branch: implementasi `lukas`, kemudian dipromosikan ke `main` atas permintaan user.
- Acuan: PRD v1.0, Design v1.7.
- Commit kode: `8753b4b1026effcb0f059f233f4201d4c114c4f9` — `feat: introduce customer-first seller approval and scoped workspaces`.
- Perubahan: registrasi CUSTOMER, menu akun, pengajuan seller pada UID yang sama, review/approval/rejection reason, suspend/reactivate, workspace seller dan super-admin terpisah, role/ownership server-side, serta redirect `/admin`.
- File utama: `lib/accounts/*`, `lib/server/account-*`, `components/accounts/*`, route workspace/API, `proxy.ts`, dan dokumen acuan.
- Validasi yang telah dijalankan pada implementasi tersebut: TypeScript, lint, build, 25 unit/domain tests, tes API akun/local/commerce, browser 390/768/1440, serta regresi customer checkout/voucher/Pesanan/WhatsApp.
- Batas: adapter/rules Firebase produksi belum diaktifkan atau diuji live; katalog seller demo belum terhubung ke checkout demo; stok seller masih catatan persiapan. Rincian ada di [AUDIT.md](AUDIT.md).
- Riwayat redesign sebelum commit ini tetap ada di audit, arsip, dan Git; entri ini bukan rekonstruksi lengkap semua push lama.

## 2026-10-04 — Pusat dokumentasi dan riwayat developer (Design v1.8)

- Developer: Asricky.
- Branch tujuan: `main`, sesuai permintaan user.
- Acuan: PRD v1.0, Design v1.8. Versi ini mengubah dokumentasi, bukan fitur aplikasi.
- Judul commit yang disiapkan: `docs: centralize versioned references and developer update history`.
- Perubahan: dokumen aktif dipusatkan di `docs/`; baseline v1.7 diarsipkan utuh; root menjadi pengarah; log Lukas/Zik/Theo dan aturan update sebelum push ditambahkan.
- File utama: `docs/README.md`, `docs/PRD.md`, `docs/Design.md`, `docs/AUDIT.md`, tiga file update developer, `docs/history/2026-10-04-v1.7/*`, `AGENTS.md`, dan `README.md`.
- Validasi: kesamaan snapshot dengan commit sumber, keberadaan tautan lokal baru, dan `git diff --check`. Build/test aplikasi tidak diulang karena hanya dokumentasi yang berubah.
- Batas: log Zik/Theo belum memiliki entri pekerjaan terverifikasi. Aturan sebelum push merupakan workflow developer/agent, bukan hook otomatis. Penghapusan arsip `UI Katalog v1` yang sudah ada tidak termasuk perubahan ini.
