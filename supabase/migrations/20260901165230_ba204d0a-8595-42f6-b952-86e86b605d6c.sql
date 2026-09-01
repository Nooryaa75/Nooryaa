-- Indexes to support scale on the hottest paths: presence, discovery, finance, matches

-- Online-now checks + admin activity (heartbeat updates every 2 min)
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles (last_seen DESC);

-- "Les nouvelles inscrites" deck + registration growth analytics
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles (created_at DESC);

-- Geo-discovery prefilter (lat/lng bounding box before Haversine)
CREATE INDEX IF NOT EXISTS idx_profiles_geo ON public.profiles (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Active profile discovery (status filter used across browse/recherche)
CREATE INDEX IF NOT EXISTS idx_profiles_status_gender ON public.profiles (status, gender, created_at DESC);

-- Finance: revenue by period, plan and gender joins
CREATE INDEX IF NOT EXISTS idx_subscriptions_created ON public.subscriptions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions (user_id, status);

-- Match computation (mutual likes, recent first)
CREATE INDEX IF NOT EXISTS idx_likes_created ON public.likes (created_at DESC);

-- Support tickets admin triage
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets (status, last_reply_at DESC);

-- Moderation realtime alerts
CREATE INDEX IF NOT EXISTS idx_moderation_events_created ON public.moderation_events (created_at DESC);

-- Analytics: message volume per period
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages (created_at DESC);