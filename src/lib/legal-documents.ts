export type LegalDocumentKey = "terms" | "privacy";
export type LegalLocale = "fr" | "en" | "ar";
export type LegalSection = { title: string; body: string };
export type LegalTranslation = { title: string; sections: LegalSection[] };
export type LegalContent = Record<LegalLocale, LegalTranslation>;

import { LEGAL_TRANSLATIONS } from "./legal-translations";

const termsSections: LegalSection[] = [
  { title: "1. Objet", body: "Les présentes Conditions Générales d'Utilisation (CGU) encadrent l'accès et l'utilisation de l'application Nooryaa, service de mise en relation destiné aux personnes majeures recherchant une relation sincère tournée vers le dîn. En créant un compte, vous acceptez sans réserve les présentes CGU." },
  { title: "2. Conditions d'accès", body: "L'inscription est réservée aux personnes âgées d'au moins 18 ans. Vous vous engagez à fournir des informations exactes, à jour et complètes. La vérification de votre profil par selfie est obligatoire : elle permet de garantir l'authenticité des membres. Un seul compte par personne est autorisé." },
  { title: "3. Règles de conduite (Adab)", body: "Les échanges sur Nooryaa doivent respecter un cadre de bienveillance et d'adab. Sont notamment interdits : les propos ou contenus à caractère sexuel, haineux, discriminatoire ou violent ; le harcèlement ; l'usurpation d'identité ; la sollicitation financière ; la prospection commerciale. Tout manquement peut entraîner la suspension ou la suppression du compte." },
  { title: "4. Modération", body: "Les contenus publiés (photos, bio, messages signalés) peuvent faire l'objet d'une modération automatique et humaine. Les photos non conformes (nudité, visage incohérent avec l'âge déclaré, image générée par IA) sont refusées. Les signalements des membres sont traités par notre équipe de modération." },
  { title: "5. Propriété intellectuelle", body: "L'ensemble des éléments de l'application (marque, logo, charte graphique, textes) est la propriété exclusive de Nooryaa. Toute reproduction ou utilisation sans autorisation est interdite. Vous conservez les droits sur les contenus que vous publiez, tout en accordant à Nooryaa une licence d'utilisation nécessaire au fonctionnement du service." },
  { title: "6. Suspension et suppression de compte", body: "Nooryaa se réserve le droit de suspendre ou supprimer tout compte ne respectant pas les présentes CGU, sans préjudice d'éventuelles poursuites. Vous pouvez supprimer votre compte à tout moment depuis votre espace personnel." },
  { title: "7. Responsabilité", body: "Nooryaa est un service de mise en relation et ne saurait être tenu responsable des échanges ou rencontres entre membres. Nous vous invitons à rester vigilant lors de vos interactions et à privilégier les échanges dans un cadre conforme au dîn (moutabala)." },
  { title: "8. Modification des CGU", body: "Nooryaa peut modifier les présentes CGU à tout moment. Les membres seront informés de toute modification substantielle. La poursuite de l'utilisation du service vaut acceptation des nouvelles conditions." },
];

const privacySections: LegalSection[] = [
  { title: "1. Données collectées", body: "Dans le cadre du service, Nooryaa collecte les données que vous renseignez : identité (prénom, nom, pseudo), coordonnées (email, téléphone), date de naissance, localisation approximative (ville, coordonnées GPS de votre ville), informations de profil (pratique religieuse, situation familiale, activités, photos) ainsi que vos échanges via la messagerie." },
  { title: "2. Finalités", body: "Vos données servent exclusivement à : créer et gérer votre compte ; vous proposer des profils compatibles (algorithme de compatibilité et recherche par proximité géographique) ; assurer la modération et la sécurité de la communauté ; vous notifier des likes, messages et événements du service." },
  { title: "3. Vérification par selfie", body: "La photo de vérification (selfie) est transmise uniquement pour comparaison avec vos photos de profil. Elle n'est ni enregistrée, ni conservée : seul le statut de vérification (vérifié / non vérifié) est conservé sur votre compte." },
  { title: "4. Partage des données", body: "Vos données ne sont ni vendues, ni partagées avec des tiers à des fins commerciales. Certains traitements (hébergement, analyse de contenu pour la modération) sont réalisés par des sous-traitants techniques soumis à des obligations strictes de confidentialité et de sécurité." },
  { title: "5. Conservation", body: "Vos données sont conservées tant que votre compte est actif. En cas de suppression du compte, elles sont effacées ou anonymisées dans un délai raisonnable, sauf obligations légales de conservation (par exemple pour les signalements en cours de traitement)." },
  { title: "6. Vos droits", body: "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de portabilité et d'opposition concernant vos données. Vous pouvez exercer ces droits depuis votre espace « Mon compte » ou en nous contactant. Vous pouvez également introduire une réclamation auprès de la CNIL." },
  { title: "7. Sécurité", body: "Nous mettons en œuvre des mesures techniques et organisationnelles appropriées : chiffrement des échanges, contrôle d'accès, règles de sécurité au niveau de la base de données, et vérification systématique de l'identité des membres." },
  { title: "8. Cookies", body: "L'application utilise uniquement les cookies et stockages locaux strictement nécessaires à son fonctionnement (session de connexion, préférences). Aucun cookie publicitaire ou de suivi tiers n'est utilisé." },
];

export const DEFAULT_LEGAL_CONTENT: Record<LegalDocumentKey, LegalContent> = {
  terms: {
    fr: { title: "Conditions Générales d'Utilisation", sections: termsSections },
    en: LEGAL_TRANSLATIONS.en.terms,
    ar: LEGAL_TRANSLATIONS.ar.terms,
  },
  privacy: {
    fr: { title: "Politique de confidentialité", sections: privacySections },
    en: LEGAL_TRANSLATIONS.en.privacy,
    ar: LEGAL_TRANSLATIONS.ar.privacy,
  },
};

export function isLegalContent(value: unknown): value is LegalContent {
  if (!value || typeof value !== "object") return false;
  return (["fr", "en", "ar"] as const).every((locale) => {
    const item = (value as Record<string, unknown>)[locale];
    if (!item || typeof item !== "object") return false;
    const record = item as Record<string, unknown>;
    return typeof record.title === "string" && Array.isArray(record.sections) && record.sections.every((section) => {
      if (!section || typeof section !== "object") return false;
      const row = section as Record<string, unknown>;
      return typeof row.title === "string" && typeof row.body === "string";
    });
  });
}