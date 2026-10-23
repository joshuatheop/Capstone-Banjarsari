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

## 2026-10-23 — Transaksi non-prod di Supabase, mode demo Firebase dihapus (Design v2.0)

- Developer: Zik / Zikri.
- Branch tujuan: belum ditentukan; belum ada commit atau push.
- Acuan: PRD v1.0, Design v2.0.
- Commit kode / judul commit yang disiapkan: `feat: move non-prod transactions to Supabase and remove Firebase demo mode`. Hash belum ada saat entri ditulis.
- Perubahan: mode `LOCAL_PREVIEW` dihapus (store file, fixture, password environment, project Firebase placeholder); penanda `NONPROD` berbasis backend Supabase; API `/api/local` menjadi `/api/nonprod`; migrasi SQL untuk stok, pesanan, booking, registrasi, workspace seller, publikasi katalog, dan like, dengan fungsi `security definer` yang dijaga `NONPROD_DB_SECRET`; checkout atomik dan idempoten di Postgres; monitoring membaca DB; script setup dan skrip integrasi disesuaikan.
- File utama: `supabase/migrations/20261023000000_nonprod_commerce.sql`, `lib/nonprod.ts`, `lib/server/{commerce-store,nonprod-db,nonprod-session,nonprod-identities,nonprod-accounts,account-store,seller-data}.ts`, `app/api/nonprod/*`, `app/api/super-admin/{monitoring,users}/route.ts`, `lib/data/{backend,firestore,supabase}.ts`, `lib/firebase.ts`, `scripts/{setup-nonprod,setup-lan,nonprod-test-env,check-*}.mjs`, `README.md`, `AGENTS.md`, `supabase/README.md`, `docs/*`, `docs/history/2026-10-23-v1.9/*`.
- Validasi dan hasil: SQL diuji di Postgres 16 (Docker) dengan skenario keamanan, atomisitas, dan idempotensi; tiga skrip integrasi lulus terhadap aplikasi + Postgres/PostgREST lokal; TypeScript, lint (exit 0), 25/25 unit test, dan build production lulus; alur login, profil, checkout, dan pembatalan diverifikasi di Chrome desktop dengan konfirmasi langsung di database. Rincian dan yang belum diuji ada di [AUDIT](AUDIT.md#transaksi-non-prod-supabase--v20-23-oktober-2026).
- Keterbatasan / tindak lanjut: belum diterapkan atau diuji di project Supabase non-prod sebenarnya (operator menjalankan migrasi, `npm run setup:nonprod`, dan SQL pendaftaran secret); mobile dan keyboard belum diuji; ulasan, admin katalog lama, dan analytics klien belum dipindahkan; sesi non-prod hanya pada `next dev`.
