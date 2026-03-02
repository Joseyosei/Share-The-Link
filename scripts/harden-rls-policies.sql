-- Security hardening: Tighten RLS policies
-- Run after the existing policies are in place

-- 1. Remove duplicate SELECT policy on user_subscriptions
DROP POLICY IF EXISTS "Users can read own subscription" ON public.user_subscriptions;

-- 2. Tighten analytics_events INSERT: require event_type and user_id
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Validated analytics event inserts" ON public.analytics_events
  FOR INSERT
  WITH CHECK (
    event_type IS NOT NULL
    AND user_id IS NOT NULL
    AND event_type IN ('page_view', 'profile_view', 'link_click', 'share', 'qr_scan')
  );

-- 3. Ensure appearance_settings are readable on public profile pages
-- (visitors viewing /@username need to see the theme)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view appearance settings' AND tablename = 'appearance_settings'
  ) THEN
    CREATE POLICY "Anyone can view appearance settings" ON public.appearance_settings
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- 4. Ensure links are readable on public profile pages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view active links' AND tablename = 'links'
  ) THEN
    CREATE POLICY "Anyone can view active links" ON public.links
      FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

-- 5. Restrict stream_chat INSERT to reasonable message sizes
-- (prevent spam / payload injection via oversized messages)
DROP POLICY IF EXISTS "Authenticated users can chat" ON public.stream_chat;
CREATE POLICY "Authenticated users can chat with limits" ON public.stream_chat
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND message IS NOT NULL
    AND char_length(message) <= 500
    AND stream_id IS NOT NULL
  );

-- 6. Restrict stream_tips INSERT to validated amounts
DROP POLICY IF EXISTS "Anyone can send tips" ON public.stream_tips;
CREATE POLICY "Validated tip inserts" ON public.stream_tips
  FOR INSERT
  WITH CHECK (
    amount > 0
    AND amount <= 10000
    AND stream_id IS NOT NULL
    AND currency IS NOT NULL
  );

-- 7. Tighten job_applications INSERT (prevent spam)
DROP POLICY IF EXISTS "Anyone can submit job applications" ON public.job_applications;
CREATE POLICY "Validated job application submissions" ON public.job_applications
  FOR INSERT
  WITH CHECK (
    full_name IS NOT NULL
    AND email IS NOT NULL
    AND char_length(full_name) <= 200
    AND char_length(email) <= 320
    AND char_length(COALESCE(cover_letter, '')) <= 5000
  );

-- 8. Ensure connected_accounts cannot be deleted by users (only admin)
-- (prevents user from deleting their Stripe account record)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'No user deletes on connected accounts' AND tablename = 'connected_accounts'
  ) THEN
    -- No explicit DELETE policy means RLS blocks deletes. This is already correct.
    -- Just verify: there should be NO delete policy for regular users.
    NULL;
  END IF;
END $$;
