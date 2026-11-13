ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_removed_at timestamptz;
COMMENT ON COLUMN public.profiles.photo_removed_at IS 'Set when a validated member removes their last photo: account becomes not validated until a new photo and a new selfie are accepted.';

CREATE OR REPLACE FUNCTION public.protect_profile_verification()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() = NEW.id
     AND coalesce(current_setting('nooryaa.photo_rule', true), '') <> 'on'
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.photo_removed_at := OLD.photo_removed_at;
    NEW.photo_verified := OLD.photo_verified;
    NEW.photo_verified_at := OLD.photo_verified_at;
    NEW.photo_verification_status := OLD.photo_verification_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_verification ON public.profiles;
CREATE TRIGGER profiles_protect_verification
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_verification();

CREATE OR REPLACE FUNCTION public.mark_profile_photo_removed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.photos WHERE user_id = OLD.user_id) THEN
    PERFORM set_config('nooryaa.photo_rule', 'on', true);
    UPDATE public.profiles
       SET photo_removed_at = now(),
           photo_verified = false,
           photo_verified_at = NULL,
           photo_verification_status = 'photo_removed',
           primary_photo_url = NULL,
           primary_photo_blurred = false
     WHERE id = OLD.user_id
       AND onboarded = true
       AND photo_removed_at IS NULL;
    PERFORM set_config('nooryaa.photo_rule', 'off', true);
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_photo_removed ON public.photos;
CREATE TRIGGER trg_photo_removed
AFTER DELETE ON public.photos
FOR EACH ROW EXECUTE FUNCTION public.mark_profile_photo_removed();