import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Matchs = likes croisés (envoyé ∩ reçu), avec la date du match
 * (le plus récent des deux likes), triés du plus récent au plus ancien.
 */
export function useMatches(userId: string | undefined) {
  return useQuery({
    queryKey: ["matches", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [{ data: sent }, { data: received }] = await Promise.all([
        supabase.from("likes").select("to_user, created_at").eq("from_user", userId!),
        supabase.from("likes").select("from_user, created_at").eq("to_user", userId!),
      ]);
      const sentMap = new Map((sent ?? []).map((l: any) => [l.to_user as string, l.created_at as string]));
      const recvMap = new Map((received ?? []).map((l: any) => [l.from_user as string, l.created_at as string]));
      const ids = [...sentMap.keys()].filter((id) => recvMap.has(id));
      if (ids.length === 0) return [] as any[];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, pseudo, birthdate, city, country, latitude, longitude, primary_photo_url, primary_photo_blurred, photo_verified, personality, porte_voile, objective")
        .in("id", ids);
      return (profiles ?? [])
        .map((p: any) => {
          const a = sentMap.get(p.id)!;
          const b = recvMap.get(p.id)!;
          return { ...p, _matchedAt: a > b ? a : b };
        })
        .sort((a: any, b: any) => (b._matchedAt as string).localeCompare(a._matchedAt as string));
    },
  });
}
