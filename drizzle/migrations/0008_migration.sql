DROP POLICY IF EXISTS "Photos visible to authenticated" ON public.photos;
CREATE POLICY "Photos visible to authenticated" ON public.photos
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR NOT public.is_blocked_between(auth.uid(), user_id)
);