-- NON-PROD saja. Salin ke supabase/accounts.sql (diabaikan Git), ganti password, lalu jalankan di SQL Editor
-- SETELAH migrasi 20261005020000_nonprod_user_passwords.sql. Password disimpan sebagai hash bcrypt, bukan teks polos.
-- Login memakai username `admin` / `user` (atau emailnya). Akun hasil registrasi di tabel users tidak dihapus.
insert into users (user_id, email, display_name, role, kewarganegaraan, password_hash, created_at, updated_at) values
  ('nonprod-admin', 'admin@palugada.local', 'Admin Banjarsari', 'admin',    'Indonesia', extensions.crypt('GANTI_PASSWORD_ADMIN', extensions.gen_salt('bf')), now(), now()),
  ('nonprod-user',  'user@palugada.local',  'Warga Banjarsari', 'customer', 'Indonesia', extensions.crypt('GANTI_PASSWORD_USER',  extensions.gen_salt('bf')), now(), now())
on conflict (user_id) do update set
  email = excluded.email, display_name = excluded.display_name, role = excluded.role, password_hash = excluded.password_hash, updated_at = now();
