CREATE TABLE public.app_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL UNIQUE CHECK (platform IN ('ios','android')),
  version text NOT NULL DEFAULT '',
  min_version text NOT NULL DEFAULT '',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_versions TO anon;
GRANT SELECT ON public.app_versions TO authenticated;
GRANT ALL ON public.app_versions TO service_role;

ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App versions are public" ON public.app_versions FOR SELECT USING (true);

CREATE TRIGGER app_versions_set_updated_at BEFORE UPDATE ON public.app_versions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.app_versions (platform, version, min_version) VALUES ('ios', '', ''), ('android', '', '');