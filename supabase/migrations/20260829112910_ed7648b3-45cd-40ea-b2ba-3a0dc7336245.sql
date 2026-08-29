ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS audio_path text, ADD COLUMN IF NOT EXISTS audio_duration smallint;

CREATE POLICY "msg audio read auth" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'message-audio');
CREATE POLICY "msg audio insert own folder" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'message-audio' AND (storage.foldername(name))[1] = (auth.uid())::text);
CREATE POLICY "msg audio delete own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'message-audio' AND (storage.foldername(name))[1] = (auth.uid())::text);