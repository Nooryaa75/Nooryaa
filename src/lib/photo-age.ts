/**
 * Écart entre l'âge apparent sur une photo et l'âge déclaré dans la fiche.
 *
 * Règle produit : un écart moyen laisse passer la photo (une photo un peu
 * ancienne ne doit pas pénaliser une personne honnête). Seuls un écart
 * important (plus de 10 ans) ou une personne paraissant mineure sont refusés.
 */

export type AgeMatch = "ok" | "doubt" | "mismatch" | "unknown";

/** Au-delà de cet écart, la photo est refusée. */
export const MAX_AGE_GAP = 10;

/** Âge minimal autorisé sur la plateforme. */
export const MIN_ADULT_AGE = 18;

/** Écart (en années) entre l'âge déclaré et la fourchette apparente, 0 si elle l'inclut. */
export function ageGap(declaredAge: number, apparentMin: number, apparentMax: number): number {
  if (declaredAge < apparentMin) return apparentMin - declaredAge;
  if (declaredAge > apparentMax) return declaredAge - apparentMax;
  return 0;
}

/**
 * Qualifie l'écart. `doubt` (écart moyen) reste informatif : il ne bloque pas
 * et ne signale rien à la modération.
 */
export function ageGapMatch(
  declaredAge: number,
  apparentMin: number,
  apparentMax: number,
): AgeMatch {
  if (apparentMin <= 0 || apparentMax <= 0 || !Number.isFinite(declaredAge)) return "unknown";
  const gap = ageGap(declaredAge, apparentMin, apparentMax);
  if (gap === 0) return "ok";
  return gap <= MAX_AGE_GAP ? "ok" : "mismatch";
}

/** Une photo sur laquelle personne n'atteint l'âge adulte est refusée. */
export function appearsMinor(apparentMin: number, apparentMax: number): boolean {
  return apparentMin > 0 && apparentMax > 0 && apparentMax < MIN_ADULT_AGE;
}
