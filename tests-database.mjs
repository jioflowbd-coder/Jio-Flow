// Run with PGLITE_MODULE pointing to an installed @electric-sql/pglite module.
// Uses an in-memory PostgreSQL-compatible database. No remote project is touched.
import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const {PGlite}=await import(process.env.PGLITE_MODULE||'@electric-sql/pglite');const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,invited_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
for(const f of ['001_identity_and_shops.sql','002_crm_foundation.sql','003_account_provisioning.sql','004_products_customers_followups.sql'])await db.exec(await readFile(new URL('./supabase/migrations/'+f,import.meta.url),'utf8'));
const creator='11111111-1111-4111-8111-111111111111',owner='22222222-2222-4222-8222-222222222222',admin='33333333-3333-4333-8333-333333333333',agent='44444444-4444-4444-8444-444444444444',owner2='55555555-5555-4555-8555-555555555555',outsider='66666666-6666-4666-8666-666666666666';
async function identity(id){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated')}
async function q(sql,params=[]){return (await db.query(sql,params)).rows}
async function denied(sql,params=[]){await assert.rejects(()=>db.query(sql,params))}
await db.query(`insert into auth.users values($1,'creator@test.example',now(),null)`,[creator]);await db.query(`insert into public.jf_profiles(id,full_name,email,platform_role)values($1,'Creator','creator@test.example','creator')`,[creator]);await identity(creator);
const shop=(await q("select public.jf_create_shop('Business One') as id"))[0].id;
const shop2=(await q("select public.jf_create_shop('Business Two') as id"))[0].id;
async function attach(actor,shop,role,id,email){await identity(actor);const request=(await q("select public.jf_prepare_invitation($1,$2,'Test User',$3) as id",[shop,role,email]))[0].id;await db.exec('reset role');await db.query('insert into auth.users values($1,$2,now(),now())',[id,email]);await identity(actor);await q('select public.jf_finish_invitation($1,$2)',[request,id]);return request}
const ownerRequest=await attach(creator,shop,'owner',owner,'owner@test.example');await attach(creator,shop2,'owner',owner2,'owner2@test.example');
await identity(owner);await denied("select public.jf_create_shop('Forbidden')");await denied("select public.jf_prepare_invitation($1,'owner','Forbidden','another@test.example')",[shop]);await denied("select public.jf_prepare_invitation($1,'admin','Forbidden','another@test.example')",[shop2]);
await attach(owner,shop,'admin',admin,'admin@test.example');await attach(admin,shop,'agent',agent,'agent@test.example');
await identity(admin);await denied("select public.jf_prepare_invitation($1,'admin','Forbidden','another@test.example')",[shop]);await denied("update public.jf_shops set owner_id=$1 where id=$2",[admin,shop]);
const visible=await q('select email from public.jf_profiles');assert.ok(visible.some(p=>p.email==='owner@test.example'));assert.equal(visible.some(p=>p.email==='owner2@test.example'),false);
await db.exec('reset role');assert.equal((await q('select status from public.jf_memberships where user_id=$1',[agent]))[0].status,'pending');
await db.query("insert into public.jf_customers(shop_id,phone)values($1,'01700000001'),($2,'01700000001')",[shop,shop2]);
const customer=(await q('select id from public.jf_customers where shop_id=$1',[shop]))[0].id;
await denied("insert into public.jf_customers(shop_id,phone)values($1,'01700000001')",[shop]);
await denied("insert into public.jf_followups(shop_id,customer_id)values($1,$2)",[shop2,customer]);
await db.query('insert into public.jf_followups(shop_id,customer_id)values($1,$2)',[shop,customer]);await denied('insert into public.jf_followups(shop_id,customer_id)values($1,$2)',[shop,customer]);
await db.query("insert into public.jf_products(shop_id,name)values($1,'Product')",[shop]);const product=(await q('select id from public.jf_products where shop_id=$1',[shop]))[0].id;await db.query('insert into public.jf_product_costs(shop_id,product_id,unit_cost)values($1,$2,123)',[shop,product]);
await identity(admin);assert.equal((await q('select * from public.jf_customers')).length,1);assert.equal((await q('select * from public.jf_product_costs')).length,0);await denied("insert into public.jf_customers(shop_id,phone)values($1,'01711111111')",[shop]);
await db.exec('reset role');await db.query(`update public.jf_memberships set permissions=permissions||'{"profit":true}'::jsonb where user_id=$1`,[admin]);await identity(admin);assert.equal((await q('select * from public.jf_product_costs')).length,1);
await identity(agent);assert.equal((await q('select * from public.jf_customers')).length,0);await denied("select public.jf_prepare_invitation($1,'agent','Forbidden','another@test.example')",[shop]);
await db.exec('reset role');await db.query("update public.jf_memberships set status='active' where user_id=$1",[agent]);await identity(agent);assert.equal((await q('select * from public.jf_customers')).length,0);
await db.exec('reset role');await db.query('update auth.users set email_confirmed_at=null where id=$1',[admin]);await identity(admin);assert.equal((await q('select * from public.jf_customers')).length,0);await identity(owner);assert.equal((await q('select * from public.jf_product_costs')).length,1);await db.exec('reset role');await db.query('update public.jf_profiles set active=false where id=$1',[owner]);await identity(owner);assert.equal((await q('select * from public.jf_customers')).length,0);
await db.exec('reset role');await db.exec('set role anon');await denied('select * from public.jf_profiles');await denied("select public.jf_create_shop('Anonymous')");await denied('select * from public.jf_customers');
await db.exec('reset role');const versionCount=(await q('select count(*)::int as n from public.jf_schema_versions'))[0].n;assert.equal(versionCount,4);
await db.query('update public.jf_profiles set active=true where id=$1',[owner]);await db.query('update auth.users set email_confirmed_at=now() where id=$1',[admin]);await identity(owner);
const productPayload={name:'A Product',sku:'SKU-004',sale_price:'690.50',unit_cost:'120.25',active:true};
const savedProduct=(await q('select public.jf_save_product($1,null,$2::jsonb) as id',[shop,JSON.stringify(productPayload)]))[0].id;
await q('select public.jf_set_product_active($1,$2,false)',[shop,savedProduct]);assert.equal((await q('select active from public.jf_products where id=$1',[savedProduct]))[0].active,false);
await q('select public.jf_save_product($1,$2,$3::jsonb)',[shop,savedProduct,JSON.stringify({...productPayload,sale_price:'700.00',active:true})]);
assert.equal(Number((await q('select sale_price from public.jf_products where id=$1',[savedProduct]))[0].sale_price),700);
await denied('select public.jf_save_product($1,$2,$3::jsonb)',[shop2,savedProduct,JSON.stringify(productPayload)]);
for(const price of ['-1','NaN','1.234'])await denied('select public.jf_save_product($1,null,$2::jsonb)',[shop,JSON.stringify({...productPayload,sale_price:price})]);
const customerPayload={full_name:'Saved Customer',phone:'01712345678',source:'facebook',address:'Dhaka'};
const savedCustomer=(await q('select public.jf_save_customer($1,null,$2::jsonb) as id',[shop,JSON.stringify(customerPayload)]))[0].id;
assert.equal((await q('select phone from public.jf_customers where id=$1',[savedCustomer]))[0].phone,'+8801712345678');
const sameCustomer=(await q('select public.jf_save_customer($1,null,$2::jsonb) as id',[shop,JSON.stringify({...customerPayload,phone:'+8801712345678',full_name:'Updated Customer'})]))[0].id;assert.equal(sameCustomer,savedCustomer);
assert.equal((await q('select count(*)::int as n from public.jf_followups where customer_id=$1',[savedCustomer]))[0].n,1);
await denied('select public.jf_save_customer($1,null,$2::jsonb)',[shop,JSON.stringify({...customerPayload,permanent:true})]);
await denied('select public.jf_save_customer($1,null,$2::jsonb)',[shop,JSON.stringify({...customerPayload,assigned_membership_id:'99999999-9999-4999-8999-999999999999'})]);
await denied("select public.jf_record_followup($1,$2,'callback','busy')",[shop,savedCustomer]);
await q("select public.jf_record_followup($1,$2,'callback','busy',now()+interval '1 day','Call tomorrow')",[shop,savedCustomer]);
await q("select public.jf_record_followup($1,$2,'completed','positive',null,'Purchased')",[shop,savedCustomer]);
assert.equal((await q('select count(*)::int as n from public.jf_notes where customer_id=$1',[savedCustomer]))[0].n,2);
assert.equal((await q('select callback_at from public.jf_followups where customer_id=$1',[savedCustomer]))[0].callback_at,null);
assert.ok((await q("select * from public.jf_customer_page($1,'completed','+8801712',0)",[shop])).some(r=>r.id===savedCustomer));
assert.equal((await q("select * from public.jf_customer_page($1,'callback','+8801712',0)",[shop])).length,0);
await identity(admin);await denied('select public.jf_save_product($1,null,$2::jsonb)',[shop,JSON.stringify(productPayload)]);
await db.exec('reset role');await db.query(`update public.jf_memberships set permissions=permissions||'{"products":true,"profit":false}'::jsonb where user_id=$1`,[admin]);await identity(admin);
await denied('select public.jf_save_product($1,null,$2::jsonb)',[shop,JSON.stringify(productPayload)]);
const publicProduct={...productPayload,sku:'ADMIN-004'};delete publicProduct.unit_cost;await q('select public.jf_save_product($1,null,$2::jsonb)',[shop,JSON.stringify(publicProduct)]);
await identity(agent);await denied('select public.jf_save_customer($1,null,$2::jsonb)',[shop,JSON.stringify(customerPayload)]);assert.equal((await q('select * from public.jf_customer_page($1)',[shop])).length,0);
await db.exec('reset role');await db.exec('set role anon');await denied('select public.jf_save_customer($1,null,$2::jsonb)',[shop,JSON.stringify(customerPayload)]);
await db.close();console.log('Operational checks passed: product CRUD/activation/cost privacy, normalized phone upserts, one follow-up, notes/history, callback validation, server-side filtering and denied Agent/anonymous writes.');
console.log('Database checks passed: all migrations execute; Creator/Owner/Admin/Agent hierarchy, same-shop profile reads, tenant foreign keys, duplicate phone/follow-up constraints, Agent data blockade, Admin finance permission, inactive rejection and anonymous denial.');
