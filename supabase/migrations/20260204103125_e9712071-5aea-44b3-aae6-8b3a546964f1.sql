-- ============================================
-- STRIPE CONNECT INTEGRATION TABLES
-- ============================================

-- Table: connected_accounts
-- Maps users to their Stripe Connect accounts (V2 API)
CREATE TABLE public.connected_accounts (
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

-- Table: user_subscriptions
-- Tracks platform subscription status for users
CREATE TABLE public.user_subscriptions (
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

-- Table: connect_products
-- Products created by connected accounts on their storefronts
CREATE TABLE public.connect_products (
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

-- Enable RLS on all tables
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connect_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connected_accounts
CREATE POLICY "Users can view their own connected account"
ON public.connected_accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own connected account"
ON public.connected_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connected account"
ON public.connected_accounts FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions"
ON public.user_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.user_subscriptions FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for connect_products
CREATE POLICY "Anyone can view active products"
ON public.connect_products FOR SELECT
USING (is_active = true);

CREATE POLICY "Connected account owners can manage products"
ON public.connect_products FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.connected_accounts ca
    WHERE ca.id = connect_products.connected_account_id
    AND ca.user_id = auth.uid()
  )
);

-- Indexes for performance
CREATE INDEX idx_connected_accounts_user_id ON public.connected_accounts(user_id);
CREATE INDEX idx_connected_accounts_stripe_id ON public.connected_accounts(stripe_account_id);
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_account ON public.user_subscriptions(stripe_account_id);
CREATE INDEX idx_connect_products_connected_account ON public.connect_products(connected_account_id);

-- Trigger for updated_at
CREATE TRIGGER update_connected_accounts_updated_at
  BEFORE UPDATE ON public.connected_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_connect_products_updated_at
  BEFORE UPDATE ON public.connect_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();