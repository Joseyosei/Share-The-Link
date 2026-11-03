-- Add countdown_end and countdown_label to get_public_links return type
DROP FUNCTION IF EXISTS public.get_public_links(text);

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
  is_featured boolean,
  countdown_end timestamptz,
  countdown_label text
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
    COALESCE(l.is_featured, false) as is_featured,
    l.countdown_end,
    l.countdown_label
  FROM public.links l
  INNER JOIN public.profiles p ON l.user_id = p.user_id
  WHERE p.username = lookup_username AND l.is_active = true
  ORDER BY l.position ASC;
$$;
