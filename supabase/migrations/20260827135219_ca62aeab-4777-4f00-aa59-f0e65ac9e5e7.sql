CREATE OR REPLACE FUNCTION public.delete_own_account(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.photos WHERE user_id = delete_own_account.user_id;
  DELETE FROM public.messages WHERE sender = delete_own_account.user_id OR receiver = delete_own_account.user_id;
  DELETE FROM public.likes WHERE from_user = delete_own_account.user_id OR to_user = delete_own_account.user_id;
  DELETE FROM public.blocks WHERE blocker = delete_own_account.user_id OR blocked = delete_own_account.user_id;
  DELETE FROM public.reports WHERE reporter = delete_own_account.user_id OR reported = delete_own_account.user_id;
  DELETE FROM public.saved_searches WHERE user_id = delete_own_account.user_id;
  DELETE FROM public.conversation_hides WHERE user_id = delete_own_account.user_id OR peer_id = delete_own_account.user_id;
  DELETE FROM public.profile_passes WHERE user_id = delete_own_account.user_id OR target_id = delete_own_account.user_id;
  DELETE FROM public.moderation_events WHERE user_id = delete_own_account.user_id OR target_user = delete_own_account.user_id;
  DELETE FROM public.admin_actions WHERE target_user = delete_own_account.user_id;
  DELETE FROM public.profiles WHERE id = delete_own_account.user_id;
  DELETE FROM auth.users WHERE id = delete_own_account.user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_account(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_own_account(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.delete_own_account(uuid) TO service_role;
