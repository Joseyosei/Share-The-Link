-- Add AI Agent fields to profiles table for Make.com/n8n integration
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS webhook_settings JSONB DEFAULT '{}'::jsonb;

-- Index on api_key for fast lookups from webhook endpoints
CREATE INDEX IF NOT EXISTS idx_profiles_api_key ON profiles (api_key) WHERE api_key IS NOT NULL;

-- RLS: users can only read/update their own api_key and webhook_settings
-- (existing RLS policies on profiles table should already handle this)
