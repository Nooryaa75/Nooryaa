UPDATE public.profiles SET gender = 'femme', updated_at = now() WHERE email = 'meguetounif@yahoo.fr';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE p.email = 'meguetounif@yahoo.fr'
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'user' FROM public.profiles WHERE email = 'meguetounif@yahoo.fr'
    ON CONFLICT DO NOTHING;
  END IF;
END $$;