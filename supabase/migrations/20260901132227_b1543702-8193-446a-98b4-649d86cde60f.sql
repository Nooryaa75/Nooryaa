ALTER TABLE public.saved_searches
  ADD COLUMN IF NOT EXISTS last_notified_at timestamptz NOT NULL DEFAULT now();

UPDATE public.saved_searches
  SET last_notified_at = now()
  WHERE last_notified_at IS NULL;
