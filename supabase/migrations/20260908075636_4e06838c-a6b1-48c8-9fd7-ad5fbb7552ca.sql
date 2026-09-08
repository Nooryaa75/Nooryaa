CREATE TABLE public.visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path text NOT NULL,
  referrer text,
  source text NOT NULL DEFAULT 'direct',
  city text,
  region text,
  country text,
  ip_hash text,
  user_agent text,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX visits_created_at_idx ON public.visits (created_at DESC);

GRANT SELECT, DELETE ON public.visits TO authenticated;
GRANT ALL ON public.visits TO service_role;

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read visits" ON public.visits
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete visits" ON public.visits
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));