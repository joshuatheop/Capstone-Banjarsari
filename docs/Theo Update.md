# Theo Update

Developer: **Theo**. Catatan append-only; tambahkan entri di akhir mengikuti [template dan aturan dokumentasi](README.md).

Belum ada entri pekerjaan Theo yang diverifikasi dalam pembaruan dokumentasi ini. File ini disiapkan oleh Asricky pada 4 Oktober 2026; bukan klaim kontribusi atau persetujuan Theo.

Acuan saat file dibuat: PRD v1.0 dan Design v1.8. Pada update berikutnya, cantumkan versi acuan aktual, perubahan, commit, validasi, dan keterbatasan tanpa menghapus catatan lama.

## 2026-11-10 — Penyatuan vertical Belanja dan Makanan menjadi Produk UMKM (PRD v1.2 / Design v2.2)

- Developer: Theo
- Branch tujuan: `theo`
- Acuan: PRD v1.2, Design v2.2, AUDIT 10 November 2026. Snapshot arsip sebelumnya: `docs/history/2026-11-10-v2.1/`.
- Commit kode / judul commit yang disiapkan: `feat: merge retail and food verticals into unified Produk UMKM`
- Perubahan: Merombak vertical dengan menggabungkan Belanja dan Makanan menjadi Produk UMKM. Beranda kini menampilkan 3 vertical (Produk UMKM, Jasa, Ojek) dengan layout desktop 3 kolom dan mobile 2 kolom (kartu Produk UMKM lebar penuh di baris atas). Navigasi utama memperbarui menu menjadi Produk UMKM dan rute `/makanan` diarahkan ke katalog Produk UMKM. Detail toko menyatukan tab produk dan makanan, serta kartu katalog menampilkan badge 'Produk UMKM'. Di sisi database dan server, migrasi SQL memperbarui constraint `produk.vertical` dan `orders.vertical` menjadi `PRODUK_UMKM`, mendaftarkan kategori `seller-product`, memperbarui RPC `catalog_publish`, dan menetapkan vertical pesanan checkout menjadi `PRODUK_UMKM`.
- File utama: `app/(storefront)/page.tsx`, `app/(storefront)/katalog/page.tsx`, `app/(storefront)/makanan/page.tsx`, `app/(storefront)/promo/page.tsx`, `app/(storefront)/bisnis/[id]/BusinessDetailClient.tsx`, `components/commerce/{CommerceNav,CatalogCard,CatalogDetail,CatalogExplorer,CampaignBanner,NonprodAccount}.tsx`, `components/commerce/marketplace.module.css`, `components/accounts/{BusinessFields,SellerDashboard}.tsx`, `lib/catalog.ts`, `lib/server/commerce-store.ts`, `lib/server/account-store.ts`, `lib/firestore/types.ts`, `lib/monitoring/types.ts`, `lib/accounts/{types,policy}.ts`, `lib/data/{supabase,firestore}.ts`, `scripts/offline-database.mjs`, `supabase/migrations/20261110000000_merge_product_umkm_vertical.sql`, docs acuan (`PRD.md`, `Design.md`, `AUDIT.md`, `README.md`).
- Validasi dan hasil: `npm test` 30/30 unit tests lulus; `npx tsc --noEmit` lulus; `npm run lint` 0 error 0 warning; `npm run build` lulus (44 halaman statis & dinamis).
- Keterbatasan / tindak lanjut: Backward-compatibility tipe dan database tetap dipertahankan untuk record lama berlabel RETAIL/FOOD. Pada project Supabase hosted, migrasi baru perlu dijalankan oleh operator.

