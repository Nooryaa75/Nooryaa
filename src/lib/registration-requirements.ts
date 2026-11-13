import { isAdult } from "./profile";
import { wantsChildrenAnswered } from "./wants-children";
import { pseudoValid } from "./pseudo";

type ProfileAnswers = Record<string, unknown>;
const filled = (value: unknown) => typeof value === "string" && value.trim().length > 0;
const answered = (value: unknown) => typeof value === "boolean";

/**
 * Membres déjà entrés : leur pseudo reste accepté tel quel (sauf le pseudo
 * provisoire « user_… »). La règle « un seul mot »
 * s'applique aux nouvelles inscriptions et à tout changement de pseudo.
 */
function pseudoAccepted(p: ProfileAnswers): boolean {
  if (pseudoValid(p.pseudo)) return true;
  const pseudo = typeof p.pseudo === "string" ? p.pseudo.trim() : "";
  return p.onboarded === true && pseudo.length > 0 && !pseudo.startsWith("user_");
}

export function registrationChecks(p: ProfileAnswers): [number, string, boolean][] {
  const origins = Array.isArray(p.countries_origin) ? p.countries_origin : [];
  return [
    [0, "Pseudo (un seul mot, au moins 3 lettres)", pseudoAccepted(p)],
    [0, "Je suis", p.gender === "homme" || p.gender === "femme"],
    [0, "Date de naissance", filled(p.birthdate) && /^\d{4}-\d{2}-\d{2}$/.test(String(p.birthdate)) && isAdult(String(p.birthdate))],
    [0, "Ville de résidence", filled(p.city)],
    [0, "Pays de résidence", filled(p.country)],
    [0, "Pays d'origine", origins.some(filled) || filled(p.country_origin)],
    [0, "Où as-tu grandi ?", filled(p.grew_up)],
    [0, "Situation", ["celibataire", "divorce", "veuf"].includes(String(p.marital_status))],
    [0, "Taille (en cm)", Number(p.height_cm) >= 120 && Number(p.height_cm) <= 230],
    [0, "Avez-vous des enfants ?", answered(p.has_children)],
    [0, "Combien d'enfants ?", p.has_children !== true || (Number.isInteger(Number(p.children_count)) && Number(p.children_count) >= 1)],
    [0, "Voulez-vous des enfants ?", wantsChildrenAnswered(p.wants_children_answer ?? p.wants_children)],
    [1, "Salat quotidienne", answered(p.salat_quotidienne)],
    [1, "Ramadan", answered(p.ramadan)],
    [1, "Avez-vous fait le Hadj ?", answered(p.hadj)],
    [1, "Avez-vous fait la Omra ?", answered(p.omra)],
    [1, "Portez-vous le voile ?", p.gender !== "femme" || answered(p.porte_voile)],
    [2, "Mon objectif sur Nooryaa", filled(p.objective)],
    [2, "À propos de vous (30 à 500 caractères)", filled(p.bio) && String(p.bio).trim().length >= 30 && String(p.bio).length <= 500],
  ];
}

export function registrationComplete(p: ProfileAnswers | null, photoCount: number, validPhone: boolean): boolean {
  return !!p && p.onboarded === true && validPhone && photoCount > 0 &&
    // Photo retirée après validation : compte non validé jusqu'à une nouvelle photo et un nouveau selfie.
    !p.photo_removed_at &&
    // onboarded n'est posé qu'après un selfie accepté : une revérification ultérieure
    // (nouvelle photo à contrôler) ne doit pas renvoyer un membre déjà entré vers l'inscription.
    (p.photo_verified === true || p.photo_verification_status === "pending" || p.onboarded === true) &&
    registrationChecks(p).every(([, , ok]) => ok);
}