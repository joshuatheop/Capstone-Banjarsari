// Isolated PostgreSQL verification using the development-only PGlite dependency.
// Does not connect to Supabase or use any project credentials.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { PGlite } = await import('@electric-sql/pglite');
const db=new PGlite();
const baseline=await readFile('supabase/migrations/20261005000000_nonprod_baseline.sql','utf8');
const commerce=await readFile('supabase/migrations/20261023000000_nonprod_commerce.sql','utf8');
await db.exec(baseline);
await db.exec(`create role anon; create role authenticated; alter table produk add column stock_on_hand integer not null default 0 check(stock_on_hand>=0);
 create table account_workspaces(uid text primary key,data jsonb not null,revision integer not null default 1,updated_at timestamptz default now());
 create function assert_server(p_secret text) returns void language plpgsql as $$ begin if p_secret is distinct from 'isolated-test' then raise exception 'forbidden'; end if; end; $$;`);
for(const name of ['workspace_save','catalog_publish']) { const start=commerce.indexOf(`create or replace function ${name}(`);await db.exec(commerce.slice(start,commerce.indexOf('$$;',commerce.indexOf('$$',start)+2)+3)); }
await db.exec(await readFile('supabase/migrations/20261101000000_atomic_workspace_inventory.sql','utf8'));
const business={id:'shop-test',ownerId:'user-test',status:'ACTIVE',businessName:'Test',description:'Test',address:'Test address',whatsapp:'6281234567890',logo:'',createdAt:'2026-11-01T00:00:00Z'};
const item={id:'product-test',businessId:business.id,kind:'RETAIL',name:'Product',description:'',price:1000,stock:10,image:'',active:true};
const w={business,listings:[item],access:{uid:'user-test',roles:['CUSTOMER','SELLER']}};
const save=(data,revision,secret='isolated-test')=>db.query('select workspace_commit($1,$2,$3::jsonb,$4)',[secret,'user-test',JSON.stringify(data),revision]);
const stock=async()=>Number((await db.query('select stock_on_hand from produk where product_id=$1',[item.id])).rows[0].stock_on_hand);
await assert.rejects(save(w,0,'bad'),/forbidden/);
await save(w,0);assert.equal(await stock(),10);
await db.exec("update produk set stock_on_hand=7 where product_id='product-test'"); // checkout reservation
await save({...w,business:{...business,businessName:'Renamed'}},1);assert.equal(await stock(),7);
await save({...w,listings:[{...item,stock:14}]},2);assert.equal(await stock(),11); // +4, not overwrite to 14
await assert.rejects(save({...w,listings:[{...item,stock:0}]},3),/stock_insufficient/);
assert.equal((await db.query("select revision from account_workspaces where uid='user-test'")).rows[0].revision,3);
await assert.rejects(save(w,1),/conflict/);assert.equal(await stock(),11);
await db.exec("insert into bisnis(business_id,owner_user_id,business_name,slug) values('foreign-shop','foreign','Foreign','foreign'); insert into produk(product_id,business_id,product_name,slug,stock_on_hand) values('foreign-product','foreign-shop','Foreign','foreign-product',8)");
await assert.rejects(save({...w,listings:[{...item,id:'foreign-product'}]},3),/business_owned/);
assert.equal((await db.query("select revision from account_workspaces where uid='user-test'")).rows[0].revision,3);
await db.close();console.log('PASS isolated PostgreSQL: atomic workspace/catalog, stale revision, ownership, stock delta after checkout, negative-stock rollback and secret guard.');
