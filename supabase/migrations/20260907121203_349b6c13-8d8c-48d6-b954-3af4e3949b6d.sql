INSERT INTO public.social_links (network, label, url, active, sort_order)
VALUES
  ('appstore', 'App Store', '', true, 10),
  ('googleplay', 'Google Play', '', true, 11)
ON CONFLICT DO NOTHING;