CREATE TABLE public.conversation_media_cleanup (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 bucket text NOT NULL CHECK (bucket IN ('message-photos','message-audio')),
 path text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(bucket,path)
);
GRANT ALL ON public.conversation_media_cleanup TO service_role;
ALTER TABLE public.conversation_media_cleanup ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.conversation_expired(last_message timestamptz, at_time timestamptz DEFAULT now())
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
 SELECT last_message <= at_time - interval '10 days';
$$;
REVOKE ALL ON FUNCTION public.conversation_expired(timestamptz,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.conversation_expired(timestamptz,timestamptz) TO service_role;

CREATE INDEX IF NOT EXISTS messages_conversation_activity_idx ON public.messages (LEAST(sender,receiver), GREATEST(sender,receiver), created_at DESC);

CREATE OR REPLACE FUNCTION public.purge_inactive_conversations(dry_run boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE deleted_count integer := 0; pair_count integer := 0;
BEGIN
 LOCK TABLE public.messages IN SHARE ROW EXCLUSIVE MODE;
 SELECT count(*) INTO pair_count FROM (
  SELECT least(sender,receiver),greatest(sender,receiver) FROM public.messages
  GROUP BY least(sender,receiver),greatest(sender,receiver)
  HAVING public.conversation_expired(max(created_at),now())
 ) p;
 IF dry_run THEN RETURN jsonb_build_object('conversations',pair_count,'dry_run',true); END IF;
 WITH expired AS (
  SELECT least(sender,receiver) a,greatest(sender,receiver) b FROM public.messages
  GROUP BY least(sender,receiver),greatest(sender,receiver)
  HAVING public.conversation_expired(max(created_at),now())
 ), removed AS (
  DELETE FROM public.messages m USING expired p
  WHERE least(m.sender,m.receiver)=p.a AND greatest(m.sender,m.receiver)=p.b
  RETURNING m.image_path,m.audio_path
 ), queued AS (
  INSERT INTO public.conversation_media_cleanup(bucket,path)
  SELECT 'message-photos',image_path FROM removed WHERE image_path IS NOT NULL
  UNION SELECT 'message-audio',audio_path FROM removed WHERE audio_path IS NOT NULL
  ON CONFLICT(bucket,path) DO NOTHING RETURNING id
 ) SELECT count(*) INTO deleted_count FROM removed;
 RETURN jsonb_build_object('conversations',pair_count,'messages',deleted_count,'dry_run',false);
END;
$$;
REVOKE ALL ON FUNCTION public.purge_inactive_conversations(boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_inactive_conversations(boolean) TO service_role;