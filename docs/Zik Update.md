# Zik Update

Developer: **Zik / Zikri**. Catatan append-only; tambahkan entri di akhir mengikuti [template dan aturan dokumentasi](README.md).

Belum ada entri pekerjaan Zik yang diverifikasi dalam pembaruan dokumentasi ini. File ini disiapkan oleh Asricky pada 4 Oktober 2026; bukan klaim kontribusi atau persetujuan Zik.

Acuan saat file dibuat: PRD v1.0 dan Design v1.8. Pada update berikutnya, cantumkan versi acuan aktual, perubahan, commit, validasi, dan keterbatasan tanpa menghapus catatan lama.

## 2026-10-05 — Database non-prod Supabase dan lapisan data (Design v1.9)

- Developer: Zik / Zikri.
- Branch tujuan: `zikri`, sesuai permintaan user.
- Acuan: PRD v1.0, Design v1.9.
- Commit kode / judul commit yang disiapkan: `feat: add Supabase non-prod database layer with dual-backend catalog adapters`. Hash belum ada saat entri ditulis.
- Perubahan: lapisan `lib/data` dengan adapter Firestore dan Supabase beserta pengaman agar non-prod tidak menyentuh production; skema, policy, dan fungsi login Supabase; seed anonim dari ekspor Firestore; login admin/user berbasis hash di DB; IPv4-first dan timeout/ulang koneksi server; perbaikan `/bisnis/[id]`; lint mengecualikan prototipe `UI Katalog v1`; dua script ad hoc yang menargetkan Firebase production dihapus.
- File utama: `lib/data/*`, `lib/supabase/*`, `lib/server/preview-session.ts`, `instrumentation.ts`, `supabase/migrations/*`, `supabase/README.md`, `scripts/firexport-to-supabase-seed.mjs`, `eslint.config.mjs`, `.gitignore`, `README.md`, `docs/Design.md`, `docs/AUDIT.md`, `docs/history/2026-10-05-v1.8/*`.
- Validasi dan hasil: TypeScript, lint, 25/25 unit test, build production, `test:local-api`, `test:commerce`, `test:accounts`, smoke test rute, dan login di Chrome. Rinciannya, termasuk tes yang tidak diulang setelah perubahan login, ada di [AUDIT](AUDIT.md#database-non-prod-supabase--v19-5-oktober-2026).
- Keterbatasan / tindak lanjut: stok/checkout untuk produk Supabase, ulasan, jalur tulis admin/seller, favorit, dan analytics klien belum dipindahkan; login hanya lewat preview development; fungsi login belum dibatasi percobaannya; layout mobile belum diverifikasi. Tidak ada deployment atau perubahan data production.
