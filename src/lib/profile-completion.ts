/** Calcule le taux de remplissage d'un profil membre (0–100). */
export type CompletionItem = { key: string; label: string; done: boolean };

const filled = (v: unknown) =>
  Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && String(v).trim() !== "";

export function profileCompletion(p: any): { percent: number; missing: CompletionItem[] } {
  if (!p) return { percent: 0, missing: [] };
  const valeurs = (p.preferences as any)?.valeurs;
  const items: CompletionItem[] = [
    { key: "photo", label: "Photo de profil", done: filled(p.primary_photo_url) },
    { key: "bio", label: "À propos de moi", done: filled(p.bio) && String(p.bio).length >= 30 },
    { key: "city", label: "Ville", done: filled(p.city) },
    { key: "height", label: "Taille", done: filled(p.height_cm) },
    { key: "body", label: "Corpulence", done: filled(p.body_type) },
    { key: "profession", label: "Profession", done: filled(p.profession) },
    { key: "education", label: "Niveau d'études", done: filled(p.education_level) },
    { key: "origin", label: "Pays d'origine", done: filled(p.country_origin) },
    { key: "grew_up", label: "Où as-tu grandi ?", done: filled(p.grew_up) },
    { key: "objective", label: "Mon objectif", done: filled(p.objective) },
    { key: "activities", label: "Centres d'intérêt", done: filled(p.activities) },
    { key: "valeurs", label: "Valeurs importantes", done: filled(valeurs) },
    { key: "personality", label: "Type de personnalité", done: filled(p.personality) },
    { key: "smoker", label: "Fumez-vous ?", done: p.smoker !== null && p.smoker !== undefined },
  ];
  const done = items.filter((i) => i.done).length;
  return { percent: Math.round((done / items.length) * 100), missing: items.filter((i) => !i.done) };
}
