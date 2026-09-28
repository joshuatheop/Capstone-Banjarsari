# PALUGADA Banjarsari

Marketplace warga: produk, makanan, dan jasa; monitoring admin dan rekomendasi stok. Status implementasi dan batas demo dijelaskan di [Design.md](Design.md#34-marketplace-transaksi-demo-analisis-dan-lan-v12) dan [AUDIT.md](AUDIT.md).

## Menjalankan demo lokal

Gunakan Node.js 22 dan npm. Dari folder repository:

```powershell
npm ci
npm run setup:local
npm run setup:lan
npm run dev:lan
```

setup:local hanya untuk instalasi pertama dan tidak menimpa .env.local existing. setup:lan memperbarui alamat jaringan, mengatur password demo, dan merotasi secret sesi. Bila .env.local sudah ada, pastikan NEXT_PUBLIC_LOCAL_PREVIEW=true sebelum melanjutkan; jangan pakai konfigurasi produksi untuk demo.

Buka [localhost:3000](http://localhost:3000). Dari HP pada Wi-Fi yang sama, gunakan IP Wi-Fi laptop yang ditampilkan setup:lan. Saat verifikasi: [192.168.0.103:3000](http://192.168.0.103:3000). Laptop/server harus tetap menyala. Jika IP berubah, jalankan setup:lan dan restart dev:lan.

| Akun | Username | Password demo | Halaman |
|---|---|---|---|
| Admin | admin | Admin123! | /admin |
| Customer | user | User123! | / |

Alias email admin@palugada.local dan user@palugada.local juga diterima. Kredensial sederhana ini hanya untuk development; secret sesi acak, environment, dan data transaksi berada di file yang diabaikan Git.

## VS Code dan akses HP

- **Terminal → Run Task → PALUGADA: Jalankan di jaringan lokal (3000)** untuk menjalankan server. Hentikan server lama sebelum menjalankan task agar port tidak bentrok.
- **Run and Debug → PALUGADA: Buka aplikasi lokal** membuka browser Edge setelah server berjalan.
- .vscode/settings.json menamai port 3000 sebagai PALUGADA Banjarsari.
- Jika HP tidak terhubung, jalankan VS Code **sebagai Administrator**, lalu task **PALUGADA: Izinkan akses HP (Windows Administrator)**. Aturan firewall hanya berlaku untuk Node, TCP 3000, sumber LocalSubnet. Pada sesi implementasi, UAC dibatalkan sehingga aturan ini belum diterapkan.
- Untuk URL di luar Wi-Fi yang sama, pilih **Ports → Forward a Port → 3000**, sign in jika diminta, dan pertahankan visibility **Private**. Ini langkah manual; belum ada tunnel aktif. Jika proxy mempertahankan hostname tunnel, tambahkan hostname persis ke LOCAL_PREVIEW_HOSTS dan restart development server. Jangan memakai wildcard. Lihat [panduan VS Code](https://code.visualstudio.com/docs/debugtest/port-forwarding).

## Mencoba fitur

Customer: pilih produk → tambah keranjang → checkout → isi alamat/kontak → buat pesanan uji → Pesanan. Checkout terpisah per toko; pembatalan sebelum konfirmasi mengembalikan stok. Makanan dan barang pada demo memakai ambil di toko/tunai. Detail jasa menyediakan form pengajuan booking.

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
