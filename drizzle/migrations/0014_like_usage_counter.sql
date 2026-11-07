-- Compteur quotidien des likes envoyés : retirer un like ne rend pas le like du jour.
CREATE TABLE IF NOT EXISTS public.like_usage (
  user_id uuid NOT NULL,
  day date NOT NULL,
  used integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
GRANT SELECT ON public.like_usage TO authenticated;
GRANT ALL ON public.like_usage TO service_role;
ALTER TABLE public.like_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own like usage" ON public.like_usage
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Reprend les likes déjà envoyés aujourd'hui.
INSERT INTO public.like_usage (user_id, day, used)
SELECT from_user, (now() AT TIME ZONE 'Europe/Paris')::date, count(*)
FROM public.likes
WHERE created_at >= (date_trunc('day', now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris')
GROUP BY from_user
ON CONFLICT (user_id, day) DO NOTHING;

CREATE OR REPLACE FUNCTION public.likes_used_today(_user uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT used FROM public.like_usage
    WHERE user_id = _user AND day = (now() AT TIME ZONE 'Europe/Paris')::date
  ), 0)
$$;

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
  INSERT INTO public.like_usage (user_id, day, used)
  VALUES (NEW.from_user, (now() AT TIME ZONE 'Europe/Paris')::date, 1)
  ON CONFLICT (user_id, day) DO UPDATE SET used = public.like_usage.used + 1;
  RETURN NEW;
END
$$;