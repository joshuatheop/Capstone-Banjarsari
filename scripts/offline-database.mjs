// Explicit offline development alternative. No connection to hosted Supabase or Firebase.
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { createServer } from 'node:http';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';

const port=Number(process.env.OFFLINE_APP_PORT || 3011), dbPort=Number(process.env.OFFLINE_DB_PORT || 54329);
if (process.env.NODE_ENV === 'production') throw new Error('Offline database is development-only.');
if (process.env.NODE_ENV === 'production') throw new Error('Offline database is development-only.');
if (![port,dbPort].every(n=>Number.isInteger(n)&&n>1024&&n<65536)) throw new Error('Invalid local port');
await mkdir('.local',{recursive:true});
let config;
try { config=JSON.parse(await readFile('.local/offline-config.json','utf8')); }
catch(error) { if(error.code!=='ENOENT')throw error; config={key:'sb_publishable_offline_'+randomBytes(16).toString('hex'),secret:randomBytes(32).toString('hex'),session:randomBytes(32).toString('hex')}; await writeFile('.local/offline-config.json',JSON.stringify(config)); }
const db=new PGlite(path.resolve('.local/offline-postgres'),{extensions:{pgcrypto}});
await db.exec(`create schema if not exists extensions;
 do $$ begin if not exists(select from pg_roles where rolname='anon') then create role anon; end if; if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if; end $$;
 create table if not exists offline_migrations(name text primary key);`);
for(const file of (await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort()) {
  if((await db.query('select name from offline_migrations where name=$1',[file])).rows.length)continue;
  await db.transaction(async tx=>{await tx.exec(await readFile(path.join('supabase/migrations',file),'utf8'));await tx.query('insert into offline_migrations values($1)',[file]);});
}
await db.query('insert into server_secret(hash) values(extensions.crypt($1,extensions.gen_salt(\'bf\'))) on conflict(id) do update set hash=excluded.hash',[config.secret]);
const accounts={admin:{email:'admin',password:'localAdmin123!'},customer:{email:'user',password:'localUser123!'}};
for(const [role,account] of Object.entries(accounts)) await db.query(`insert into users(user_id,email,display_name,role,password_hash,created_at) values($1,$2,$3,$4,extensions.crypt($5,extensions.gen_salt('bf')),now()) on conflict(user_id) do nothing`,['offline-'+role,account.email+'@palugada.local','LOCAL TEST '+role,role==='admin'?'admin':'user',account.password]);
await writeFile('.local/offline-accounts.json',JSON.stringify(accounts));
await db.exec(`grant usage on schema public to anon,authenticated; grant select on kategori,bisnis,produk,jasa,ulasan to anon,authenticated;`);
// Minimal catalog fixture for checkout regression. No fake sales, ratings or forecasts.
await db.exec(`insert into kategori(category_id,category_name,category_type,slug) values('offline-retail','Produk Uji Lokal','PRODUCT','offline-retail'),('offline-service','Jasa Uji Lokal','SERVICE','offline-service') on conflict do nothing;
 insert into bisnis(business_id,business_name,business_description,business_address,slug,area_name,created_at) values('offline-shop-a','TOKO UJI LOKAL A','Data pengujian lokal, bukan toko nyata.','Banjarsari (data uji)','offline-a','Banjarsari',now()),('offline-shop-b','TOKO UJI LOKAL B','Data pengujian lokal, bukan toko nyata.','Banjarsari (data uji)','offline-b','Banjarsari',now()) on conflict do nothing;
 insert into produk(product_id,business_id,category_id,product_name,product_price,stock_on_hand,slug,vertical,created_at) values('offline-product-a','offline-shop-a','offline-retail','Produk uji lokal A',45000,100,'offline-product-a','RETAIL',now()),('offline-product-b','offline-shop-b','offline-retail','Produk uji lokal B',35000,100,'offline-product-b','RETAIL',now()) on conflict do nothing;
 insert into jasa(service_id,business_id,category_id,service_name,minimum_price,slug,created_at) values('offline-service','offline-shop-a','offline-service','Jasa uji lokal',20000,'offline-service',now()) on conflict do nothing;
 update produk set product_price=case product_id when 'offline-product-a' then 45000 else 35000 end where product_id in ('offline-product-a','offline-product-b');`);
const tables=new Set(['produk','jasa','bisnis','kategori','ulasan']);
const columns=new Map();
for(const table of tables) columns.set(table,new Set((await db.query('select column_name from information_schema.columns where table_schema=\'public\' and table_name=$1',[table])).rows.map(r=>r.column_name)));
const functions=new Map((await db.query(`select p.proname,p.proargnames,p.proretset from pg_proc p join pg_namespace n on p.pronamespace=n.oid where n.nspname='public' and has_function_privilege('anon',p.oid,'EXECUTE')`)).rows.map(r=>[r.proname,r]));
const id = value => { if(!/^[a-z_][a-z0-9_]*$/.test(value))throw new Error('Invalid identifier');return '"'+value+'"'; };
const server=createServer(async(req,res)=>{
  const origin=req.headers.origin, allowed=[`http://127.0.0.1:${port}`,`http://localhost:${port}`];
  const reply=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
  if(![`127.0.0.1:${dbPort}`,`localhost:${dbPort}`].includes(req.headers.host)||origin&&!allowed.includes(origin))return reply(403,{message:'Origin denied'});
  if(origin)res.setHeader('Access-Control-Allow-Origin',origin);
  res.setHeader('Access-Control-Allow-Headers','authorization,apikey,content-type,x-client-info,prefer');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
  if(req.headers.apikey!==config.key)return reply(401,{message:'Invalid local API key'});
  try {
    const url=new URL(req.url,`http://127.0.0.1:${dbPort}`),parts=url.pathname.split('/').filter(Boolean);
    if(parts[0]!=='rest'||parts[1]!=='v1')return reply(404,{message:'Not found'});
    const result=await db.transaction(async tx=>{
      await tx.exec('set local role anon');
      if(parts[2]==='rpc'&&req.method==='POST'){
        const fn=parts[3];if(!functions.has(fn))throw new Error('Unknown RPC');
        let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>1500000)throw new Error('Payload too large');}
        const args=JSON.parse(raw),keys=Object.keys(args),params=[];
        const call=keys.map(key=>{if(!functions.get(fn).proargnames?.includes(key))throw new Error('Unknown argument');params.push(typeof args[key]==='object'&&args[key]!==null?JSON.stringify(args[key]):args[key]);return `${id(key)} => $${params.length}`;});
        const rows=(await tx.query(`select * from ${id(fn)}(${call.join(',')})`,params)).rows;
        return functions.get(fn).proretset?rows:rows[0]?.[fn]??null;
      }
      const table=parts[2];if(req.method!=='GET'||!tables.has(table))throw new Error('Table access denied');
      const allowedColumns=columns.get(table),column=value=>{if(!allowedColumns.has(value))throw new Error('Unknown column');return id(value);};
      const select=url.searchParams.get('select')??'*',projection=select==='*'?'*':select.split(',').map(column).join(',');
      const filters=[],params=[];
      for(const [key,value] of url.searchParams){if(['select','order','limit'].includes(key))continue;const match=value.match(/^(eq|neq|gte|is)\.(.*)$/);if(!match)throw new Error('Unsupported filter');const col=column(key);if(match[1]==='is'&&match[2]==='null'){filters.push(`${col} is null`);continue;}params.push(match[2]);filters.push(`${col} ${{eq:'=',neq:'<>',gte:'>=',is:'='}[match[1]]} $${params.length}`);}
      let sql=`select ${projection} from ${id(table)}${filters.length?' where '+filters.join(' and '):''}`;
      const order=url.searchParams.get('order');if(order){const [col,direction]=order.split('.');sql+=` order by ${column(col)} ${direction==='desc'?'desc':'asc'}`;}
      const limit=Number(url.searchParams.get('limit')??10000);if(!Number.isInteger(limit)||limit<0||limit>10000)throw new Error('Invalid limit');sql+=` limit ${limit}`;
      const rows=(await tx.query(sql,params)).rows;
      return req.headers.accept?.includes('vnd.pgrst.object+json')?rows[0]??null:rows;
    });
    reply(200,result);
  } catch(error){reply(400,{message:error.message});}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(dbPort,'127.0.0.1',resolve);});
console.log(`Offline PostgreSQL ready on loopback ${dbPort}. Uses .local/offline-postgres; hosted credentials unchanged.`);
const env={...process.env,NEXT_PUBLIC_APP_ENV:'nonprod',NEXT_PUBLIC_DATA_BACKEND:'supabase',NEXT_PUBLIC_SUPABASE_URL:`http://127.0.0.1:${dbPort}`,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:config.key,NONPROD_DB_SECRET:config.secret,NONPROD_SESSION_SECRET:config.session,NONPROD_HOSTS:'127.0.0.1,localhost',NEXT_PUBLIC_SITE_URL:`http://127.0.0.1:${port}`,NEXT_PUBLIC_OFFLINE_DATABASE:'true'};
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port',String(port)],{env,stdio:'inherit',windowsHide:true});
let closing=false;const close=async()=>{if(closing)return;closing=true;child.kill();server.close();await db.close();};
process.on('SIGINT',()=>void close());process.on('SIGTERM',()=>void close());child.on('exit',()=>void close());
