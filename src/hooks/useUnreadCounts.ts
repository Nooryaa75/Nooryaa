import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const LIKES_SEEN_KEY = "nooryaa:likes-seen-at";

function localSeenAt(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LIKES_SEEN_KEY);
}

/** Date de dernière consultation des coups de cœur (persistée en base, repli local). */
export async function getLikesSeenAt(userId?: string): Promise<string | null> {
  const local = localSeenAt();
  if (!userId) return local;
  const { data } = await supabase.from("profiles").select("preferences").eq("id", userId).maybeSingle();
  const remote = (data?.preferences as any)?.likes_seen_at as string | undefined;
  if (remote && local) return new Date(remote) > new Date(local) ? remote : local;
  return remote ?? local;
}

/** Marque les coups de cœur comme vus (base + local). */
export async function markLikesSeen() {
  const now = new Date().toISOString();
  if (typeof window !== "undefined") window.localStorage.setItem(LIKES_SEEN_KEY, now);
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;
  const { data } = await supabase.from("profiles").select("preferences").eq("id", userId).maybeSingle();
  const prefs = { ...((data?.preferences as any) ?? {}), likes_seen_at: now };
  await supabase.from("profiles").update({ preferences: prefs as any }).eq("id", userId);
}

/** Marque les likes comme vus à l'ouverture de la page, puis rafraîchit les pastilles. */
export function useMarkLikesSeen() {
  const queryClient = useQueryClient();
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await markLikesSeen();
      if (!cancelled) queryClient.invalidateQueries({ queryKey: ["unread-counts"] });
    })();
    return () => {
      cancelled = true;
    };
  }, [queryClient]);
}

export function useUnreadCounts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["unread-counts"],
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return { likes: 0, messages: 0 };

      const since = await getLikesSeenAt(userId);
      let likesQuery = supabase
        .from("likes")
        .select("id", { count: "exact", head: true })
        .eq("to_user", userId);
      if (since) likesQuery = likesQuery.gt("created_at", since);

      const [likesRes, messagesRes, hidesRes] = await Promise.all([
        likesQuery,
        supabase
          .from("messages")
          .select("id, sender")
          .eq("receiver", userId)
          .is("read_at", null)
          .is("deleted_at", null),
        supabase.from("conversation_hides").select("peer_id").eq("user_id", userId),
      ]);

      const hidden = new Set((hidesRes.data ?? []).map((h: any) => h.peer_id));
      const messages = (messagesRes.data ?? []).filter((m: any) => !hidden.has(m.sender)).length;

      return { likes: likesRes.count ?? 0, messages };
    },
  });

  // Keep badges in sync in real time (new/removed likes, deleted or read messages).
  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["unread-counts"] });

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId || cancelled) return;

      channel = supabase
        .channel(`unread-counts-${userId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, invalidate)
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, invalidate)
        .on("postgres_changes", { event: "*", schema: "public", table: "conversation_hides" }, invalidate)
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
