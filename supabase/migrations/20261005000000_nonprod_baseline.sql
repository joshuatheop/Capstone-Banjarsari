-- PALUGADA non-prod baseline (mirror koleksi Firestore: lib/firestore/types.ts).
-- Hanya untuk database Supabase NON-PROD. Jangan dijalankan ke production.
-- Kolom baru: tambahkan lewat migrasi baru (lihat supabase/README.md).

create table if not exists kategori (
  category_id   text primary key,
  category_name text not null,
  category_type text not null check (category_type in ('PRODUCT','SERVICE')),
  slug          text not null,
  icon          text,
  is_active     boolean not null default true,
  created_at    timestamptz,
  updated_at    timestamptz,
  deleted_at    timestamptz
);

create table if not exists bisnis (
  business_id          text primary key,
  owner_user_id        text,
  seller_status        text check (seller_status in ('ACTIVE','SUSPENDED')),
  business_name        text not null,
  business_description text,
  business_address     text,
  business_phone       text,
  business_logo_url    text,
  slug                 text not null,
  marketplace          text,
  area_name            text,
  latitude             double precision,
  longitude            double precision,
  owner_name           text,
  is_active            boolean not null default true,
  created_at           timestamptz,
  updated_at           timestamptz,
  deleted_at           timestamptz
);

create table if not exists produk (
  product_id          text primary key,
  business_id         text references bisnis(business_id),
  category_id         text references kategori(category_id),
  vertical            text check (vertical in ('RETAIL','FOOD')),
  product_name        text not null,
  product_description text,
  product_price       bigint not null default 0,
  slug                text not null,
  whatsapp_number     text,
  marketplace         text,
  media_sosial        text,
  thumbnail_url       text,
  is_active           boolean not null default true,
  like_count          integer not null default 0,
  click_count         integer not null default 0,
  created_at          timestamptz,
  updated_at          timestamptz,
  deleted_at          timestamptz
);

create table if not exists jasa (
  service_id          text primary key,
  business_id         text references bisnis(business_id),
  category_id         text references kategori(category_id),
  service_name        text not null,
  service_description text,
  minimum_price       bigint,
  maximum_price       bigint,
  price_type          text not null default 'CONTACT_PROVIDER'
                      check (price_type in ('FIXED','STARTING_FROM','RANGE','CONTACT_PROVIDER')),
  is_negotiable       boolean not null default false,
  availability_type   text not null default 'ALWAYS_AVAILABLE'
                      check (availability_type in ('ALWAYS_AVAILABLE','BY_SCHEDULE','BY_REQUEST','TEMPORARILY_UNAVAILABLE')),
  whatsapp_number     text,
  marketplace         text,
  slug                text not null,
  thumbnail_url       text,
  is_active           boolean not null default true,
  like_count          integer not null default 0,
  click_count         integer not null default 0,
  created_at          timestamptz,
  updated_at          timestamptz,
  deleted_at          timestamptz
);

-- Data pengguna non-prod hanya hasil anonimisasi (bukan UID/email Firebase asli).
create table if not exists users (
  user_id       text primary key,
  email         text not null,
  display_name  text,
  role          text not null default 'user',
  photo_url     text,
  alamat        text,
  kewarganegaraan text,
  no_telepon    text,
  created_at    timestamptz,
  updated_at    timestamptz
);

create table if not exists ulasan (
  review_id  text primary key,
  item_id    text not null,
  item_type  text not null check (item_type in ('product','service')),
  user_id    text,
  user_name  text,
  user_photo text,
  rating     integer not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz
);

create table if not exists analytics_events (
  event_id        text primary key,
  session_id      text,
  business_id     text,
  product_id      text,
  service_id      text,
  event_type      text,
  destination_url text,
  item_name       text,
  business_name   text,
  created_at      timestamptz
);

create index if not exists produk_business_idx on produk(business_id);
create index if not exists jasa_business_idx on jasa(business_id);
create index if not exists ulasan_item_idx on ulasan(item_id);
create index if not exists analytics_created_idx on analytics_events(created_at desc);

-- RLS aktif tanpa policy: akses hanya lewat service_role (server/seed).
-- Tambahkan policy select publik per tabel bila client perlu membaca langsung.
alter table kategori         enable row level security;
alter table bisnis           enable row level security;
alter table produk           enable row level security;
alter table jasa             enable row level security;
alter table users            enable row level security;
alter table ulasan           enable row level security;
alter table analytics_events enable row level security;
