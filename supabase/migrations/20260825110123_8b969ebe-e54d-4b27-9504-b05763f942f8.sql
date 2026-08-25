CREATE TABLE public.conversation_hides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  peer_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, peer_id),
  CHECK (user_id <> peer_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_hides TO authenticated;
GRANT ALL ON public.conversation_hides TO service_role;

ALTER TABLE public.conversation_hides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their hidden conversations"
ON public.conversation_hides FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE INDEX conversation_hides_user_peer_idx ON public.conversation_hides(user_id, peer_id);