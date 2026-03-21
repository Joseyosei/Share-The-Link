-- RPC function to fetch active products for a public profile by username
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
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    up.id,
    up.name,
    up.description,
    up.price_cents,
    up.image_url,
    up.category,
    up.external_url
  FROM public.user_products up
  INNER JOIN public.profiles p ON up.user_id = p.user_id::text
  WHERE p.username = lookup_username AND up.is_active = true
  ORDER BY up.created_at DESC;
$$;
