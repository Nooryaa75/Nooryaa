ALTER TABLE public.moderation_events ADD COLUMN IF NOT EXISTS media_bucket text;
ALTER TABLE public.moderation_events ADD COLUMN IF NOT EXISTS media_path text;
COMMENT ON COLUMN public.moderation_events.media_path IS 'Private storage path of the checked photo, selfie or voice message, viewable only by admins.';