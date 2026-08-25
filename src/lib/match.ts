import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ageFromBirthdate } from "@/lib/profile";

type Criterion = {
  weight: number;
  matches: boolean;
};

const normalize = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[·'’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const same = (left: unknown, right: unknown) => {
  const a = normalize(left);
  const b = normalize(right);
  if (!a || !b) return false;
  return a === b || a.startsWith(b) || b.startsWith(a);
};

const activityList = (value: unknown) =>
  (Array.isArray(value) ? value : String(value ?? "").split(","))
    .map(normalize)
    .filter(Boolean);

function compatibilityCriteria(me: any, profile: any): Criterion[] {
  const prefs: any = me?.preferences ?? {};
  const criteria: Criterion[] = [];
  const add = (expected: unknown, actual: unknown, weight = 1) => {
    if (expected === null || expected === undefined || expected === "" || actual === null || actual === undefined || actual === "") return;
    criteria.push({ weight, matches: typeof expected === "boolean" ? expected === actual : same(expected, actual) });
  };

  // Critères explicitement choisis dans « Ce que je recherche ».
  add(prefs.country, profile.country);
  add(prefs.country_origin, profile.country_origin);
  add(prefs.education_level, profile.education_level);
  add(prefs.profession, profile.profession);
  add(prefs.objective, profile.objective, 2);
  add(prefs.marital_status, profile.marital_status);
  add(prefs.wants_children, profile.wants_children);
  add(prefs.has_children, profile.has_children);
  add(prefs.smoker, profile.smoker);
  if (me?.gender === "homme") add(prefs.porte_voile, profile.porte_voile, 2);
  add(prefs.salat_quotidienne, profile.salat_quotidienne);
  add(prefs.ramadan, profile.ramadan);
  add(prefs.hadj, profile.hadj);
  add(prefs.omra, profile.omra);
  add(prefs.personality, profile.personality);

  const desiredActivities = activityList(prefs.activities);
  const profileActivities = activityList(profile.activities);
  if (desiredActivities.length && profileActivities.length) {
    criteria.push({
      weight: 1,
      matches: desiredActivities.some((activity) => profileActivities.includes(activity)),
    });
  }

  const height = Number(profile.height_cm);
  const minHeight = Number(prefs.height_min);
  const maxHeight = Number(prefs.height_max);
  if (Number.isFinite(height) && height > 0 && (Number.isFinite(minHeight) || Number.isFinite(maxHeight))) {
    criteria.push({
      weight: 1,
      matches: (!Number.isFinite(minHeight) || height >= minHeight) && (!Number.isFinite(maxHeight) || height <= maxHeight),
    });
  }

  const age = ageFromBirthdate(profile.birthdate ?? null);
  const minAge = Number(prefs.age_min);
  const maxAge = Number(prefs.age_max);
  if (age !== null && (Number.isFinite(minAge) || Number.isFinite(maxAge))) {
    criteria.push({
      weight: 1,
      matches: (!Number.isFinite(minAge) || age >= minAge) && (!Number.isFinite(maxAge) || age <= maxAge),
    });
  }

  // Socle commun : il évite un score artificiellement nul lorsque les préférences
  // facultatives n'ont pas encore été renseignées.
  add(me?.country, profile.country);
  add(me?.religious_practice, profile.religious_practice, 2);
  add(me?.salat_quotidienne, profile.salat_quotidienne);
  add(me?.ramadan, profile.ramadan);
  add(me?.objective, profile.objective, 2);
  add(me?.smoker, profile.smoker);
  add(me?.wants_children, profile.wants_children);
  add(me?.personality, profile.personality);

  const myActivities = activityList(me?.activities);
  if (myActivities.length && profileActivities.length) {
    criteria.push({ weight: 1, matches: myActivities.some((activity) => profileActivities.includes(activity)) });
  }

  return criteria;
}

/** Score de compatibilité entre le profil courant (me) et un profil cible. */
export function matchScore(me: any, p: any): number {
  return compatibilityCriteria(me, p).reduce((total, criterion) => total + (criterion.matches ? criterion.weight : 0), 0);
}

export function maxMatchScore(me: any, p?: any): number {
  if (!p) return 1;
  return Math.max(1, compatibilityCriteria(me, p).reduce((total, criterion) => total + criterion.weight, 0));
}

export function matchPercent(me: any, p: any): number | null {
  if (!me || !p) return null;
  return Math.min(100, Math.round((matchScore(me, p) / maxMatchScore(me, p)) * 100));
}

/** Profil courant, mis en cache pour le calcul du score partout dans l'app. */
export function useMyProfile(userId: string) {
  return useQuery({
    queryKey: ["me", userId],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", userId).single()).data,
  });
}
