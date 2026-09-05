ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_content_or_image;
ALTER TABLE public.messages ADD CONSTRAINT messages_content_or_image CHECK (deleted_at IS NOT NULL OR content IS NOT NULL OR image_path IS NOT NULL OR audio_path IS NOT NULL);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_pseudo TEXT;
  meta_phone TEXT;
  meta_first TEXT;
  meta_last TEXT;
BEGIN
  new_pseudo := 'user_' || substr(replace(NEW.id::text, '-', ''), 1, 10);
  meta_phone := NULLIF(btrim(NEW.raw_user_meta_data->>'phone'), '');
  meta_first := NULLIF(btrim(NEW.raw_user_meta_data->>'first_name'), '');
  meta_last  := NULLIF(btrim(NEW.raw_user_meta_data->>'last_name'), '');

  BEGIN
    INSERT INTO public.profiles (id, email, pseudo, phone, first_name, last_name, onboarded)
    VALUES (NEW.id, NEW.email, new_pseudo, meta_phone, meta_first, meta_last, FALSE)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN unique_violation THEN
    -- Numéro de téléphone (ou identité) déjà utilisé : on crée quand même le
    -- compte, sans le numéro, pour éviter une erreur serveur à l'inscription.
    INSERT INTO public.profiles (id, email, pseudo, phone, first_name, last_name, onboarded)
    VALUES (NEW.id, NEW.email, new_pseudo, NULL, meta_first, meta_last, FALSE)
    ON CONFLICT (id) DO NOTHING;
  END;

  RETURN NEW;
END $function$;