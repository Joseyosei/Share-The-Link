-- Refresh the PostgREST schema cache
-- This is needed when tables exist but the API returns "table not found" errors
NOTIFY pgrst, 'reload schema';

-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('booking_services', 'bookings', 'creator_availability', 'creator_blocked_dates');
