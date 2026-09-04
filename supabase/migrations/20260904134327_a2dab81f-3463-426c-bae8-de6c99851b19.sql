DROP FUNCTION IF EXISTS public.delete_own_account(uuid);

CREATE FUNCTION public.delete_own_account(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.photos WHERE user_id = p_user_id;
  DELETE FROM public.messages WHERE sender = p_user_id OR receiver = p_user_id;
  DELETE FROM public.likes WHERE from_user = p_user_id OR to_user = p_user_id;
  DELETE FROM public.blocks WHERE blocker = p_user_id OR blocked = p_user_id;
  DELETE FROM public.reports WHERE reporter = p_user_id OR reported = p_user_id;
  DELETE FROM public.saved_searches WHERE user_id = p_user_id;
  DELETE FROM public.conversation_hides WHERE user_id = p_user_id OR peer_id = p_user_id;
  DELETE FROM public.profile_passes WHERE user_id = p_user_id OR target_id = p_user_id;
  DELETE FROM public.moderation_events WHERE user_id = p_user_id OR target_user = p_user_id;
  DELETE FROM public.admin_actions WHERE target_user = p_user_id;
  DELETE FROM public.notifications WHERE user_id = p_user_id OR actor_id = p_user_id;
  DELETE FROM public.email_notifications WHERE user_id = p_user_id OR actor_id = p_user_id;
  DELETE FROM public.credit_events WHERE user_id = p_user_id;
  DELETE FROM public.user_credits WHERE user_id = p_user_id;
  DELETE FROM public.subscriptions WHERE user_id = p_user_id;
  DELETE FROM public.ticket_replies WHERE author_id = p_user_id;
  DELETE FROM public.support_tickets WHERE user_id = p_user_id;
  DELETE FROM public.contact_messages WHERE user_id = p_user_id;
  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  DELETE FROM public.profiles WHERE id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$function$;