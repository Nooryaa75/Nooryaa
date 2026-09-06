CREATE TABLE public.section_archives (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section text NOT NULL,
  label text NOT NULL,
  row_count integer NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '[]'::jsonb,
  note text,
  created_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.section_archives TO service_role;

ALTER TABLE public.section_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client access to archives"
ON public.section_archives
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX section_archives_section_idx ON public.section_archives (section, created_at DESC);