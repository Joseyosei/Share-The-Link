-- Add INSERT policy for streams table so users can create their own streams
CREATE POLICY "Users can insert their own streams"
ON public.streams
FOR INSERT
WITH CHECK (auth.uid() = user_id);