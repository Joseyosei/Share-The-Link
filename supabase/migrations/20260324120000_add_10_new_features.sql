-- ============================================================
-- Migration: 10 New Features for Share The Link
-- 1. Email/SMS Collection (subscribers)
-- 2. Custom Domains
-- 3. Link Thumbnails/Icons
-- 4. Embeddable Music Player (handled in frontend)
-- 5. Tip Jar / Donations
-- 6. Testimonials on public profiles (uses existing reviews table)
-- 7. Countdown Timer Links
-- 8. A/B Testing for Links
-- 9. Team/Collaboration
-- 10. Zapier/Webhooks Integration
-- ============================================================

-- ============================================================
-- 1. EMAIL/SMS COLLECTION - Subscribers table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscribers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  source text DEFAULT 'profile', -- profile, landing, embed
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz,
  is_active boolean DEFAULT true,
  tags text[] DEFAULT '{}',
  UNIQUE(creator_id, email)
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscribers"
  ON public.subscribers FOR ALL USING (auth.uid() = creator_id);

CREATE INDEX IF NOT EXISTS idx_subscribers_creator ON public.subscribers(creator_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(creator_id, email);

-- RPC for public email signup (no auth required)
CREATE OR REPLACE FUNCTION public.subscribe_to_creator(
  creator_username text,
  subscriber_email text,
  subscriber_name text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_creator_id uuid;
BEGIN
  SELECT user_id INTO v_creator_id FROM profiles WHERE username = creator_username;
  IF v_creator_id IS NULL THEN RETURN false; END IF;

  INSERT INTO subscribers (creator_id, email, name, source)
  VALUES (v_creator_id, subscriber_email, subscriber_name, 'profile')
  ON CONFLICT (creator_id, email) DO UPDATE SET
    is_active = true,
    unsubscribed_at = NULL,
    name = COALESCE(EXCLUDED.name, subscribers.name);

  RETURN true;
END;
$$;

-- ============================================================
-- 2. CUSTOM DOMAINS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.custom_domains (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain text NOT NULL UNIQUE,
  status text DEFAULT 'pending', -- pending, verifying, active, failed
  verification_token text,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own domains"
  ON public.custom_domains FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 3. LINK THUMBNAILS / ICONS
-- ============================================================
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS icon_url text;

-- ============================================================
-- 5. TIP JAR / DONATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tip_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  is_enabled boolean DEFAULT false,
  suggested_amounts integer[] DEFAULT '{3,5,10,25}', -- in dollars/pounds
  custom_message text DEFAULT 'Support my work!',
  currency text DEFAULT 'GBP',
  stripe_account_id text, -- connected account for payouts
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tips (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  currency text DEFAULT 'GBP',
  tipper_name text,
  tipper_email text,
  message text,
  stripe_payment_id text,
  status text DEFAULT 'completed', -- completed, refunded
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tip_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage tip settings"
  ON public.tip_settings FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their tips"
  ON public.tips FOR SELECT USING (auth.uid() = creator_id);

CREATE INDEX IF NOT EXISTS idx_tips_creator ON public.tips(creator_id);

-- RPC for public tip jar data
CREATE OR REPLACE FUNCTION public.get_tip_settings(lookup_username text)
RETURNS TABLE (is_enabled boolean, suggested_amounts integer[], custom_message text, currency text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ts.is_enabled, ts.suggested_amounts, ts.custom_message, ts.currency
  FROM tip_settings ts
  INNER JOIN profiles p ON ts.user_id = p.user_id
  WHERE p.username = lookup_username AND ts.is_enabled = true
  LIMIT 1;
$$;

-- ============================================================
-- 6. TESTIMONIALS - public RPC for approved/featured reviews
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_public_reviews(lookup_username text)
RETURNS TABLE (
  id uuid, reviewer_name text, company text, role text,
  rating integer, title text, content text, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT r.id, r.reviewer_name, r.company, r.role,
         r.rating, r.title, r.content, r.created_at
  FROM reviews r
  INNER JOIN profiles p ON r.user_id = p.user_id
  WHERE p.username = lookup_username
    AND r.is_approved = true
  ORDER BY r.is_featured DESC, r.rating DESC, r.created_at DESC
  LIMIT 6;
$$;

-- ============================================================
-- 7. COUNTDOWN TIMER LINKS
-- ============================================================
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS countdown_end timestamptz;
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS countdown_label text;

-- ============================================================
-- 8. A/B TESTING FOR LINKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.link_variants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id uuid NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  variant_name text NOT NULL DEFAULT 'B', -- A is the original
  title text NOT NULL,
  url text NOT NULL,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.link_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their link variants"
  ON public.link_variants FOR ALL USING (
    EXISTS (
      SELECT 1 FROM links l WHERE l.id = link_variants.link_id AND l.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_link_variants_link ON public.link_variants(link_id);

-- ============================================================
-- 9. TEAM / COLLABORATION
-- ============================================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_email text NOT NULL,
  member_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role text DEFAULT 'editor', -- editor, viewer, admin
  status text DEFAULT 'pending', -- pending, accepted, declined
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(owner_id, member_email)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage team members"
  ON public.team_members FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Members can view their invites"
  ON public.team_members FOR SELECT USING (auth.uid() = member_id);

CREATE POLICY "Members can update their invite status"
  ON public.team_members FOR UPDATE USING (auth.uid() = member_id);

-- ============================================================
-- 10. ZAPIER / WEBHOOKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.webhooks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  events text[] DEFAULT '{}', -- link_click, profile_view, new_subscriber, new_tip, new_booking
  secret text, -- for HMAC signing
  is_active boolean DEFAULT true,
  last_triggered_at timestamptz,
  failure_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id uuid NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb,
  response_status integer,
  response_body text,
  triggered_at timestamptz DEFAULT now()
);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their webhooks"
  ON public.webhooks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their webhook logs"
  ON public.webhook_logs FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM webhooks w WHERE w.id = webhook_logs.webhook_id AND w.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_webhooks_user ON public.webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook ON public.webhook_logs(webhook_id);
