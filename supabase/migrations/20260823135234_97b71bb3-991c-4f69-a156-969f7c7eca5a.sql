ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS identity_key text
  GENERATED ALWAYS AS (
    lower(btrim(email)) || '|' ||
    regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') || '|' ||
    lower(btrim(coalesce(first_name, ''))) || '|' ||
    lower(btrim(coalesce(last_name, '')))
  ) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_identity_key_uidx
  ON public.profiles (identity_key)
  WHERE first_name IS NOT NULL AND last_name IS NOT NULL AND phone IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_lower_uidx
  ON public.profiles (lower(btrim(email)));

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_digits_uidx
  ON public.profiles ((regexp_replace(phone, '[^0-9]', '', 'g')))
  WHERE phone IS NOT NULL AND btrim(phone) <> '';

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
  INSERT INTO public.profiles (id, email, pseudo, phone, first_name, last_name, onboarded)
  VALUES (NEW.id, NEW.email, new_pseudo, meta_phone, meta_first, meta_last, FALSE)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $function$;