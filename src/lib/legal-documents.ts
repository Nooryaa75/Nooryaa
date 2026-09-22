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
  { title: "1. Responsable du traitement", body: "Le responsable du traitement de vos données est la société BK Company, 7 bis allée de Chelles, 93340 Le Raincy, immatriculée au RCS de Bobigny sous le n° 130 260 730, éditrice de l'application Nooryaa. Pour toute question relative à vos données personnelles ou pour exercer vos droits, vous pouvez écrire à contact@nooryaa.com. Nous répondons à chaque demande dans un délai maximum d'un mois." },
  { title: "2. Données collectées", body: "Dans le cadre du service, Nooryaa collecte les données que vous renseignez : identité (prénom, nom, pseudo), coordonnées (email, téléphone), date de naissance, localisation approximative (ville, coordonnées GPS de votre ville), informations de profil (pratique religieuse, situation familiale, activités, photos) ainsi que vos échanges via la messagerie. Certaines de ces informations (pratique religieuse, orientation vers le mariage) constituent des données sensibles au sens de l'article 9 du RGPD : elles sont traitées uniquement sur la base de votre consentement explicite, que vous donnez en renseignant votre profil et que vous pouvez retirer à tout moment en supprimant ces informations ou votre compte." },
  { title: "3. Finalités et bases légales", body: "Exécution du contrat : création et gestion de votre compte, mise en relation, messagerie, abonnements. Consentement : données de profil sensibles, mesure d'audience, notifications marketing. Intérêt légitime : sécurité du service, prévention des faux comptes et des fraudes, modération. Obligation légale : conservation des justificatifs de facturation." },
  { title: "4. Vérification par selfie", body: "La photo de vérification (selfie) est transmise uniquement pour comparaison avec vos photos de profil. Elle n'est ni enregistrée, ni conservée : seul le statut de vérification (vérifié / non vérifié) est conservé sur votre compte." },
  { title: "5. Destinataires, sous-traitants et hébergement", body: "Vos données ne sont ni vendues, ni louées, ni partagées à des fins publicitaires. Vos données sont hébergées au sein de l'Union européenne, dans des centres de données situés à Francfort (Allemagne, région eu-central-1), par l'intermédiaire de notre prestataire technique d'hébergement et de base de données (Lovable Cloud). Nous faisons appel à des sous-traitants techniques encadrés par des contrats conformes à l'article 28 du RGPD : hébergement et base de données (Union européenne), envoi des emails transactionnels (Resend), analyse automatisée des photos et messages pour la modération. Lorsqu'un transfert hors Union européenne est nécessaire, il est encadré par les clauses contractuelles types de la Commission européenne." },
  { title: "6. Durées de conservation", body: "Compte actif : vos données sont conservées tant que votre compte existe. Compte inactif : suppression ou anonymisation après 3 ans sans connexion. Compte supprimé : effacement sous 30 jours. Messages : supprimés avec le compte. Signalements et preuves de modération : 1 an. Consentements : 3 ans à compter de leur recueil. Factures : 10 ans (obligation comptable)." },
  { title: "7. Vos droits", body: "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition, ainsi que du droit de retirer votre consentement à tout moment. Vous pouvez télécharger l'intégralité de vos données et gérer vos consentements depuis Mon compte → Mes données personnelles, corriger vos informations depuis Mon profil et supprimer votre compte à tout moment. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr)." },
  { title: "8. Sécurité", body: "Nous mettons en œuvre des mesures techniques et organisationnelles appropriées : chiffrement des échanges, contrôle d'accès, règles de sécurité au niveau de la base de données, journalisation des accès administrateurs et vérification systématique de l'identité des membres." },
  { title: "9. Cookies et mesure d'audience", body: "L'application utilise les cookies et stockages locaux strictement nécessaires à son fonctionnement (session de connexion, préférences, langue). Une mesure d'audience interne (pages visitées, ville approximative, provenance) n'est activée qu'avec votre accord et peut être refusée ou retirée à tout moment depuis le bandeau cookies ou Mon compte → Mes données personnelles. Aucun cookie publicitaire tiers n'est utilisé." },
  { title: "10. Mineurs", body: "Le service est strictement réservé aux personnes majeures. Aucun compte n'est ouvert sciemment à une personne de moins de 18 ans ; tout compte identifié comme tel est supprimé sans délai." },
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