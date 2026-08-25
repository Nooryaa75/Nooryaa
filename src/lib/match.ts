import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Score de compatibilité entre le profil courant (me) et un profil cible. */
export function matchScore(me: any, p: any): number {
  const prefs: any = me?.preferences ?? {};
  const iAmMan = me?.gender === "homme";
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
}

export function maxMatchScore(me: any): number {
  const prefs: any = me?.preferences ?? {};
  const iAmMan = me?.gender === "homme";
  return Math.max(
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
}

export function matchPercent(me: any, p: any): number | null {
  if (!me || !p) return null;
  return Math.min(100, Math.round((matchScore(me, p) / maxMatchScore(me)) * 100));
}

/** Profil courant, mis en cache pour le calcul du score partout dans l'app. */
export function useMyProfile(userId: string) {
  return useQuery({
    queryKey: ["me", userId],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", userId).single()).data,
  });
}
