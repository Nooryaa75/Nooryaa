import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, Check, CreditCard, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/compte/abonnement")({
  head: () => ({ meta: [{ title: "Mon abonnement — Nooryaa" }] }),
  component: AbonnementPage,
});

type Plan = {
  id: string;
  emoji: string;
  name: string;
  price: string;
  period: string;
  tagline?: string;
  features: string[];
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    id: "gratuit",
    emoji: "🟢",
    name: "Gratuit",
    price: "0 €",
    period: "",
    tagline: "Options de base",
    features: [
      "Création du profil",
      "Consultation des profils limitée",
      "Nombre limité de likes",
      "Matchs limités",
      "Messagerie avec les matchs limitée",
    ],
  },
  {
    id: "24h",
    emoji: "🔵",
    name: "24H",
    price: "2,99 €",
    period: "/ 24 heures",
    tagline: "Essentiel pendant 24 heures",
    features: [
      "Likes supplémentaires ou illimités",
      "Filtres avancés",
      "Voir qui a aimé le profil",
      "Profil davantage visible",
    ],
  },
  {
    id: "essentiel",
    emoji: "🟣",
    name: "Essentiel",
    price: "6,99 €",
    period: "/ 7 jours",
    tagline: "Accès Premium pendant 7 jours",
    features: [
      "Likes illimités",
      "Filtres avancés",
      "Voir qui a aimé le profil",
      "Revenir sur un profil précédent",
      "1 Boost",
    ],
  },
  {
    id: "noor",
    emoji: "🌙",
    name: "NOOR",
    price: "14,99 €",
    period: "/ mois",
    tagline: "Tout Essentiel, et plus",
    highlight: true,
    features: [
      "Likes illimités",
      "Filtres avancés complets",
      "Voir qui a aimé le profil",
      "Mode incognito",
      "3 Boosts / mois",
      "Profil prioritaire",
    ],
  },
  {
    id: "aya-plus",
    emoji: "✨",
    name: "AYA+",
    price: "19,99 €",
    period: "/ mois",
    tagline: "Tout NOOR, et plus",
    features: [
      "Priorité maximale dans les recherches",
      "5 Boosts / mois",
      "Super Likes",
      "Filtres exclusifs",
      "Badge Premium",
      "Support prioritaire",
    ],
  },
];

function AbonnementPage() {
  const [current, setCurrent] = useState("gratuit");
  const currentPlan = plans.find((p) => p.id === current)!;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-card rounded-2xl p-6 border border-primary/30 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-serif text-primary">Mon abonnement</h2>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-primary/40 bg-secondary/50 p-4">
          <div>
            <p className="font-semibold text-primary flex items-center gap-2">
              {currentPlan.emoji} {currentPlan.name} <BadgeCheck className="h-4 w-4" />
            </p>
            <p className="text-sm text-muted-foreground">
              Votre formule actuelle — modifiable à tout moment, sans engagement.
            </p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-primary bg-primary/10 border border-primary/30 rounded-full px-3 py-1">
            Actif
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-serif text-primary mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> Formules d'abonnement
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const active = plan.id === current;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-5 flex flex-col gap-3 bg-card transition-colors ${
                  active
                    ? "border-primary shadow-[var(--shadow-card)]"
                    : plan.highlight
                      ? "border-primary/50"
                      : "border-border/60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-serif text-lg text-primary">
                      {plan.emoji} {plan.name}
                    </p>
                    {plan.tagline && (
                      <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                    )}
                  </div>
                  {active && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 border border-primary/30 rounded-full px-2 py-0.5">
                      Actuel
                    </span>
                  )}
                </div>
                <p className="text-2xl font-semibold text-foreground">
                  {plan.price}
                  <span className="text-sm font-normal text-muted-foreground"> {plan.period}</span>
                </p>
                <ul className="space-y-1.5 text-sm flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={active}
                  onClick={() => {
                    if (plan.id === "gratuit") {
                      setCurrent(plan.id);
                      toast.success("Vous êtes revenu à la formule Gratuit.");
                    } else {
                      toast.info(
                        "Le paiement sécurisé arrive bientôt : cette formule sera activable ici.",
                      );
                    }
                  }}
                  className={`w-full rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
                    active
                      ? "bg-secondary text-muted-foreground border-border/60 cursor-default"
                      : "bg-primary text-primary-foreground border-primary hover:opacity-90"
                  }`}
                >
                  {active ? "Formule actuelle" : "Choisir cette formule"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Vous pouvez changer ou résilier votre formule à tout moment. Rien ne vous sera facturé sans
        votre accord.
      </p>
    </div>
  );
}
