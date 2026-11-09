/**
 * Règles de la photo de profil et de l'ordre photo → selfie.
 * - Une photo de profil doit être une vraie photo d'une vraie personne :
 *   texte, citation, logo, dessin, paysage, objet ou animal sont refusés.
 * - Le selfie n'est possible qu'après au moins une photo de profil enregistrée,
 *   sinon il n'y a rien à comparer.
 */
export type RealPhoto = "yes" | "no" | "unsure";

export const NOT_REAL_PHOTO_REASON =
  "Votre photo doit être une vraie photo de vous. Les images avec du texte, les dessins, les logos, les paysages ou les objets ne sont pas acceptés.";

export const PHOTO_BEFORE_SELFIE_REASON =
  "Ajoutez d'abord une vraie photo de vous, puis faites le selfie de vérification.";

export function enforceRealPhoto<V extends "allow" | "warn" | "block">(
  verdict: V,
  realPhoto: RealPhoto,
): V | "block" | "warn" {
  if (realPhoto === "no") return "block";
  if (realPhoto === "unsure" && verdict === "allow") return "warn";
  return verdict;
}

export function canStartSelfie(photoCount: number): boolean {
  return photoCount > 0;
}
