CREATE TABLE public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  accepted boolean NOT NULL DEFAULT true,
  document_version integer,
  locale text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX user_consents_user_idx ON public.user_consents(user_id, kind, created_at DESC);

GRANT SELECT, INSERT ON public.user_consents TO authenticated;
GRANT ALL ON public.user_consents TO service_role;

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own consents"
ON public.user_consents FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users insert own consents"
ON public.user_consents FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins read all consents"
ON public.user_consents FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
