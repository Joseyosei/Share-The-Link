-- ==============================================
-- SHARE THE LINK - COMPLETE DATABASE SETUP
-- ==============================================

-- Helper: update_updated_at_column trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 1. PROFILES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- ==============================================
-- 2. LINKS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT DEFAULT 'link',
  position INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own links"
  ON public.links FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own links"
  ON public.links FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own links"
  ON public.links FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own links"
  ON public.links FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_links_user_id ON public.links(user_id);

-- ==============================================
-- 3. APPEARANCE SETTINGS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.appearance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'default',
  font_family TEXT,
  background_type TEXT,
  background_color TEXT,
  background_gradient TEXT,
  button_style TEXT,
  button_color TEXT,
  title_color TEXT,
  bio_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.appearance_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own appearance settings"
  ON public.appearance_settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appearance settings"
  ON public.appearance_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appearance settings"
  ON public.appearance_settings FOR UPDATE USING (auth.uid() = user_id);

-- ==============================================
-- 4. EARNINGS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC,
  currency TEXT DEFAULT 'GBP',
  source TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own earnings"
  ON public.earnings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own earnings"
  ON public.earnings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==============================================
-- 5. STREAMS & LIVE STREAMING TABLES
-- ==============================================
CREATE TABLE IF NOT EXISTS public.streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('offline', 'live', 'ended')),
  room_name TEXT,
  room_url TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  viewer_count INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  total_tips NUMERIC DEFAULT 0,
  thumbnail_url TEXT,
  is_recording BOOLEAN DEFAULT false,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stream_viewers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.streams(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewer_name TEXT,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  watch_duration INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.stream_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.streams(id) ON DELETE CASCADE,
  tipper_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tipper_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  message TEXT,
  stripe_payment_id TEXT,
  creator_amount NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stream_chat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.streams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'message' CHECK (message_type IN ('message', 'tip', 'system')),
  is_highlighted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_chat ENABLE ROW LEVEL SECURITY;

-- Streams policies
CREATE POLICY "Anyone can view live streams" ON public.streams FOR SELECT USING (status = 'live' OR status = 'ended');
CREATE POLICY "Users can view their own streams" ON public.streams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own streams" ON public.streams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own streams" ON public.streams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own streams" ON public.streams FOR DELETE USING (auth.uid() = user_id);

-- Stream viewers policies
CREATE POLICY "Anyone can join as viewer" ON public.stream_viewers FOR INSERT WITH CHECK (true);
CREATE POLICY "Stream owners can view their viewers" ON public.stream_viewers FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.streams s WHERE s.id = stream_id AND s.user_id = auth.uid()));
CREATE POLICY "Viewers can update their own record" ON public.stream_viewers FOR UPDATE
  USING (viewer_id = auth.uid() OR viewer_id IS NULL);

-- Stream tips policies
CREATE POLICY "Anyone can send tips" ON public.stream_tips FOR INSERT WITH CHECK (true);
CREATE POLICY "Stream owners can view their tips" ON public.stream_tips FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.streams s WHERE s.id = stream_id AND s.user_id = auth.uid()) OR tipper_id = auth.uid());

-- Stream chat policies
CREATE POLICY "Anyone can view stream chat" ON public.stream_chat FOR SELECT USING (true);
CREATE POLICY "Authenticated users can chat" ON public.stream_chat FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Streaming indexes
CREATE INDEX IF NOT EXISTS idx_streams_user_id ON public.streams(user_id);
CREATE INDEX IF NOT EXISTS idx_streams_status ON public.streams(status);
CREATE INDEX IF NOT EXISTS idx_stream_chat_stream_id ON public.stream_chat(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_tips_stream_id ON public.stream_tips(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_stream_id ON public.stream_viewers(stream_id);

-- ==============================================
-- 6. AI PAGE BUILDER TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.ai_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_description TEXT NOT NULL,
  generated_bio TEXT,
  generated_colors JSONB,
  generated_layout TEXT,
  generated_ctas JSONB,
  generated_font TEXT,
  applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI generations" ON public.ai_generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own AI generations" ON public.ai_generations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own AI generations" ON public.ai_generations FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id ON public.ai_generations(user_id);

-- ==============================================
-- 7. STRIPE CONNECT TABLES
-- ==============================================
CREATE TABLE IF NOT EXISTS public.connected_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  display_name TEXT,
  contact_email TEXT,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  charges_enabled BOOLEAN DEFAULT FALSE,
  payouts_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stripe_account_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  plan_name TEXT,
  status TEXT DEFAULT 'inactive',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.connect_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connected_account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
  stripe_product_id TEXT NOT NULL,
  stripe_price_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  price_amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'gbp',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_products ENABLE ROW LEVEL SECURITY;

-- Connected accounts policies
CREATE POLICY "Users can view their own connected account" ON public.connected_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own connected account" ON public.connected_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own connected account" ON public.connected_accounts FOR UPDATE USING (auth.uid() = user_id);

-- Subscription policies
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own subscriptions" ON public.user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON public.user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Connect products policies
CREATE POLICY "Anyone can view active products" ON public.connect_products FOR SELECT USING (is_active = true);
CREATE POLICY "Connected account owners can manage products" ON public.connect_products FOR ALL
  USING (EXISTS (SELECT 1 FROM public.connected_accounts ca WHERE ca.id = connect_products.connected_account_id AND ca.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_id ON public.connected_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_stripe_id ON public.connected_accounts(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_connect_products_connected_account ON public.connect_products(connected_account_id);

-- ==============================================
-- 8. AUTO-SHARE LINKS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.auto_share_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  message TEXT,
  share_url TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  posted_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.auto_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own auto shares"
  ON public.auto_share_links FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own auto shares"
  ON public.auto_share_links FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own auto shares"
  ON public.auto_share_links FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own auto shares"
  ON public.auto_share_links FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_auto_share_links_user_id ON public.auto_share_links(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_share_links_link_id ON public.auto_share_links(link_id);
CREATE INDEX IF NOT EXISTS idx_auto_share_links_status ON public.auto_share_links(status, scheduled_at)
  WHERE status = 'pending';

-- ==============================================
-- 9. PUBLIC PROFILE FUNCTIONS (RPC)
-- ==============================================
CREATE OR REPLACE FUNCTION public.get_public_profile(lookup_username text)
RETURNS TABLE (
  username text,
  full_name text,
  bio text,
  avatar_url text,
  social_links jsonb
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.username, p.full_name, p.bio, p.avatar_url, p.social_links
  FROM public.profiles p
  WHERE p.username = lookup_username
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_public_links(lookup_username text)
RETURNS TABLE (
  id uuid,
  title text,
  url text,
  link_type text,
  link_position integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT l.id, l.title, l.url, l.type, l.position
  FROM public.links l
  INNER JOIN public.profiles p ON l.user_id = p.user_id
  WHERE p.username = lookup_username AND l.is_active = true
  ORDER BY l.position ASC;
$$;

CREATE OR REPLACE FUNCTION public.get_appearance_by_username(lookup_username text)
RETURNS TABLE (
  theme text,
  font_family text,
  background_type text,
  background_color text,
  background_gradient text,
  button_style text,
  button_color text,
  title_color text,
  bio_color text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT a.theme, a.font_family, a.background_type, a.background_color,
         a.background_gradient, a.button_style, a.button_color, a.title_color, a.bio_color
  FROM public.appearance_settings a
  INNER JOIN public.profiles p ON a.user_id = p.user_id
  WHERE p.username = lookup_username
  LIMIT 1;
$$;

-- ==============================================
-- 10. TRIGGERS FOR UPDATED_AT
-- ==============================================
CREATE OR REPLACE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_links_updated_at BEFORE UPDATE ON public.links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_appearance_updated_at BEFORE UPDATE ON public.appearance_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_streams_updated_at BEFORE UPDATE ON public.streams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_connected_accounts_updated_at BEFORE UPDATE ON public.connected_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_connect_products_updated_at BEFORE UPDATE ON public.connect_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- 11. ENABLE REALTIME
-- ==============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE public.streams;
