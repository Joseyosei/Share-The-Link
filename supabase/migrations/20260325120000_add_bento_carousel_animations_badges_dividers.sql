-- ============================================================
-- Migration: 5 New Premium Features
-- 1. Bento Grid / Card Layout
-- 2. Featured Content Carousel
-- 3. Link Entry Animations (pulse, shake, bounce, glow)
-- 4. Verified Badge & Social Proof
-- 5. Color-Coded Section Dividers
-- ============================================================

-- ── 1. Appearance Settings: new columns ──────────────────────
ALTER TABLE public.appearance_settings
  ADD COLUMN IF NOT EXISTS layout_mode text DEFAULT 'list',
  ADD COLUMN IF NOT EXISTS link_animation text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS verified_badge boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_member_since boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_follower_count boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS section_dividers_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS section_divider_style text DEFAULT 'gradient',
  ADD COLUMN IF NOT EXISTS featured_link_ids text[] DEFAULT '{}';

-- ── 2. Links table: per-link customization ───────────────────
ALTER TABLE public.links
  ADD COLUMN IF NOT EXISTS animation text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS section_color text,
  ADD COLUMN IF NOT EXISTS section_icon text,
  ADD COLUMN IF NOT EXISTS bento_size text DEFAULT '1x1',
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS schedule_start timestamptz,
  ADD COLUMN IF NOT EXISTS schedule_end timestamptz,
  ADD COLUMN IF NOT EXISTS link_group text;

-- ── 3. Profiles: ensure created_at exists for "member since" ─
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- ── 4. Update RPC to return new appearance columns ───────────
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

-- ── 5. Update get_public_links to return new link fields ─────
CREATE OR REPLACE FUNCTION public.get_public_links(lookup_username text)
RETURNS TABLE (
  id uuid,
  title text,
  url text,
  link_type text,
  link_position integer,
  schedule_start timestamptz,
  schedule_end timestamptz,
  link_group text,
  thumbnail_url text,
  animation text,
  section_color text,
  section_icon text,
  bento_size text,
  is_featured boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    l.id, l.title, l.url, l.type as link_type, l.position as link_position,
    l.schedule_start, l.schedule_end, l.link_group,
    l.thumbnail_url,
    COALESCE(l.animation, 'none') as animation,
    l.section_color,
    l.section_icon,
    COALESCE(l.bento_size, '1x1') as bento_size,
    COALESCE(l.is_featured, false) as is_featured
  FROM public.links l
  INNER JOIN public.profiles p ON l.user_id = p.user_id
  WHERE p.username = lookup_username AND l.is_active = true
  ORDER BY l.position ASC;
$$;
