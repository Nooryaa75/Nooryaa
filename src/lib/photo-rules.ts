/**
 * Règles de la photo de profil et de l'ordre photo → selfie.
 * - Une photo de profil doit être une vraie photo d'une vraie personne :
 *   texte, citation, logo, dessin, paysage, objet ou animal sont refusés.
 * - Le selfie n'est possible qu'après au moins une photo de profil enregistrée,
 *   sinon il n'y a rien à comparer.
 */
export type RealPhoto = "yes" | "no" | "unsure";
/** Visage de la personne nettement visible (voile et niqab acceptés si les yeux se voient). */
export type FaceVisible = "yes" | "no" | "unsure";

export const NO_FACE_REASON =
  "Votre visage doit être bien visible sur la photo : de face, assez près, bien éclairé et net. Les photos sans visage, de loin, trop sombres ou floues ne sont pas acceptées.";

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

/**
 * Chaque photo de profil doit montrer le visage de la personne : sans visage
 * nettement visible (photo de dos, de loin, trop sombre, floue, visage caché),
 * la photo est refusée — sinon le selfie et le contrôle d'identité n'ont rien
 * à comparer et un faux profil pourrait passer.
 */
export function enforceFaceVisible<V extends "allow" | "warn" | "block">(
  verdict: V,
  faceVisible: FaceVisible,
): V | "block" {
  return faceVisible === "yes" ? verdict : "block";
}

export function canStartSelfie(photoCount: number): boolean {
  return photoCount > 0;
}

export const NOT_SAME_PERSON_REASON =
  "Cette photo ne semble pas être vous : elle ne correspond pas à vos photos de profil. Ajoutez une photo de vous ou refaites la vérification par selfie.";

export const SAME_PERSON_UNCONFIRMED_REASON =
  "Nous ne reconnaissons pas la même personne que sur votre selfie de vérification et vos autres photos. Ajoutez une photo de vous où votre visage est bien visible.";

/**
 * Ressemblance d'une nouvelle photo avec les références du membre (selfie de
 * vérification en priorité, puis photos déjà acceptées). Règle pour chaque
 * membre : toutes ses photos doivent montrer la même personne que son selfie.
 * - personne différente ou ressemblance impossible à établir → photo refusée ;
 * - ressemblance sans certitude → photo acceptée mais selfie à refaire ;
 * - aucune référence (toute première photo) → pas de comparaison possible.
 */
export function identityDecision(
  hasReferences: boolean,
  samePerson: "yes" | "maybe" | "no" | "unknown",
): { verdict: "allow" | "review" | "block"; requireSelfie: boolean; reason?: string } {
  if (!hasReferences || samePerson === "yes") return { verdict: "allow", requireSelfie: false };
  if (samePerson === "no") return { verdict: "block", requireSelfie: false, reason: NOT_SAME_PERSON_REASON };
  if (samePerson === "unknown") return { verdict: "block", requireSelfie: false, reason: SAME_PERSON_UNCONFIRMED_REASON };
  return { verdict: "review", requireSelfie: true };
}
