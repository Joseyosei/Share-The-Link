-- Add background_image column to appearance_settings
ALTER TABLE public.appearance_settings
  ADD COLUMN IF NOT EXISTS background_image text;

-- Update RPC to include background_image
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
  background_image text,
  font_family text,
  title_color text,
  bio_color text,
  button_style text,
  button_color text,
  layout_mode text,
  link_animation text,
  verified_badge boolean,
  show_member_since boolean,
  show_follower_count boolean,
  section_dividers_enabled boolean,
  section_divider_style text,
  featured_link_ids text[],
  profile_created_at timestamptz
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
    a.background_image,
    a.font_family,
    a.title_color,
    a.bio_color,
    a.button_style,
    a.button_color,
    COALESCE(a.layout_mode, 'list') as layout_mode,
    COALESCE(a.link_animation, 'none') as link_animation,
    COALESCE(a.verified_badge, false) as verified_badge,
    COALESCE(a.show_member_since, false) as show_member_since,
    COALESCE(a.show_follower_count, false) as show_follower_count,
    COALESCE(a.section_dividers_enabled, false) as section_dividers_enabled,
    COALESCE(a.section_divider_style, 'gradient') as section_divider_style,
    COALESCE(a.featured_link_ids, '{}') as featured_link_ids,
    p.created_at as profile_created_at
  FROM public.profiles p
  LEFT JOIN public.appearance_settings a ON a.user_id = p.user_id
  WHERE p.username = lookup_username
  LIMIT 1;
$$;

-- Create background-images storage bucket if not exists
INSERT INTO storage.buckets (id, name, public) VALUES ('background-images', 'background-images', true) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to background-images bucket
CREATE POLICY IF NOT EXISTS "Users can upload background images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'background-images');

CREATE POLICY IF NOT EXISTS "Users can update their background images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'background-images');

CREATE POLICY IF NOT EXISTS "Background images are publicly readable"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'background-images');

CREATE POLICY IF NOT EXISTS "Users can delete their background images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'background-images');
