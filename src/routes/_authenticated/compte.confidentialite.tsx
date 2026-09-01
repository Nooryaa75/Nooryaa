import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/compte/confidentialite")({
  head: () => ({ meta: [{ title: "Politique de confidentialité — Nooryaa" }] }),
  component: ConfidentialitePage,
});

const sections = [
  {
    title: "1. Données collectées",
    body: "Dans le cadre du service, Nooryaa collecte les données que vous renseignez : identité (prénom, nom, pseudo), coordonnées (email, téléphone), date de naissance, localisation approximative (ville, coordonnées GPS de votre ville), informations de profil (pratique religieuse, situation familiale, activités, photos) ainsi que vos échanges via la messagerie.",
  },
  {
    title: "2. Finalités",
    body: "Vos données servent exclusivement à : créer et gérer votre compte ; vous proposer des profils compatibles (algorithme de compatibilité et recherche par proximité géographique) ; assurer la modération et la sécurité de la communauté ; vous notifier des likes, messages et événements du service.",
  },
  {
    title: "3. Vérification par selfie",
    body: "La photo de vérification (selfie) est transmise uniquement pour comparaison avec vos photos de profil. Elle n'est ni enregistrée, ni conservée : seul le statut de vérification (vérifié / non vérifié) est conservé sur votre compte.",
  },
  {
    title: "4. Partage des données",
    body: "Vos données ne sont ni vendues, ni partagées avec des tiers à des fins commerciales. Certains traitements (hébergement, analyse de contenu pour la modération) sont réalisés par des sous-traitants techniques soumis à des obligations strictes de confidentialité et de sécurité.",
  },
  {
    title: "5. Conservation",
    body: "Vos données sont conservées tant que votre compte est actif. En cas de suppression du compte, elles sont effacées ou anonymisées dans un délai raisonnable, sauf obligations légales de conservation (par exemple pour les signalements en cours de traitement).",
  },
  {
    title: "6. Vos droits",
    body: "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de portabilité et d'opposition concernant vos données. Vous pouvez exercer ces droits depuis votre espace « Mon compte » ou en nous contactant. Vous pouvez également introduire une réclamation auprès de la CNIL.",
  },
  {
    title: "7. Sécurité",
    body: "Nous mettons en œuvre des mesures techniques et organisationnelles appropriées : chiffrement des échanges, contrôle d'accès, règles de sécurité au niveau de la base de données, et vérification systématique de l'identité des membres.",
  },
  {
    title: "8. Cookies",
    body: "L'application utilise uniquement les cookies et stockages locaux strictement nécessaires à son fonctionnement (session de connexion, préférences). Aucun cookie publicitaire ou de suivi tiers n'est utilisé.",
  },
];

function ConfidentialitePage() {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border/60 shadow-[var(--shadow-card)] space-y-5 max-w-3xl">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-serif text-primary">Politique de confidentialité</h2>
      </div>
      <p className="text-xs text-muted-foreground">Dernière mise à jour : août 2026</p>
      {sections.map((s) => (
        <section key={s.title} className="space-y-1.5">
          <h3 className="font-semibold">{s.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
        </section>
      ))}
    </div>
  );
}
