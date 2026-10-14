CREATE OR REPLACE FUNCTION public.register_push_token(_token text, _platform text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR coalesce(_token,'') = '' THEN RETURN; END IF;
  INSERT INTO public.push_tokens(user_id, token, platform, updated_at)
  VALUES (auth.uid(), _token, _platform, now())
  ON CONFLICT (token) DO UPDATE SET user_id = auth.uid(), platform = EXCLUDED.platform, updated_at = now();
END $$;
REVOKE ALL ON FUNCTION public.register_push_token(text,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.register_push_token(text,text) TO authenticated;