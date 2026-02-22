-- Create team_members table for the public team page
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  social_links JSONB DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create site_content table for admin-managed content (videos, images, texts)
CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL, -- 'team_video', 'team_image', 'team_text', 'announcement', etc.
  title TEXT,
  body TEXT,
  media_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies for team_members (public read, admin write via service role)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active team members" ON team_members FOR SELECT USING (is_active = true);

-- RLS for site_content
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active site content" ON site_content FOR SELECT USING (is_active = true);

-- Create admin_users table to track who has admin access
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view admin_users" ON admin_users FOR SELECT USING (auth.uid() = user_id);

-- Allow admins to manage team_members and site_content
CREATE POLICY "Admins can manage team members" ON team_members FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage site content" ON site_content FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- Insert the founder as the first team member
INSERT INTO team_members (name, role, bio, display_order) VALUES
  ('Pastor Jerry Uchechukwu Eze', 'Founder & CEO', 'Visionary entrepreneur and founder of Share The Link. Building the ultimate link-in-bio platform for creators, entrepreneurs, and organizations worldwide.', 0)
ON CONFLICT DO NOTHING;
