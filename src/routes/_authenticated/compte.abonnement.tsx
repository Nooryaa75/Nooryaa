import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, CreditCard, Heart, MessageCircle, Search, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/compte/abonnement")({
  head: () => ({ meta: [{ title: "Mon abonnement — Nooryaa" }] }),
  component: AbonnementPage,
});

function AbonnementPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-card rounded-2xl p-6 border border-primary/30 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-serif text-primary">Mon abonnement</h2>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-primary/40 bg-secondary/50 p-4">
          <div>
            <p className="font-semibold text-primary flex items-center gap-2">
              Abonnement gratuit <BadgeCheck className="h-4 w-4" />
            </p>
            <p className="text-sm text-muted-foreground">Votre formule actuelle — sans engagement.</p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-primary bg-primary/10 border border-primary/30 rounded-full px-3 py-1">
            Actif
          </span>
        </div>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2"><Search className="h-4 w-4 text-primary" /> Recherche et filtres avancés</li>
          <li className="flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /> Likes illimités</li>
          <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" /> Messagerie illimitée</li>
          <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Vérification de profil par selfie</li>
        </ul>
      </div>
      <p className="text-xs text-muted-foreground">
        Nooryaa est actuellement en abonnement gratuit. Si des formules payantes sont proposées à
        l'avenir, vous serez informé ici et rien ne vous sera facturé sans votre accord.
      </p>
    </div>
  );
}
