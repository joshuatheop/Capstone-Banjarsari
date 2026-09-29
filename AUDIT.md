# Audit implementasi PALUGADA — 29 September 2026

Scope: marketplace customer, monitoring/analisis admin, forecasting, transaksi demo lokal, responsivitas, autentikasi lokal, dan akses jaringan. Branch lukas, identitas commit Asricky. Perubahan lint legacy mendukung audit yang diminta; tidak ada migrasi atau deployment Firebase.

## Perbaikan

| Aspek | Hasil |
|---|---|
| Alur customer | Cari → detail → keranjang → checkout per seller → riwayat → pembatalan sebelum konfirmasi. Booking jasa mencatat permintaan jadwal. |
| HP | Form login langsung terlihat; username/email, tampilkan sandi, navigasi bawah, grid dua kolom, tabel admin dapat digeser. |
| Transaksi | Harga/ketersediaan dicek server; validasi kuantitas; stok persisten; kunci file dan idempotensi mencegah pengurangan ganda; pembatalan mengembalikan stok sekali. |
| Akses | Cookie HMAC HttpOnly/SameSite Strict, masa berlaku 8 jam, role server, owner filter, Origin/Host allowlist, throttling login 20 kegagalan/menit per identitas demo. |
| Monitoring | GMV hanya PAID dan bukan CANCELLED; pembayaran dibatalkan tidak dihitung sebagai tertunda; grafik/periode memakai tanggal WIB; insight deskriptif dan tindak lanjut. |
| Forecast | Empat baseline diuji bergulir; MAE/WAPE ditampilkan; tidak mengisi tanggal hilang menjadi nol; rekomendasi makanan dibatasi umur simpan. CSV milik admin dapat dianalisis. |
| Kode lama | Filter menjadi derived state; tipe eksplisit menggantikan any; cleanup peta; popup lokasi memakai textContent sehingga nama/alamat tidak dieksekusi sebagai HTML; image/navigation lint diperbaiki. |
| Dependency | Next.js/eslint-config-next 16.3.6; SheetJS 0.20.3 dari CDN resmi; pembaruan transitif kompatibel. npm audit fix menghasilkan 0 vulnerabilities. |

## Verifikasi

- npm run build: lulus pada Next.js 16.3.6; TypeScript lulus.
- ESLint seluruh repository: 0 error, 0 warning setelah perbaikan.
- npm test: 11 pengujian monitoring, forecasting, CSV, dan batas akses LAN lulus.
- npm run test:local-api: autentikasi, role, ownership, cookie palsu, origin, dan logout lulus.
- npm run test:commerce: harga server, kuantitas/stok invalid, checkout dua seller, retry serentak, pengembalian stok, booking, serta forecasting RBAC lulus.
- Browser Chrome pada viewport desktop 1440 dan HP 390: login kedua akun melalui IP Wi-Fi, checkout/pembatalan, halaman customer/admin, filter forecasting, dan overflow halaman diperiksa.
- Build production dijalankan terpisah pada port 3001: semua lima API /api/local/* mengembalikan 404 walau flag preview masih ada. Server pemeriksaan ini dihentikan.
- Ketiga template Excel existing tetap dapat dibaca setelah pembaruan SheetJS.
- Listener development terikat 0.0.0.0:3000; request HTTP dan login melalui IP 192.168.0.103 berhasil dari mesin server.

## Batas hasil audit

- Ini implementasi **demo lokal**, bukan penyelesaian seluruh PRD produksi. Payment gateway, seller/courier lifecycle, ongkir, delivery, refund, verifikasi review, registrasi, serta transaksi Firestore produksi belum diimplementasikan pada tahap ini.
- Riwayat monitoring menggabungkan fixture berlabel dan transaksi uji lokal. Akun seller/customer pada tabel sebagian fixture; bukan sinkronisasi direktori Firebase. Tidak ada analisis margin atau pembelian supplier karena data biaya/pengadaan belum tersedia.
- Forecast memakai dataset simulasi terpisah, atau CSV yang diimpor. Tidak melatih model dari fixture pesanan. Hasil impor hanya dalam sesi halaman, bukan database. Tidak ada promo/cuaca, lost sales karena stockout, resep/BOM, atau batch kedaluwarsa. Incoming hanya boleh diisi untuk pasokan yang tiba sebelum kebutuhan.
- Penyimpanan .local/commerce.json untuk satu mesin development. Bukan pengganti database transaksi production. Jika proses terhenti paksa saat menulis dan lock tertinggal, hentikan semua server proyek, backup JSON, lalu hapus **hanya** .local/commerce.lock sebelum restart.
- Password mudah sengaja hanya untuk demo development. Akses LAN menggunakan HTTP; jangan gunakan credential pribadi. Tidak ada tunnel publik yang dibuat.
- Aturan firewall belum berhasil diterapkan: Windows membutuhkan Administrator dan dialog UAC dibatalkan. Skrip/task sudah tersedia. Akses dari HP fisik belum dapat diverifikasi; isolasi klien Wi-Fi/firewall masih dapat menghalanginya.
- Pengaturan port dan task VS Code sudah tersedia. Forwarded URL cloud baru muncul setelah pengguna memilih **Ports → Forward a Port → 3000** dan sign in bila diminta. Pengaturan workspace sendiri bukan tunnel aktif.
- Firebase rules dan akun produksi tidak diaudit lewat layanan live. Aturan contoh lama pada guidebook mengizinkan owner menulis dokumen user; sebelum produksi, role/otorisasi harus dikunci oleh rules/server dan diuji dengan emulator. Client role guard saja tidak cukup.

## Referensi

- [Next.js security advisories](https://github.com/vercel/next.js/security/advisories) dan [advisori Windows](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36).
- [Distribusi NodeJS resmi SheetJS](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/).
- [Time series cross-validation](https://otexts.com/fpp3/tscv.html): validasi memakai data sebelum hari yang diuji.
- [VS Code port forwarding](https://code.visualstudio.com/docs/debugtest/port-forwarding): private forwarding memerlukan autentikasi pemilik.

## Redesign dan konsolidasi — 29 September 2026

- Customer shell, beranda, promo, katalog, toko, detail, keranjang, checkout, pesanan, booking, akun, serta login diselaraskan dengan Design v1.4 dan referensi mobile. Admin menggunakan bahasa visual yang sama tanpa mengubah perhitungan insight/forecast.
- Struktur route group menjadi storefront/auth/workspace; URL publik tetap. Satu panduan root AGENTS.md menggantikan tiga panduan duplikat. Komponen katalog/navigasi yang tidak lagi dipakai dihapus; CSS Firebase existing dikelompokkan dalam styles/legacy.
- Pemeriksaan browser: 320, 390, 768, dan 1440 piksel; tidak ditemukan overflow halaman atau runtime/hydration error pada jalur yang diuji. Login HP menampilkan tombol Masuk dalam viewport. Modal lokasi/pengaturan memakai native dialog dan dapat ditutup lewat Escape.
- Transaksi browser: tambah cepat memeriksa stok, pilih item/toko, hanya checkout item terpilih, item tidak terpilih tetap ada, konfirmasi pembatalan, alamat browser terisi otomatis. Booking tiga langkah diuji sampai tersimpan; kembali ke langkah sebelumnya mempertahankan jadwal.
- npm run lint, npm run build, 11 unit/domain tests, test:local-api, dan test:commerce lulus. API memeriksa role/origin, kepemilikan, harga server, stok, idempotency serentak, pemisahan toko, pembatalan/pengembalian stok, booking, dan akses forecasting.
- Ditemukan 127.0.0.1 belum tercakup allowedDevOrigins Next.js; diperbaiki dengan allowlist loopback eksplisit serta hostname LAN. Tidak menambahkan wildcard.
- Aset raster orisinal dibuat dengan built-in imagegen; daftar/prompt di public/illustrations/README.md. Atlas tidak dipakai untuk katalog Firebase production. Tidak ada diskon, timer, saldo, poin, ETA, atau kontak toko demo yang dianggap nyata.
- IP Wi-Fi terbaru 192.168.0.109; setup:lan memperbarui allowlist lokal dan kredensial development. Setelah restart server, login customer, hidrasi tombol katalog, dan dialog akun melalui alamat LAN berhasil diuji di browser mesin server. Keterbatasan firewall/akses HP fisik/VS Code forwarding pada bagian sebelumnya tetap berlaku.
- Pesanan sisa verifikasi redesign yang belum selesai dibatalkan melalui API untuk mengembalikan stok. Riwayat pesanan batal dan booking berlabel pengujian tetap ada dalam data demo lokal.