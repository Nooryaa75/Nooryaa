ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wants_children_answer text;

UPDATE public.profiles
SET wants_children_answer = CASE
  WHEN wants_children IS NULL THEN NULL
  WHEN wants_children THEN 'oui'
  ELSE 'non'
END
WHERE wants_children_answer IS NULL;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_wants_children_answer_check
  CHECK (wants_children_answer IS NULL OR wants_children_answer IN ('oui', 'non', 'je_ne_sais_pas'));

COMMENT ON COLUMN public.profiles.wants_children IS 'DEPRECATED: remplacé par wants_children_answer (oui / non / je_ne_sais_pas)';