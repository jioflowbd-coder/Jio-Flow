import { createHmac, timingSafeEqual } from 'node:crypto';

export const config = { api: { bodyParser: false } };
const respond = (res, status, json) => res.status(status).json(json);
const safeEqual = (left, right) => {
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a,b);
};
async function rawBody(req, max = 128 * 1024) {
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > max) throw new Error('Body too large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method !== 'POST') return respond(res,405,{ok:false});
  const token=process.env.STEADFAST_WEBHOOK_TOKEN;
  if(!token || token.length < 24) return respond(res,503,{ok:false});
  const auth=String(req.headers.authorization || '');
  if(!safeEqual(auth, `Bearer ${token}`)) return respond(res,401,{ok:false});
  if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json')) return respond(res,415,{ok:false});
  try {
    const raw = await rawBody(req);
    const received=String(req.headers['x-signature']||'').toLowerCase();
    const expected=createHmac('sha256',token).update(raw).digest('hex');
    if(!/^[0-9a-f]{64}$/.test(received) || !safeEqual(received,expected))return respond(res,401,{ok:false});
    const event=JSON.parse(raw.toString('utf8'));
    if(!event || typeof event !== 'object' || Array.isArray(event)) return respond(res,400,{ok:false});
    const type=String(event.notification_type||'').trim();
    const invoice=String(event.invoice||event.merchant_order_id||'').trim();
    const cid=String(event.consignment_id||'').trim();
    const status=String(event.status||event.delivery_status||'').trim();
    const idem=String(req.headers['idempotency-key']||'').trim();
    if(!/^[a-z_]{3,80}$/.test(type) || !status || status.length>100 ||
       (!invoice && !cid) || invoice.length>120 || cid.length>120 || !idem || idem.length>250)
      return respond(res,400,{ok:false});
    const url=String(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL||'').replace(/\/$/,'');
    const key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;
    if(!url || !key) return respond(res,503,{ok:false});
    const r=await fetch(`${url}/rest/v1/jf_steadfast_events?on_conflict=idempotency_key`,{
      method:'POST',
      headers:{
        apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',
        Prefer:'resolution=ignore-duplicates,return=minimal'
      },
      body:JSON.stringify({
        idempotency_key:idem,notification_type:type,
        invoice:invoice||null,consignment_id:cid||null,delivery_status:status
      }),
      signal:AbortSignal.timeout(4000)
    });
    if(!r.ok) return respond(res,503,{ok:false});
    // Event log only. Existing CRM order statuses are NOT mutated.
    return respond(res,200,{ok:true});
  }catch {
    return respond(res,503,{ok:false});
  }
}
