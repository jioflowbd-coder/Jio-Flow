/**
 * JioFlow Steadfast integration — safe placeholder.
 * This endpoint intentionally does not create bookings or expose credentials.
 * Add Supabase authentication, role checks, validated booking logic, and
 * webhook verification before enabling courier operations.
 */
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Allow', 'POST');

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed.'
    });
  }

  return res.status(503).json({
    success: false,
    message: 'Steadfast integration is not enabled yet.'
  });
}
