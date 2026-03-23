-- Create an RPC function that returns all data needed for the public profile page
-- This bypasses RLS (SECURITY DEFINER) so public visitors can view profiles

-- Return user_id and social_links alongside profile data
CREATE OR REPLACE FUNCTION public.get_profile_page_data(lookup_username text)
RETURNS TABLE (
  user_id uuid,
  username text,
  full_name text,
  bio text,
  avatar_url text,
  social_links jsonb,
  theme text,
  background_type text,
  background_gradient text,
  background_color text,
  background_animation text,
  font_family text,
  title_color text,
  bio_color text,
  button_style text,
  button_color text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.username,
    p.full_name,
    p.bio,
    p.avatar_url,
    p.social_links,
    COALESCE(a.theme, 'air') as theme,
    a.background_type,
    a.background_gradient,
    a.background_color,
    a.background_animation,
    a.font_family,
    a.title_color,
    a.bio_color,
    a.button_style,
    a.button_color
  FROM public.profiles p
  LEFT JOIN public.appearance_settings a ON a.user_id = p.user_id
  WHERE p.username = lookup_username
  LIMIT 1;
$$;

-- Public booking services by username
CREATE OR REPLACE FUNCTION public.get_public_booking_services(lookup_username text)
RETURNS TABLE (
  id uuid,
  title text,
  type text,
  duration integer,
  price numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT bs.id, bs.title, bs.type, bs.duration, bs.price
  FROM public.booking_services bs
  INNER JOIN public.profiles p ON bs.creator_id = p.user_id
  WHERE p.username = lookup_username AND bs.is_active = true
  ORDER BY bs.price ASC
  LIMIT 3;
$$;

-- Public products by username
CREATE OR REPLACE FUNCTION public.get_public_products(lookup_username text)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price_cents integer,
  image_url text,
  category text,
  external_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT up.id, up.name, up.description, up.price_cents, up.image_url, up.category, up.external_url
  FROM public.user_products up
  INNER JOIN public.profiles p ON up.user_id = p.user_id
  WHERE p.username = lookup_username AND up.is_active = true
  ORDER BY up.created_at DESC;
$$;
