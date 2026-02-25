-- Create storage bucket for team member avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-avatars',
  'team-avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Admins can upload team avatars" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete team avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view team avatars" ON storage.objects;

-- Allow authenticated admin users to upload to team-avatars bucket
CREATE POLICY "Admins can upload team avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'team-avatars'
  AND EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- Allow authenticated admin users to delete team avatars
CREATE POLICY "Admins can delete team avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'team-avatars'
  AND EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- Allow public read access to team avatars
CREATE POLICY "Public can view team avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'team-avatars');

-- Fix team_members RLS
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
CREATE POLICY "Admins can manage team members"
ON public.team_members
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
