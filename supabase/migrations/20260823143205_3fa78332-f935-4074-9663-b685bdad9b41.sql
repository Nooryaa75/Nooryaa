ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_children boolean,
  ADD COLUMN IF NOT EXISTS children_count smallint,
  ADD COLUMN IF NOT EXISTS wants_children boolean;