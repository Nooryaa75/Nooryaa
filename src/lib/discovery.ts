import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const ANY = "any";

export type Filters = {
  ageMin: number; ageMax: number; heightMin: number | null; heightMax: number | null; city: string; country: string; countryOrigin: string;
  bodyType: string;
  profession: string; marital: string; education: string; objective: string;
  activity: string; activities: string; personality: string;
  salat: string; ramadan: string; hadj: string; omra: string; voile: string;
  hasChildren: string; wantsChildren: string; smoker: string;
  radiusEnabled: boolean; radiusKm: number;
  originLabel: string; originLat: number | null; originLng: number | null;
  onlineOnly: boolean;
};

/** Un profil est « en ligne » si sa dernière activité date de moins de 10 minutes. */
export const ONLINE_MINUTES = 10;
export function isOnline(p: { last_seen?: string | null }): boolean {
  if (!p?.last_seen) return false;
  return Date.now() - new Date(p.last_seen).getTime() < ONLINE_MINUTES * 60 * 1000;
}

export const DEFAULT_FILTERS: Filters = {
  ageMin: 18, ageMax: 60, heightMin: 120, heightMax: 230, city: "", country: ANY, countryOrigin: ANY,
  bodyType: ANY,
  profession: ANY, marital: ANY, education: ANY, objective: ANY,
  activity: ANY, activities: "", personality: ANY,
  salat: ANY, ramadan: ANY, hadj: ANY, omra: ANY, voile: ANY,
  hasChildren: ANY, wantsChildren: ANY, smoker: ANY,
  radiusEnabled: true, radiusKm: 50,
  originLabel: "", originLat: null, originLng: null,
  onlineOnly: false,
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

const tri = (v: string) => (v === ANY ? null : v === "yes");

/** Retourne les profils correspondant aux filtres (sans tenir compte des likes/passes). */
export async function queryDiscoveryProfiles({
  me,
  filters,
  excluded,
  supabase,
  limit = 200,
}: {
  me: any;
  filters: Filters;
  excluded: Set<string> | string[];
  supabase: SupabaseClient<Database>;
  limit?: number;
}): Promise<any[]> {
  const excludedSet = excluded instanceof Set ? excluded : new Set(excluded);
  const userId = me?.id;
  const today = new Date();
  const maxBirth = new Date(today.getFullYear() - filters.ageMin, today.getMonth(), today.getDate()).toISOString().slice(0, 10);
  const minBirth = new Date(today.getFullYear() - filters.ageMax - 1, today.getMonth(), today.getDate()).toISOString().slice(0, 10);

  // Genre opposé strict : un homme ne voit que des femmes, une femme que des hommes.
  const wantedGender = me?.gender === "homme" ? "femme" : me?.gender === "femme" ? "homme" : null;
  if (!wantedGender) return [];

  let q = supabase.from("profiles").select("*").eq("onboarded", true).eq("status", "active").neq("id", userId);
  q = q.eq("gender", wantedGender);

  q = q.gte("birthdate", minBirth).lte("birthdate", maxBirth);
  if (filters.onlineOnly) {
    const cutoff = new Date(Date.now() - ONLINE_MINUTES * 60 * 1000).toISOString();
    q = q.gte("last_seen", cutoff);
  }
  // La taille peut ne pas être renseignée : on n'exclut pas ces profils.
  if (filters.heightMin != null) q = q.or(`height_cm.is.null,height_cm.gte.${filters.heightMin}`);
  if (filters.heightMax != null) q = q.or(`height_cm.is.null,height_cm.lte.${filters.heightMax}`);
  if (filters.city) q = q.ilike("city", `%${filters.city}%`);
  if (filters.country !== ANY) q = q.eq("country", filters.country);
  if (filters.countryOrigin !== ANY) q = q.eq("country_origin", filters.countryOrigin);
  if (filters.bodyType !== ANY) q = q.eq("body_type", filters.bodyType);
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

  const originLat = filters.originLat ?? (me as any)?.latitude ?? null;
  const originLng = filters.originLng ?? (me as any)?.longitude ?? null;

  const { data, error } = await q.order("last_active", { ascending: false }).limit(limit);
  if (error) throw error;

  let rows = (data ?? []).filter((p) => !excludedSet.has(p.id));
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

  return rows;
}
