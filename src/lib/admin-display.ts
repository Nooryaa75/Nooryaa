import { GEO_TRANSLATIONS } from "./geo-catalog";

const frenchPlaces = new Map<string, string>();
const placeKey = (value: string) => value.trim().normalize("NFC").toLocaleLowerCase("fr-FR");

// Preserve canonical French names before registering foreign aliases.
for (const french of Object.keys(GEO_TRANSLATIONS)) frenchPlaces.set(placeKey(french), french);
for (const [french, translations] of Object.entries(GEO_TRANSLATIONS)) {
  for (const alias of Object.values(translations)) {
    const key = placeKey(alias);
    if (!frenchPlaces.has(key)) frenchPlaces.set(key, french);
  }
}

export function frenchPlace(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.split(/([(),،])/).map((part) => {
    if (/^[(),،]$/.test(part)) return part === "،" ? "," : part;
    const translated = frenchPlaces.get(placeKey(part));
    if (!translated) return part;
    return `${part.match(/^\s*/)?.[0] ?? ""}${translated}${part.match(/\s*$/)?.[0] ?? ""}`;
  }).join("");
}

export const PROFILE_STATUS_LABELS: Record<string, string> = {
  active: "Actif", suspended: "Suspendu", banned: "Banni",
};

export const REPORT_STATUS_LABELS: Record<string, string> = {
  open: "Ouvert", reviewed: "Examiné", resolved: "Résolu", dismissed: "Classé sans suite", closed: "Fermé",
};