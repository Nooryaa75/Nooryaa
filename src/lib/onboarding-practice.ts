// Questions de pratique religieuse de la fiche d'inscription.
// Règle (Karim, 22 oct. 2026) : toutes ces questions sont obligatoires.
// « Portez-vous le voile ? » ne concerne que les femmes.

export type PracticeAnswers = {
  gender: string;
  salat_quotidienne: boolean | null;
  ramadan: boolean | null;
  hadj: boolean | null;
  omra: boolean | null;
  porte_voile: boolean | null;
};

export function practiceChecks(form: PracticeAnswers): [string, boolean][] {
  return [
    ["Salat quotidienne", form.salat_quotidienne !== null],
    ["Ramadan", form.ramadan !== null],
    ["Avez-vous fait le Hadj ?", form.hadj !== null],
    ["Avez-vous fait la Omra ?", form.omra !== null],
    ["Portez-vous le voile ?", form.gender !== "femme" || form.porte_voile !== null],
  ];
}
