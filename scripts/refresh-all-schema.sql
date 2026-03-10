-- Refresh the PostgREST schema cache for all tables
-- This resolves "table not found" errors when tables exist but API doesn't see them
NOTIFY pgrst, 'reload schema';

-- Verify all key tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_products', 
  'booking_services', 
  'bookings', 
  'creator_availability', 
  'creator_blocked_dates',
  'profiles',
  'links'
)
ORDER BY table_name;
