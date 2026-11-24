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

// ---------------------------------------------------------------------------
// Règles de refus communes aux photos de profil ET au selfie (Nooryaa, 24 nov. 2026)
// Refusé : photo dans le noir, short, visage à moitié, photo de profil (de côté),
// photo modifiée par l'IA, sexe différent de celui indiqué, caractère sexuel,
// texte ajouté. (Plusieurs personnes, torse nu, visage peu visible et écart
// d'âge sont gérés par les règles ci-dessus et photo-age.ts.)
// ---------------------------------------------------------------------------

export type Tri = "yes" | "no" | "unsure";
export type FaceAngle = "front" | "three_quarter" | "profile" | "unknown";
export type ApparentGender = "homme" | "femme" | "unknown";

export type PhotoRuleChecks = {
  /** Photo prise dans le noir / beaucoup trop sombre. */
  too_dark: Tri;
  /** Personne en short (jambes / genoux découverts). */
  shorts: Tri;
  /** Visage visible en entier (pas coupé par le cadre ni à moitié caché). */
  face_complete: Tri;
  /** Orientation du visage : « profile » = pris de côté. */
  face_angle: FaceAngle;
  /** Sexe apparent, seulement quand l'analyse est sûre. */
  apparent_gender: ApparentGender;
  /** Contenu sexuel ou suggestif. */
  sexual: Tri;
  /** Texte ajouté sur l'image (légende, écriture, numéro, lien, filigrane). */
  added_text: Tri;
  /** Image créée ou modifiée par l'IA. */
  ai_generated: "no" | "maybe" | "yes";
  /** Filtres : « heavy » = filtre qui transforme le visage. */
  filtered: "no" | "light" | "heavy";
};

export const TOO_DARK_REASON =
  "Votre photo est trop sombre. Prenez-la dans un endroit bien éclairé, pour que votre visage se voie clairement.";
export const SHORTS_REASON =
  "Les photos en short ne sont pas autorisées sur Nooryaa. Merci d'ajouter une photo de vous dans une tenue qui couvre les jambes, dans le respect des règles de pudeur.";
export const HALF_FACE_REASON =
  "Votre visage doit apparaître en entier sur la photo. Les photos où le visage est coupé ou à moitié caché ne sont pas acceptées.";
export const PROFILE_VIEW_REASON =
  "Votre photo doit être prise de face. Les photos prises de profil (de côté) ne sont pas acceptées.";
export const AI_EDITED_REASON =
  "Les photos créées ou modifiées par l'intelligence artificielle, ou avec un filtre qui change le visage, ne sont pas acceptées. Merci d'ajouter une vraie photo de vous, sans retouche.";
export const GENDER_MISMATCH_REASON =
  "La personne sur la photo ne correspond pas au sexe indiqué dans votre profil. Merci d'ajouter une photo de vous.";
export const SEXUAL_CONTENT_REASON =
  "Les photos à caractère sexuel ou suggestif ne sont pas autorisées sur Nooryaa.";
export const ADDED_TEXT_REASON =
  "Les photos avec du texte ajouté (écriture, légende, numéro, lien) ne sont pas acceptées. Merci d'ajouter une photo de vous sans texte.";

export type RuleViolation = { verdict: "block" | "warn"; category: string; reason: string };

/**
 * Applique les règles de refus. Renvoie la première règle enfreinte
 * (refus d'abord, puis simple signalement à l'équipe en cas de doute),
 * ou null si la photo les respecte toutes.
 * - strict = false (selfie) : seul un problème certain compte, le doute ne
 *   signale rien (le selfie a déjà sa propre vérification « à contrôler »).
 */
export function photoRuleViolation(
  c: PhotoRuleChecks,
  declaredGender: "homme" | "femme" | null | undefined,
  strict = true,
): RuleViolation | null {
  const blocks: [boolean, string, string][] = [
    [c.sexual === "yes", "caractere_sexuel", SEXUAL_CONTENT_REASON],
    [c.shorts === "yes", "short", SHORTS_REASON],
    [c.ai_generated === "yes" || c.filtered === "heavy", "modifiee_ia", AI_EDITED_REASON],
    [c.added_text === "yes", "texte", ADDED_TEXT_REASON],
    [c.too_dark === "yes", "trop_sombre", TOO_DARK_REASON],
    [c.face_complete === "no", "visage_a_moitie", HALF_FACE_REASON],
    [c.face_angle === "profile", "photo_de_profil", PROFILE_VIEW_REASON],
    [
      !!declaredGender && c.apparent_gender !== "unknown" && c.apparent_gender !== declaredGender,
      "sexe_incoherent",
      GENDER_MISMATCH_REASON,
    ],
  ];
  for (const [hit, category, reason] of blocks) if (hit) return { verdict: "block", category, reason };
  if (!strict) return null;
  const warns: [boolean, string, string][] = [
    [c.sexual === "unsure", "caractere_sexuel", SEXUAL_CONTENT_REASON],
    [c.shorts === "unsure", "short", SHORTS_REASON],
    [c.ai_generated === "maybe", "modifiee_ia", AI_EDITED_REASON],
    [c.added_text === "unsure", "texte", ADDED_TEXT_REASON],
    [c.face_complete === "unsure", "visage_a_moitie", HALF_FACE_REASON],
  ];
  for (const [hit, category, reason] of warns) if (hit) return { verdict: "warn", category, reason };
  return null;
}

/** Lit les contrôles renvoyés par l'analyse (valeurs inconnues → neutres). */
export function parsePhotoRuleChecks(p: Record<string, unknown>): PhotoRuleChecks {
  const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(v as T) ? (v as T) : fallback;
  const tri = ["yes", "no", "unsure"] as const;
  return {
    too_dark: pick(p["too_dark"], tri, "no"),
    shorts: pick(p["shorts"], tri, "no"),
    face_complete: pick(p["face_complete"], tri, "yes"),
    face_angle: pick(p["face_angle"], ["front", "three_quarter", "profile", "unknown"] as const, "unknown"),
    apparent_gender: pick(p["apparent_gender"], ["homme", "femme", "unknown"] as const, "unknown"),
    sexual: pick(p["sexual"], tri, "no"),
    added_text: pick(p["added_text"], tri, "no"),
    ai_generated: pick(p["ai_generated"], ["no", "maybe", "yes"] as const, "no"),
    filtered: pick(p["filtered"], ["no", "light", "heavy"] as const, "no"),
  };
}

/** Consignes d'analyse communes (photo et selfie) pour les champs de PhotoRuleChecks. */
export const PHOTO_RULES_PROMPT = `Règles de refus Nooryaa (analyse l'image de la personne) :
- too_dark : "yes" si la photo est prise dans le noir ou si elle est si sombre qu'on distingue mal le visage ; "unsure" si limite ; "no" si l'éclairage est correct.
- shorts : "yes" si la personne porte un short, un bermuda ou une tenue laissant les jambes nues au-dessus du genou (hommes comme femmes) ; "unsure" si on ne voit pas assez ; "no" si les jambes sont couvertes ou ne sont pas visibles (photo de buste, de visage).
- face_complete : "no" si le visage est coupé par le bord de l'image ou à moitié caché (main, cheveux, objet, téléphone, ombre forte sur une moitié) ; "unsure" en cas de doute ; "yes" si le visage entier se voit. Le voile qui couvre les cheveux est accepté ; le niqab est accepté si les yeux se voient bien.
- face_angle : "front" (de face), "three_quarter" (légèrement tourné, les deux yeux visibles), "profile" (pris de côté, un seul œil ou le visage vu de côté), "unknown" si pas de visage.
- apparent_gender : "homme" ou "femme" uniquement si tu es certain du sexe de la personne sur l'image ; "unknown" en cas de doute.
- sexual : "yes" si l'image a un caractère sexuel ou suggestif (pose provocante, tenue moulante ou transparente, sous-vêtements, décolleté marqué, gestes ou regard aguicheurs explicites) ; "unsure" si limite ; "no" sinon.
- added_text : "yes" si du texte est ajouté sur l'image (écriture, légende, citation, numéro, pseudo, lien, filigrane, autocollant avec texte) ; un texte qui fait naturellement partie de la scène (logo discret sur un vêtement, enseigne au loin) ne compte pas ; "unsure" si doute ; "no" sinon.
- ai_generated : "yes" si l'image est créée ou retouchée par l'IA (visage transformé, peau irréelle, rendu 3D/illustration, traits incohérents), "maybe" si doute, "no" sinon.
- filtered : "no", "light" (retouche légère de lumière/couleur) ou "heavy" (filtre beauté marqué, visage déformé ou transformé, stickers, oreilles d'animaux).`;

/** Résumé lisible des règles communes pour le journal de modération. */
export function checksSummary(c: PhotoRuleChecks | undefined): string {
  if (!c) return "";
  return ` / sombre:${c.too_dark} / short:${c.shorts} / visage entier:${c.face_complete} / orientation:${c.face_angle} / sexe apparent:${c.apparent_gender} / sexuel:${c.sexual} / texte:${c.added_text}`;
}
