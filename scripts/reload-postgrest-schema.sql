-- Reload PostgREST schema cache so it can see the auto_share_links table
NOTIFY pgrst, 'reload schema';

-- Verify the table exists
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'auto_share_links';
