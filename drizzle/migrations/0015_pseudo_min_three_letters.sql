CREATE OR REPLACE FUNCTION public.enforce_pseudo_min_letters()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Un pseudo choisi (hors pseudo provisoire user_…) doit contenir au moins 3 lettres.
  IF NEW.pseudo IS DISTINCT FROM OLD.pseudo
     AND NEW.pseudo IS NOT NULL
     AND NEW.pseudo NOT LIKE 'user\_%'
     AND length(regexp_replace(NEW.pseudo, '[^[:alpha:]]', '', 'g')) < 3 THEN
    RAISE EXCEPTION 'Le pseudo doit contenir au moins 3 lettres.' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_pseudo_min_letters ON public.profiles;
CREATE TRIGGER profiles_pseudo_min_letters
BEFORE UPDATE OF pseudo ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_pseudo_min_letters();