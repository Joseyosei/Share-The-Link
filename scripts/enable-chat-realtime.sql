-- Enable realtime for stream_chat (ignore if already enabled)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE stream_chat;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- already added
END;
$$;
