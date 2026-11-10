-- Migrasi: Penyatuan vertical Belanja (RETAIL) dan Makanan (FOOD) menjadi PRODUK_UMKM.

-- 1. Perbarui check constraint pada tabel produk
alter table produk drop constraint if exists produk_vertical_check;
update produk set vertical = 'PRODUK_UMKM' where vertical in ('RETAIL', 'FOOD') or vertical is null;
alter table produk add constraint produk_vertical_check check (vertical in ('PRODUK_UMKM', 'RETAIL', 'FOOD'));

-- 2. Perbarui check constraint pada tabel orders
alter table orders drop constraint if exists orders_vertical_check;
update orders set vertical = 'PRODUK_UMKM' where vertical in ('RETAIL', 'FOOD');
alter table orders add constraint orders_vertical_check check (vertical in ('PRODUK_UMKM', 'RETAIL', 'FOOD'));

-- 3. Tambahkan kategori baru untuk Produk UMKM toko
insert into kategori (category_id, category_name, category_type, slug)
values ('seller-product', 'Produk UMKM Toko', 'PRODUCT', 'seller-product')
on conflict (category_id) do update set category_name = excluded.category_name;

-- 4. Perbarui fungsi catalog_publish agar memasukkan produk dengan vertical PRODUK_UMKM
create or replace function catalog_publish(p_secret text, p_business jsonb, p_listings jsonb) returns void
language plpgsql security definer set search_path = public as
$$
declare
  l jsonb;
begin
  perform assert_server(p_secret);

  if p_business is not null and p_business ? 'id' then
    insert into bisnis (business_id, business_name, business_description, business_address,
                        business_phone, whatsapp_number, slug, thumbnail_url, area_name,
                        latitude, longitude, owner_name, is_active, owner_user_id, seller_status,
                        created_at, updated_at)
    values (p_business->>'id', p_business->>'name', p_business->>'description', p_business->>'address',
            p_business->>'phone', p_business->>'whatsapp', p_business->>'id', nullif(p_business->>'logo', ''),
            'Banjarsari', (p_business->>'latitude')::double precision, (p_business->>'longitude')::double precision,
            p_business->>'owner', true, p_business->>'owner_user_id', coalesce(p_business->>'seller_status', 'ACTIVE'),
            (p_business->>'created_at')::timestamptz, (p_business->>'updated_at')::timestamptz)
    on conflict (business_id) do update set
      business_name = excluded.business_name, business_description = excluded.business_description,
      business_address = excluded.business_address, business_phone = excluded.business_phone,
      whatsapp_number = excluded.whatsapp_number, thumbnail_url = excluded.thumbnail_url,
      latitude = excluded.latitude, longitude = excluded.longitude, owner_name = excluded.owner_name,
      seller_status = excluded.seller_status, updated_at = excluded.updated_at
    where bisnis.owner_user_id = excluded.owner_user_id or bisnis.owner_user_id is null;
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
      values (l->>'id', l->>'business_id', 'seller-product', 'PRODUK_UMKM',
              l->>'name', l->>'description', (l->>'price')::bigint, l->>'whatsapp', l->>'id', nullif(l->>'image', ''),
              (l->>'is_active')::boolean, greatest((l->>'stock')::int, 0), (l->>'updated_at')::timestamptz, (l->>'updated_at')::timestamptz)
      on conflict (product_id) do update set
        product_name = excluded.product_name, product_description = excluded.product_description, product_price = excluded.product_price,
        whatsapp_number = excluded.whatsapp_number, thumbnail_url = excluded.thumbnail_url, is_active = excluded.is_active,
        vertical = 'PRODUK_UMKM',
        stock_on_hand = case when excluded.updated_at > produk.updated_at then excluded.stock_on_hand else produk.stock_on_hand end,
        updated_at = greatest(excluded.updated_at, produk.updated_at)
      where produk.business_id = excluded.business_id;
    end if;
  end loop;
end;
$$;

