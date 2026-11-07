-- Limite quotidienne de likes : 5 par jour (jour calendaire de Paris) pour tout le monde
-- tant que l'abonnement ne donne pas « Likes illimités » (et seulement si les abonnements sont en ligne).
CREATE OR REPLACE FUNCTION public.daily_like_limit(_user uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN COALESCE((SELECT value FROM public.site_settings WHERE key = 'subscriptions_enabled') = 'true'::jsonb, false)
     AND EXISTS (
       SELECT 1
       FROM public.subscriptions s
       JOIN public.plans p ON p.code = s.plan_code
       WHERE s.user_id = _user
         AND s.status = 'active'
         AND (s.ends_at IS NULL OR s.ends_at > now())
         AND COALESCE((p.access ->> 'unlimited_likes')::boolean, false)
     )
    THEN -1
    ELSE 5
  END
$$;

CREATE OR REPLACE FUNCTION public.likes_used_today(_user uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM public.likes
  WHERE from_user = _user
    AND created_at >= (date_trunc('day', now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris')
$$;

-- Likes restants aujourd'hui pour le membre connecté (-1 = illimité).
CREATE OR REPLACE FUNCTION public.my_likes_remaining_today()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN 0
    WHEN public.daily_like_limit(auth.uid()) < 0 THEN -1
    ELSE GREATEST(0, public.daily_like_limit(auth.uid()) - public.likes_used_today(auth.uid()))
  END
$$;

REVOKE ALL ON FUNCTION public.daily_like_limit(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.likes_used_today(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_likes_remaining_today() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_likes_remaining_today() TO authenticated;
GRANT EXECUTE ON FUNCTION public.daily_like_limit(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.likes_used_today(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.enforce_daily_like_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lim integer;
BEGIN
  lim := public.daily_like_limit(NEW.from_user);
  IF lim >= 0 AND public.likes_used_today(NEW.from_user) >= lim THEN
    RAISE EXCEPTION 'LIKE_LIMIT_REACHED' USING ERRCODE = 'P0001', HINT = lim::text;
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS likes_daily_limit ON public.likes;
CREATE TRIGGER likes_daily_limit
BEFORE INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.enforce_daily_like_limit();

-- La discussion n'est possible qu'entre deux membres qui se sont likés mutuellement (match).
CREATE OR REPLACE FUNCTION public.can_message(_sender uuid, _receiver uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.likes WHERE from_user = _sender AND to_user = _receiver)
     AND EXISTS (SELECT 1 FROM public.likes WHERE from_user = _receiver AND to_user = _sender)
$$;