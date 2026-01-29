-- Fix PUBLIC_DATA_EXPOSURE: Restrict profiles table to prevent mass scraping
-- The "Public profiles are viewable by everyone" policy was already dropped

-- Create function to get public profile data by username (prevents mass scraping)
CREATE OR REPLACE FUNCTION public.get_public_profile(lookup_username text)
RETURNS TABLE (
  username text,
  full_name text,
  bio text,
  avatar_url text
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
    p.avatar_url
  FROM public.profiles p
  WHERE p.username = lookup_username
  LIMIT 1;
$$;

-- Create function to get public links by username (position is a reserved word, use quotes)
CREATE OR REPLACE FUNCTION public.get_public_links(lookup_username text)
RETURNS TABLE (
  id uuid,
  title text,
  url text,
  link_type text,
  link_position integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    l.id,
    l.title,
    l.url,
    l.type,
    l.position
  FROM public.links l
  INNER JOIN public.profiles p ON l.user_id = p.user_id
  WHERE p.username = lookup_username
    AND l.is_active = true
  ORDER BY l.position ASC;
$$;

-- The "Public appearance settings are viewable" policy was already dropped
-- Appearance settings will be fetched via the existing get_appearance_by_username function