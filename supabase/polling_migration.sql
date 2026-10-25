-- Existing jf_steadfast_bookings table from earlier ZIP is required.
ALTER TABLE public.jf_steadfast_bookings ADD COLUMN IF NOT EXISTS last_checked_at timestamptz;
ALTER TABLE public.jf_steadfast_bookings ADD COLUMN IF NOT EXISTS last_poll_error text;
CREATE INDEX IF NOT EXISTS jf_steadfast_poll_lookup_idx ON public.jf_steadfast_bookings(last_checked_at)
WHERE state='booked' AND consignment_id IS NOT NULL;
