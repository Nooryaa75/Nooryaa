-- Présence
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen timestamptz NOT NULL DEFAULT now();

-- Formules
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text,
  duration_days integer NOT NULL DEFAULT 30,
  price_ttc numeric(10,2) NOT NULL DEFAULT 0,
  vat_rate numeric(5,2) NOT NULL DEFAULT 20,
  likes_per_day integer NOT NULL DEFAULT 10,
  super_likes integer NOT NULL DEFAULT 0,
  boosts integer NOT NULL DEFAULT 0,
  features text[] NOT NULL DEFAULT '{}',
  highlight boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO anon;
GRANT SELECT ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read active plans" ON public.plans;
CREATE POLICY "Anyone can read active plans" ON public.plans FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "Admins manage plans" ON public.plans;
CREATE POLICY "Admins manage plans" ON public.plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS trg_plans_updated_at ON public.plans;
CREATE TRIGGER trg_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Abonnements
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_code text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  amount_ttc numeric(10,2) NOT NULL DEFAULT 0,
  vat_rate numeric(5,2) NOT NULL DEFAULT 20,
  payment_method text NOT NULL DEFAULT 'manuel',
  auto_renew boolean NOT NULL DEFAULT true,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created ON public.subscriptions(created_at);
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own subscriptions" ON public.subscriptions;
CREATE POLICY "Users see own subscriptions" ON public.subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users create own subscriptions" ON public.subscriptions;
CREATE POLICY "Users create own subscriptions" ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users update own subscriptions" ON public.subscriptions;
CREATE POLICY "Users update own subscriptions" ON public.subscriptions FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Crédits
CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  likes_balance integer NOT NULL DEFAULT 10,
  super_likes integer NOT NULL DEFAULT 0,
  boosts integer NOT NULL DEFAULT 0,
  likes_used_today integer NOT NULL DEFAULT 0,
  reset_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_credits TO authenticated;
GRANT ALL ON public.user_credits TO service_role;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own credits" ON public.user_credits;
CREATE POLICY "Users see own credits" ON public.user_credits FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.credit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL,
  amount integer NOT NULL,
  reason text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_events_user ON public.credit_events(user_id, created_at DESC);
GRANT SELECT ON public.credit_events TO authenticated;
GRANT ALL ON public.credit_events TO service_role;
ALTER TABLE public.credit_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users see own credit events" ON public.credit_events;
CREATE POLICY "Users see own credit events" ON public.credit_events FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Support
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal';
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS assigned_to text;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS last_reply_at timestamptz;
DROP POLICY IF EXISTS "Admins view all tickets" ON public.support_tickets;
CREATE POLICY "Admins view all tickets" ON public.support_tickets FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins update tickets" ON public.support_tickets;
CREATE POLICY "Admins update tickets" ON public.support_tickets FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.ticket_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author text NOT NULL DEFAULT 'admin',
  author_id uuid,
  content text NOT NULL,
  internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket ON public.ticket_replies(ticket_id, created_at);
GRANT SELECT, INSERT ON public.ticket_replies TO authenticated;
GRANT ALL ON public.ticket_replies TO service_role;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ticket owner reads replies" ON public.ticket_replies;
CREATE POLICY "Ticket owner reads replies" ON public.ticket_replies FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (internal = false AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()))
  );
DROP POLICY IF EXISTS "Ticket owner writes replies" ON public.ticket_replies;
CREATE POLICY "Ticket owner writes replies" ON public.ticket_replies FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (internal = false AND author_id = auth.uid()
        AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()))
  );

-- Formules par défaut
INSERT INTO public.plans (code, name, tagline, duration_days, price_ttc, likes_per_day, super_likes, boosts, features, highlight, sort_order)
VALUES
  ('gratuit', 'Gratuit', 'Découvrir Nooryaa', 0, 0, 10, 0, 0, ARRAY['10 likes par jour','Messagerie limitée','Profil vérifié'], false, 0),
  ('24h', 'Pass 24H', 'Boost express', 1, 4.99, 50, 1, 1, ARRAY['50 likes','1 super like','1 boost 24h'], false, 1),
  ('essentiel', 'Essentiel', 'Pour aller à l''essentiel', 30, 19.99, 50, 3, 1, ARRAY['50 likes par jour','3 super likes','1 boost par mois'], false, 2),
  ('noor', 'Noor', 'La formule la plus choisie', 30, 29.99, 200, 10, 4, ARRAY['200 likes par jour','10 super likes','4 boosts par mois','Voir qui vous a liké'], true, 3),
  ('aya', 'Aya+', 'L''expérience complète', 30, 49.99, 9999, 30, 12, ARRAY['Likes illimités','30 super likes','12 boosts','Mise en avant permanente','Support prioritaire'], false, 4)
ON CONFLICT (code) DO NOTHING;