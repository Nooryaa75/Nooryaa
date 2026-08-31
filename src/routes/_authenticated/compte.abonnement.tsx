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

type DurationId = "24h" | "7j" | "1m";

const durations: { id: DurationId; label: string; days: number }[] = [
  { id: "24h", label: "24 heures", days: 1 },
  { id: "7j", label: "1 semaine", days: 7 },
  { id: "1m", label: "1 mois", days: 30 },
];

type Feature = string | ((duration: DurationId) => string);

type Plan = {
  id: string;
  emoji: string;
  name: string;
  tagline: string;
  features: Feature[];
  highlight?: boolean;
  prices?: Record<DurationId, number>;
};

const ayaBoosts: Record<DurationId, string> = {
  "24h": "1 Boost",
  "7j": "2 Boosts",
  "1m": "4 Boosts",
};

const plans: Plan[] = [
  {
    id: "gratuit",
    emoji: "🟢",
    name: "Gratuit",
    tagline: "Pour découvrir Nooryaa",
    features: [
      "Accès à tout",
      "Nombre de likes limité à la journée",
      "Fonctionnalités de la messagerie limitées",
    ],
  },
  {
    id: "noor",
    emoji: "🌙",
    name: "NOOR",
    tagline: "L'essentiel pour aller plus loin",
    highlight: true,
    prices: { "24h": 2.99, "7j": 6.99, "1m": 14.99 },
    features: [
      "Likes illimités",
      "Filtres avancés complets",
      "Voir qui a liké le profil",
      "Mode incognito",
    ],
  },
  {
    id: "aya",
    emoji: "✨",
    name: "AYA",
    tagline: "Tout NOOR, et plus encore",
    prices: { "24h": 3.99, "7j": 9.99, "1m": 19.99 },
    features: [
      "Toute la formule NOOR",
      "Priorité maximale dans les recherches",
      (d) => ayaBoosts[d],
      "Super Likes",
    ],
  },
];

const euro = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

function AbonnementPage() {
  const [current, setCurrent] = useState("gratuit");
  const [selectedDuration, setSelectedDuration] = useState<Record<string, DurationId>>({
    noor: "1m",
    aya: "1m",
  });
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
    <div className="space-y-6 max-w-5xl">
      <div className="bg-card rounded-2xl p-6 border border-primary/30 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-serif text-primary">Mon abonnement</h2>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-primary/40 bg-secondary/50 p-4">
          <div className="min-w-0">
            <p className="font-semibold text-primary flex items-center gap-2">
              {currentPlan.emoji} {currentPlan.name} <BadgeCheck className="h-4 w-4 shrink-0" />
            </p>
            <p className="text-sm text-muted-foreground">
              Votre formule actuelle — modifiable à tout moment, sans engagement.
            </p>
          </div>
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-primary bg-primary/10 border border-primary/30 rounded-full px-3 py-1">
            Actif
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-serif text-primary mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> Formules d'abonnement
        </h3>
        <div className="grid gap-4 md:grid-cols-3 items-start">
          {plans.map((plan) => {
            const active = plan.id === current;
            const duration = selectedDuration[plan.id] ?? "1m";
            const price = plan.prices?.[duration];
            const days = durations.find((d) => d.id === duration)!.days;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl border bg-card p-6 flex flex-col gap-4 transition-colors ${
                  active
                    ? "border-primary shadow-[var(--shadow-card)]"
                    : plan.highlight
                      ? "border-primary/50"
                      : "border-border/60"
                }`}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-serif text-xl text-primary">
                      {plan.emoji} {plan.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                  </div>
                  {active && (
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 border border-primary/30 rounded-full px-2 py-0.5">
                      Actuel
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-3xl font-semibold text-foreground">
                    {price === undefined ? "0 €" : euro(price)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {price === undefined
                      ? "Gratuit, pour toujours"
                      : `soit ${euro(price / days)} / jour`}
                  </p>
                </div>

                {plan.prices ? (
                  <select
                    value={duration}
                    onChange={(e) =>
                      setSelectedDuration((s) => ({
                        ...s,
                        [plan.id]: e.target.value as DurationId,
                      }))
                    }
                    aria-label={`Durée de la formule ${plan.name}`}
                    className="w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm text-foreground"
                  >
                    {durations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label} — {euro(plan.prices![d.id])}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full rounded-xl border border-dashed border-border/60 px-3 py-2.5 text-sm text-muted-foreground">
                    Sans durée ni engagement
                  </div>
                )}

                <button
                  type="button"
                  disabled={active && !plan.prices}
                  onClick={() => {
                    if (!plan.prices) {
                      setCurrent(plan.id);
                      toast.success("Vous êtes revenu à la formule Gratuit.");
                    } else {
                      toast.info(
                        `Paiement sécurisé bientôt disponible : ${plan.name} — ${
                          durations.find((d) => d.id === duration)!.label
                        }.`,
                      );
                    }
                  }}
                  className={`w-full rounded-full px-4 py-2.5 text-sm font-semibold border transition-colors ${
                    active && !plan.prices
                      ? "bg-secondary text-muted-foreground border-border/60 cursor-default"
                      : plan.highlight
                        ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
                        : "bg-background text-primary border-primary/50 hover:bg-primary/10"
                  }`}
                >
                  {active && !plan.prices ? "Formule actuelle" : "Sélectionner"}
                </button>

                <ul className="space-y-2 text-sm border-t border-border/60 pt-4">
                  {plan.features.map((f, idx) => {
                    const label = typeof f === "function" ? f(duration) : f;
                    return (
                      <li key={`${plan.id}-feature-${idx}`} className="flex gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Plus la durée choisie est longue, moins le tarif journalier est élevé. Vous pouvez changer ou
        résilier votre formule à tout moment. Rien ne vous sera facturé sans votre accord.
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
