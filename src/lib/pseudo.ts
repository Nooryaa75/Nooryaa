/**
 * Règle du pseudo : au moins 3 lettres (tout alphabet, arabe compris).
 * Les chiffres et symboles sont permis mais ne comptent pas comme lettres.
 * Le pseudo provisoire « user_… » n'est jamais un vrai pseudo.
 */
export const PSEUDO_MIN_LETTERS = 3;
export const PSEUDO_TOO_SHORT = "Le pseudo doit contenir au moins 3 lettres.";

export function pseudoLetterCount(pseudo: unknown): number {
  if (typeof pseudo !== "string") return 0;
  return (pseudo.match(/\p{L}/gu) ?? []).length;
}

export function pseudoValid(pseudo: unknown): boolean {
  if (typeof pseudo !== "string") return false;
  const p = pseudo.trim();
  return p.length > 0 && !p.startsWith("user_") && pseudoLetterCount(p) >= PSEUDO_MIN_LETTERS;
}
