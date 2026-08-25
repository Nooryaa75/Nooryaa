ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS hidden_for uuid[] NOT NULL DEFAULT '{}';

DROP POLICY IF EXISTS "Users update own sent messages" ON public.messages;
CREATE POLICY "Users update own sent messages"
ON public.messages FOR UPDATE TO authenticated
USING (sender = auth.uid())
WITH CHECK (sender = auth.uid());

DROP POLICY IF EXISTS "Users delete own sent messages" ON public.messages;
CREATE POLICY "Users delete own sent messages"
ON public.messages FOR DELETE TO authenticated
USING (sender = auth.uid());