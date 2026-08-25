import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Graphe des coups de cœur autour de l'utilisateur courant. */
export function useLikeGraph(userId: string) {
  return useQuery({
    queryKey: ["like-graph", userId],
    queryFn: async () => {
      const [{ data: sent }, { data: received }] = await Promise.all([
        supabase.from("likes").select("to_user").eq("from_user", userId),
        supabase.from("likes").select("from_user").eq("to_user", userId),
      ]);
      return {
        iLiked: new Set((sent ?? []).map((r) => r.to_user)),
        likedMe: new Set((received ?? []).map((r) => r.from_user)),
      };
    },
  });
}

export type LikeGraph = { iLiked: Set<string>; likedMe: Set<string> } | undefined;

/**
 * Une photo floutée se dévoile si son propriétaire m'a liké·e
 * et que je suis moi-même « ouvert·e » : soit je l'ai liké·e en retour,
 * soit ma propre photo n'est pas floutée.
 */
/** Le flou d'un profil est levé pour moi ? (réciprocité des coups de cœur) */
export function isRevealed(
  target: { id?: string | null } | null | undefined,
  me: { id?: string | null; primary_photo_blurred?: boolean | null } | null | undefined,
  graph: LikeGraph,
): boolean {
  if (!target?.id || !me?.id) return false;
  if (target.id === me.id) return false;
  if (!graph?.likedMe.has(target.id)) return false;
  return graph.iLiked.has(target.id) || !me.primary_photo_blurred;
}

export function isBlurred(
  target: { id?: string | null; primary_photo_blurred?: boolean | null } | null | undefined,
  me: { id?: string | null; primary_photo_blurred?: boolean | null } | null | undefined,
  graph: LikeGraph,
): boolean {
  if (!target?.primary_photo_blurred) return false;
  return !isRevealed(target, me, graph);
}

/** Un homme ne peut écrire à une femme que si elle lui a envoyé un coup de cœur. */
export function canMessage(
  me: { gender?: string | null } | null | undefined,
  target: { id?: string | null; gender?: string | null } | null | undefined,
  graph: LikeGraph,
): boolean {
  if (!me || !target?.id) return true;
  if (me.gender !== "homme" || target.gender !== "femme") return true;
  return !!graph?.likedMe.has(target.id);
}

export const MESSAGE_BLOCKED_HINT =
  "Vous pourrez lui écrire lorsqu'elle vous aura envoyé un coup de cœur.";
