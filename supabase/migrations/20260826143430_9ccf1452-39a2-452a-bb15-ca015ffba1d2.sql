ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS photo_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS photo_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS photo_verification_status TEXT NOT NULL DEFAULT 'none';