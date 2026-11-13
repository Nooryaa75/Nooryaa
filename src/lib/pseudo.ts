/**
 * Règle du pseudo :
 * - un seul mot : pas d'espace, pas de phrase ;
 * - au moins 3 lettres (tout alphabet, arabe compris) ; chiffres, « _ », « - »
 *   et « . » sont permis mais ne comptent pas comme lettres ;
 * - 20 caractères au maximum (les voyelles arabes ne comptent pas) ;
 * - le pseudo provisoire « user_… » n'est jamais un vrai pseudo.
 */
export const PSEUDO_MIN_LETTERS = 3;
export const PSEUDO_MAX_LENGTH = 20;
export const PSEUDO_TOO_SHORT =
  "Le pseudo doit être un seul mot, sans espace, avec au moins 3 lettres (20 caractères maximum).";

export function pseudoLetterCount(pseudo: unknown): number {
  if (typeof pseudo !== "string") return 0;
  return (pseudo.match(/\p{L}/gu) ?? []).length;
}

/** Un seul mot : lettres, voyelles arabes, chiffres, « _ », « - » ou « . ». */
export function pseudoSingleWord(pseudo: unknown): boolean {
  if (typeof pseudo !== "string") return false;
  return /^[\p{L}\p{M}\p{N}_.-]+$/u.test(pseudo.trim());
}

export function pseudoValid(pseudo: unknown): boolean {
  if (typeof pseudo !== "string") return false;
  const p = pseudo.trim();
  const length = p.replace(/\p{M}/gu, "").length;
  return (
    p.length > 0 &&
    !p.startsWith("user_") &&
    pseudoSingleWord(p) &&
    length <= PSEUDO_MAX_LENGTH &&
    pseudoLetterCount(p) >= PSEUDO_MIN_LETTERS
  );
}
