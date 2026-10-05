-- NON-PROD saja. Password disimpan sebagai hash bcrypt (pgcrypto) di users.password_hash.
-- Hash tidak pernah dikembalikan ke klien: login & baca profil lewat fungsi security definer.

create extension if not exists pgcrypto with schema extensions;

alter table users add column if not exists password_hash text;

-- Cocokkan email + password; hanya mengembalikan kolom non-sensitif bila cocok.
create or replace function login_user(p_email text, p_password text)
returns table (user_id text, email text, display_name text, role text)
language sql security definer set search_path = public, extensions as
$$
  select u.user_id, u.email, u.display_name, u.role
  from users u
  where lower(u.email) = lower(p_email)
    and u.password_hash is not null
    and u.password_hash = crypt(p_password, u.password_hash);
$$;

-- Dipakai untuk memvalidasi sesi (cookie hanya memuat user_id).
create or replace function get_user_public(p_id text)
returns table (user_id text, email text, display_name text, role text)
language sql security definer set search_path = public as
$$
  select u.user_id, u.email, u.display_name, u.role from users u where u.user_id = p_id;
$$;

revoke all on function login_user(text, text), get_user_public(text) from public;
grant execute on function login_user(text, text), get_user_public(text) to anon, authenticated;
