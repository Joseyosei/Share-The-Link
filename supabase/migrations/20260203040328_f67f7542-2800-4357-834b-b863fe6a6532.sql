-- =============================================
-- LIVE STREAMING TABLES
-- =============================================

-- Streams table
CREATE TABLE public.streams (
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

-- Stream viewers tracking
CREATE TABLE public.stream_viewers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.streams(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewer_name TEXT,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  watch_duration INTEGER DEFAULT 0
);

-- Stream tips (with 90/10 split)
CREATE TABLE public.stream_tips (
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

-- Stream chat messages
CREATE TABLE public.stream_chat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.streams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'message' CHECK (message_type IN ('message', 'tip', 'system')),
  is_highlighted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- AI PAGE BUILDER TABLES
-- =============================================

-- AI generation history
CREATE TABLE public.ai_generations (
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

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STREAMS POLICIES
-- =============================================

-- Anyone can view live streams
CREATE POLICY "Anyone can view live streams"
  ON public.streams FOR SELECT
  USING (status = 'live' OR status = 'ended');

-- Users can view their own streams
CREATE POLICY "Users can view their own streams"
  ON public.streams FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own streams
CREATE POLICY "Users can create their own streams"
  ON public.streams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own streams
CREATE POLICY "Users can update their own streams"
  ON public.streams FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own streams
CREATE POLICY "Users can delete their own streams"
  ON public.streams FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- STREAM VIEWERS POLICIES
-- =============================================

-- Anyone can join as a viewer
CREATE POLICY "Anyone can join as viewer"
  ON public.stream_viewers FOR INSERT
  WITH CHECK (true);

-- Stream owners can view their viewers
CREATE POLICY "Stream owners can view their viewers"
  ON public.stream_viewers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.streams s 
      WHERE s.id = stream_id AND s.user_id = auth.uid()
    )
  );

-- Anyone can update their own viewer record
CREATE POLICY "Viewers can update their own record"
  ON public.stream_viewers FOR UPDATE
  USING (viewer_id = auth.uid() OR viewer_id IS NULL);

-- =============================================
-- STREAM TIPS POLICIES
-- =============================================

-- Anyone can send tips
CREATE POLICY "Anyone can send tips"
  ON public.stream_tips FOR INSERT
  WITH CHECK (true);

-- Stream owners can view their tips
CREATE POLICY "Stream owners can view their tips"
  ON public.stream_tips FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.streams s 
      WHERE s.id = stream_id AND s.user_id = auth.uid()
    )
    OR tipper_id = auth.uid()
  );

-- =============================================
-- STREAM CHAT POLICIES
-- =============================================

-- Anyone can view chat in live streams
CREATE POLICY "Anyone can view stream chat"
  ON public.stream_chat FOR SELECT
  USING (true);

-- Authenticated users can send chat messages
CREATE POLICY "Authenticated users can chat"
  ON public.stream_chat FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- AI GENERATIONS POLICIES
-- =============================================

-- Users can view their own AI generations
CREATE POLICY "Users can view their own AI generations"
  ON public.ai_generations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own AI generations
CREATE POLICY "Users can create their own AI generations"
  ON public.ai_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own AI generations
CREATE POLICY "Users can update their own AI generations"
  ON public.ai_generations FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- ENABLE REALTIME FOR CHAT
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE public.streams;

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_streams_updated_at
  BEFORE UPDATE ON public.streams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_streams_user_id ON public.streams(user_id);
CREATE INDEX idx_streams_status ON public.streams(status);
CREATE INDEX idx_stream_chat_stream_id ON public.stream_chat(stream_id);
CREATE INDEX idx_stream_tips_stream_id ON public.stream_tips(stream_id);
CREATE INDEX idx_stream_viewers_stream_id ON public.stream_viewers(stream_id);
CREATE INDEX idx_ai_generations_user_id ON public.ai_generations(user_id);