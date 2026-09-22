import type { Locale } from "./i18n";

/** Le système impérial n'est utilisé que pour la version anglaise. */
export function isImperial(locale: Locale) {
  return locale === "en";
}

/** Taille stockée en cm -> affichage localisé (5'9" en anglais, 175 cm sinon). */
export function formatHeight(cm: number | null | undefined, locale: Locale): string | null {
  if (cm == null || !Number.isFinite(cm)) return null;
  if (!isImperial(locale)) return `${Math.round(cm)} cm`;
  const totalInches = Math.round(cm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}"`;
}

/** Distance stockée en km -> affichage localisé (miles en anglais). */
export function formatDistance(km: number | null | undefined, locale: Locale): string | null {
  if (km == null || !Number.isFinite(km)) return null;
  if (!isImperial(locale)) return `${Math.round(km)} km`;
  return `${Math.round(km * 0.621371)} mi`;
}

export function heightUnitLabel(locale: Locale) {
  return isImperial(locale) ? "ft/in" : "cm";
}

export function distanceUnitLabel(locale: Locale) {
  return isImperial(locale) ? "mi" : "km";
}
