import type { Locale } from "./locale";

type Reasoned = { reason?: string | null; reasonFr?: string | null } | null | undefined;

/**
 * Message d'avertissement (photo, selfie) affiché dans la langue du membre.
 * - texte fixe du site : traduit par le catalogue ;
 * - texte rédigé par l'analyse automatique dans la langue demandée : gardé tel quel ;
 * - sinon (texte resté en français) : message générique traduit.
 */
export function memberReason(
  result: Reasoned,
  fallbackFr: string,
  locale: Locale,
  translate: (source: string, locale: Locale) => string,
): string {
  const reason = (result?.reason ?? "").trim();
  if (locale === "fr") return reason || fallbackFr;
  if (reason) {
    const translated = translate(reason, locale);
    if (translated !== reason) return translated;
    const fr = (result?.reasonFr ?? "").trim();
    if (fr && fr !== reason) return reason;
  }
  return translate(fallbackFr, locale);
}
