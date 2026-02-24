-- Update founder name and photo in team_members table
UPDATE team_members 
SET name = 'Joseph Osei-Bonsu', 
    avatar_url = '/images/joseph-osei-bonsu.jpg'
WHERE role = 'Founder & CEO';

-- If no rows were updated (founder doesn't exist yet), insert
INSERT INTO team_members (name, role, bio, avatar_url, display_order)
SELECT 'Joseph Osei-Bonsu', 'Founder & CEO', 
  'Visionary entrepreneur and founder of Share The Link. Building the ultimate link-in-bio platform for creators, entrepreneurs, and organizations worldwide.',
  '/images/joseph-osei-bonsu.jpg', 0
WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE role = 'Founder & CEO');

-- Insert admin user by email (admin@sharethelink.io)
-- First look up the user_id from auth.users, then insert into admin_users
INSERT INTO admin_users (user_id, role)
SELECT id, 'super_admin' 
FROM auth.users 
WHERE email = 'admin@sharethelink.io'
ON CONFLICT (user_id) DO NOTHING;
