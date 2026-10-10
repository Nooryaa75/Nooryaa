CREATE TABLE public.app_version_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL DEFAULT '',
  installed TEXT NOT NULL DEFAULT '',
  outcome TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.app_version_checks TO service_role;
ALTER TABLE public.app_version_checks ENABLE ROW LEVEL SECURITY;