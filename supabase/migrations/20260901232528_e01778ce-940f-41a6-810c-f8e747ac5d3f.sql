CREATE TABLE public.social_links (
  id uuid primary key default gen_random_uuid(),
  network text not null unique,
  label text not null,
  url text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT ON public.social_links TO anon;
GRANT SELECT ON public.social_links TO authenticated;
GRANT ALL ON public.social_links TO service_role;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_links_public_read" ON public.social_links FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.social_links (network, label, url, active, sort_order) VALUES
 ('facebook','Facebook','https://www.facebook.com/', true, 1),
 ('instagram','Instagram','https://www.instagram.com/', true, 2),
 ('tiktok','TikTok','https://www.tiktok.com/', true, 3),
 ('snapchat','Snapchat','https://www.snapchat.com/', true, 4);