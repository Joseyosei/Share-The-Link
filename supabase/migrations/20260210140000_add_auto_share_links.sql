-- ==============================================
-- AUTO-SHARE LINKS TABLE
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
