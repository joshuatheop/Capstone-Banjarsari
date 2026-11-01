-- Additive non-prod RPC; no table rewrite or production migration.
-- Workspace approval, catalog publication and stock deltas succeed or roll back together.
create or replace function workspace_commit(p_secret text, p_uid text, p_data jsonb, p_revision integer)
returns integer language plpgsql security definer set search_path = public as
$$
declare
  previous jsonb; business jsonb := p_data->'business'; item jsonb; old_item jsonb;
  listings jsonb := '[]'::jsonb; available integer; delta integer; stamp timestamptz;
  catalog_owner text; version integer;
begin
  perform assert_server(p_secret);
  select data into previous from account_workspaces where uid = p_uid for update;
  version := workspace_save(p_secret, p_uid, p_data, p_revision);
  if business is null or business = 'null'::jsonb then return version; end if;
  -- Lock SKU rows before applying deltas: checkout/cancel use these same rows.
  for item in select value from jsonb_array_elements(p_data->'listings') order by value->>'id' loop
    if item->>'businessId' <> business->>'id' then raise exception 'business_owned'; end if;
    old_item := null;
    select value into old_item from jsonb_array_elements(coalesce(previous->'listings','[]'::jsonb)) where value->>'id' = item->>'id';
    available := (item->>'stock')::integer;
    stamp := clock_timestamp();
    if item->>'kind' <> 'SERVICE' then
      select stock_on_hand, updated_at, business_id into available, stamp, catalog_owner from produk where product_id = item->>'id' for update;
      if found then
        if catalog_owner <> business->>'id' then raise exception 'business_owned'; end if;
        delta := (item->>'stock')::integer - coalesce((old_item->>'stock')::integer, (item->>'stock')::integer);
        available := available + delta;
        if available < 0 or available > 1000000 then raise exception 'stock_insufficient'; end if;
        stamp := greatest(clock_timestamp(), stamp + interval '1 microsecond');
      else
        available := (item->>'stock')::integer; stamp := clock_timestamp();
      end if;
    else
      select business_id into catalog_owner from jasa where service_id = item->>'id' for update;
      if found and catalog_owner <> business->>'id' then raise exception 'business_owned'; end if;
    end if;
    listings := listings || jsonb_build_array(jsonb_build_object(
      'kind',item->>'kind','id',item->>'id','business_id',business->>'id','name',item->>'name',
      'description',item->>'description','price',(item->>'price')::bigint,'stock',available,
      'image',item->>'image','whatsapp',business->>'whatsapp',
      'is_active',(item->>'active')::boolean and business->>'status' = 'ACTIVE','updated_at',stamp));
  end loop;
  perform catalog_publish(p_secret, jsonb_build_object(
    'business_id',business->>'id','owner_user_id',business->>'ownerId','seller_status',business->>'status',
    'business_name',business->>'businessName','business_description',business->>'description','business_address',business->>'address',
    'business_phone',business->>'whatsapp','business_logo_url',business->>'logo','slug',business->>'id',
    'area_name',business->>'address','owner_name',business->>'ownerName','is_active',business->>'status' = 'ACTIVE','created_at',business->>'createdAt'), listings);
  return version;
end;
$$;
revoke all on function workspace_commit(text,text,jsonb,integer) from public;
grant execute on function workspace_commit(text,text,jsonb,integer) to anon, authenticated;
