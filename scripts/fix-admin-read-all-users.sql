-- Allow admin users to read ALL profiles, links, and streams
-- This enables the admin overview to show all platform users

-- Drop existing admin policies if they exist to avoid conflicts
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
  DROP POLICY IF EXISTS "Admins can view all links" ON public.links;
  DROP POLICY IF EXISTS "Admins can view all streams" ON public.streams;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Admin can read all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Admin can read all links
CREATE POLICY "Admins can view all links"
  ON public.links
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Admin can read all streams
CREATE POLICY "Admins can view all streams"
  ON public.streams
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );
