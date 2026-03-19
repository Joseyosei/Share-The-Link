-- Create user_videos table for storing uploaded short videos (0-3 minutes)
-- Separate from stream_recordings which are from live streams

CREATE TABLE IF NOT EXISTS user_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER DEFAULT 0, -- in seconds, max 180 (3 minutes)
  file_size INTEGER, -- in bytes
  mime_type TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  view_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ready' CHECK (status IN ('processing', 'ready', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_videos_user_id ON user_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_videos_visibility ON user_videos(visibility);
CREATE INDEX IF NOT EXISTS idx_user_videos_created_at ON user_videos(created_at DESC);

-- Enable RLS
ALTER TABLE user_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own videos
CREATE POLICY "Users can view their own videos" 
  ON user_videos FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own videos
CREATE POLICY "Users can insert their own videos" 
  ON user_videos FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own videos
CREATE POLICY "Users can update their own videos" 
  ON user_videos FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own videos
CREATE POLICY "Users can delete their own videos" 
  ON user_videos FOR DELETE 
  USING (auth.uid() = user_id);

-- Anyone can view public videos
CREATE POLICY "Anyone can view public videos" 
  ON user_videos FOR SELECT 
  USING (visibility = 'public');

-- Anyone can view unlisted videos (they need the direct link)
CREATE POLICY "Anyone can view unlisted videos" 
  ON user_videos FOR SELECT 
  USING (visibility = 'unlisted');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_videos_updated_at
  BEFORE UPDATE ON user_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_user_videos_updated_at();
