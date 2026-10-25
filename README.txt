JioFlow Steadfast polling every ~30 minutes (GitHub Actions + Vercel Hobby)

IMPORTANT: Ecom Merchant Webhook is UNCHANGED. This integration NEVER requests a webhook change.

1. Backup your existing repository files. Do not replace existing vercel.json.
2. Run supabase/polling_migration.sql in your EXISTING JioFlow Supabase SQL Editor.
3. GitHub: upload api/steadfast-poll.mjs into root /api, and upload
   .github/workflows/steadfast-status-poll.yml into the exact nested path.
4. Vercel Production -> Environment Variables: add Secret JIOFLOW_POLL_SECRET
   with a NEW strong random 32+ byte/character value. Redeploy.
5. GitHub Repo -> Settings -> Secrets and variables -> Actions -> New repository secret:
   JIOFLOW_POLL_SECRET = SAME VALUE as Vercel variable above.
   JIOFLOW_POLL_URL = https://YOUR_ACTUAL_WORKING_DOMAIN/api/steadfast-poll
   (two GitHub secrets, URL may alternatively be a variable if workflow adapted).
6. GitHub -> Actions -> JioFlow Steadfast Status Poll -> enable workflow if prompted.
   Choose Run workflow for manual verification at the END, as requested.
7. The workflow runs every 30 minutes according to cron but GitHub Actions
   scheduled executions can be delayed or occasionally skipped.
8. Vercel Hobby cron limits do not affect this externally initiated function call.
9. Existing STEADFAST_API_KEY, STEADFAST_SECRET_KEY, SUPABASE_URL and
   SUPABASE_SERVICE_ROLE_KEY must exist in Production.

SCOPE & LIMITATIONS
- Only rows in jf_steadfast_bookings with state=booked and consignment_id
  will be checked. If orders are not linked into this table: 0 are checked.
- At most 20 rows per invocation. For higher scale add pagination and rate-limit handling.
- Completed statuses (delivered/cancelled/partial_delivered) are skipped.
- Saves delivery_status into jf_steadfast_bookings ONLY. Does not automatically
  alter your existing JioFlow orders UI or main orders table. To achieve that,
  we need real order table columns and mapping, followed by guarded deployment.
- DO NOT use polling to infer fraud/phone history. That's a separate endpoint.
- No changes to Ecom webhook, Ecom token, or Steadfast merchant callback URL.
- DO NOT enable live parcel booking in Vercel until security and data mapping verified.
- Do not paste tokens into screenshots/chats.
- JioFlow site was previously reported BLANK: confirm the website is working
  and Vercel deployments are green before activating the scheduler.
