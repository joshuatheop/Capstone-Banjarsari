-- NON-PROD saja. Baca katalog publik + penghitung klik. users & analytics_events tetap tertutup.

create policy "katalog publik: kategori" on kategori for select to anon, authenticated
  using (is_active and deleted_at is null);
create policy "katalog publik: bisnis" on bisnis for select to anon, authenticated
  using (is_active and deleted_at is null);
create policy "katalog publik: produk" on produk for select to anon, authenticated
  using (is_active and deleted_at is null);
create policy "katalog publik: jasa" on jasa for select to anon, authenticated
  using (is_active and deleted_at is null);
create policy "katalog publik: ulasan" on ulasan for select to anon, authenticated
  using (true);

create or replace function increment_product_clicks(p_id text) returns void
language sql security definer set search_path = public as
$$ update produk set click_count = click_count + 1 where product_id = p_id; $$;

create or replace function increment_service_clicks(p_id text) returns void
language sql security definer set search_path = public as
$$ update jasa set click_count = click_count + 1 where service_id = p_id; $$;

grant execute on function increment_product_clicks(text), increment_service_clicks(text) to anon, authenticated;
