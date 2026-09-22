import { createFileRoute, redirect } from "@tanstack/react-router";
import { adminCheckAuth } from "@/lib/admin.functions";
import { AdminNav } from "@/components/AdminNav";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/rgpd")({
  ssr: false,
  head: () => ({ meta: [{ title: "Registre RGPD — Admin Nooryaa" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminRgpd,
});

type Row = {
  traitement: string;
  finalite: string;
  base: string;
  donnees: string;
  duree: string;
  destinataires: string;
};

const REGISTRE: Row[] = [
  {
    traitement: "Gestion des comptes membres",
    finalite: "Création, authentification et gestion du compte",
    base: "Exécution du contrat",
    donnees: "Identité, email, téléphone, date de naissance, mot de passe chiffré",
    duree: "Durée de vie du compte ; suppression sous 30 jours après clôture ; anonymisation après 3 ans d'inactivité",
    destinataires: "BK Company ; hébergeur GitHub (UE, Francfort)",
  },
  {
    traitement: "Mise en relation (matchmaking)",
    finalite: "Recherche de profils, swipe, likes, matchs, recommandations",
    base: "Exécution du contrat",
    donnees: "Profil, ville et coordonnées GPS de la ville, préférences de recherche, likes",
    duree: "Durée de vie du compte",
    destinataires: "Membres concernés ; BK Company",
  },
  {
    traitement: "Messagerie entre membres",
    finalite: "Échange de messages texte et vocaux après match",
    base: "Exécution du contrat",
    donnees: "Contenu des messages, fichiers audio, accusés de lecture",
    duree: "Supprimés avec le compte",
    destinataires: "Membres de la conversation ; équipe modération en cas de signalement",
  },
  {
    traitement: "Données sensibles (art. 9 RGPD)",
    finalite: "Affichage de la pratique religieuse et de l'objectif de mariage",
    base: "Consentement explicite",
    donnees: "Pratique religieuse, objectif de mariage",
    duree: "Jusqu'au retrait par le membre ou suppression du compte",
    destinataires: "Membres autorisés ; BK Company",
  },
  {
    traitement: "Vérification d'identité (selfie)",
    finalite: "Garantir l'authenticité des profils, prévenir les faux comptes",
    base: "Intérêt légitime",
    donnees: "Selfie transmis pour comparaison (non conservé), statut de vérification",
    duree: "Selfie non conservé ; statut conservé avec le compte",
    destinataires: "BK Company ; outil d'analyse automatisée",
  },
  {
    traitement: "Modération des contenus",
    finalite: "Contrôle des photos, bios, messages signalés et vocaux",
    base: "Intérêt légitime",
    donnees: "Contenus publiés, signalements, preuves de modération",
    duree: "Signalements et preuves : 1 an",
    destinataires: "Équipe de modération BK Company",
  },
  {
    traitement: "Abonnements et facturation",
    finalite: "Gestion des formules payantes et justificatifs comptables",
    base: "Exécution du contrat ; obligation légale",
    donnees: "Formule souscrite, montants, dates, historique d'achat",
    duree: "Factures : 10 ans (obligation comptable)",
    destinataires: "BK Company ; prestataire de paiement",
  },
  {
    traitement: "Emails transactionnels et notifications",
    finalite: "Confirmation d'inscription, alertes de match/message, emails de compte",
    base: "Exécution du contrat ; consentement (marketing)",
    donnees: "Email, prénom, locale, préférences de notification",
    duree: "Durée de vie du compte ; consentements : 3 ans",
    destinataires: "Resend (envoi d'emails)",
  },
  {
    traitement: "Mesure d'audience (visites)",
    finalite: "Statistiques de fréquentation, pages vues, ville approximative, provenance",
    base: "Consentement (bandeau cookies)",
    donnees: "Pages visitées, ville/région/pays approximatifs, referrer, horodatage",
    duree: "Jusqu'au retrait du consentement ou purge manuelle",
    destinataires: "BK Company uniquement",
  },
  {
    traitement: "Registre des consentements",
    finalite: "Preuve de l'acceptation des CGU, de la politique de confidentialité et des cookies",
    base: "Obligation légale (responsabilité, art. 7 RGPD)",
    donnees: "Type de consentement, version, langue, date",
    duree: "3 ans à compter du recueil",
    destinataires: "BK Company",
  },
  {
    traitement: "Support et contact",
    finalite: "Traitement des demandes d'assistance et tickets",
    base: "Exécution du contrat ; intérêt légitime",
    donnees: "Email, contenu des échanges, historique des tickets",
    duree: "Durée de vie du compte, sauf contentieux",
    destinataires: "Équipe support BK Company",
  },
  {
    traitement: "Administration et sécurité",
    finalite: "Journalisation des accès administrateurs, suspension et bannissement",
    base: "Intérêt légitime",
    donnees: "Actions d'administration, statuts de compte, journaux techniques",
    duree: "Durée de vie du compte",
    destinataires: "Administrateurs BK Company",
  },
];

function AdminRgpd() {
  return (
    <div className="min-h-screen mosaic-soft">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-serif text-primary flex items-center gap-2">
            <ShieldCheck className="h-7 w-7" /> Registre des traitements (RGPD)
          </h1>
          <p className="text-sm text-muted-foreground">
            Documentation interne exigée par l'article 30 du RGPD : finalités, bases légales, durées et destinataires de chaque traitement.
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border/60 p-5 text-sm space-y-1">
          <p><span className="font-semibold">Responsable du traitement :</span> BK Company, 7 bis allée de Chelles, 93340 Le Raincy — RCS Bobigny 130 260 730</p>
          <p><span className="font-semibold">Contact données personnelles :</span> contact@nooryaa.com</p>
          <p><span className="font-semibold">Hébergement :</span> Union européenne — centres de données de Francfort (Allemagne, région eu-central-1), via GitHub</p>
          <p><span className="font-semibold">Sous-traitants :</span> GitHub (hébergement/base de données, UE) · Resend (emails transactionnels) · outil d'analyse automatisée (modération)</p>
          <p className="text-muted-foreground">Dernière revue du registre : septembre 2026</p>
        </div>

        <div className="bg-card rounded-2xl border border-border/60 overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-border/60 text-left">
                <th className="p-3 font-semibold">Traitement</th>
                <th className="p-3 font-semibold">Finalité</th>
                <th className="p-3 font-semibold">Base légale</th>
                <th className="p-3 font-semibold">Données</th>
                <th className="p-3 font-semibold">Durée</th>
                <th className="p-3 font-semibold">Destinataires</th>
              </tr>
            </thead>
            <tbody>
              {REGISTRE.map((r) => (
                <tr key={r.traitement} className="border-b border-border/40 align-top">
                  <td className="p-3 font-medium">{r.traitement}</td>
                  <td className="p-3 text-muted-foreground">{r.finalite}</td>
                  <td className="p-3">{r.base}</td>
                  <td className="p-3 text-muted-foreground">{r.donnees}</td>
                  <td className="p-3 text-muted-foreground">{r.duree}</td>
                  <td className="p-3 text-muted-foreground">{r.destinataires}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
