DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact" ON public.contact_messages
FOR INSERT TO anon, authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND read = false
  AND char_length(btrim(name)) BETWEEN 1 AND 200
  AND char_length(btrim(email)) BETWEEN 3 AND 320
  AND char_length(btrim(message)) BETWEEN 1 AND 5000
  AND (subject IS NULL OR char_length(subject) <= 300)
);