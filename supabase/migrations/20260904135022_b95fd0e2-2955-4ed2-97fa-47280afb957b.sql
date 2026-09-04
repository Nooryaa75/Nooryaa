DROP FUNCTION IF EXISTS public.delete_own_account(uuid);

CREATE OR REPLACE FUNCTION public.delete_own_account(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF delete_own_account.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required' USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.photos p WHERE p.user_id = delete_own_account.user_id;
  DELETE FROM public.messages m WHERE m.sender = delete_own_account.user_id OR m.receiver = delete_own_account.user_id;
  DELETE FROM public.likes l WHERE l.from_user = delete_own_account.user_id OR l.to_user = delete_own_account.user_id;
  DELETE FROM public.blocks b WHERE b.blocker = delete_own_account.user_id OR b.blocked = delete_own_account.user_id;
  DELETE FROM public.reports r WHERE r.reporter = delete_own_account.user_id OR r.reported = delete_own_account.user_id;
  DELETE FROM public.saved_searches s WHERE s.user_id = delete_own_account.user_id;
  DELETE FROM public.conversation_hides c WHERE c.user_id = delete_own_account.user_id OR c.peer_id = delete_own_account.user_id;
  DELETE FROM public.profile_passes pp WHERE pp.user_id = delete_own_account.user_id OR pp.target_id = delete_own_account.user_id;
  DELETE FROM public.moderation_events me WHERE me.user_id = delete_own_account.user_id OR me.target_user = delete_own_account.user_id;
  DELETE FROM public.admin_actions a WHERE a.target_user = delete_own_account.user_id;
  DELETE FROM public.notifications n WHERE n.user_id = delete_own_account.user_id OR n.actor_id = delete_own_account.user_id;
  DELETE FROM public.email_notifications e WHERE e.user_id = delete_own_account.user_id OR e.actor_id = delete_own_account.user_id;
  DELETE FROM public.credit_events ce WHERE ce.user_id = delete_own_account.user_id;
  DELETE FROM public.user_credits uc WHERE uc.user_id = delete_own_account.user_id;
  DELETE FROM public.subscriptions s2 WHERE s2.user_id = delete_own_account.user_id;
  DELETE FROM public.ticket_replies tr WHERE tr.author_id = delete_own_account.user_id;
  DELETE FROM public.support_tickets st WHERE st.user_id = delete_own_account.user_id;
  DELETE FROM public.contact_messages cm WHERE cm.user_id = delete_own_account.user_id;
  DELETE FROM public.user_roles ur WHERE ur.user_id = delete_own_account.user_id;
  DELETE FROM public.profiles pr WHERE pr.id = delete_own_account.user_id;
  DELETE FROM auth.users au WHERE au.id = delete_own_account.user_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.delete_own_account(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_own_account(uuid) TO service_role;

NOTIFY pgrst, 'reload schema';