ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS smoker boolean;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;