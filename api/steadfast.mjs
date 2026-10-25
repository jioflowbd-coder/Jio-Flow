// JioFlow / Steadfast — secured, read-only status endpoint (Step 2)
// Credentials remain on Vercel. No order booking or webhook is enabled by this file.
const STEADFAST_BASE = 'https://portal.packzy.com/api/v1';
const send = (res, status, body) => res.status(status).json(body);

async function authenticate(req) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  const authorization = req.headers.authorization || '';
  const match = /^Bearer (\S+)$/i.exec(authorization);
  if (!match) return { error: 'Sign in required', status: 401 };
  if (!url || !key) return { error: 'Supabase configuration missing', status: 503 };
  const base = url.replace(/\/$/, '');
  const headers = { apikey: key, Authorization: `Bearer ${match[1]}` };
  const userResp = await fetch(`${base}/auth/v1/user`, { headers, signal: AbortSignal.timeout(10000) });
  if (!userResp.ok) return { error: 'Invalid session', status: 401 };
  const user = await userResp.json();
  if (!user.id || !user.email_confirmed_at) return { error: 'Email verification required', status: 403 };
  const profileResp = await fetch(`${base}/rest/v1/jf_profiles?select=id,active,deleted_at,role&id=eq.${encodeURIComponent(user.id)}&limit=1`, { headers, signal: AbortSignal.timeout(10000) });
  if (!profileResp.ok) return { error: 'Unable to verify account permissions', status: 503 };
  const profiles = await profileResp.json();
  const profile = profiles?.[0];
  if (!profile || profile.active !== true || profile.deleted_at) return { error: 'Inactive account', status: 403 };
  if (!['owner', 'admin', 'creator'].includes(String(profile.role || '').toLowerCase())) return { error: 'Courier access restricted to administrators', status: 403 };
  return { user };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Allow', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return send(res, 415, { error: 'JSON required' });
  try {
    const auth = await authenticate(req);
    if (auth.error) return send(res, auth.status, { success: false, error: auth.error });
    if (!process.env.STEADFAST_API_KEY || !process.env.STEADFAST_SECRET_KEY) return send(res, 503, { success: false, error: 'Steadfast credentials missing on server' });
    const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!input || input.action !== 'status' || !['cid', 'invoice', 'tracking'].includes(input.by)) return send(res, 400, { success: false, error: 'Supported action: status; by: cid/invoice/tracking' });
    const value = String(input.value || '').trim();
    if (!/^[a-zA-Z0-9_-]{1,70}$/.test(value)) return send(res, 400, { success: false, error: 'Invalid lookup value' });
    const path = { cid: 'status_by_cid', invoice: 'status_by_invoice', tracking: 'status_by_trackingcode' }[input.by];
    const upstream = await fetch(`${STEADFAST_BASE}/${path}/${encodeURIComponent(value)}`, {
      headers: { 'Api-Key': process.env.STEADFAST_API_KEY, 'Secret-Key': process.env.STEADFAST_SECRET_KEY, Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });
    const result = await upstream.json().catch(() => null);
    if (!upstream.ok || !result || (typeof result.status === 'number' && result.status >= 400)) return send(res, 502, { success: false, error: 'Steadfast status request failed' });
    return send(res, 200, { success: true, delivery_status: result.delivery_status ?? null, data: result });
  } catch (error) {
    if (error instanceof SyntaxError) return send(res, 400, { success: false, error: 'Invalid JSON' });
    return send(res, 503, { success: false, error: 'Courier service unavailable' });
  }
}
