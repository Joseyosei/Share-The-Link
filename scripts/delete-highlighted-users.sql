-- Delete highlighted user accounts and all their related data
-- This script removes users by their username

-- List of usernames to delete (from the screenshots)
-- @elvisagyemang, @paem@elvisagyemang.org, @pastorjerryeze, @ofori, @job, 
-- @sallybonsu, @deng, @Pastor Jerry, @Pastor Jerry Eze, @job26, @introvert, @elvisagyemangoffical

-- First, get the user_ids for these usernames
WITH users_to_delete AS (
  SELECT user_id, username FROM profiles 
  WHERE username IN (
    'elvisagyemang',
    'paem@elvisagyemang.org',
    'pastorjerryeze',
    'ofori',
    'job',
    'sallybonsu',
    'deng',
    'Pastor Jerry',
    'Pastor Jerry Eze',
    'job26',
    'introvert',
    'elvisagyemangoffical'
  )
)

-- Delete from all related tables first (due to foreign key constraints)
-- Delete analytics events
DELETE FROM analytics_events WHERE user_id IN (SELECT user_id FROM users_to_delete);

-- Delete links
DELETE FROM links WHERE user_id IN (SELECT user_id FROM users_to_delete);

-- Delete appearance settings
DELETE FROM appearance_settings WHERE user_id IN (SELECT user_id FROM users_to_delete);

-- Delete AI generations
DELETE FROM ai_generations WHERE user_id IN (SELECT user_id FROM users_to_delete);

-- Delete user integrations
DELETE FROM user_integrations WHERE user_id IN (SELECT user_id FROM users_to_delete);

-- Delete streams and related data
DELETE FROM stream_chat WHERE user_id IN (SELECT user_id FROM users_to_delete);
DELETE FROM stream_tips WHERE tipper_id IN (SELECT user_id FROM users_to_delete);
DELETE FROM stream_viewers WHERE viewer_id IN (SELECT user_id FROM users_to_delete);
DELETE FROM stream_recordings WHERE user_id IN (SELECT user_id FROM users_to_delete);
DELETE FROM streams WHERE user_id IN (SELECT user_id FROM users_to_delete);

-- Delete booking related data
DELETE FROM bookings WHERE creator_id IN (SELECT user_id FROM users_to_delete);
DELETE FROM booking_services WHERE creator_id IN (SELECT user_id FROM users_to_delete);
DELETE FROM creator_availability WHERE creator_id IN (SELECT user_id FROM users_to_delete);
DELETE FROM creator_blocked_dates WHERE creator_id IN (SELECT user_id FROM users_to_delete);

-- Delete products
DELETE FROM user_products WHERE user_id IN (SELECT user_id FROM users_to_delete);
DELETE FROM connect_products WHERE connected_account_id IN (
  SELECT id FROM connected_accounts WHERE user_id IN (SELECT user_id FROM users_to_delete)
);
DELETE FROM connected_accounts WHERE user_id IN (SELECT user_id FROM users_to_delete);

-- Delete earnings
DELETE FROM earnings WHERE user_id IN (SELECT user_id FROM users_to_delete);

-- Delete reviews
DELETE FROM reviews WHERE user_id IN (SELECT user_id FROM users_to_delete);

-- Delete subscriptions
DELETE FROM user_subscriptions WHERE user_id IN (SELECT user_id FROM users_to_delete);

-- Delete auto share links
DELETE FROM auto_share_links WHERE user_id IN (SELECT user_id FROM users_to_delete);

-- Delete admin users entries if any
DELETE FROM admin_users WHERE user_id IN (SELECT user_id FROM users_to_delete);

-- Finally delete the profiles
DELETE FROM profiles WHERE username IN (
  'elvisagyemang',
  'paem@elvisagyemang.org',
  'pastorjerryeze',
  'ofori',
  'job',
  'sallybonsu',
  'deng',
  'Pastor Jerry',
  'Pastor Jerry Eze',
  'job26',
  'introvert',
  'elvisagyemangoffical'
);

-- Note: The auth.users table entries need to be deleted via Supabase Dashboard or service role
-- This script only deletes the public schema data

-- Verify deletion
SELECT 'Remaining profiles:' as status, COUNT(*) as count FROM profiles;
