-- Allow admins to read all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Allow admins to read all links
DROP POLICY IF EXISTS "Admins can view all links" ON public.links;
CREATE POLICY "Admins can view all links"
ON public.links
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Allow admins to read all streams
DROP POLICY IF EXISTS "Admins can view all streams" ON public.streams;
CREATE POLICY "Admins can view all streams"
ON public.streams
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));

-- Allow admins to read all stream recordings
DROP POLICY IF EXISTS "Admins can view all recordings" ON public.stream_recordings;
CREATE POLICY "Admins can view all recordings"
ON public.stream_recordings
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()));
