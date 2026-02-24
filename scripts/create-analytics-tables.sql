-- Create analytics_events table for tracking profile views, link clicks, etc.
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('page_view', 'link_click', 'profile_view')),
  link_id uuid REFERENCES public.links(id) ON DELETE SET NULL,
  visitor_id text, -- anonymous fingerprint
  ip_address text,
  country text,
  country_code text,
  city text,
  device_type text CHECK (device_type IN ('mobile', 'desktop', 'tablet')),
  browser text,
  os text,
  referrer text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for fast analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_user_date ON public.analytics_events(user_id, created_at);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own analytics events
CREATE POLICY "Users can view their own analytics" ON public.analytics_events
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone can insert analytics events (for tracking anonymous visitors)
CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

-- Create integrations settings table
CREATE TABLE IF NOT EXISTS public.user_integrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  integration_id text NOT NULL,
  is_enabled boolean DEFAULT true,
  settings jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, integration_id)
);

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own integrations" ON public.user_integrations
  FOR ALL USING (auth.uid() = user_id);
