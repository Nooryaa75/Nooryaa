import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Check, CreditCard, Sparkles, PauseCircle, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { suspendAccount, deleteAccount } from "@/lib/account.functions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

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
  const [loading, setLoading] = useState<"suspend" | "delete" | null>(null);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();
  const doSuspend = useServerFn(suspendAccount);
  const doDelete = useServerFn(deleteAccount);
  const currentPlan = plans.find((p) => p.id === current)!;

  async function handleSuspend() {
    setLoading("suspend");
    try {
      await doSuspend();
      toast.success("Votre compte est suspendu. Vous allez être déconnecté.");
      await supabase.auth.signOut();
      router.navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e.message || "La suspension a échoué.");
    } finally {
      setLoading(null);
      setSuspendOpen(false);
    }
  }

  async function handleDelete() {
    setLoading("delete");
    try {
      await doDelete();
      toast.success("Votre compte a été supprimé.");
      await supabase.auth.signOut();
      router.navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e.message || "La suppression a échoué.");
    } finally {
      setLoading(null);
      setDeleteOpen(false);
    }
  }

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

      <div className="bg-card rounded-2xl p-6 border border-destructive/30 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h3 className="text-lg font-serif text-destructive">Gestion du compte</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Ces actions affectent votre compte Nooryaa. La suspension est réversible en contactant le
          support ; la suppression est définitive.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <AlertDialog open={suspendOpen} onOpenChange={setSuspendOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="rounded-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10">
                <PauseCircle className="h-4 w-4" />
                Suspendre mon compte
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Suspendre votre compte ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Votre profil sera masqué et vous ne pourrez plus utiliser Nooryaa. Vous pourrez
                  réactiver votre compte ultérieurement en nous contactant.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading === "suspend"}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSuspend}
                  disabled={loading === "suspend"}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {loading === "suspend" ? "Suspension…" : "Oui, suspendre"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="rounded-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
                Supprimer mon compte
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Toutes vos données (profil, photos, messages, likes,
                  recherches) seront définitivement effacées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading === "delete"}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={loading === "delete"}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {loading === "delete" ? "Suppression…" : "Oui, supprimer"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
