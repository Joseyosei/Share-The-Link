-- Add social_links JSONB column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

-- Update the get_public_profile RPC to include social_links
CREATE OR REPLACE FUNCTION public.get_public_profile(lookup_username text)
RETURNS TABLE (
  username text,
  full_name text,
  bio text,
  avatar_url text,
  social_links jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.username,
    p.full_name,
    p.bio,
    p.avatar_url,
    p.social_links
  FROM public.profiles p
  WHERE p.username = lookup_username
  LIMIT 1;
$$;
