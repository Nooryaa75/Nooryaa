UPDATE public.profiles SET onboarded = FALSE WHERE onboarded IS TRUE AND gender IS NULL;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_gender_required_when_onboarded
  CHECK (onboarded IS FALSE OR gender IS NOT NULL);