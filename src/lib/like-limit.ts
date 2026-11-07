// Limite quotidienne de likes (version gratuite) : appliquée par la base de
// données au moment du like ; ce module ne sert qu'à reconnaître le refus et
// à l'expliquer au membre.

/** Nombre de likes par jour pour tout le monde (hommes et femmes) en version gratuite. */
export const FREE_DAILY_LIKES = 5;

export const LIKE_LIMIT_MESSAGE =
  "Vous avez utilisé vos 5 likes du jour. Revenez demain pour liker de nouveaux profils.";

/** Le refus vient-il de la limite quotidienne de likes ? */
export function isLikeLimitError(error: { message?: string | null } | null | undefined): boolean {
  return !!error?.message && error.message.includes("LIKE_LIMIT_REACHED");
}
