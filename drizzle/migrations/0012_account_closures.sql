CREATE TABLE public.account_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  reason text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.account_closures TO service_role;
ALTER TABLE public.account_closures ENABLE ROW LEVEL SECURITY;
CREATE INDEX account_closures_created_idx ON public.account_closures (created_at DESC);