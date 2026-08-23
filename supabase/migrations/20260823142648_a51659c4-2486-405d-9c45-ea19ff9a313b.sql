ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS salat_quotidienne boolean,
  ADD COLUMN IF NOT EXISTS ramadan boolean,
  ADD COLUMN IF NOT EXISTS hadj boolean,
  ADD COLUMN IF NOT EXISTS omra boolean,
  ADD COLUMN IF NOT EXISTS porte_voile boolean;