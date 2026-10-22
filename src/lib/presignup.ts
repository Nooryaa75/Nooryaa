// Réponses de l'inscription guidée (avant la création du compte).
// Elles sont conservées dans le navigateur puis reprises par la fiche
// profil après confirmation de l'email ou connexion Google / Apple.

export type PresignupAnswers = {
  gender?: "homme" | "femme";
  pseudo?: string;
  birthdate?: string;
  origins?: string[];
  grewUp?: string;
  city?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
};

const KEY = "nooryaa-presignup";

export function loadPresignup(): PresignupAnswers {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as PresignupAnswers) : {};
  } catch {
    return {};
  }
}

export function savePresignup(answers: PresignupAnswers) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(answers));
  } catch {
    /* stockage indisponible : on ignore */
  }
}

export function clearPresignup() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function hasPresignup(a: PresignupAnswers): boolean {
  return !!(a.gender || a.pseudo || a.birthdate || (a.origins && a.origins.length) || a.city);
}

/**
 * Champs de la fiche à enregistrer à partir des réponses de l'inscription guidée.
 * `existing` = fiche actuelle : on ne remplace jamais une valeur déjà saisie.
 */
export function presignupProfilePatch(
  a: PresignupAnswers,
  existing: Record<string, any> | null = null,
): Record<string, any> {
  const ex = existing ?? {};
  const patch: Record<string, any> = {};
  if ((a.gender === "homme" || a.gender === "femme") && !ex.gender) {
    patch.gender = a.gender;
    patch.looking_for = a.gender === "homme" ? "femme" : "homme";
  }
  const pseudo = (a.pseudo ?? "").trim();
  if (pseudo && (!ex.pseudo || String(ex.pseudo).startsWith("user_"))) patch.pseudo = pseudo.slice(0, 40);
  if (a.birthdate && /^\d{4}-\d{2}-\d{2}$/.test(a.birthdate) && !ex.birthdate) patch.birthdate = a.birthdate;
  const origins = (a.origins ?? []).filter(Boolean).slice(0, 3);
  const exOrigins = Array.isArray(ex.countries_origin) ? ex.countries_origin : [];
  if (origins.length && !exOrigins.length && !ex.country_origin) {
    patch.countries_origin = origins;
    patch.country_origin = origins[0];
  }
  if (a.grewUp?.trim() && !ex.grew_up) patch.grew_up = a.grewUp.trim().slice(0, 120);
  if (a.city?.trim() && !ex.city) patch.city = a.city.trim().slice(0, 120);
  if (a.country?.trim() && (!ex.country || !ex.city)) patch.country = a.country.trim();
  if (typeof a.latitude === "number" && typeof a.longitude === "number" && ex.latitude == null) {
    patch.latitude = a.latitude;
    patch.longitude = a.longitude;
  }
  return patch;
}

