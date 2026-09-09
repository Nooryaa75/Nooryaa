import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Check, CreditCard, Sparkles, PauseCircle, Trash2, AlertTriangle, XCircle, RefreshCw, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { suspendAccount, deleteAccount, CLOSURE_REASONS } from "@/lib/account.functions";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { recordSubscription } from "@/lib/subscription.functions";
import { useActivePlans, plansForGender, durationLabel, type PublicPlan } from "@/lib/entitlements";

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
import { frenchError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/compte/abonnement")({
  head: () => ({ meta: [{ title: "Mon abonnement — Nooryaa" }] }),
  component: AbonnementPage,
});

/** Carte affichée au membre : formules de même nom regroupées, une option par durée. */
type PlanGroup = {
  key: string;
  name: string;
  emoji: string;
  tagline: string;
  highlight: boolean;
  free: boolean;
  variants: PublicPlan[];
};

function groupPlans(plans: PublicPlan[]): PlanGroup[] {
  const map = new Map<string, PlanGroup>();
  for (const p of plans) {
    const key = `${p.audience}:${p.name.trim().toLowerCase()}`;
    const g = map.get(key) ?? {
      key,
      name: p.name,
      emoji: p.emoji ?? "",
      tagline: p.tagline ?? "",
      highlight: false,
      free: true,
      variants: [],
    };
    g.variants.push(p);
    g.highlight = g.highlight || p.highlight;
    g.free = g.free && p.price_ttc === 0;
    if (!g.emoji && p.emoji) g.emoji = p.emoji;
    if (!g.tagline && p.tagline) g.tagline = p.tagline;
    map.set(key, g);
  }
  const groups = [...map.values()];
  for (const g of groups) g.variants.sort((a, b) => a.duration_days - b.duration_days || a.sort_order - b.sort_order);
  groups.sort((a, b) => Math.min(...a.variants.map((v) => v.sort_order)) - Math.min(...b.variants.map((v) => v.sort_order)));
  return groups;
}

function autoFeatures(p: PublicPlan): string[] {
  const out: string[] = [];
  out.push(p.likes_per_day < 0 ? "Likes illimités" : `${p.likes_per_day} likes par jour`);
  if (p.messages_per_day >= 0) out.push(`${p.messages_per_day} messages par jour`);
  if (p.super_likes > 0) out.push(`${p.super_likes} super likes`);
  if (p.boosts > 0) out.push(`${p.boosts} boost${p.boosts > 1 ? "s" : ""}`);
  if (p.rewinds !== 0) out.push(p.rewinds < 0 ? "Retours en arrière illimités" : `${p.rewinds} retours en arrière par jour`);
  return out;
}

const formatDate = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const euro = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

function AbonnementPage() {
  const saveSubscription = useServerFn(recordSubscription);
  const [current, setCurrent] = useState<string | null>(null);
  const [autoRenew, setAutoRenew] = useState(false);
  const [renewsAt, setRenewsAt] = useState<Date | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<"suspend" | "delete" | null>(null);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDetails, setSuspendDetails] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteDetails, setDeleteDetails] = useState("");
  const router = useRouter();
  const doSuspend = useServerFn(suspendAccount);
  const doDelete = useServerFn(deleteAccount);
  const { data: dbPlans, isLoading: plansLoading } = useActivePlans();
  const [gender, setGender] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data }, { data: sub }] = await Promise.all([
        supabase.from("profiles").select("gender").eq("id", u.user.id).maybeSingle(),
        supabase
          .from("subscriptions")
          .select("plan_code, auto_renew, ends_at")
          .eq("user_id", u.user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (!alive) return;
      setGender((data?.gender as string | null) ?? null);
      if (sub) {
        setCurrent(sub.plan_code);
        setAutoRenew(sub.auto_renew);
        setRenewsAt(sub.ends_at ? new Date(sub.ends_at) : null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const subscriptionsDisabled = !plansLoading && (dbPlans?.length ?? 0) === 0;
  const visiblePlans = plansForGender(dbPlans ?? [], gender);
  const groups = groupPlans(visiblePlans);
  const freePlan = visiblePlans.find((p) => p.price_ttc === 0) ?? null;
  const currentPlan: PublicPlan | null =
    (dbPlans ?? []).find((p) => p.code === current) ?? freePlan;
  const currentIsPaid = !!currentPlan && currentPlan.price_ttc > 0;


  async function handleSuspend() {
    if (!suspendReason) {
      toast.error("Merci d'indiquer la raison de votre suspension.");
      return;
    }
    setLoading("suspend");
    try {
      await doSuspend({ data: { reason: suspendReason, details: suspendDetails } });
      toast.success("Votre compte est suspendu. Un email de confirmation vous a été envoyé.");
      await supabase.auth.signOut();
      router.navigate({ to: "/" });
    } catch (e: any) {
      toast.error(frenchError(e, "La suspension a échoué."));
    } finally {
      setLoading(null);
      setSuspendOpen(false);
    }
  }

  async function handleDelete() {
    if (!deleteReason) {
      toast.error("Merci d'indiquer la raison de votre départ.");
      return;
    }
    setLoading("delete");
    try {
      await doDelete({ data: { reason: deleteReason, details: deleteDetails } });
      toast.success("Votre compte a été supprimé. Un email de confirmation vous a été envoyé.");
      await supabase.auth.signOut();
      router.navigate({ to: "/" });
    } catch (e: any) {
      toast.error(frenchError(e, "La suppression a échoué."));
    } finally {
      setLoading(null);
      setDeleteOpen(false);
    }
  }

  function handleCancelSubscription() {
    setAutoRenew(false);
    setCancelOpen(false);
    toast.success(
      renewsAt
        ? `Renouvellement automatique annulé. Vous gardez votre formule jusqu'au ${formatDate(renewsAt)}.`
        : "Renouvellement automatique annulé.",
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="relative flex items-center justify-center">
        <Link to="/compte" aria-label="Retour" className="absolute left-0 text-primary">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-primary">Mon abonnement</h1>
      </div>
      <div className="bg-card rounded-2xl border border-primary/30 p-4 shadow-[var(--shadow-card)] space-y-4 sm:p-5 lg:p-6">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-serif text-primary">Mon abonnement</h2>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-xl border border-primary/40 bg-secondary/50 p-4 sm:items-center sm:gap-4">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-primary">
              <span className="shrink-0">{currentPlan ? `${currentPlan.emoji ?? ""} ${currentPlan.name}` : "Accès complet"}</span>
              {currentIsPaid && currentPlan && currentPlan.duration_days > 0 && (
                <span className="text-muted-foreground font-medium">— {durationLabel(currentPlan.duration_days)}</span>
              )}
              <BadgeCheck className="h-4 w-4 shrink-0" />
            </p>
            <p className="text-sm text-muted-foreground">
              {!currentIsPaid
                ? "Votre formule actuelle — modifiable à tout moment, sans engagement."
                : autoRenew
                  ? `Renouvellement automatique actif${renewsAt ? ` — prochaine échéance le ${formatDate(renewsAt)}` : ""}.`
                  : `Renouvellement automatique annulé${renewsAt ? ` — accès conservé jusqu'au ${formatDate(renewsAt)}` : ""}.`}
            </p>
          </div>
          <span className="shrink-0 self-center text-xs font-semibold uppercase tracking-wide text-primary bg-primary/10 border border-primary/30 rounded-full px-3 py-1">
            {currentIsPaid && !autoRenew ? "Se termine" : "Actif"}
          </span>
        </div>

        {currentIsPaid && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {autoRenew ? (
              <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="whitespace-normal rounded-full px-4 py-2.5 leading-tight gap-2 border-primary/40 text-primary hover:bg-primary/10"
                  >
                    <XCircle className="h-4 w-4 shrink-0" />
                    Annuler mon abonnement
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Annuler le renouvellement automatique ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Votre formule {currentPlan?.name} restera active
                      {renewsAt ? ` jusqu'au ${formatDate(renewsAt)}` : " jusqu'à son échéance"}, puis
                      votre compte repassera automatiquement en formule Gratuit. Aucun nouveau
                      prélèvement ne sera effectué.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Garder mon abonnement</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancelSubscription}>
                      Oui, annuler
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                className="whitespace-normal rounded-full px-4 py-2.5 leading-tight gap-2"
                onClick={() => {
                  setAutoRenew(true);
                  toast.success("Renouvellement automatique réactivé.");
                }}
              >
                <RefreshCw className="h-4 w-4 shrink-0" />
                Réactiver le renouvellement
              </Button>
            )}
          </div>
        )}
      </div>

      {subscriptionsDisabled ? (
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5">
          <h3 className="text-lg font-serif text-primary mb-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Accès complet offert
          </h3>
          <p className="text-sm text-muted-foreground">
            Aucune formule n'est proposée actuellement : vous accédez à l'intégralité de Nooryaa,
            sans restriction ni abonnement.
          </p>
        </div>
      ) : (
      <div>
        <h3 className="text-lg font-serif text-primary mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> Formules d'abonnement
        </h3>
        <div className="grid grid-cols-1 gap-4 items-start md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const variant =
              group.variants.find((v) => v.code === selectedVariant[group.key]) ??
              group.variants.find((v) => v.code === current) ??
              group.variants[0]!;
            const active = group.variants.some((v) => v.code === current) || (!current && group.free && variant.code === freePlan?.code);
            const price = variant.price_ttc;
            const days = variant.duration_days;
            const isFree = price === 0;
            const features = variant.features.length > 0 ? variant.features : autoFeatures(variant);
            return (
              <div
                key={group.key}
                className={`rounded-2xl border bg-card p-4 flex flex-col gap-4 transition-colors sm:p-5 lg:p-6 ${
                  active
                    ? "border-primary shadow-[var(--shadow-card)]"
                    : group.highlight
                      ? "border-primary/50"
                      : "border-border/60"
                }`}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <div className="min-w-0">
                    <p className="break-words font-serif text-xl text-primary">
                      {group.emoji} {group.name}
                    </p>
                    <p className="break-words text-sm text-muted-foreground">{variant.tagline ?? group.tagline}</p>
                  </div>
                  {active && (
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 border border-primary/30 rounded-full px-2 py-0.5">
                      Actuel
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="break-words text-3xl font-semibold text-foreground">
                    {isFree ? "0 €" : euro(price)}
                  </p>
                  <p className="break-words text-sm text-muted-foreground">
                    {isFree
                      ? "Gratuit, pour toujours"
                      : days > 0
                        ? `soit ${euro(price / days)} / jour`
                        : "Sans engagement"}
                  </p>
                </div>

                {group.variants.length > 1 ? (
                  <select
                    value={variant.code}
                    onChange={(e) => setSelectedVariant((s) => ({ ...s, [group.key]: e.target.value }))}
                    aria-label={`Durée de la formule ${group.name}`}
                    className="w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm text-foreground"
                  >
                    {group.variants.map((v) => (
                      <option key={v.code} value={v.code}>
                        {durationLabel(v.duration_days)} — {v.price_ttc === 0 ? "0 €" : euro(v.price_ttc)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full rounded-xl border border-dashed border-border/60 px-3 py-2.5 text-sm text-muted-foreground">
                    {isFree || days === 0 ? "Sans durée ni engagement" : durationLabel(days)}
                  </div>
                )}

                <button
                  type="button"
                  disabled={active && isFree}
                  onClick={() => {
                    if (isFree) {
                      setCurrent(variant.code);
                      setAutoRenew(false);
                      setRenewsAt(null);
                      void saveSubscription({ data: { planCode: variant.code, amountTtc: 0, days: 0, autoRenew: false } }).catch(() => {});
                      toast.success(`Vous êtes passé à la formule ${group.name}.`);
                    } else {
                      const end = new Date();
                      end.setDate(end.getDate() + days);
                      setCurrent(variant.code);
                      setRenewsAt(days > 0 ? end : null);
                      setAutoRenew(true);
                      void saveSubscription({
                        data: { planCode: variant.code, amountTtc: price, days, autoRenew: true },
                      }).catch(() => {});
                      toast.info(`Paiement sécurisé bientôt disponible : ${group.name} — ${durationLabel(days)}.`);
                    }
                  }}
                  className={`w-full whitespace-normal rounded-full px-4 py-2.5 text-sm font-semibold leading-tight border transition-colors ${
                    active && isFree
                      ? "bg-secondary text-muted-foreground border-border/60 cursor-default"
                      : group.highlight
                        ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
                        : "bg-background text-primary border-primary/50 hover:bg-primary/10"
                  }`}
                >
                  {active && isFree ? "Formule actuelle" : active ? "Changer de durée" : "Sélectionner"}
                </button>

                <ul className="space-y-2 text-sm border-t border-border/60 pt-4">
                  {features.map((label, idx) => (
                    <li key={`${variant.code}-feature-${idx}`} className="flex gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="min-w-0 break-words">{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
      )}




      <div className="bg-card rounded-2xl border border-destructive/30 p-4 shadow-[var(--shadow-card)] space-y-4 sm:p-5 lg:p-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h3 className="text-lg font-serif text-destructive">Gestion du compte</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Ces actions affectent votre compte Nooryaa. La suspension est réversible en contactant le
          support ; la suppression est définitive.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <AlertDialog open={suspendOpen} onOpenChange={setSuspendOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="whitespace-normal rounded-full px-4 py-2.5 leading-tight gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 sm:w-auto w-full">
                <PauseCircle className="h-4 w-4 shrink-0" />
                Suspendre mon compte
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-h-[85vh] overflow-y-auto">
              <AlertDialogHeader>
                <AlertDialogTitle>Suspendre votre compte ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Votre profil sera masqué et vous ne pourrez plus utiliser Nooryaa. Vos données sont
                  conservées : vous pourrez réactiver votre compte en contactant le service client.
                  Un email de confirmation vous sera envoyé.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <ReasonPicker
                idPrefix="suspend"
                label="Pourquoi suspendez-vous votre compte ?"
                reason={suspendReason}
                onReason={setSuspendReason}
                details={suspendDetails}
                onDetails={setSuspendDetails}
              />
              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading === "suspend"}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    if (!suspendReason) e.preventDefault();
                    void handleSuspend();
                  }}
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
              <Button variant="outline" className="whitespace-normal rounded-full px-4 py-2.5 leading-tight gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 sm:w-auto w-full">
                <Trash2 className="h-4 w-4 shrink-0" />
                Supprimer mon compte
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-h-[85vh] overflow-y-auto">
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Toutes vos données (profil, photos, messages, coups
                  de cœur, recherches) seront définitivement effacées. Un email de confirmation vous
                  sera envoyé.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <ReasonPicker
                idPrefix="delete"
                label="Pourquoi nous quittez-vous ?"
                reason={deleteReason}
                onReason={setDeleteReason}
                details={deleteDetails}
                onDetails={setDeleteDetails}
              />
              <AlertDialogFooter>
                <AlertDialogCancel disabled={loading === "delete"}>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    if (!deleteReason) e.preventDefault();
                    void handleDelete();
                  }}
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

function ReasonPicker({
  idPrefix,
  label,
  reason,
  onReason,
  details,
  onDetails,
}: {
  idPrefix: string;
  label: string;
  reason: string;
  onReason: (v: string) => void;
  details: string;
  onDetails: (v: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3">
      <p className="text-sm font-medium">{label}</p>
      <RadioGroup value={reason} onValueChange={onReason} className="gap-2">
        {CLOSURE_REASONS.map((r) => (
          <div key={r} className="flex items-start gap-2">
            <RadioGroupItem value={r} id={`${idPrefix}-${r}`} className="mt-0.5" />
            <Label htmlFor={`${idPrefix}-${r}`} className="text-sm font-normal leading-snug">
              {r}
            </Label>
          </div>
        ))}
      </RadioGroup>
      <Textarea
        value={details}
        onChange={(e) => onDetails(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Souhaitez-vous nous en dire plus ? (facultatif)"
        className="text-sm"
      />
      {!reason && (
        <p className="text-xs text-destructive">Merci de sélectionner une raison pour continuer.</p>
      )}
    </div>
  );
}
