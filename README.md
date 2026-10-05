# PALUGADA Banjarsari

Marketplace warga: Belanja, Makanan, Jasa, dan direktori kontak Ojek; monitoring admin dan rekomendasi stok. Status implementasi dan batas demo dijelaskan di [Design.md](docs/Design.md#38-commerce-direktori-ojek-dan-keputusan-persiapan--v16) dan [AUDIT.md](docs/AUDIT.md).

## Menjalankan demo lokal

Gunakan Node.js 22 dan npm. Dari folder repository:

```powershell
npm ci
npm run setup:local
npm run setup:lan
npm run dev:lan
```

setup:local hanya untuk instalasi pertama dan tidak menimpa .env.local existing. setup:lan memperbarui alamat jaringan, mengatur password demo, dan merotasi secret sesi. Bila .env.local sudah ada, pastikan NEXT_PUBLIC_LOCAL_PREVIEW=true sebelum melanjutkan; jangan pakai konfigurasi produksi untuk demo.

Buka [localhost:3000](http://localhost:3000). Dari HP pada Wi-Fi yang sama, gunakan IP Wi-Fi laptop yang ditampilkan setup:lan. Saat verifikasi: [192.168.0.109:3000](http://192.168.0.109:3000). Laptop/server harus tetap menyala. Jika IP berubah, jalankan setup:lan dan restart dev:lan.

| Akun | Username | Password demo | Halaman |
|---|---|---|---|
| Super Admin | admin | Admin123! | /super-admin |
| Customer | user | User123! | / |

Alias email admin@palugada.local dan user@palugada.local juga diterima. Kredensial sederhana ini hanya untuk development; secret sesi acak, environment, dan data transaksi berada di file yang diabaikan Git.

## VS Code dan akses HP

- **Terminal → Run Task → PALUGADA: Jalankan di jaringan lokal (3000)** untuk menjalankan server. Hentikan server lama sebelum menjalankan task agar port tidak bentrok.
- **Run and Debug → PALUGADA: Buka aplikasi lokal** membuka browser Edge setelah server berjalan.
- .vscode/settings.json menamai port 3000 sebagai PALUGADA Banjarsari.
- Jika HP tidak terhubung, jalankan VS Code **sebagai Administrator**, lalu task **PALUGADA: Izinkan akses HP (Windows Administrator)**. Aturan firewall hanya berlaku untuk Node, TCP 3000, sumber LocalSubnet. Pada sesi implementasi, UAC dibatalkan sehingga aturan ini belum diterapkan.
- Untuk URL di luar Wi-Fi yang sama, pilih **Ports → Forward a Port → 3000**, sign in jika diminta, dan pertahankan visibility **Private**. Ini langkah manual; belum ada tunnel aktif. Jika proxy mempertahankan hostname tunnel, tambahkan hostname persis ke LOCAL_PREVIEW_HOSTS dan restart development server. Jangan memakai wildcard. Lihat [panduan VS Code](https://code.visualstudio.com/docs/debugtest/port-forwarding).

## Mencoba fitur

Customer: login → lengkapi nama/HP/alamat pertama → pilih produk dan jumlah → Beli Sekarang atau tambah keranjang → pilih voucher demo bila sesuai → checkout memakai alamat tersimpan → Pesanan. Checkout terpisah per toko; pembatalan sebelum konfirmasi mengembalikan stok. Makanan dan barang pada demo memakai ambil di toko/tunai. Detail jasa menyediakan form pengajuan booking. Ojek hanya direktori kontak dan draft WhatsApp, tanpa order perjalanan internal.

Admin: buka Ringkasan untuk KPI dan insight, Pesanan/Pembayaran/Booking untuk monitoring, **Forecasting stok** untuk saran barang dan produksi makanan. Unduh contoh CSV, isi data harian lengkap minimal 28 hari, pilih tanggal akhir data, lalu impor. Dataset awal berupa simulasi 56 hari; data impor hanya dianalisis untuk sesi halaman.

Demo tidak memproses pembayaran, mengirim WhatsApp, menjalankan pengantaran, atau menulis data ke Firebase production. Store demo .local/commerce.json tetap ada setelah restart. Jangan mengisi data pribadi sungguhan. Ruang lingkup yang belum selesai tercatat pada AUDIT.md.

## Pemeriksaan

```powershell
npm test
npm run lint
npm run build
npm run test:local-api
npm run test:commerce
```

Dua pemeriksaan API memerlukan dev:lan/dev:local yang aktif dan .local/accounts.json. Test commerce membuat pesanan berlabel uji, membatalkannya, dan meninggalkan booking uji. Pengujian browser/screenshot lokal berada di .local/ dan tidak ikut Git.

Next.js 16.3.6, React 19, TypeScript, Firebase, CSS Modules. SheetJS memakai tarball 0.20.3 dari [distribusi resmi](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/) karena versi npm lama memiliki advisori keamanan. npm ci memerlukan akses registry npm dan cdn.sheetjs.com.

## Struktur dan desain saat ini

Customer berada di `app/(storefront)`, autentikasi di `app/(auth)`, dan admin di `app/(workspace)/admin`. URL existing tetap sama. Panduan pengembangan tunggal adalah [AGENTS.md](AGENTS.md); referensi tampilan dan batas fitur terbaru ada pada [Design.md bagian 36](docs/Design.md#36-implementasi-redesign-marketplace--v14).

Halaman baru `/promo` menampilkan status penawaran yang belum aktif secara jujur. Keranjang mendukung pilihan per barang/toko; hanya barang terpilih yang dikirim saat checkout. Akun menyediakan alamat tersimpan khusus browser yang diisi otomatis pada checkout. Booking jasa disajikan dalam tiga langkah tanpa mengubah aturan transaksi. [Ilustrasi demo dan prompt](public/illustrations/README.md) dibuat dengan built-in imagegen.

Setelah berpindah dari struktur route group lama, hentikan dev server dan hapus cache generated `.next` bila TypeScript masih mereferensikan `(davy)`/`(theo)`, lalu jalankan kembali. Jangan hapus `.local` karena menyimpan transaksi demo.
## Pembaruan alur customer dan perencanaan admin — v1.6

Customer dapat memakai **Beli Sekarang** untuk checkout satu produk dengan jumlah pilihan tanpa mengubah keranjang, atau checkout barang terpilih dari Keranjang. Profil belum lengkap diarahkan ke onboarding. Kelola alamat lewat **Akun → Alamat tersimpan**; checkout hanya menampilkan kontak dan selector **Ubah**. Nama/HP/alamat utama production memakai field Firebase existing; metadata dan alamat tambahan masih per browser. Setelah konfirmasi langsung masuk Pesanan. Buka rincian untuk tombol **WhatsApp Penjual** per toko; nomor demo belum terverifikasi.

Beranda mempunyai empat vertical dalam grid **2×2 di HP**. **Ojek** adalah direktori kontak dengan data contoh berlabel demo, avatar, dan status rating belum tersedia. Tidak ada booking internal. Search/filter dapat dibuka saat dibutuhkan. Voucher lokal: **DEMOHEMAT10** (10%, min. Rp50.000, maks. Rp15.000) atau **DEMOLOKAL5** (Rp5.000, min. Rp25.000). Diskon server dibagi per toko; belum merupakan promo production. Registrasi lokal kini tersedia pada pembaruan arsitektur akun v1.7 di bawah.

Admin mobile memakai drawer melalui tombol Menu. Pembayaran menyediakan filter metode COD/Transfer/QRIS terpisah dari status. **Forecasting stok** menonjolkan **Siapkan Besok**, demand/stok/incoming, risiko, alasan, dan High/Medium/Low Confidence; metrik teknis tersedia di **Lihat Analisis**. Besok mengikuti tanggal akhir dataset. **Financial Projection** menyajikan grafik tren GMV, aktual vs skenario, volume order, komposisi pembayaran, dan kontribusi seller. Buka **Ubah asumsi skenario** untuk pertumbuhan, fee, biaya, dan horizon. Forecast adalah estimasi; GMV bukan pendapatan fee platform dan proyeksi bukan laporan laba aktual. Kontrak lengkap: [Design.md bagian 38](docs/Design.md#38-commerce-direktori-ojek-dan-keputusan-persiapan--v16).

## Akun dan workspace — v1.7

Semua registrasi baru menjadi **CUSTOMER**. Demo kini mendukung registrasi email/password lokal; setelah login lengkapi profil seperti biasa. Login masuk ke pengalaman customer. Tombol avatar kanan atas menyediakan profil, alamat, pesanan, favorit, settings, pengajuan toko, dan logout.

Untuk mencoba seller:

1. Login customer atau daftar melalui `/register`.
2. Buka **Mulai Berjualan** / `/profile/seller-application`; simpan draft atau kirim data usaha dan logo/foto.
3. Login akun operator `admin` di browser/profil browser lain, lalu buka `/super-admin/seller-applications`.
4. Pilih Review → Approve, atau Reject dengan alasan. Customer dapat memperbaiki pengajuan yang ditolak.
5. Pada akun customer pilih **Cek status** atau buka ulang menu akun. **Seller Dashboard** tersedia pada UID yang sama, tanpa login ulang.
6. Kelola produk/menu/jasa/settings lewat `/seller`. Suspend/reactivate ada di `/super-admin/sellers`. Akun seller tetap bisa berbelanja sebagai customer.

`/admin` mengarah ke `/super-admin`; route operasional produk/jasa/UMKM lama mengarah ke `/seller`. Source legacy dipertahankan. Data seller dibatasi businessId pemilik pada server. Transaksi historis tanpa ownership key tidak diklaim berdasarkan nama.

```powershell
npm run test:accounts
```

Tes membuat akun/pengajuan/katalog berlabel uji yang tetap tersimpan lokal. Password registrasi demo di-hash dengan scrypt; jangan gunakan kredensial pribadi. Katalog seller demo belum terhubung ke katalog transaksi customer, dan catatan stok seller belum menggantikan reservasi inventory. Dashboard transaksi seller baru menampilkan empty state. Ini dijelaskan juga pada UI, [Design v1.7](docs/Design.md#39-satu-akun-pembeli-seller-capability-dan-governance--v17), dan AUDIT.md.

### Mengaktifkan adapter Firebase production

Adapter role/approval/katalog disiapkan tetapi **belum diaktifkan atau diuji live**. Sebelum mengaktifkan, operator perlu memverifikasi project Firebase/ADC, menguji dan menerapkan `config/firestore.account-architecture.rules` terhadap koleksi existing, serta menyiapkan custom claim SUPER_ADMIN. Jangan mempertahankan catch-all allow dari rules lama karena dapat membuka koleksi private. File rules adalah kandidat deployment, bukan bukti bahwa rules live sudah berubah.

- `GOOGLE_APPLICATION_CREDENTIALS` atau Application Default Credentials memberi Firebase Admin akses ke project yang benar. Simpan credential di luar Git.
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` dan `NEXT_PUBLIC_SITE_URL` harus menunjuk project/origin aplikasi yang benar.
- Provision UID operator terverifikasi dengan `node scripts/provision-super-admin.mjs <uid>`, kemudian login ulang. Script tidak membuat akun baru dan tidak otomatis mempromosikan `users.role=admin` lama. Saat mencabut hak operator, hapus claim dan revoke refresh tokens/sesi melalui Admin SDK.
- Setelah verifikasi rules/credential selesai, set `PALUGADA_ACCOUNT_SERVER_ENABLED=true` pada environment server. Nonaktifkan mode preview untuk deployment production.
- Role authority dan application disimpan di koleksi private `palugada_workspaces`; Business/katalog dimirror secara atomik ke `bisnis`/`produk`/`jasa`. Jangan memberi client akses tulis ke workspace ini.

Tidak ada deployment rules, provisioning operator, atau migrasi toko legacy yang dijalankan dalam implementasi ini. Monitoring transaksi production tetap memerlukan integrasi domain transaksi existing.


## Database non-prod (Supabase)

Environment non-prod memakai database Supabase yang **terpisah dari production**. Production tetap Firestore. Pilihan backend ada di environment (`.env.local`, diabaikan Git):

| Variabel | Nilai | Fungsi |
|---|---|---|
| `NEXT_PUBLIC_DATA_BACKEND` | `firestore` (default) atau `supabase` | Memilih adapter di `lib/data/` |
| `NEXT_PUBLIC_APP_ENV` | `production`, `nonprod`, `development` | Pengaman; build production otomatis `production`, staging harus mengisi `nonprod` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase **non-prod** | Koneksi DB |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key project non-prod | Kunci klien; akses dibatasi RLS |

Pengaman: `supabase` ditolak bila `APP_ENV=production`, dan `firestore` di luar production hanya diizinkan dengan `NEXT_PUBLIC_LOCAL_PREVIEW=true`. Jangan mengisi variabel Supabase dengan project production atau menyimpan service key di `NEXT_PUBLIC_*`.

Setup singkat (rincian di [supabase/README.md](supabase/README.md)):

1. Buat project Supabase non-prod, lalu jalankan `supabase/migrations/*.sql` berurutan di SQL Editor.
2. Buat seed anonim dari ekspor Firestore: `node scripts/firexport-to-supabase-seed.mjs <folder-csv>`, lalu jalankan `supabase/seed.sql`. Email, telepon, nama, alamat, dan foto dianonimkan; ekspor mentah dan hasil seed tidak boleh di-commit.
3. Salin `supabase/accounts.example.sql` menjadi `supabase/accounts.sql`, ganti placeholder password, lalu jalankan di SQL Editor untuk membuat akun demo admin/user (password disimpan sebagai hash bcrypt, bukan teks polos). `accounts.sql` memuat password demo sehingga diabaikan Git.
4. Isi variabel di atas dan jalankan ulang `npm run dev:local`.

Dengan backend Supabase, login `admin` dan `user` diperiksa terhadap DB (bukan password di `.env.local`), sehingga password pada tabel akun demo di atas tidak berlaku. Akun yang mendaftar lewat form tetap disimpan lokal.

Batas saat ini: baca katalog, detail, dan penghitung klik sudah memakai lapisan data. Stok/checkout tetap memakai store lokal sehingga produk seed tampil stok 0, ulasan, favorit, jalur tulis admin/seller, dan analytics klien belum dipindahkan, dan login Supabase baru tersedia pada mode preview development. Lihat [Design bagian 41](docs/Design.md#41-database-non-prod-supabase-dan-lapisan-data--v19) dan [AUDIT](docs/AUDIT.md#database-non-prod-supabase--v19-5-oktober-2026).

## Dokumentasi dan catatan developer

Semua acuan aktif berada di [docs/](docs/README.md): [PRD](docs/PRD.md), [Design](docs/Design.md), dan [AUDIT](docs/AUDIT.md). Catatan per developer: [Lukas Update](<docs/Lukas Update.md>), [Zik Update](<docs/Zik Update.md>), dan [Theo Update](<docs/Theo Update.md>).

Sebelum setiap push pekerjaan baru, tambahkan entri di log developer terkait. Sebelum revisi dokumen acuan, arsipkan versi sebelumnya ke folder history baru; jangan menghapus entri atau menimpa arsip lama. Versi terbaru, template, dan prosedur lengkap tersedia di [panduan docs](docs/README.md). File dokumen di root dipertahankan sebagai pengarah.
