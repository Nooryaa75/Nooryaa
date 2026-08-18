export const PRACTICE_LABELS: Record<string, string> = {
  tres_pratiquant: "Très pratiquant·e",
  pratiquant: "Pratiquant·e",
  en_apprentissage: "En apprentissage",
  non_pratiquant: "Non pratiquant·e",
};

export const MARITAL_LABELS: Record<string, string> = {
  celibataire: "Célibataire",
  divorce: "Divorcé·e",
  veuf: "Veuf·ve",
};

export const GENDER_LABELS: Record<string, string> = {
  homme: "Homme",
  femme: "Femme",
};

export const EDUCATION_LEVELS = [
  "Sans diplôme",
  "Secondaire / Brevet",
  "Baccalauréat",
  "Bac +2",
  "Bac +3 / Licence",
  "Bac +5 / Master",
  "Doctorat",
] as const;

export const OBJECTIVES = [
  "Mariage rapide (insha'Allah)",
  "Faire connaissance pour mariage",
  "Trouver un·e partenaire sérieux·se",
  "Échanger d'abord, voir ensuite",
] as const;

export const RELIGION_OPTIONS = [
  "Islam (sunnite)",
  "Islam (chiite)",
  "Islam (autre)",
  "Islam",
] as const;

export function ageFromBirthdate(birthdate: string | null): number | null {
  if (!birthdate) return null;
  const d = new Date(birthdate);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

/** Date maximale autorisée (18 ans révolus), recalculée à chaque appel. */
export function maxBirthdate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
}

export function minBirthdate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 90);
  return d.toISOString().slice(0, 10);
}

export function isAdult(birthdate: string): boolean {
  if (!birthdate) return false;
  return birthdate <= maxBirthdate();
}

export const COUNTRIES = [
  "France", "Belgique", "Suisse", "Luxembourg", "Canada", "Royaume-Uni",
  "Allemagne", "Pays-Bas", "Espagne", "Italie", "Maroc", "Algérie", "Tunisie",
  "Sénégal", "Mali", "Côte d'Ivoire", "Guinée", "Mauritanie", "Comores",
  "Turquie", "Égypte", "Liban", "Syrie", "Jordanie", "Arabie saoudite",
  "Émirats arabes unis", "Qatar", "Pakistan", "Bangladesh", "Inde",
  "Indonésie", "Malaisie", "Somalie", "Soudan", "Tchad", "Niger", "Nigéria",
  "Autre",
] as const;

export const CITIES = [
  "Paris / Île-de-France", "Lyon / Rhône-Alpes", "Marseille / PACA",
  "Toulouse / Occitanie", "Lille / Hauts-de-France", "Bordeaux / Nouvelle-Aquitaine",
  "Nantes / Pays de la Loire", "Strasbourg / Grand Est", "Rennes / Bretagne",
  "Montpellier", "Nice", "Rouen / Normandie", "Dijon / Bourgogne",
  "Clermont-Ferrand / Auvergne", "Orléans / Centre-Val de Loire",
  "Bruxelles", "Genève", "Montréal", "Londres", "Autre / à l'étranger",
] as const;

export const PROFESSIONS = [
  "Étudiant·e", "Santé / médical", "Enseignement / éducation",
  "Informatique / tech", "Ingénierie", "Commerce / vente", "Comptabilité / finance",
  "Droit / juridique", "Fonction publique", "Artisanat / BTP", "Transport / logistique",
  "Restauration / hôtellerie", "Entrepreneur·e / indépendant·e", "Social / associatif",
  "Sécurité", "Agriculture", "Au foyer", "Sans emploi actuellement", "Autre",
] as const;

export const ACTIVITIES_OPTIONS = [
  "Lecture / Coran", "Sport / fitness", "Voyages", "Cuisine", "Nature / randonnée",
  "Sciences islamiques", "Bénévolat / caritatif", "Arts / musique halal",
  "Technologie", "Famille / enfants", "Entrepreneuriat", "Langues",
] as const;