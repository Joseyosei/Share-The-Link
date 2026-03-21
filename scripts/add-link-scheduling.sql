-- Add scheduling columns to links table
ALTER TABLE links ADD COLUMN IF NOT EXISTS schedule_start TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE links ADD COLUMN IF NOT EXISTS schedule_end TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE links ADD COLUMN IF NOT EXISTS link_group TEXT DEFAULT NULL;

-- Add background_animation column to appearance_settings
ALTER TABLE appearance_settings ADD COLUMN IF NOT EXISTS background_animation TEXT DEFAULT NULL;

-- Create index for scheduled links
CREATE INDEX IF NOT EXISTS idx_links_schedule ON links (user_id, schedule_start, schedule_end);
CREATE INDEX IF NOT EXISTS idx_links_group ON links (user_id, link_group);
