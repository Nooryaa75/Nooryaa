import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Navigation, Clock } from "lucide-react";
import type { DeckKey } from "@/components/DeckCard";
import { matchPercent } from "@/lib/match";
import { ANY, DEFAULT_FILTERS, distanceKm, queryDiscoveryProfiles, type Filters } from "@/lib/discovery";

export { ANY, DEFAULT_FILTERS, distanceKm, type Filters };

export const buildDecks = (
  gender?: string | null,
): { key: DeckKey; title: string; desc: string; Icon: typeof Sparkles }[] => {
  // On s'adresse au genre recherché : un homme voit des femmes, une femme voit des hommes.
  const isMan = gender === "homme";
  const isWoman = gender === "femme";
  const they = isMan ? "Elles" : isWoman ? "Ils" : "Ils/elles";
  const them = isMan ? "des femmes" : isWoman ? "des hommes" : "des profils";
  const news = isMan ? "Les nouvelles inscrites" : isWoman ? "Les nouveaux inscrits" : "Les nouveaux profils";
  return [
    { key: "match", title: `${they} te correspondent`, desc: "Selon vos critères et vos préférences.", Icon: Sparkles },
    { key: "proches", title: "Près de chez toi", desc: `Les profils ${them} dans un rayon de 20 km.`, Icon: Navigation },
    { key: "nouveaux", title: news, desc: "Les inscriptions des 7 derniers jours.", Icon: Clock },
  ];
};

/** Charge le profil courant, les profils compatibles et les 3 sélections. */
export function useDiscovery(userId: string, filters: Filters) {
  const { data: me } = useQuery({
    queryKey: ["me", userId],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", userId).single()).data,
  });

  const { data: sentLikes } = useQuery({
    queryKey: ["sent-likes-discovery", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("likes").select("to_user").eq("from_user", userId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: passes } = useQuery({
    queryKey: ["passes", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profile_passes").select("target_id").eq("user_id", userId);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Point de référence : la ville choisie dans le filtre, sinon la position du profil.
  const originLat = filters.originLat ?? (me as any)?.latitude ?? null;
  const originLng = filters.originLng ?? (me as any)?.longitude ?? null;

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["browse", userId, me?.gender, me?.looking_for, filters, originLat, originLng],
    enabled: !!me,
    queryFn: async () => {
      const [{ data: iBlock }, { data: blockedMe }] = await Promise.all([
        supabase.from("blocks").select("blocked").eq("blocker", userId),
        supabase.from("blocks").select("blocker").eq("blocked", userId),
      ]);
      const excluded = new Set<string>([
        ...(iBlock ?? []).map((r) => r.blocked),
        ...(blockedMe ?? []).map((r) => r.blocker),
      ]);
      const rows = await queryDiscoveryProfiles({ me, filters, excluded, supabase, limit: 200 });
      const withPercent = (p: any) => ({ ...p, _matchPercent: matchPercent(me, p) ?? 0 });
      return rows.slice(0, 80).map(withPercent);
    },
  });

  const deckList = useMemo(() => buildDecks(me?.gender), [me?.gender]);

  // Profils encore « à décider » : ni likés, ni refusés.
  const visibleProfiles = useMemo(() => {
    const likedIds = new Set((sentLikes ?? []).map((r) => r.to_user));
    const passedIds = new Set((passes ?? []).map((r: any) => r.target_id));
    return (profiles ?? []).filter((p: any) => !likedIds.has(p.id) && !passedIds.has(p.id));
  }, [profiles, sentLikes, passes]);

  const decks = useMemo(() => {
    const rows: any[] = visibleProfiles;
    const withPercent = (p: any) => ({
      ...p,
      _matchPercent: matchPercent(me, p) ?? 0,
    });

    const withDistance = rows.map((p) => {
      if (typeof p._distance === "number") return p;
      const lat = p.latitude, lng = p.longitude;
      const d = originLat != null && originLng != null && lat != null && lng != null
        ? distanceKm(originLat, originLng, lat, lng) : null;
      return { ...p, _distance: d };
    });
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      match: [...rows].sort((a, b) => (matchPercent(me, b) ?? 0) - (matchPercent(me, a) ?? 0)).map(withPercent),
      proches: withDistance
        .filter((p: any) => p._distance != null && p._distance <= 20)
        .sort((a: any, b: any) => a._distance - b._distance),
      nouveaux: [...rows]
        .filter((p) => new Date(p.created_at ?? 0).getTime() >= sevenDaysAgo)
        .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()),
    } as Record<DeckKey, any[]>;
  }, [visibleProfiles, me, originLat, originLng]);

  return { me, profiles: visibleProfiles, allProfiles: profiles, isLoading, decks, deckList, originLat, originLng };
}
