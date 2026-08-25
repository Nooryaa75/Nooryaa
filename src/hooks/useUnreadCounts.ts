import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const LIKES_SEEN_KEY = "nooryaa:likes-seen-at";

export function getLikesSeenAt() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LIKES_SEEN_KEY);
}

export function markLikesSeen() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LIKES_SEEN_KEY, new Date().toISOString());
}

/** Marks likes as seen when the likes page is mounted, and refreshes badges. */
export function useMarkLikesSeen() {
  const queryClient = useQueryClient();
  useEffect(() => {
    markLikesSeen();
    queryClient.invalidateQueries({ queryKey: ["unread-counts"] });
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

      const since = getLikesSeenAt();
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
