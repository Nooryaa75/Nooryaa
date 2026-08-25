CREATE OR REPLACE FUNCTION public.hide_conversation(_peer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.messages
  SET hidden_for = CASE
    WHEN hidden_for @> ARRAY[auth.uid()]::uuid[] THEN hidden_for
    ELSE hidden_for || auth.uid()
  END
  WHERE (sender = auth.uid() AND receiver = _peer_id)
     OR (sender = _peer_id AND receiver = auth.uid());
END;
$$;

REVOKE ALL ON FUNCTION public.hide_conversation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hide_conversation(uuid) TO authenticated;