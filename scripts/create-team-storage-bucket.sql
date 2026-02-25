-- Create storage bucket for team member avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-avatars',
  'team-avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated admin users to upload to team-avatars bucket
CREATE POLICY IF NOT EXISTS "Admins can upload team avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'team-avatars'
  AND EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- Allow authenticated admin users to delete team avatars
CREATE POLICY IF NOT EXISTS "Admins can delete team avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'team-avatars'
  AND EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- Allow public read access to team avatars
CREATE POLICY IF NOT EXISTS "Public can view team avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'team-avatars');

-- Also fix RLS on team_members to ensure admin_users check uses auth.uid() properly
-- Drop and recreate the admin policy to be more permissive for super admins
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
CREATE POLICY "Admins can manage team members"
ON public.team_members
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
