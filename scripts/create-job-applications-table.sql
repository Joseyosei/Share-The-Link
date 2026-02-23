-- Create job_applications table for career page applications
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  cover_letter TEXT,
  resume_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a job application (public insert)
CREATE POLICY "Anyone can submit job applications" ON job_applications FOR INSERT WITH CHECK (true);

-- Only admins can view applications
CREATE POLICY "Admins can view job applications" ON job_applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- Admins can manage applications
CREATE POLICY "Admins can manage job applications" ON job_applications FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);
