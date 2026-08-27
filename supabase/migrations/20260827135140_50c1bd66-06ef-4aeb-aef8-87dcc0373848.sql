CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.photos WHERE user_id = uid;
  DELETE FROM public.messages WHERE sender = uid OR receiver = uid;
  DELETE FROM public.likes WHERE from_user = uid OR to_user = uid;
  DELETE FROM public.blocks WHERE blocker = uid OR blocked = uid;
  DELETE FROM public.reports WHERE reporter = uid OR reported = uid;
  DELETE FROM public.saved_searches WHERE user_id = uid;
  DELETE FROM public.conversation_hides WHERE user_id = uid OR peer_id = uid;
  DELETE FROM public.profile_passes WHERE user_id = uid OR target_id = uid;
  DELETE FROM public.moderation_events WHERE user_id = uid OR target_user = uid;
  DELETE FROM public.admin_actions WHERE target_user = uid;
  DELETE FROM public.profiles WHERE id = uid;
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO service_role;
