CREATE TABLE public.profile_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_id)
);

GRANT SELECT, INSERT, DELETE ON public.profile_passes TO authenticated;
GRANT ALL ON public.profile_passes TO service_role;

ALTER TABLE public.profile_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own passes"
ON public.profile_passes FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE INDEX profile_passes_user_idx ON public.profile_passes (user_id);