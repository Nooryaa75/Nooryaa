/**
 * Réponse à « Voulez-vous des enfants ? ».
 * Le troisième choix « Je ne sais pas » est une vraie réponse : il compte comme
 * renseigné dans la fiche, mais il ne sert jamais de critère de recherche ni de
 * critère de compatibilité.
 */
export const WANTS_CHILDREN_CHOICES = ["oui", "non", "je_ne_sais_pas"] as const;

export type WantsChildrenChoice = (typeof WANTS_CHILDREN_CHOICES)[number] | "";

/** Valeur de formulaire à partir de la base (nouveau texte, ou ancien booléen). */
export function wantsChildrenChoice(value: unknown): WantsChildrenChoice {
  if (value === true) return "oui";
  if (value === false) return "non";
  if (typeof value === "string" && (WANTS_CHILDREN_CHOICES as readonly string[]).includes(value)) {
    return value as WantsChildrenChoice;
  }
  return "";
}

/** true / false pour les filtres et la compatibilité ; null = sans réponse ou « je ne sais pas ». */
export function wantsChildrenBool(value: unknown): boolean | null {
  const choice = wantsChildrenChoice(value);
  if (choice === "oui") return true;
  if (choice === "non") return false;
  return null;
}

/** Libellé à afficher sur une fiche ; undefined quand la question n'a pas de réponse. */
export function wantsChildrenLabel(value: unknown): string | undefined {
  const choice = wantsChildrenChoice(value);
  if (!choice) return undefined;
  if (choice === "oui") return "Oui";
  if (choice === "non") return "Non";
  return "Je ne sais pas";
}

/** La question est considérée renseignée dès qu'un des trois choix est sélectionné. */
export function wantsChildrenAnswered(value: unknown): boolean {
  return wantsChildrenChoice(value) !== "";
}
