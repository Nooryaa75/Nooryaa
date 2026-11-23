import { GEO_TRANSLATIONS } from "./geo-catalog";
import { registrationComplete } from "./registration-requirements";
import { isValidPhone } from "@/components/PhoneInput";

const frenchPlaces = new Map<string, string>();
const placeKey = (value: string) => value.trim().normalize("NFC").toLocaleLowerCase("fr-FR");

// Preserve canonical French names before registering foreign aliases.
for (const french of Object.keys(GEO_TRANSLATIONS)) frenchPlaces.set(placeKey(french), french);
for (const [french, translations] of Object.entries(GEO_TRANSLATIONS)) {
  for (const alias of Object.values(translations)) {
    const key = placeKey(alias);
    if (!frenchPlaces.has(key)) frenchPlaces.set(key, french);
  }
}

export function frenchPlace(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.split(/([(),،])/).map((part) => {
    if (/^[(),،]$/.test(part)) return part === "،" ? "," : part;
    const translated = frenchPlaces.get(placeKey(part));
    if (!translated) return part;
    return `${part.match(/^\s*/)?.[0] ?? ""}${translated}${part.match(/\s*$/)?.[0] ?? ""}`;
  }).join("");
}

export const PROFILE_STATUS_LABELS: Record<string, string> = {
  active: "Entré", inactive: "Pas encore entré", photo_removed: "Non validé (photo retirée)", photo_rejected: "Non validé (photo refusée)", suspended: "Suspendu", banned: "Banni",
};

/**
 * Statut affiché dans l'administration : « Entré » signifie que le membre est
 * réellement entré dans la plateforme — inscription terminée (fiche complète,
 * téléphone valide, au moins une photo) ou compte ancien déjà marqué comme
 * ayant fini l'inscription (onboarded). La pastille verte, elle, indique
 * uniquement le selfie vérifié. Suspendu et Banni restent prioritaires.
 * Ne modifie pas le statut enregistré.
 */
export function adminProfileStatus(p: Record<string, unknown>, photoCount = 0): string {
  const s = (p.status as string | null | undefined) ?? "active";
  if (s !== "active") return s;
  if (p.photo_removed_at) return p.photo_verification_status === "photo_rejected" ? "photo_rejected" : "photo_removed";
  if (p.onboarded === true) return "active";
  return registrationComplete(p, photoCount, isValidPhone(p.phone as string | null)) ? "active" : "inactive";
}

export const REPORT_STATUS_LABELS: Record<string, string> = {
  open: "Ouvert", reviewed: "Examiné", resolved: "Résolu", dismissed: "Classé sans suite", closed: "Fermé",
};

export type GenderShares = {
  /** Pourcentage d'hommes, null si aucun profil n'est concerné. */
  homme: number | null;
  /** Pourcentage de femmes, null si aucun profil n'est concerné. */
  femme: number | null;
  hommeCount: number;
  femmeCount: number;
  total: number;
};

/**
 * Répartition hommes / femmes en pourcentages sur les profils réellement
 * listés (mêmes filtres de recherche, statut et dates). Les deux pourcentages
 * summent toujours à 100 et valent null quand aucun profil n'est concerné,
 * pour n'afficher aucun chiffre trompeur.
 */
export function genderShares(counts: { homme?: number | null; femme?: number | null } | null | undefined): GenderShares {
  const homme = Math.max(0, Math.trunc(counts?.homme ?? 0));
  const femme = Math.max(0, Math.trunc(counts?.femme ?? 0));
  const total = homme + femme;
  if (total === 0) return { homme: null, femme: null, hommeCount: 0, femmeCount: 0, total: 0 };
  const hommePct = Math.round((homme / total) * 100);
  return { homme: hommePct, femme: 100 - hommePct, hommeCount: homme, femmeCount: femme, total };
}