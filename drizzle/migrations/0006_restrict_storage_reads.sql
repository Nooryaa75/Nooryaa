DROP POLICY IF EXISTS "Public photos read" ON storage.objects;
CREATE POLICY "Profile photos read signed in" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "msg photos read auth" ON storage.objects;
CREATE POLICY "msg photos read participants" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'message-photos' AND (
    (storage.foldername(name))[1] = (select auth.uid())::text
    OR EXISTS (SELECT 1 FROM public.messages m WHERE m.image_path = storage.objects.name AND (m.sender = (select auth.uid()) OR m.receiver = (select auth.uid())))
  ));

DROP POLICY IF EXISTS "msg audio read auth" ON storage.objects;
CREATE POLICY "msg audio read participants" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'message-audio' AND (
    (storage.foldername(name))[1] = (select auth.uid())::text
    OR EXISTS (SELECT 1 FROM public.messages m WHERE m.audio_path = storage.objects.name AND (m.sender = (select auth.uid()) OR m.receiver = (select auth.uid())))
  ));