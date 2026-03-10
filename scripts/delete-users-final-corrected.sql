-- Delete highlighted user accounts (preserving @ofori, @sallybonsu, @deng)
-- This script deletes all related data for each user in the correct order

BEGIN;

-- Step 1: Get user IDs for the accounts to delete (excluding @ofori, @sallybonsu, @deng)
WITH users_to_delete AS (
  SELECT id FROM public.profiles 
  WHERE username IN (
    'elvisagyemang',
    'paem@elvisagyemang.org',
    'pastorjerryeze',
    'job',
    'job26',
    'introvert',
    'elvisagyemangoffical'
  )
  AND username NOT IN ('ofori', 'sallybonsu', 'deng')
)

-- Delete from all related tables in order of foreign key dependencies
DELETE FROM public.auto_share_links 
WHERE user_id IN (SELECT id FROM public.profiles WHERE username IN ('elvisagyemang', 'paem@elvisagyemang.org', 'pastorjerryeze', 'job', 'job26', 'introvert', 'elvisagyemangoffical') AND username NOT IN ('ofori', 'sallybonsu', 'deng'));

DELETE FROM public.booking_services 
WHERE creator_id IN (SELECT id FROM public.profiles WHERE username IN ('elvisagyemang', 'paem@elvisagyemang.org', 'pastorjerryeze', 'job', 'job26', 'introvert', 'elvisagyemangoffical') AND username NOT IN ('ofori', 'sallybonsu', 'deng'));

DELETE FROM public.bookings 
WHERE creator_id IN (SELECT id FROM public.profiles WHERE username IN ('elvisagyemang', 'paem@elvisagyemang.org', 'pastorjerryeze', 'job', 'job26', 'introvert', 'elvisagyemangoffical') AND username NOT IN ('ofori', 'sallybonsu', 'deng'));

DELETE FROM public.creator_availability 
WHERE creator_id IN (SELECT id FROM public.profiles WHERE username IN ('elvisagyemang', 'paem@elvisagyemang.org', 'pastorjerryeze', 'job', 'job26', 'introvert', 'elvisagyemangoffical') AND username NOT IN ('ofori', 'sallybonsu', 'deng'));

DELETE FROM public.creator_blocked_dates 
WHERE creator_id IN (SELECT id FROM public.profiles WHERE username IN ('elvisagyemang', 'paem@elvisagyemang.org', 'pastorjerryeze', 'job', 'job26', 'introvert', 'elvisagyemangoffical') AND username NOT IN ('ofori', 'sallybonsu', 'deng'));

DELETE FROM public.user_products 
WHERE user_id IN (SELECT id FROM public.profiles WHERE username IN ('elvisagyemang', 'paem@elvisagyemang.org', 'pastorjerryeze', 'job', 'job26', 'introvert', 'elvisagyemangoffical') AND username NOT IN ('ofori', 'sallybonsu', 'deng'));

DELETE FROM public.stream_recordings 
WHERE user_id IN (SELECT id FROM public.profiles WHERE username IN ('elvisagyemang', 'paem@elvisagyemang.org', 'pastorjerryeze', 'job', 'job26', 'introvert', 'elvisagyemangoffical') AND username NOT IN ('ofori', 'sallybonsu', 'deng'));

DELETE FROM public.stream_chat 
WHERE user_id IN (SELECT id FROM public.profiles WHERE username IN ('elvisagyemang', 'paem@elvisagyemang.org', 'pastorjerryeze', 'job', 'job26', 'introvert', 'elvisagyemangoffical') AND username NOT IN ('ofori', 'sallybonsu', 'deng'));

DELETE FROM public.streams 
WHERE user_id IN (SELECT id FROM public.profiles WHERE username IN ('elvisagyemang', 'paem@elvisagyemang.org', 'pastorjerryeze', 'job', 'job26', 'introvert', 'elvisagyemangoffical') AND username NOT IN ('ofori', 'sallybonsu', 'deng'));

DELETE FROM public.reviews 
WHERE user_id IN (SELECT id FROM public.profiles WHERE username IN ('elvisagyemang', 'paem@elvisagyemang.org', 'pastorjerryeze', 'job', 'job26', 'introvert', 'elvisagyemangoffical') AND username NOT IN ('ofori', 'sallybonsu', 'deng'));

DELETE FROM public.ai_generations 
WHERE user_id IN (SELECT id FROM public.profiles WHERE username IN ('elvisagyemang', 'paem@elvisagyemang.org', 'pastorjerryeze', 'job', 'job26', 'introvert', 'elvisagyemangoffical') AND username NOT IN ('ofori', 'sallybonsu', 'deng'));

DELETE FROM public.appearance_settings 
WHERE user_id IN (SELECT id FROM public.profiles WHERE username IN ('elvisagyemang', 'paem@elvisagyemang.org', 'pastorjerryeze', 'job', 'job26', 'introvert', 'elvisagyemangoffical') AND username NOT IN ('ofori', 'sallybonsu', 'deng'));

DELETE FROM public.analytics_events 
WHERE user_id IN (SELECT id FROM public.profiles WHERE username IN ('elvisagyemang', 'paem@elvisagyemang.org', 'pastorjerryeze', 'job', 'job26', 'introvert', 'elvisagyemangoffical') AND username NOT IN ('ofori', 'sallybonsu', 'deng'));

DELETE FROM public.user_integrations 
WHERE user_id IN (SELECT id FROM public.profiles WHERE username IN ('elvisagyemang', 'paem@elvisagyemang.org', 'pastorjerryeze', 'job', 'job26', 'introvert', 'elvisagyemangoffical') AND username NOT IN ('ofori', 'sallybonsu', 'deng'));

DELETE FROM public.user_subscriptions 
WHERE user_id IN (SELECT id FROM public.profiles WHERE username IN ('elvisagyemang', 'paem@elvisagyemang.org', 'pastorjerryeze', 'job', 'job26', 'introvert', 'elvisagyemangoffical') AND username NOT IN ('ofori', 'sallybonsu', 'deng'));

DELETE FROM public.earnings 
WHERE user_id IN (SELECT id FROM public.profiles WHERE username IN ('elvisagyemang', 'paem@elvisagyemang.org', 'pastorjerryeze', 'job', 'job26', 'introvert', 'elvisagyemangoffical') AND username NOT IN ('ofori', 'sallybonsu', 'deng'));

DELETE FROM public.connected_accounts 
WHERE user_id IN (SELECT id FROM public.profiles WHERE username IN ('elvisagyemang', 'paem@elvisagyemang.org', 'pastorjerryeze', 'job', 'job26', 'introvert', 'elvisagyemangoffical') AND username NOT IN ('ofori', 'sallybonsu', 'deng'));

DELETE FROM public.links 
WHERE user_id IN (SELECT id FROM public.profiles WHERE username IN ('elvisagyemang', 'paem@elvisagyemang.org', 'pastorjerryeze', 'job', 'job26', 'introvert', 'elvisagyemangoffical') AND username NOT IN ('ofori', 'sallybonsu', 'deng'));

DELETE FROM public.admin_users 
WHERE user_id IN (SELECT id FROM public.profiles WHERE username IN ('elvisagyemang', 'paem@elvisagyemang.org', 'pastorjerryeze', 'job', 'job26', 'introvert', 'elvisagyemangoffical') AND username NOT IN ('ofori', 'sallybonsu', 'deng'));

-- Finally, delete the profiles
DELETE FROM public.profiles 
WHERE username IN ('elvisagyemang', 'paem@elvisagyemang.org', 'pastorjerryeze', 'job', 'job26', 'introvert', 'elvisagyemangoffical')
AND username NOT IN ('ofori', 'sallybonsu', 'deng');

COMMIT;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
