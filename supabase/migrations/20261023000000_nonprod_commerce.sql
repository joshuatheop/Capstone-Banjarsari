-- NON-PROD saja. Memindahkan transaksi (stok, pesanan, booking), registrasi, dan workspace akun
-- dari file lokal ke Postgres. Jangan dijalankan ke production.
--
-- Akses: tabel di bawah memakai RLS tanpa policy. Semua baca/tulis lewat fungsi security definer
-- yang menolak panggilan tanpa secret server (NONPROD_DB_SECRET). Publishable key saja tidak cukup.
-- Setelah migrasi, daftarkan secret satu kali (lihat supabase/README.md):
--   insert into server_secret (hash) values (crypt('<NONPROD_DB_SECRET>', gen_salt('bf')))
--   on conflict (id) do update set hash = excluded.hash;

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- gerbang secret server
create table if not exists server_secret (
  id   boolean primary key default true check (id),
  hash text not null
);
alter table server_secret enable row level security;

create or replace function assert_server(p_secret text) returns void
language plpgsql security definer set search_path = public, extensions as
$$
begin
  if p_secret is null or not exists (select 1 from server_secret s where s.hash = crypt(p_secret, s.hash)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end;
$$;

-- ---------------------------------------------------------------- stok
-- Nama kolom sama dengan field Firestore (stock_on_hand). Data uji: produk aktif diberi stok awal 20.
alter table produk add column if not exists stock_on_hand integer not null default 0 check (stock_on_hand >= 0);
update produk set stock_on_hand = 20 where stock_on_hand = 0 and is_active and deleted_at is null;

-- ---------------------------------------------------------------- tabel transaksi
create table if not exists orders (
  order_id       text primary key,
  checkout_id    text not null,
  business_id    text,
  customer_id    text not null,
  customer       text not null,
  seller         text not null,
  vertical       text not null check (vertical in ('RETAIL','FOOD')),
  subtotal       bigint not null,
  discount       bigint not null default 0,
  voucher_code   text,
  total          bigint not null,
  recipient_name text,
  item           text not null,
  quantity       integer not null,
  items          jsonb not null,
  status         text not null,
  payment        text not null,
  method         text not null,
  delivery       text not null,
  courier        text,
  address        text,
  phone          text,
  note           text,
  created_at     timestamptz not null default now()
);
create index if not exists orders_customer_idx on orders(customer_id, created_at desc);
create index if not exists orders_business_idx on orders(business_id, created_at desc);

create table if not exists bookings (
  booking_id  text primary key,
  customer_id text not null,
  business_id text,
  customer    text not null,
  service     text not null,
  provider    text not null,
  schedule    timestamptz not null,
  status      text not null,
  estimate    bigint not null default 0,
  address     text,
  notes       text,
  created_at  timestamptz not null default now()
);
create index if not exists bookings_customer_idx on bookings(customer_id, created_at desc);
create index if not exists bookings_business_idx on bookings(business_id, created_at desc);

-- Idempotensi checkout/booking: kunci unik per pengguna menunjuk ke id yang sudah dibuat.
create table if not exists request_log (
  key        text primary key,
  ref_ids    text[] not null,
  created_at timestamptz not null default now()
);

-- Workspace akun (aplikasi seller, toko, listing). Satu dokumen JSON per akun, revision untuk optimistic lock.
create table if not exists account_workspaces (
  uid        text primary key,
  data       jsonb not null,
  revision   integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table orders             enable row level security;
alter table bookings           enable row level security;
alter table request_log        enable row level security;
alter table account_workspaces enable row level security;

-- ---------------------------------------------------------------- registrasi
create or replace function register_user(p_secret text, p_name text, p_email text, p_password text)
returns table (user_id text, email text, display_name text, role text)
language plpgsql security definer set search_path = public, extensions as
$$
declare
  v_email text := lower(trim(p_email));
  v_id text := 'customer-' || gen_random_uuid();
begin
  perform assert_server(p_secret);
  if exists (select 1 from users u where lower(u.email) = v_email) then
    raise exception 'email_taken' using errcode = '23505';
  end if;
  insert into users (user_id, email, display_name, role, password_hash, created_at, updated_at)
  values (v_id, v_email, trim(p_name), 'user', crypt(p_password, gen_salt('bf')), now(), now());
  return query select u.user_id, u.email, u.display_name, u.role from users u where u.user_id = v_id;
end;
$$;

create or replace function users_list(p_secret text)
returns table (user_id text, display_name text, email text, role text)
language plpgsql security definer set search_path = public as
$$
begin
  perform assert_server(p_secret);
  return query select u.user_id, u.display_name, u.email, u.role from users u order by u.created_at nulls last;
end;
$$;

-- ---------------------------------------------------------------- checkout
-- p_orders: array pesanan (kunci = nama kolom orders). Harga dan stok diverifikasi ulang terhadap produk di dalam transaksi.
create or replace function checkout_commit(p_secret text, p_key text, p_orders jsonb)
returns setof orders
language plpgsql security definer set search_path = public as
$$
declare
  v_existing text[];
  o jsonb;
  it jsonb;
begin
  perform assert_server(p_secret);
  perform pg_advisory_xact_lock(hashtext(p_key));
  select ref_ids into v_existing from request_log where key = p_key;
  if found then
    return query select * from orders where order_id = any(v_existing) order by order_id;
    return;
  end if;

  for o in select value from jsonb_array_elements(p_orders) loop
    for it in select value from jsonb_array_elements(o->'items') loop
      update produk
         set stock_on_hand = stock_on_hand - (it->>'quantity')::int
       where product_id = it->>'productId'
         and is_active and deleted_at is null
         and product_price = (it->>'price')::bigint
         and stock_on_hand >= (it->>'quantity')::int;
      if not found then
        raise exception 'stock:%', it->>'productId';
      end if;
    end loop;
    o := o || jsonb_build_object('created_at', coalesce(o->>'created_at', now()::text));
    insert into orders select * from jsonb_populate_record(null::orders, o);
  end loop;

  insert into request_log (key, ref_ids)
  select p_key, array_agg(value->>'order_id') from jsonb_array_elements(p_orders);

  return query
    select * from orders
    where order_id in (select value->>'order_id' from jsonb_array_elements(p_orders))
    order by order_id;
end;
$$;

create or replace function order_cancel(p_secret text, p_customer_id text, p_order_id text)
returns setof orders
language plpgsql security definer set search_path = public as
$$
declare
  v_order orders;
  it jsonb;
begin
  perform assert_server(p_secret);
  select * into v_order from orders where order_id = p_order_id and customer_id = p_customer_id for update;
  if not found then raise exception 'not_found'; end if;
  if v_order.status = 'CANCELLED' then
    return next v_order; return;
  end if;
  if v_order.status <> 'AWAITING_SELLER' then raise exception 'bad_status'; end if;
  for it in select value from jsonb_array_elements(v_order.items) loop
    update produk set stock_on_hand = stock_on_hand + (it->>'quantity')::int where product_id = it->>'productId';
  end loop;
  update orders set status = 'CANCELLED', payment = 'CANCELLED', delivery = 'CANCELLED'
   where order_id = p_order_id returning * into v_order;
  return next v_order;
end;
$$;

create or replace function orders_list(p_secret text, p_customer_id text default null, p_business_id text default null)
returns setof orders
language plpgsql security definer set search_path = public as
$$
begin
  perform assert_server(p_secret);
  return query select * from orders
    where (p_customer_id is null or customer_id = p_customer_id)
      and (p_business_id is null or business_id = p_business_id)
    order by created_at desc;
end;
$$;

-- ---------------------------------------------------------------- booking
create or replace function booking_commit(p_secret text, p_key text, p_booking jsonb)
returns setof bookings
language plpgsql security definer set search_path = public as
$$
declare v_existing text[];
begin
  perform assert_server(p_secret);
  perform pg_advisory_xact_lock(hashtext(p_key));
  select ref_ids into v_existing from request_log where key = p_key;
  if found then
    return query select * from bookings where booking_id = v_existing[1];
    return;
  end if;
  insert into bookings select * from jsonb_populate_record(null::bookings,
    p_booking || jsonb_build_object('created_at', coalesce(p_booking->>'created_at', now()::text)));
  insert into request_log (key, ref_ids) values (p_key, array[p_booking->>'booking_id']);
  return query select * from bookings where booking_id = p_booking->>'booking_id';
end;
$$;

create or replace function bookings_list(p_secret text, p_customer_id text default null, p_business_id text default null)
returns setof bookings
language plpgsql security definer set search_path = public as
$$
begin
  perform assert_server(p_secret);
  return query select * from bookings
    where (p_customer_id is null or customer_id = p_customer_id)
      and (p_business_id is null or business_id = p_business_id)
    order by created_at desc;
end;
$$;

-- ---------------------------------------------------------------- workspace akun
create or replace function workspace_get(p_secret text, p_uid text)
returns table (data jsonb, revision integer)
language plpgsql security definer set search_path = public as
$$
begin
  perform assert_server(p_secret);
  return query select w.data, w.revision from account_workspaces w where w.uid = p_uid;
end;
$$;

create or replace function workspace_list(p_secret text)
returns table (data jsonb)
language plpgsql security definer set search_path = public as
$$
begin
  perform assert_server(p_secret);
  return query select w.data from account_workspaces w order by w.updated_at;
end;
$$;

-- p_revision = revision yang dibaca (0 untuk dokumen baru). Mengembalikan revision baru, atau error 'conflict'.
create or replace function workspace_save(p_secret text, p_uid text, p_data jsonb, p_revision integer)
returns integer
language plpgsql security definer set search_path = public as
$$
declare v_new integer;
begin
  perform assert_server(p_secret);
  if p_revision = 0 then
    insert into account_workspaces (uid, data) values (p_uid, p_data)
    on conflict (uid) do nothing returning revision into v_new;
  else
    update account_workspaces set data = p_data, revision = revision + 1, updated_at = now()
     where uid = p_uid and revision = p_revision returning revision into v_new;
  end if;
  if v_new is null then raise exception 'conflict'; end if;
  return v_new;
end;
$$;

-- ---------------------------------------------------------------- publikasi katalog seller
-- Mirror workspace seller ke bisnis/produk/jasa (setara mirror Firestore di production).
-- Stok hanya diatur ulang untuk item yang diubah seller (updated_at lebih baru); pesanan tidak menyentuh updated_at,
-- jadi stok yang sudah berkurang karena checkout tidak tertimpa saat workspace disimpan ulang.
create or replace function catalog_publish(p_secret text, p_business jsonb, p_listings jsonb)
returns void
language plpgsql security definer set search_path = public as
$$
declare
  l jsonb;
  v_active boolean := coalesce((p_business->>'is_active')::boolean, false);
begin
  perform assert_server(p_secret);

  insert into kategori (category_id, category_name, category_type, slug, is_active, created_at, updated_at) values
    ('seller-retail',  'Produk Warga',  'PRODUCT', 'seller-retail',  true, now(), now()),
    ('seller-food',    'Makanan Warga', 'PRODUCT', 'seller-food',    true, now(), now()),
    ('seller-service', 'Jasa Warga',    'SERVICE', 'seller-service', true, now(), now())
  on conflict (category_id) do nothing;

  insert into bisnis (business_id, owner_user_id, seller_status, business_name, business_description, business_address,
                      business_phone, business_logo_url, slug, area_name, owner_name, is_active, created_at, updated_at)
  values (p_business->>'business_id', p_business->>'owner_user_id', p_business->>'seller_status', p_business->>'business_name',
          p_business->>'business_description', p_business->>'business_address', p_business->>'business_phone',
          nullif(p_business->>'business_logo_url', ''), p_business->>'slug', p_business->>'area_name', p_business->>'owner_name',
          v_active, coalesce((p_business->>'created_at')::timestamptz, now()), now())
  on conflict (business_id) do update set
    seller_status = excluded.seller_status, business_name = excluded.business_name, business_description = excluded.business_description,
    business_address = excluded.business_address, business_phone = excluded.business_phone, business_logo_url = excluded.business_logo_url,
    area_name = excluded.area_name, owner_name = excluded.owner_name, is_active = excluded.is_active, updated_at = now()
  where bisnis.owner_user_id = excluded.owner_user_id;
  if not exists (select 1 from bisnis b where b.business_id = p_business->>'business_id' and b.owner_user_id = p_business->>'owner_user_id') then
    raise exception 'business_owned';
  end if;

  for l in select value from jsonb_array_elements(p_listings) loop
    if l->>'kind' = 'SERVICE' then
      insert into jasa (service_id, business_id, category_id, service_name, service_description, minimum_price, price_type,
                        availability_type, whatsapp_number, slug, thumbnail_url, is_active, created_at, updated_at)
      values (l->>'id', l->>'business_id', 'seller-service', l->>'name', l->>'description', (l->>'price')::bigint, 'FIXED',
              'ALWAYS_AVAILABLE', l->>'whatsapp', l->>'id', nullif(l->>'image', ''), (l->>'is_active')::boolean,
              (l->>'updated_at')::timestamptz, (l->>'updated_at')::timestamptz)
      on conflict (service_id) do update set
        service_name = excluded.service_name, service_description = excluded.service_description, minimum_price = excluded.minimum_price,
        whatsapp_number = excluded.whatsapp_number, thumbnail_url = excluded.thumbnail_url, is_active = excluded.is_active, updated_at = excluded.updated_at
      where jasa.business_id = excluded.business_id;
    else
      insert into produk (product_id, business_id, category_id, vertical, product_name, product_description, product_price,
                          whatsapp_number, slug, thumbnail_url, is_active, stock_on_hand, created_at, updated_at)
      values (l->>'id', l->>'business_id', case when l->>'kind' = 'FOOD' then 'seller-food' else 'seller-retail' end, l->>'kind',
              l->>'name', l->>'description', (l->>'price')::bigint, l->>'whatsapp', l->>'id', nullif(l->>'image', ''),
              (l->>'is_active')::boolean, greatest((l->>'stock')::int, 0), (l->>'updated_at')::timestamptz, (l->>'updated_at')::timestamptz)
      on conflict (product_id) do update set
        product_name = excluded.product_name, product_description = excluded.product_description, product_price = excluded.product_price,
        whatsapp_number = excluded.whatsapp_number, thumbnail_url = excluded.thumbnail_url, is_active = excluded.is_active,
        stock_on_hand = case when excluded.updated_at > produk.updated_at then excluded.stock_on_hand else produk.stock_on_hand end,
        updated_at = greatest(excluded.updated_at, produk.updated_at)
      where produk.business_id = excluded.business_id;
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------- favorit
-- Penghitung like publik (seperti penghitung klik). Daftar favorit per akun tetap di browser, sama seperti production.
create or replace function adjust_likes(p_kind text, p_id text, p_delta integer) returns void
language plpgsql security definer set search_path = public as
$$
begin
  if p_delta not in (-1, 1) then raise exception 'bad_delta'; end if;
  if p_kind = 'product' then
    update produk set like_count = greatest(like_count + p_delta, 0) where product_id = p_id;
  elsif p_kind = 'service' then
    update jasa set like_count = greatest(like_count + p_delta, 0) where service_id = p_id;
  else
    raise exception 'bad_kind';
  end if;
end;
$$;

-- ---------------------------------------------------------------- hak eksekusi
revoke all on function
  assert_server(text),
  register_user(text, text, text, text), users_list(text),
  checkout_commit(text, text, jsonb), order_cancel(text, text, text), orders_list(text, text, text),
  booking_commit(text, text, jsonb), bookings_list(text, text, text),
  workspace_get(text, text), workspace_list(text), workspace_save(text, text, jsonb, integer),
  catalog_publish(text, jsonb, jsonb)
from public;
grant execute on function
  register_user(text, text, text, text), users_list(text),
  checkout_commit(text, text, jsonb), order_cancel(text, text, text), orders_list(text, text, text),
  booking_commit(text, text, jsonb), bookings_list(text, text, text),
  workspace_get(text, text), workspace_list(text), workspace_save(text, text, jsonb, integer),
  catalog_publish(text, jsonb, jsonb)
to anon, authenticated;

revoke all on function adjust_likes(text, text, integer) from public;
grant execute on function adjust_likes(text, text, integer) to anon, authenticated;
