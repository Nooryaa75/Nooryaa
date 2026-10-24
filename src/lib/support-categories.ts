/**
 * Sujets proposés dans « Service client ».
 * Le signalement d'un membre passe par le bouton « Signaler » (fiches, messages),
 * jamais par le service client — il n'est donc volontairement pas listé ici.
 */
export const supportCategories = [
  "Partenariat",
  "Inscription",
  "Connexion / Email",
  "Suppression de compte",
  "Abonnement",
  "Autres",
] as const;

export type SupportCategory = (typeof supportCategories)[number];

export const isSupportCategory = (value: string): value is SupportCategory =>
  (supportCategories as readonly string[]).includes(value);
