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
  return useQuery({
    queryKey: ["unread-counts"],
    refetchInterval: 30_000,
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

      const [likesRes, messagesRes] = await Promise.all([
        likesQuery,
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("receiver", userId)
          .is("read_at", null),
      ]);

      return { likes: likesRes.count ?? 0, messages: messagesRes.count ?? 0 };
    },
  });
}
