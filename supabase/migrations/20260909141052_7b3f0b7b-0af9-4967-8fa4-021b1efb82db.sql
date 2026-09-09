ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'tous',
  ADD COLUMN IF NOT EXISTS emoji text,
  ADD COLUMN IF NOT EXISTS messages_per_day integer NOT NULL DEFAULT -1,
  ADD COLUMN IF NOT EXISTS rewinds integer NOT NULL DEFAULT 0;

ALTER TABLE public.plans DROP CONSTRAINT IF EXISTS plans_audience_check;
ALTER TABLE public.plans ADD CONSTRAINT plans_audience_check CHECK (audience IN ('homme','femme','tous'));

-- Formules existantes : hommes / femmes
UPDATE public.plans SET audience = 'homme', emoji = '🟢', messages_per_day = 5, likes_per_day = 10 WHERE code = 'gratuit';
UPDATE public.plans SET audience = 'homme', emoji = '🌙', likes_per_day = -1, super_likes = 20, boosts = 4, sort_order = 12,
  access = '{"unlimited_likes":true,"advanced_filters":true,"see_likers":true,"incognito":true}'::jsonb,
  features = ARRAY['Likes illimités','Filtres avancés complets','Voir qui a liké le profil','Mode incognito'] WHERE code = 'noor';
UPDATE public.plans SET audience = 'homme', emoji = '✨', likes_per_day = -1, super_likes = 20, boosts = 4, sort_order = 22,
  access = '{"unlimited_likes":true,"advanced_filters":true,"see_likers":true,"incognito":true,"priority":true,"boost":true,"voice_messages":true,"photo_messages":true,"saved_searches":true,"read_receipts":true}'::jsonb,
  features = ARRAY['Toute la formule NOOR','Priorité maximale dans les recherches','Boosts et super likes inclus'] WHERE code = 'aya';
UPDATE public.plans SET audience = 'femme', emoji = '🌸', likes_per_day = -1, sort_order = 40, name = 'NOOR',
  tagline = 'La formule des femmes, tout inclus', highlight = true WHERE code = 'noor_f';

-- Gratuit femmes : plus d'avantages
INSERT INTO public.plans (code, name, tagline, duration_days, price_ttc, vat_rate, likes_per_day, super_likes, boosts, features, highlight, active, sort_order, access, audience, emoji, messages_per_day, rewinds)
SELECT 'gratuit_f', 'Gratuit', 'Pour découvrir Nooryaa', 0, 0, 20, 30, 3, 1,
  ARRAY['30 likes par jour','3 super likes','1 boost offert','Voir qui a liké votre profil','Messages vocaux'],
  false, true, 30,
  '{"see_likers":true,"voice_messages":true,"read_receipts":true}'::jsonb, 'femme', '🌸', -1, 3
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE code = 'gratuit_f');

-- Variantes jour / semaine des formules hommes
INSERT INTO public.plans (code, name, tagline, duration_days, price_ttc, vat_rate, likes_per_day, super_likes, boosts, features, highlight, active, sort_order, access, audience, emoji, messages_per_day, rewinds)
SELECT v.code, v.name, v.tagline, v.duration_days, v.price_ttc, 20, -1, v.super_likes, v.boosts, v.features, v.highlight, true, v.sort_order, v.access::jsonb, 'homme', v.emoji, -1, -1
FROM (VALUES
  ('noor_24h','NOOR','L''essentiel pour aller plus loin',1,2.99,2,1,ARRAY['Likes illimités','Filtres avancés complets','Voir qui a liké le profil','Mode incognito'],true,10,'{"unlimited_likes":true,"advanced_filters":true,"see_likers":true,"incognito":true}','🌙'),
  ('noor_7j','NOOR','L''essentiel pour aller plus loin',7,6.99,10,2,ARRAY['Likes illimités','Filtres avancés complets','Voir qui a liké le profil','Mode incognito'],true,11,'{"unlimited_likes":true,"advanced_filters":true,"see_likers":true,"incognito":true}','🌙'),
  ('aya_24h','AYA','Tout NOOR, et plus encore',1,3.99,2,1,ARRAY['Toute la formule NOOR','Priorité maximale dans les recherches','Boosts et super likes inclus'],false,20,'{"unlimited_likes":true,"advanced_filters":true,"see_likers":true,"incognito":true,"priority":true,"boost":true,"voice_messages":true,"photo_messages":true,"saved_searches":true,"read_receipts":true}','✨'),
  ('aya_7j','AYA','Tout NOOR, et plus encore',7,9.99,10,2,ARRAY['Toute la formule NOOR','Priorité maximale dans les recherches','Boosts et super likes inclus'],false,21,'{"unlimited_likes":true,"advanced_filters":true,"see_likers":true,"incognito":true,"priority":true,"boost":true,"voice_messages":true,"photo_messages":true,"saved_searches":true,"read_receipts":true}','✨')
) AS v(code, name, tagline, duration_days, price_ttc, super_likes, boosts, features, highlight, sort_order, access, emoji)
WHERE NOT EXISTS (SELECT 1 FROM public.plans p WHERE p.code = v.code);

UPDATE public.plans SET name = 'NOOR' WHERE code = 'noor';
UPDATE public.plans SET name = 'AYA' WHERE code = 'aya';