-- Delete highlighted user accounts (preserving @ofori, @sallybonsu, @deng)
-- This script deletes all related data for each user in the correct order

-- Users to delete (by username)
-- @elvisagyemang, @paem@elvisagyemang.org, @pastorjerryeze, @job, 
-- @Pastor Jerry, @Pastor Jerry Eze, @job26, @introvert, @elvisagyemangoffical

BEGIN;

-- Step 1: Get user IDs from profiles table for the accounts to delete
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
DELETE FROM public.booking_services WHERE creator_id IN (SELECT id FROM users_to_delete);

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
DELETE FROM public.bookings WHERE creator_id IN (SELECT id FROM users_to_delete);

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
DELETE FROM public.creator_availability WHERE creator_id IN (SELECT id FROM users_to_delete);

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
DELETE FROM public.user_products WHERE user_id IN (SELECT id FROM users_to_delete);

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
DELETE FROM public.user_streams WHERE user_id IN (SELECT id FROM users_to_delete);

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
DELETE FROM public.user_links WHERE user_id IN (SELECT id FROM users_to_delete);

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
DELETE FROM public.profiles WHERE id IN (SELECT id FROM users_to_delete);

-- Step 2: Delete from auth.users (Supabase auth system)
-- Get user IDs from auth metadata or email
DELETE FROM auth.users 
WHERE email IN (
  SELECT email FROM (
    VALUES 
      ('elvisagyemang@example.com'),
      ('paem@elvisagyemang.org'),
      ('pastorjerryeze@example.com'),
      ('job@example.com'),
      ('job26@example.com'),
      ('introvert@example.com'),
      ('elvisagyemangoffical@example.com')
  ) AS emails(email)
);

COMMIT;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
