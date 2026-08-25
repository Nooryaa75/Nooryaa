CREATE OR REPLACE FUNCTION public.can_message(_sender uuid, _receiver uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN (SELECT gender FROM public.profiles WHERE id = _sender) = 'homme'
     AND (SELECT gender FROM public.profiles WHERE id = _receiver) = 'femme'
    THEN EXISTS (SELECT 1 FROM public.likes WHERE from_user = _receiver AND to_user = _sender)
    ELSE true
  END
$$;

REVOKE ALL ON FUNCTION public.can_message(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_message(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Users send messages" ON public.messages;
DROP POLICY IF EXISTS "users can send messages if not blocked" ON public.messages;

CREATE POLICY "users can send messages if allowed"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender
  AND NOT public.is_blocked_between(sender, receiver)
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = messages.receiver AND status = 'active')
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = messages.sender AND status = 'active')
  AND public.can_message(sender, receiver)
);