-- ==============================================
-- FIX SUPABASE SECURITY ADVISOR WARNINGS
-- ==============================================

-- 1. Fix "Function Search Path Mutable" warnings
--    Set search_path = public on all functions that are missing it.

-- Fix: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix: increment_stream_tips
CREATE OR REPLACE FUNCTION public.increment_stream_tips(p_stream_id uuid, p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.streams
  SET total_tips = COALESCE(total_tips, 0) + p_amount,
      updated_at = NOW()
  WHERE id = p_stream_id;
END;
$$;

-- Fix: update_user_videos_updated_at
CREATE OR REPLACE FUNCTION public.update_user_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix: handle_new_user (re-apply with explicit search_path)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), ' ', '')),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Fix "RLS Policy Always True" warnings
--    Tighten overly permissive policies where possible.

-- Fix: bookings INSERT - require client_email and client_name to be non-empty
DROP POLICY IF EXISTS "Anyone can create a booking" ON public.bookings;
CREATE POLICY "Anyone can create a booking" ON public.bookings
  FOR INSERT WITH CHECK (
    client_email IS NOT NULL AND client_email <> ''
    AND client_name IS NOT NULL AND client_name <> ''
    AND creator_id IS NOT NULL
  );

-- Fix: stream_viewers INSERT - require a valid stream_id exists
DROP POLICY IF EXISTS "Anyone can join as viewer" ON public.stream_viewers;
CREATE POLICY "Anyone can join as viewer" ON public.stream_viewers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.streams s
      WHERE s.id = stream_id AND s.status = 'live'
    )
  );

-- Fix: user_subscriptions "Service role full access" - restrict to service_role only
DROP POLICY IF EXISTS "Service role full access on subscriptions" ON public.user_subscriptions;
CREATE POLICY "Service role full access on subscriptions" ON public.user_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. "Leaked Password Protection Disabled" - enable via Supabase Dashboard:
--    Dashboard → Authentication → Settings → Enable "Leaked Password Protection"
--    (This cannot be fixed via SQL migration)
