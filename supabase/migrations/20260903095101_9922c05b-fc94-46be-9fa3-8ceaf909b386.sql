CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,
  actor_id UUID,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.email_notifications TO authenticated;
GRANT ALL ON public.email_notifications TO service_role;

ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own email notifications" ON public.email_notifications;
CREATE POLICY "Users read own email notifications"
ON public.email_notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_email_notif_user_kind_created
ON public.email_notifications (user_id, kind, created_at DESC);