// Textes et calculs d'affichage du détail d'un événement de modération
// (administration). Aucune lecture ni écriture : fonctions pures.

export type ModerationKind = "message" | "vocal" | "photo" | "selfie" | "identite";

export const MODERATION_KIND_LABELS: Record<ModerationKind, string> = {
  message: "Message écrit",
  vocal: "Message vocal",
  photo: "Photo de profil",
  selfie: "Selfie de vérification",
  identite: "Ressemblance photo / selfie",
};

export function moderationKind(e: { source?: string | null; categories?: string[] | null }): ModerationKind {
  const cats = e.categories ?? [];
  if (e.source === "voice") return "vocal";
  if (e.source === "photo") {
    if (cats.includes("selfie_verification")) return "selfie";
    if (cats.includes("photo_identity")) return "identite";
    return "photo";
  }
  return "message";
}

const CHECK_VALUES: Record<string, string> = {
  yes: "Oui",
  no: "Non",
  maybe: "Peut-être",
  unsure: "Incertain",
  unknown: "Inconnu",
  heavy: "Forts",
  light: "Légers",
  none: "Aucun",
  match: "Cohérent",
  mismatch: "Incohérent",
  true: "Oui",
  false: "Non",
};

const translateValue = (v: string) =>
  v
    .replace(/\s*vs déclaré:\s*/g, " · âge déclaré ")
    .replace(/\(ok\)/g, "(écart accepté)")
    .replace(/\b(yes|no|maybe|unsure|unknown|heavy|light|none|mismatch|match|true|false)\b/g, (w) => CHECK_VALUES[w] ?? w);

/**
 * Transforme le résumé technique d'un contrôle photo/selfie
 * (« Photo de profil — visage:yes / torse nu:no ») en lignes lisibles.
 * Renvoie une liste vide pour un message écrit ou vocal.
 */
export function parseModerationChecks(content: string | null | undefined): { label: string; value: string }[] {
  const text = String(content ?? "");
  const dash = text.indexOf(" — ");
  if (dash < 0) return [];
  const rest = text.slice(dash + 3);
  if (!rest.includes(":")) return [];
  return rest
    .split(" / ")
    .map((part) => {
      const i = part.indexOf(":");
      if (i < 0) return null;
      const label = part.slice(0, i).trim();
      const value = translateValue(part.slice(i + 1).trim());
      if (!label) return null;
      return { label: label.charAt(0).toUpperCase() + label.slice(1), value };
    })
    .filter((x): x is { label: string; value: string } => x !== null);
}

/** Titre du résumé technique (partie avant « — »), ou le texte entier. */
export function moderationContentTitle(content: string | null | undefined): string {
  const text = String(content ?? "");
  const dash = text.indexOf(" — ");
  return dash < 0 ? text : text.slice(0, dash);
}

/** Date de prise d'un selfie d'après son nom « <userId>-2026-11-23T19-31-00-000Z ». */
export function selfieTakenAt(name: string, userId: string): Date | null {
  if (!name.startsWith(`${userId}-`)) return null;
  const stamp = name.slice(userId.length + 1);
  const iso = stamp.replace(/T(\d\d)-(\d\d)-(\d\d)-(\d{3})Z$/, "T$1:$2:$3.$4Z");
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Choisit le selfie analysé lors d'un événement : le dernier pris avant
 * l'événement (le selfie est enregistré juste avant son analyse).
 */
export function selfieForEvent(names: string[], userId: string, eventAt: string): string | null {
  const limit = new Date(eventAt).getTime() + 60_000;
  let best: { name: string; t: number } | null = null;
  for (const name of names) {
    const d = selfieTakenAt(name, userId);
    if (!d) continue;
    const t = d.getTime();
    if (t <= limit && (!best || t > best.t)) best = { name, t };
  }
  return best?.name ?? null;
}
