import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Navigation, Clock } from "lucide-react";
import type { DeckKey } from "@/components/DeckCard";

export const ANY = "any";

export type Filters = {
  ageMin: number; ageMax: number; city: string; country: string; countryOrigin: string;
  profession: string; marital: string; education: string; objective: string;
  activity: string; activities: string; personality: string;
  salat: string; ramadan: string; hadj: string; omra: string; voile: string;
  hasChildren: string; wantsChildren: string; smoker: string;
  radiusEnabled: boolean; radiusKm: number;
  originLabel: string; originLat: number | null; originLng: number | null;
};

export const DEFAULT_FILTERS: Filters = {
  ageMin: 18, ageMax: 60, city: "", country: ANY, countryOrigin: ANY,
  profession: ANY, marital: ANY, education: ANY, objective: ANY,
  activity: ANY, activities: "", personality: ANY,
  salat: ANY, ramadan: ANY, hadj: ANY, omra: ANY, voile: ANY,
  hasChildren: ANY, wantsChildren: ANY, smoker: ANY,
  radiusEnabled: false, radiusKm: 50,
  originLabel: "", originLat: null, originLng: null,
};

/** Distance en km entre deux points (formule de haversine). */
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

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

const tri = (v: string) => (v === ANY ? null : v === "yes");

/** Charge le profil courant, les profils compatibles et les 3 sélections. */
export function useDiscovery(userId: string, filters: Filters) {
  const { data: me } = useQuery({
    queryKey: ["me", userId],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", userId).single()).data,
  });

  // Point de référence : la ville choisie dans le filtre, sinon la position du profil.
  const originLat = filters.originLat ?? (me as any)?.latitude ?? null;
  const originLng = filters.originLng ?? (me as any)?.longitude ?? null;

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["browse", userId, me?.looking_for, filters, originLat, originLng],
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
      const today = new Date();
      const maxBirth = new Date(today.getFullYear() - filters.ageMin, today.getMonth(), today.getDate()).toISOString().slice(0, 10);
      const minBirth = new Date(today.getFullYear() - filters.ageMax - 1, today.getMonth(), today.getDate()).toISOString().slice(0, 10);
      let q = supabase.from("profiles").select("*").eq("onboarded", true).eq("status", "active").neq("id", userId);
      if (me?.gender === "homme") q = q.eq("gender", "femme");
      else if (me?.gender === "femme") q = q.eq("gender", "homme");
      q = q.gte("birthdate", minBirth).lte("birthdate", maxBirth);
      if (filters.city) q = q.ilike("city", `%${filters.city}%`);
      if (filters.country !== ANY) q = q.eq("country", filters.country);
      if (filters.countryOrigin !== ANY) q = q.eq("country_origin", filters.countryOrigin);
      if (filters.profession !== ANY) q = q.eq("profession", filters.profession);
      if (filters.marital !== ANY) q = q.eq("marital_status", filters.marital as any);
      if (filters.education !== ANY) q = q.eq("education_level", filters.education);
      if (filters.objective !== ANY) q = q.eq("objective", filters.objective);
      if (filters.personality !== ANY) q = q.eq("personality", filters.personality);
      const selectedActivities = (filters.activities ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (selectedActivities.length > 0) {
        const orClause = selectedActivities.map((a) => `activities.ilike.%${a}%`).join(",");
        q = q.or(orClause);
      } else if (filters.activity !== ANY) {
        q = q.ilike("activities", `%${filters.activity}%`);
      }
      for (const [col, val] of [
        ["salat_quotidienne", filters.salat],
        ["ramadan", filters.ramadan],
        ["hadj", filters.hadj],
        ["omra", filters.omra],
        ["porte_voile", filters.voile],
        ["has_children", filters.hasChildren],
        ["wants_children", filters.wantsChildren],
        ["smoker", filters.smoker],
      ] as const) {
        const b = tri(val);
        if (b !== null) q = q.eq(col, b);
      }
      const { data, error } = await q.order("last_active", { ascending: false }).limit(200);
      if (error) throw error;
      let rows = (data ?? []).filter((p) => !excluded.has(p.id));
      if (filters.radiusEnabled && originLat != null && originLng != null) {
        rows = rows
          .map((p) => {
            const lat = (p as any).latitude;
            const lng = (p as any).longitude;
            const d = lat != null && lng != null ? distanceKm(originLat, originLng, lat, lng) : null;
            return { ...p, _distance: d } as any;
          })
          .filter((p: any) => p._distance != null && p._distance <= filters.radiusKm)
          .sort((a: any, b: any) => a._distance - b._distance);
      }

      const prefs: any = (me as any)?.preferences ?? {};
      const iAmMan = me?.gender === "homme";
      const score = (p: any) => {
        let s = 0;
        if (prefs.city && p.city && String(p.city).toLowerCase().includes(String(prefs.city).toLowerCase())) s += 2;
        if (prefs.country && p.country === prefs.country) s += 1;
        if (prefs.education && p.education_level === prefs.education) s += 1;
        if (prefs.objective && p.objective === prefs.objective) s += 2;
        if (prefs.marital && p.marital_status === prefs.marital) s += 1;
        if (typeof prefs.wantsChildren === "boolean" && p.wants_children === prefs.wantsChildren) s += 1;
        if (typeof prefs.smoker === "boolean" && p.smoker === prefs.smoker) s += 1;
        if (iAmMan && typeof prefs.voile === "boolean" && p.porte_voile === prefs.voile) s += 2;
        if (typeof prefs.salat === "boolean" && p.salat_quotidienne === prefs.salat) s += 1;
        if (typeof prefs.ramadan === "boolean" && p.ramadan === prefs.ramadan) s += 1;
        if (prefs.personality && p.personality === prefs.personality) s += 1;
        if (me?.city && p.city === me.city) s += 1;
        if (me?.objective && p.objective === me.objective) s += 1;
        return s;
      };
      const maxScore = Math.max(
        1,
        (prefs.city ? 2 : 0) +
          (prefs.country ? 1 : 0) +
          (prefs.education ? 1 : 0) +
          (prefs.objective ? 2 : 0) +
          (prefs.marital ? 1 : 0) +
          (typeof prefs.wantsChildren === "boolean" ? 1 : 0) +
          (typeof prefs.smoker === "boolean" ? 1 : 0) +
          (iAmMan && typeof prefs.voile === "boolean" ? 2 : 0) +
          (typeof prefs.salat === "boolean" ? 1 : 0) +
          (typeof prefs.ramadan === "boolean" ? 1 : 0) +
          (prefs.personality ? 1 : 0) +
          (me?.city ? 1 : 0) +
          (me?.objective ? 1 : 0)
      );
      const withPercent = (p: any) => ({
        ...p,
        _matchPercent: Math.min(100, Math.round((score(p) / maxScore) * 100)),
      });

      return rows.slice(0, 80).map(withPercent);
    },
  });

  const deckList = useMemo(() => buildDecks(me?.gender), [me?.gender]);

  const decks = useMemo(() => {
    const rows: any[] = profiles ?? [];
    const prefs: any = (me as any)?.preferences ?? {};
    const iAmMan = me?.gender === "homme";
    const score = (p: any) => {
      let s = 0;
      if (prefs.city && p.city && String(p.city).toLowerCase().includes(String(prefs.city).toLowerCase())) s += 2;
      if (prefs.country && p.country === prefs.country) s += 1;
      if (prefs.education && p.education_level === prefs.education) s += 1;
      if (prefs.objective && p.objective === prefs.objective) s += 2;
      if (prefs.marital && p.marital_status === prefs.marital) s += 1;
      if (typeof prefs.wantsChildren === "boolean" && p.wants_children === prefs.wantsChildren) s += 1;
      if (typeof prefs.smoker === "boolean" && p.smoker === prefs.smoker) s += 1;
      if (iAmMan && typeof prefs.voile === "boolean" && p.porte_voile === prefs.voile) s += 2;
      if (typeof prefs.salat === "boolean" && p.salat_quotidienne === prefs.salat) s += 1;
      if (typeof prefs.ramadan === "boolean" && p.ramadan === prefs.ramadan) s += 1;
      if (prefs.personality && p.personality === prefs.personality) s += 1;
      if (me?.city && p.city === me.city) s += 1;
      if (me?.objective && p.objective === me.objective) s += 1;
      return s;
    };

    const maxScore = Math.max(
      1,
      (prefs.city ? 2 : 0) +
        (prefs.country ? 1 : 0) +
        (prefs.education ? 1 : 0) +
        (prefs.objective ? 2 : 0) +
        (prefs.marital ? 1 : 0) +
        (typeof prefs.wantsChildren === "boolean" ? 1 : 0) +
        (typeof prefs.smoker === "boolean" ? 1 : 0) +
        (iAmMan && typeof prefs.voile === "boolean" ? 2 : 0) +
        (typeof prefs.salat === "boolean" ? 1 : 0) +
        (typeof prefs.ramadan === "boolean" ? 1 : 0) +
        (prefs.personality ? 1 : 0) +
        (me?.city ? 1 : 0) +
        (me?.objective ? 1 : 0)
    );
    const withPercent = (p: any) => ({
      ...p,
      _matchPercent: Math.min(100, Math.round((score(p) / maxScore) * 100)),
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
      match: [...rows].sort((a, b) => score(b) - score(a)).map(withPercent),
      proches: withDistance
        .filter((p: any) => p._distance != null && p._distance <= 20)
        .sort((a: any, b: any) => a._distance - b._distance),
      nouveaux: [...rows]
        .filter((p) => new Date(p.created_at ?? 0).getTime() >= sevenDaysAgo)
        .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()),
    } as Record<DeckKey, any[]>;
  }, [profiles, me, originLat, originLng]);

  return { me, profiles, isLoading, decks, deckList, originLat, originLng };
}
