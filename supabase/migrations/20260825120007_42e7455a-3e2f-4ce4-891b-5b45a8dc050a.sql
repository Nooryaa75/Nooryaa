ALTER TABLE public.likes REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_hides REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='likes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='conversation_hides') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_hides;
  END IF;
END $$;