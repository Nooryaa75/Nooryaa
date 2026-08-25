CREATE OR REPLACE FUNCTION public.can_message(_sender uuid, _receiver uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT CASE
    WHEN (SELECT gender FROM public.profiles WHERE id = _sender) = 'homme'
     AND (SELECT gender FROM public.profiles WHERE id = _receiver) = 'femme'
    THEN EXISTS (SELECT 1 FROM public.likes WHERE from_user = _receiver AND to_user = _sender)
    ELSE true
  END
$$;