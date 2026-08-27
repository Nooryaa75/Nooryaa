import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/compte/cgu")({
  head: () => ({ meta: [{ title: "Conditions Générales d'Utilisation — Nooryaa" }] }),
  component: CguPage,
});

const sections = [
  {
    title: "1. Objet",
    body: "Les présentes Conditions Générales d'Utilisation (CGU) encadrent l'accès et l'utilisation de l'application Nooryaa, service de mise en relation destiné aux personnes majeures recherchant une relation sincère tournée vers le dîn. En créant un compte, vous acceptez sans réserve les présentes CGU.",
  },
  {
    title: "2. Conditions d'accès",
    body: "L'inscription est réservée aux personnes âgées d'au moins 18 ans. Vous vous engagez à fournir des informations exactes, à jour et complètes. La vérification de votre profil par selfie est obligatoire : elle permet de garantir l'authenticité des membres. Un seul compte par personne est autorisé.",
  },
  {
    title: "3. Règles de conduite (Adab)",
    body: "Les échanges sur Nooryaa doivent respecter un cadre de bienveillance et d'adab. Sont notamment interdits : les propos ou contenus à caractère sexuel, haineux, discriminatoire ou violent ; le harcèlement ; l'usurpation d'identité ; la sollicitation financière ; la prospection commerciale. Tout manquement peut entraîner la suspension ou la suppression du compte.",
  },
  {
    title: "4. Modération",
    body: "Les contenus publiés (photos, bio, messages signalés) peuvent faire l'objet d'une modération automatique et humaine. Les photos non conformes (nudité, visage incohérent avec l'âge déclaré, image générée par IA) sont refusées. Les signalements des membres sont traités par notre équipe de modération.",
  },
  {
    title: "5. Propriété intellectuelle",
    body: "L'ensemble des éléments de l'application (marque, logo, charte graphique, textes) est la propriété exclusive de Nooryaa. Toute reproduction ou utilisation sans autorisation est interdite. Vous conservez les droits sur les contenus que vous publiez, tout en accordant à Nooryaa une licence d'utilisation nécessaire au fonctionnement du service.",
  },
  {
    title: "6. Suspension et suppression de compte",
    body: "Nooryaa se réserve le droit de suspendre ou supprimer tout compte ne respectant pas les présentes CGU, sans préjudice d'éventuelles poursuites. Vous pouvez supprimer votre compte à tout moment depuis votre espace personnel.",
  },
  {
    title: "7. Responsabilité",
    body: "Nooryaa est un service de mise en relation et ne saurait être tenu responsable des échanges ou rencontres entre membres. Nous vous invitons à rester vigilant lors de vos interactions et à privilégier les échanges dans un cadre conforme au dîn (moutabala).",
  },
  {
    title: "8. Modification des CGU",
    body: "Nooryaa peut modifier les présentes CGU à tout moment. Les membres seront informés de toute modification substantielle. La poursuite de l'utilisation du service vaut acceptation des nouvelles conditions.",
  },
];

function CguPage() {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border/60 shadow-[var(--shadow-card)] space-y-5 max-w-3xl">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-serif text-primary">Conditions Générales d'Utilisation</h2>
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
