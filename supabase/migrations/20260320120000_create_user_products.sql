-- Create user_products table for My Shop feature
CREATE TABLE IF NOT EXISTS public.user_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'digital',
  external_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_user_products_user_id ON public.user_products (user_id);

-- RLS policies
ALTER TABLE public.user_products ENABLE ROW LEVEL SECURITY;

-- Users can read their own products
CREATE POLICY "Users can read own products"
  ON public.user_products FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can insert their own products
CREATE POLICY "Users can insert own products"
  ON public.user_products FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own products
CREATE POLICY "Users can update own products"
  ON public.user_products FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Users can delete their own products
CREATE POLICY "Users can delete own products"
  ON public.user_products FOR DELETE
  USING (auth.uid()::text = user_id);

-- Public can view active products (for storefront)
CREATE POLICY "Public can view active products"
  ON public.user_products FOR SELECT
  USING (is_active = true);
