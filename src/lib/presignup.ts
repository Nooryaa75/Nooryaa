// Réponses de l'inscription guidée (avant la création du compte).
// Elles sont conservées dans le navigateur puis reprises par la fiche
// profil après confirmation de l'email ou connexion Google / Apple.

export type PresignupAnswers = {
  gender?: "homme" | "femme";
  pseudo?: string;
  birthdate?: string;
  origins?: string[];
  city?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
};

const KEY = "nooryaa-presignup";

export function loadPresignup(): PresignupAnswers {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as PresignupAnswers) : {};
  } catch {
    return {};
  }
}

export function savePresignup(answers: PresignupAnswers) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(answers));
  } catch {
    /* stockage indisponible : on ignore */
  }
}

export function clearPresignup() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
