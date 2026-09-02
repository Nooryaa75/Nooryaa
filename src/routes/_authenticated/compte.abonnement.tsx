import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BadgeCheck,
  Check,
  CreditCard,
  Sparkles,
  PauseCircle,
  Trash2,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { suspendAccount, deleteAccount } from "@/lib/account.functions";
import { recordSubscription, cancelSubscription } from "@/lib/subscription.functions";
import { useActivePlans, ACCESS_KEYS, type PublicPlan } from "@/lib/entitlements";
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

const formatDate = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const euro = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

const durationLabel = (days: number) =>
  days <= 0 ? "sans durée" : days === 1 ? "24 heures" : days === 7 ? "1 semaine" : `${days} jours`;

function AbonnementPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const saveSubscription = useServerFn(recordSubscription);
  const cancelSub = useServerFn(cancelSubscription);
  const doSuspend = useServerFn(suspendAccount);
  const doDelete = useServerFn(deleteAccount);

  const { data: plans, isLoading } = useActivePlans();
  const subscriptionsDisabled = !isLoading && (plans?.length ?? 0) === 0;

  const { data: currentSub } = useQuery({
    queryKey: ["my-subscription"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", auth.user.id)
        .eq("status", "active")
        .order("started_at", { ascending: false })
        .limit(1);
      return data?.[0] ?? null;
    },
  });

  const [cancelOpen, setCancelOpen] = useState(false);
  const [loading, setLoading] = useState<"suspend" | "delete" | null>(null);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const currentPlan: PublicPlan | null =
    (plans ?? []).find((p) => p.code === currentSub?.plan_code) ?? null;
  const renewsAt = currentSub?.ends_at ? new Date(currentSub.ends_at as string) : null;
  const autoRenew = Boolean(currentSub?.auto_renew) && !currentSub?.cancelled_at;

  async function choosePlan(plan: PublicPlan) {
    try {
      await saveSubscription({
        data: {
          planCode: plan.code,
          amountTtc: plan.price_ttc,
          days: plan.duration_days,
          autoRenew: plan.price_ttc > 0,
        },
      });
      qc.invalidateQueries({ queryKey: ["my-subscription"] });
      toast.success(
        plan.price_ttc > 0
          ? `Formule ${plan.name} activée — ${durationLabel(plan.duration_days)}.`
          : `Vous êtes passé à la formule ${plan.name}.`,
      );
    } catch (e: any) {
      toast.error(e?.message ?? "Le changement de formule a échoué.");
    }
  }

  async function handleCancelSubscription() {
    try {
      await cancelSub();
      qc.invalidateQueries({ queryKey: ["my-subscription"] });
      toast.success(
        renewsAt
          ? `Renouvellement annulé. Accès conservé jusqu'au ${formatDate(renewsAt)}.`
          : "Renouvellement automatique annulé.",
      );
    } catch (e: any) {
      toast.error(e?.message ?? "L'annulation a échoué.");
    } finally {
      setCancelOpen(false);
    }
  }

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
      <div className="relative flex items-center justify-center">
        <Link to="/compte" aria-label="Retour" className="absolute left-0 text-primary">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-primary">Mon abonnement</h1>
      </div>

      {subscriptionsDisabled ? (
        <div className="bg-card rounded-2xl p-6 border border-primary/30 shadow-[var(--shadow-card)] space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-serif text-primary">Accès complet offert</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Aucun abonnement n'est actuellement proposé : vous profitez de l'intégralité de Nooryaa,
            sans limite ni restriction.
          </p>
          <ul className="grid sm:grid-cols-2 gap-2 text-sm">
            {ACCESS_KEYS.map((a) => (
              <li key={a.key} className="flex gap-2">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{a.label}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-2xl p-6 border border-primary/30 shadow-[var(--shadow-card)] space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-serif text-primary">Ma formule actuelle</h2>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-primary/40 bg-secondary/50 p-4">
              <div className="min-w-0">
                <p className="font-semibold text-primary flex items-center gap-2">
                  {currentPlan?.name ?? "Aucune formule"}
                  <BadgeCheck className="h-4 w-4 shrink-0" />
                </p>
                <p className="text-sm text-muted-foreground">
                  {!currentPlan
                    ? "Choisissez une formule ci-dessous — modifiable à tout moment."
                    : autoRenew
                      ? `Renouvellement automatique actif${renewsAt ? ` — prochaine échéance le ${formatDate(renewsAt)}` : ""}.`
                      : `Renouvellement annulé${renewsAt ? ` — accès conservé jusqu'au ${formatDate(renewsAt)}` : ""}.`}
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-primary bg-primary/10 border border-primary/30 rounded-full px-3 py-1">
                {currentPlan ? (autoRenew ? "Actif" : "Se termine") : "—"}
              </span>
            </div>

            {currentPlan && currentPlan.price_ttc > 0 && autoRenew && (
              <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="rounded-full gap-2 border-primary/40 text-primary hover:bg-primary/10">
                    <XCircle className="h-4 w-4" />
                    Annuler mon abonnement
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Annuler le renouvellement automatique ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Votre formule {currentPlan.name} restera active
                      {renewsAt ? ` jusqu'au ${formatDate(renewsAt)}` : " jusqu'à son échéance"}.
                      Aucun nouveau prélèvement ne sera effectué.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Garder mon abonnement</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelSubscription}>Oui, annuler</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <div>
            <h3 className="text-lg font-serif text-primary mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Formules d'abonnement
            </h3>
            <div className="grid gap-4 md:grid-cols-3 items-start">
              {(plans ?? []).map((plan) => {
                const isCurrent = plan.code === currentSub?.plan_code;
                const granted = ACCESS_KEYS.filter((a) => plan.access?.[a.key]);
                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl border bg-card p-6 flex flex-col gap-4 transition-colors ${
                      isCurrent
                        ? "border-primary shadow-[var(--shadow-card)]"
                        : plan.highlight
                          ? "border-primary/50"
                          : "border-border/60"
                    }`}
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                      <div className="min-w-0">
                        <p className="font-serif text-xl text-primary">{plan.name}</p>
                        <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                      </div>
                      {isCurrent && (
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 border border-primary/30 rounded-full px-2 py-0.5">
                          Actuel
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-3xl font-semibold text-foreground">{euro(plan.price_ttc)}</p>
                      <p className="text-sm text-muted-foreground">
                        {plan.price_ttc === 0
                          ? "Gratuit, sans engagement"
                          : `${durationLabel(plan.duration_days)}${plan.duration_days > 0 ? ` — soit ${euro(plan.price_ttc / plan.duration_days)} / jour` : ""}`}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isCurrent}
                      onClick={() => choosePlan(plan)}
                      className={`w-full rounded-full px-4 py-2.5 text-sm font-semibold border transition-colors ${
                        isCurrent
                          ? "bg-secondary text-muted-foreground border-border/60 cursor-default"
                          : plan.highlight
                            ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
                            : "bg-background text-primary border-primary/50 hover:bg-primary/10"
                      }`}
                    >
                      {isCurrent ? "Formule actuelle" : "Sélectionner"}
                    </button>

                    <ul className="space-y-2 text-sm border-t border-border/60 pt-4">
                      {plan.likes_per_day > 0 && (
                        <li className="flex gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>
                            {plan.likes_per_day >= 9999 ? "Likes illimités" : `${plan.likes_per_day} likes par jour`}
                          </span>
                        </li>
                      )}
                      {plan.features.map((f, idx) => (
                        <li key={`${plan.id}-f-${idx}`} className="flex gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                      {granted.map((a) => (
                        <li key={`${plan.id}-${a.key}`} className="flex gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{a.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

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
