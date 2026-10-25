// GitHub Actions -> Vercel endpoint. Does not alter Ecom webhook or main CRM orders.
const respond=(res,code,x)=>{res.setHeader('Cache-Control','no-store');return res.status(code).json(x)};
const env=k=>process.env[k]||'';
const url=()=>String(env('SUPABASE_URL')||env('VITE_SUPABASE_URL')).replace(/\/$/,'');
const key=()=>env('SUPABASE_SERVICE_ROLE_KEY')||env('SUPABASE_SECRET_KEY');
const DONE=new Set(['delivered','cancelled','partial_delivered']);
async function db(path,method='GET',data){
 const result=await fetch(`${url()}/rest/v1/${path}`,{
  method, headers:{apikey:key(),Authorization:`Bearer ${key()}`,'Content-Type':'application/json',Prefer:'return=representation'},
  ...(data===undefined?{}:{body:JSON.stringify(data)}), signal:AbortSignal.timeout(9000)});
 if(!result.ok)throw Error(`DB ${result.status}`);
 return result.json().catch(()=>null);
}
export default async function handler(req,res){
 if(req.method!=='POST')return respond(res,405,{ok:false,error:'POST only'});
 if(!env('JIOFLOW_POLL_SECRET')||req.headers.authorization!==`Bearer ${env('JIOFLOW_POLL_SECRET')}`)
  return respond(res,401,{ok:false,error:'Unauthorized'});
 if(!url()||!key()||!env('STEADFAST_API_KEY')||!env('STEADFAST_SECRET_KEY'))
  return respond(res,503,{ok:false,error:'Missing server configuration'});
 try{
  const bookings=await db('jf_steadfast_bookings?select=invoice,consignment_id,delivery_status,state,last_checked_at&state=eq.booked&consignment_id=not.is.null&order=last_checked_at.asc.nullsfirst&limit=20');
  let checked=0,changed=0,failed=0;
  for(const b of bookings||[]){
   if(DONE.has(String(b.delivery_status||'').toLowerCase()))continue;
   try{
    const response=await fetch(`https://portal.packzy.com/api/v1/status_by_cid/${encodeURIComponent(b.consignment_id)}`,{
     headers:{'Api-Key':env('STEADFAST_API_KEY'),'Secret-Key':env('STEADFAST_SECRET_KEY'),Accept:'application/json'},signal:AbortSignal.timeout(7000)});
    if(!response.ok)throw Error(`Courier ${response.status}`);
    const result=await response.json();
    if(result.status!==200 || typeof result.delivery_status!=='string' || !result.delivery_status)throw Error('Bad courier response');
    checked++;
    await db(`jf_steadfast_bookings?invoice=eq.${encodeURIComponent(b.invoice)}`,'PATCH',{
     delivery_status:result.delivery_status,last_checked_at:new Date().toISOString(),last_poll_error:null});
    if(result.delivery_status!==b.delivery_status)changed++;
   }catch(e){
    failed++;
    // Never overwrite last known delivery status if lookup fails.
    await db(`jf_steadfast_bookings?invoice=eq.${encodeURIComponent(b.invoice)}`,'PATCH',{
      last_checked_at:new Date().toISOString(),last_poll_error:'Polling failed'}).catch(()=>{});
   }
  }
  return respond(res,200,{ok:true,checked,changed,failed,limit:20,note:'Courier bookkeeping table only; existing CRM order table not changed.'});
 }catch(e){return respond(res,503,{ok:false,error:'Polling unavailable; see Vercel function logs'});}
}
