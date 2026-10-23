# Database non-prod (Supabase)

Hanya untuk development/staging. Production tetap Firestore; jangan jalankan file di sini ke production.

## Setup
1. Buat project Supabase terpisah untuk non-prod.
2. Jalankan `supabase/migrations/*.sql` berurutan (SQL Editor, atau `supabase db push`).
3. Buat seed dari ekspor Firestore: `node scripts/firexport-to-supabase-seed.mjs <folder-csv>`
   (tambah `--keep-images` untuk mempertahankan gambar base64). Email, telepon, nama pemilik/pengguna,
   alamat, dan foto dianonimkan. Hasilnya `supabase/seed.sql` (diabaikan Git); jalankan di SQL Editor.

## Akun demo (login)
Salin `accounts.example.sql` menjadi `accounts.sql` (diabaikan Git), ganti placeholder password, lalu jalankan setelah migrasi `20261005020000_nonprod_user_passwords.sql`. Login memakai fungsi `login_user`; hash tidak pernah dikirim ke klien. `seed.sql` tidak menyentuh tabel `users`.

## Menambah kolom baru
Buat migrasi baru, jangan ubah baseline:
`supabase/migrations/<YYYYMMDDHHMMSS>_<nama>.sql`, mis. `alter table produk add column stok integer not null default 0;`
Lalu sesuaikan `lib/firestore/types.ts` dan skrip seed bila kolom perlu diisi.

## Catatan
- Semua tabel RLS aktif tanpa policy: akses lewat `service_role` di server. Jangan taruh service key di `NEXT_PUBLIC_*`.
- CSV analytics format lama (`Channel_Click_Type`) dilewati; hanya yang punya `event_type` di-seed.

## Klien Supabase di aplikasi
- Dependensi `@supabase/supabase-js` dan `@supabase/ssr` ditambahkan khusus untuk koneksi DB non-prod (dependensi baru, sengaja).
- Helper: `lib/supabase/client.ts` (browser) dan `lib/supabase/server.ts` (server).
- Env di `.env.local` (diabaikan Git): `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Jangan isi dengan project production.
- Tabel memakai RLS tanpa policy, jadi query dengan publishable key akan kosong sampai policy select ditambahkan lewat migrasi.

## Transaksi non-prod (migrasi `20261023000000_nonprod_commerce.sql`)
Menambah kolom `produk.stock_on_hand` (produk aktif diberi stok awal 20 sebagai data uji), tabel `orders`, `bookings`, `request_log`, `account_workspaces`, `server_secret`, dan fungsi `security definer` untuk registrasi, checkout atomik, pembatalan, booking, workspace seller, publikasi katalog, dan like. Semua fungsi tulis/baca transaksi memanggil `assert_server(secret)` dan menolak bila secret salah.

Setelah menjalankan migrasi, daftarkan secret server satu kali. `npm run setup:nonprod` menambahkan `NONPROD_DB_SECRET` ke `.env.local` dan mencetak SQL berikut dengan nilai yang benar:

```sql
insert into server_secret (hash) values (extensions.crypt('<NONPROD_DB_SECRET>', extensions.gen_salt('bf')))
on conflict (id) do update set hash = excluded.hash;
```

Tanpa langkah ini semua panggilan ditolak (`forbidden`) dan checkout, registrasi, serta monitoring non-prod tidak berfungsi. `accounts.example.sql` tidak lagi menghapus tabel `users`.
