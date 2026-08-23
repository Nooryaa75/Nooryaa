CREATE TABLE public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_user uuid references public.profiles(id) on delete set null,
  content text not null,
  verdict text not null,
  categories text[] not null default '{}',
  reason text,
  source text not null default 'message',
  created_at timestamptz not null default now()
);
GRANT ALL ON public.moderation_events TO service_role;
ALTER TABLE public.moderation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no client access" ON public.moderation_events FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE INDEX moderation_events_user_idx ON public.moderation_events(user_id, created_at DESC);