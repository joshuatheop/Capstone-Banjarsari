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
- Aplikasi belum membaca dari Supabase; ini baru skema dan data. Wiring lapisan data adalah langkah berikutnya.

## Klien Supabase di aplikasi
- Dependensi `@supabase/supabase-js` dan `@supabase/ssr` ditambahkan khusus untuk koneksi DB non-prod (dependensi baru, sengaja).
- Helper: `lib/supabase/client.ts` (browser) dan `lib/supabase/server.ts` (server).
- Env di `.env.local` (diabaikan Git): `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Jangan isi dengan project production.
- Tabel memakai RLS tanpa policy, jadi query dengan publishable key akan kosong sampai policy select ditambahkan lewat migrasi.
