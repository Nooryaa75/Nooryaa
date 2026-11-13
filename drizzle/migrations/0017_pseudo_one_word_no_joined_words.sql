CREATE OR REPLACE FUNCTION public.enforce_pseudo_min_letters()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  msg constant text := 'Le pseudo doit être un seul mot, sans espace ni tiret, avec au moins 3 lettres et éventuellement des chiffres à la fin (ex. Amina92), 20 caractères maximum.';
BEGIN
  -- Un pseudo choisi (hors pseudo provisoire user_…) : un seul mot fait de
  -- lettres et chiffres ; « _ », « - » ou « . » uniquement devant des chiffres
  -- finaux ; au moins 3 lettres ; 20 caractères au maximum (voyelles arabes exclues).
  IF NEW.pseudo IS DISTINCT FROM OLD.pseudo
     AND NEW.pseudo IS NOT NULL
     AND NEW.pseudo NOT LIKE 'user\_%' THEN
    IF btrim(NEW.pseudo) !~ '^[[:alpha:][:digit:]\u064B-\u065F\u0670]+([-_.][[:digit:]]+)?$' THEN
      RAISE EXCEPTION '%', msg USING ERRCODE = 'check_violation';
    END IF;
    IF length(regexp_replace(NEW.pseudo, '[^[:alpha:]]', '', 'g')) < 3 THEN
      RAISE EXCEPTION '%', msg USING ERRCODE = 'check_violation';
    END IF;
    IF length(regexp_replace(btrim(NEW.pseudo), '[\u064B-\u065F\u0670]', '', 'g')) > 20 THEN
      RAISE EXCEPTION '%', msg USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;