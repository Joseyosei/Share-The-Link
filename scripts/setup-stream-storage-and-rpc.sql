-- Create stream-recordings storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stream-recordings',
  'stream-recordings',
  true,
  524288000,
  ARRAY['video/webm', 'video/mp4', 'video/x-matroska']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the storage bucket (drop first to avoid duplicates)
DROP POLICY IF EXISTS "Users can upload their own recordings" ON storage.objects;
CREATE POLICY "Users can upload their own recordings"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'stream-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own recordings" ON storage.objects;
CREATE POLICY "Users can update their own recordings"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'stream-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own recordings" ON storage.objects;
CREATE POLICY "Users can delete their own recordings"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'stream-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Anyone can view stream recordings" ON storage.objects;
CREATE POLICY "Anyone can view stream recordings"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'stream-recordings');

-- Create the increment_stream_tips RPC function
CREATE OR REPLACE FUNCTION public.increment_stream_tips(p_stream_id uuid, p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE streams
  SET total_tips = COALESCE(total_tips, 0) + p_amount,
      updated_at = NOW()
  WHERE id = p_stream_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.increment_stream_tips(uuid, numeric) TO authenticated;
