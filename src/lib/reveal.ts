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
 * Le floutage dépend uniquement du choix de son propriétaire :
 * aucun dévoilement automatique (coups de cœur réciproques ou autre).
 * Seul mon propre profil m'est toujours visible en clair.
 */
export function isRevealed(
  target: { id?: string | null } | null | undefined,
  me: { id?: string | null } | null | undefined,
  _graph?: LikeGraph,
): boolean {
  if (!target?.id || !me?.id) return false;
  return target.id === me.id;
}

export function isBlurred(
  target: { id?: string | null; primary_photo_blurred?: boolean | null } | null | undefined,
  me: { id?: string | null } | null | undefined,
  graph?: LikeGraph,
): boolean {
  if (!target?.primary_photo_blurred) return false;
  return !isRevealed(target, me, graph);
}

/**
 * La discussion n'est possible qu'après un match : les deux membres se sont
 * likés mutuellement (même règle que la base de données, can_message).
 */
export function canMessage(
  me: { id?: string | null } | null | undefined,
  target: { id?: string | null } | null | undefined,
  graph: LikeGraph,
): boolean {
  if (!me?.id || !target?.id || !graph) return false;
  return graph.iLiked.has(target.id) && graph.likedMe.has(target.id);
}

export const MESSAGE_BLOCKED_HINT =
  "Vous pourrez discuter dès que vous vous serez likés mutuellement (match).";
