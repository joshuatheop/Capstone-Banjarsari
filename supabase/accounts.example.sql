-- NON-PROD saja. Salin ke supabase/accounts.sql (diabaikan Git), ganti password, lalu jalankan di SQL Editor
-- SETELAH migrasi 20261005020000_nonprod_user_passwords.sql. Password disimpan sebagai hash bcrypt, bukan teks polos.
-- UID/email harus sama dengan akun bawaan login lokal (lib/server/preview-session.ts).
begin;
delete from users;
insert into users (user_id, email, display_name, role, kewarganegaraan, password_hash, created_at, updated_at) values
  ('preview-admin',    'admin@palugada.local', 'Admin Banjarsari', 'admin',    'Indonesia', extensions.crypt('GANTI_PASSWORD_ADMIN', extensions.gen_salt('bf')), now(), now()),
  ('preview-customer', 'user@palugada.local',  'Warga Banjarsari', 'customer', 'Indonesia', extensions.crypt('GANTI_PASSWORD_USER',  extensions.gen_salt('bf')), now(), now());
commit;
