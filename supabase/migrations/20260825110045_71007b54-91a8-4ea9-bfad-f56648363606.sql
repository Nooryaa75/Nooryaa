DROP FUNCTION IF EXISTS public.hide_conversation(uuid);

DROP POLICY IF EXISTS "Users update own sent messages" ON public.messages;
CREATE POLICY "Users can update conversation messages"
ON public.messages FOR UPDATE TO authenticated
USING (sender = auth.uid() OR receiver = auth.uid())
WITH CHECK (sender = auth.uid() OR receiver = auth.uid());