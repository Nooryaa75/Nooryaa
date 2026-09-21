CREATE TABLE public.legal_documents (
  document_key text PRIMARY KEY CHECK (document_key IN ('terms', 'privacy')),
  published_content jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
  published_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.legal_documents TO anon;
GRANT SELECT ON public.legal_documents TO authenticated;
GRANT ALL ON public.legal_documents TO service_role;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published legal documents are public"
ON public.legal_documents FOR SELECT TO anon, authenticated USING (version > 0);

CREATE TABLE public.legal_document_drafts (
  document_key text PRIMARY KEY CHECK (document_key IN ('terms', 'privacy')),
  draft_content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.legal_document_drafts TO service_role;
ALTER TABLE public.legal_document_drafts ENABLE ROW LEVEL SECURITY;