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

/** Torse nu visible (homme ou femme) : interdit sur Nooryaa, règle de pudeur. */
export type BareChest = "yes" | "no" | "unsure";

/** Une seule personne sur la photo (photo de profil et selfie) : pas de photo de groupe ni à deux. */
export type SinglePerson = "yes" | "no" | "unsure";

export const SINGLE_PERSON_REASON =
  "Une seule personne doit être présente sur la photo. Les photos de groupe ou avec une autre personne ne sont pas acceptées.";

/**
 * Une seule personne : une photo de groupe ou à deux est toujours refusée ;
 * en cas de doute (personne en arrière-plan) elle est signalée à l'équipe.
 */
export function enforceSinglePerson<V extends "allow" | "warn" | "block">(
  verdict: V,
  singlePerson: SinglePerson,
): V | "block" | "warn" {
  if (singlePerson === "no") return "block";
  if (singlePerson === "unsure" && verdict === "allow") return "warn";
  return verdict;
}

export const BARE_CHEST_REASON =
  "Les photos torse nu ne sont pas autorisées sur Nooryaa. Merci d'ajouter une photo de vous habillé(e), dans le respect des règles de pudeur.";

/** Statut de vérification posé quand l'équipe retire une photo non conforme. */
export const PHOTO_REJECTED_STATUS = "photo_rejected";

/**
 * Pudeur : une photo torse nu est toujours refusée ; en cas de doute elle
 * est au moins signalée à l'équipe.
 */
export function enforceModestDress<V extends "allow" | "warn" | "block">(
  verdict: V,
  bareChest: BareChest,
): V | "block" | "warn" {
  if (bareChest === "yes") return "block";
  if (bareChest === "unsure" && verdict === "allow") return "warn";
  return verdict;
}

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
