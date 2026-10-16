// Langue dans laquelle l'analyse automatique (messages, vocaux, photos, selfies)
// doit s'adresser au membre. Le journal de modération, lui, reste en français
// pour que l'équipe lise toujours la même chose.

export type MemberLocale = "fr" | "en" | "ar";

const LANGUAGE_NAMES: Record<MemberLocale, string> = {
  fr: "français",
  en: "anglais",
  ar: "arabe",
};

/** Normalise la langue envoyée par l'application (défaut : français). */
export function asMemberLocale(value: unknown): MemberLocale {
  return value === "en" || value === "ar" ? value : "fr";
}

/** Consigne ajoutée au prompt d'analyse automatique. */
export function memberLanguageRule(value: unknown): string {
  const language = LANGUAGE_NAMES[asMemberLocale(value)];
  return `La phrase "reason" doit être écrite en ${language} et s'adresser directement à la personne. "reason_fr" reprend exactement la même phrase en français, pour l'équipe de modération.`;
}
