-- Comprehensive fix for all database issues
-- 1. Refresh PostgREST schema cache
-- 2. Delete admin test stream
-- 3. Verify all tables exist

-- STEP 1: Refresh the PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- STEP 2: Delete the admin's test stream "TESTING MIC 1234"
-- First get the admin user_id
DO $$
DECLARE
  admin_user_id uuid;
  stream_id_to_delete uuid;
BEGIN
  -- Find admin user
  SELECT p.user_id INTO admin_user_id
  FROM profiles p
  WHERE p.username = 'admin'
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    -- Find the test stream
    SELECT id INTO stream_id_to_delete
    FROM streams
    WHERE user_id = admin_user_id
      AND title ILIKE '%TESTING MIC%'
    LIMIT 1;

    IF stream_id_to_delete IS NOT NULL THEN
      -- Delete related data first
      DELETE FROM stream_chat WHERE stream_id = stream_id_to_delete;
      DELETE FROM stream_tips WHERE stream_id = stream_id_to_delete;
      DELETE FROM stream_viewers WHERE stream_id = stream_id_to_delete;
      DELETE FROM stream_recordings WHERE stream_id = stream_id_to_delete;
      -- Delete the stream
      DELETE FROM streams WHERE id = stream_id_to_delete;
      RAISE NOTICE 'Deleted test stream: TESTING MIC 1234';
    ELSE
      RAISE NOTICE 'No test stream found to delete';
    END IF;
  ELSE
    RAISE NOTICE 'Admin user not found';
  END IF;
END $$;

-- STEP 3: Verify all critical tables exist and list them
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'booking_services',
    'bookings',
    'creator_availability',
    'creator_blocked_dates',
    'user_products',
    'streams',
    'profiles',
    'links'
  )
ORDER BY table_name;
