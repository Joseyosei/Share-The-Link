-- Delete highlighted user accounts EXCEPT @ofori, @sallybonsu, @deng
-- This script removes the following accounts and all their related data:
-- @elvisagyemang, @paem@elvisagyemang.org, @pastorjerryeze, @job, @Pastor Jerry, @Pastor Jerry Eze, @job26, @introvert, @elvisagyemangoffical

-- Get user IDs for accounts to delete (excluding @ofori, @sallybonsu, @deng)
WITH users_to_delete AS (
  SELECT DISTINCT id FROM auth.users 
  WHERE email IN (
    'elvis@gmail.com',
    'paem@elvisagyemang.org',
    'pastorjerryeze@email.com',
    'job@email.com',
    'introvert@email.com'
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.users.id 
    AND profiles.username IN (
      'elvisagyemang',
      'pastorjerryeze',
      'job',
      'introvert',
      'job26'
    )
  )
),
-- Also get the Pastor Elvis variants
elvis_variants AS (
  SELECT DISTINCT id FROM auth.users u
  WHERE EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = u.id
    AND (
      p.username = 'elvisagyemangoffical'
      OR p.username = 'elvisagyemang'
      OR (p.full_name LIKE '%Elvis Agyemang%' AND p.username NOT IN ('ofori', 'sallybonsu', 'deng'))
    )
  )
),
-- Get Pastor Jerry variants
jerry_variants AS (
  SELECT DISTINCT id FROM auth.users u
  WHERE EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = u.id
    AND (
      p.username = 'pastorjerryeze'
      OR p.full_name LIKE '%Pastor Jerry%'
      OR p.full_name LIKE '%Jerry Eze%'
      OR p.username LIKE '%jerry%'
    )
    AND p.username NOT IN ('ofori', 'sallybonsu', 'deng')
  )
),
all_users_to_delete AS (
  SELECT DISTINCT id FROM users_to_delete
  UNION
  SELECT DISTINCT id FROM elvis_variants
  UNION
  SELECT DISTINCT id FROM jerry_variants
)
-- Delete all related data for these users
DELETE FROM public.bookings WHERE creator_id IN (SELECT id FROM all_users_to_delete);
DELETE FROM public.booking_services WHERE creator_id IN (SELECT id FROM all_users_to_delete);
DELETE FROM public.creator_availability WHERE creator_id IN (SELECT id FROM all_users_to_delete);
DELETE FROM public.user_products WHERE user_id IN (SELECT id FROM all_users_to_delete);
DELETE FROM public.streams WHERE user_id IN (SELECT id FROM all_users_to_delete);
DELETE FROM public.links WHERE user_id IN (SELECT id FROM all_users_to_delete);
DELETE FROM public.profiles WHERE user_id IN (SELECT id FROM all_users_to_delete);
DELETE FROM auth.users WHERE id IN (SELECT id FROM all_users_to_delete);

-- Verify deletion
SELECT COUNT(*) as remaining_users FROM auth.users;
