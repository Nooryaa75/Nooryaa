import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth } from "@/lib/admin.functions";
import { adminListPlans, adminSavePlan, adminDeletePlan, adminTogglePlan, adminListSocialLinks, adminSaveSocialLink, adminListAppVersions, adminSaveAppVersion, type PlanInput } from "@/lib/admin-insights.functions";
import { ACCESS_KEYS, AUDIENCE_LABEL, DURATION_PRESETS, durationLabel, quotaLabel, type PlanAudience } from "@/lib/entitlements";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ShieldCheck, Copy } from "lucide-react";
import { toast } from "sonner";
import { frenchError } from "@/lib/errors";

export const Route = createFileRoute("/admin/config")({
  ssr: false,
  head: () => ({ meta: [{ title: "Configurateur — Admin Nooryaa" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminConfig,
});

const EMPTY: PlanInput = {
  code: "",
  name: "",
  tagline: "",
  emoji: "",
  audience: "homme",
  duration_days: 30,
  price_ttc: 0,
  vat_rate: 20,
  likes_per_day: 10,
  messages_per_day: -1,
  rewinds: 0,
  super_likes: 0,
  boosts: 0,
  features: [],
  highlight: false,
  active: true,
  sort_order: 10,
  access: {},
};

const AUDIENCES: PlanAudience[] = ["homme", "femme", "tous"];

/** Champ numérique avec interrupteur « Illimité » (valeur −1). */
function QuotaField({ label, value, onChange, allowUnlimited = true }: { label: string; value: number; onChange: (v: number) => void; allowUnlimited?: boolean }) {
  const unlimited = value < 0;
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input type="number" min={0} disabled={unlimited} value={unlimited ? "" : value} placeholder={unlimited ? "∞" : "0"} onChange={(e) => onChange(Math.max(0, Number(e.target.value)))} />
        {allowUnlimited && (
          <label className="flex items-center gap-1.5 text-xs whitespace-nowrap">
            <Switch checked={unlimited} onCheckedChange={(v) => onChange(v ? -1 : 0)} aria-label={`${label} illimité`} />
            Illimité
          </label>
        )}
      </div>
    </div>
  );
}


function AdminConfig() {
  const qc = useQueryClient();
  const list = useServerFn(adminListPlans);
  const save = useServerFn(adminSavePlan);
  const remove = useServerFn(adminDeletePlan);
  const toggle = useServerFn(adminTogglePlan);
  const { data } = useQuery({ queryKey: ["admin-plans"], queryFn: () => list() });
  const [draft, setDraft] = useState<PlanInput | null>(null);
  const [tab, setTab] = useState<PlanAudience | "all">("all");

  const plans = data ?? [];
  const noneActive = plans.length > 0 && plans.every((p) => !p.active);
  const shown = tab === "all" ? plans : plans.filter((p) => ((p as any).audience ?? "tous") === tab);

  const toInput = (p: any): PlanInput => ({
    id: p.id,
    code: p.code,
    name: p.name,
    tagline: p.tagline ?? "",
    emoji: p.emoji ?? "",
    audience: (p.audience ?? "tous") as PlanAudience,
    duration_days: p.duration_days,
    price_ttc: Number(p.price_ttc),
    vat_rate: Number(p.vat_rate),
    likes_per_day: p.likes_per_day,
    messages_per_day: p.messages_per_day ?? -1,
    rewinds: p.rewinds ?? 0,
    super_likes: p.super_likes,
    boosts: p.boosts,
    features: (p.features ?? []) as string[],
    highlight: p.highlight,
    active: p.active,
    sort_order: p.sort_order,
    access: (p.access ?? {}) as Record<string, boolean>,
  });

  const saveMut = useMutation({
    mutationFn: (p: PlanInput) => save({ data: p }),
    onSuccess: () => {
      toast.success("Formule enregistrée");
      setDraft(null);
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
      qc.invalidateQueries({ queryKey: ["active-plans"] });
    },
    onError: (e: any) => toast.error(frenchError(e, "Erreur")),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Formule supprimée");
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
      qc.invalidateQueries({ queryKey: ["active-plans"] });
    },
    onError: (e: any) => toast.error(frenchError(e, "Erreur")),
  });

  const toggleMut = useMutation({
    mutationFn: (p: { id: string; active: boolean }) => toggle({ data: p }),
    onSuccess: (_r, v) => {
      toast.success(v.active ? "Formule activée" : "Formule désactivée");
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
      qc.invalidateQueries({ queryKey: ["active-plans"] });
    },
    onError: (e: any) => toast.error(frenchError(e, "Erreur")),
  });

  const isPreset = draft ? DURATION_PRESETS.some((d) => d.days === draft.duration_days) : true;

  return (
    <div className="min-h-screen mosaic-soft">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-serif gold-text tracking-wide">Configurateur</h1>
            <p className="text-sm text-muted-foreground">
              Formules hommes / femmes, durées (jour, semaine, mois…), prix, quotas et accès — appliqués immédiatement côté membre.
            </p>
          </div>
          <Button onClick={() => setDraft({ ...EMPTY, audience: tab === "all" ? "homme" : tab })} className="rounded-full gap-1.5">
            <Plus className="h-4 w-4" /> Nouvelle formule
          </Button>
        </div>

        {(noneActive || plans.length === 0) && (
          <div className="flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-4">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm">
              <strong className="text-primary">Abonnements désactivés.</strong> Aucune formule active :
              tous les membres accèdent actuellement à l'intégralité du site, sans restriction.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrer par public">
          {(["all", ...AUDIENCES] as const).map((a) => {
            const count = a === "all" ? plans.length : plans.filter((p) => ((p as any).audience ?? "tous") === a).length;
            return (
              <button
                key={a}
                role="tab"
                aria-selected={tab === a}
                onClick={() => setTab(a)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${tab === a ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60 hover:bg-secondary"}`}
              >
                {a === "all" ? "Toutes" : AUDIENCE_LABEL[a]} <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {shown.map((raw) => {
            const p = raw as any;
            const access = (p.access ?? {}) as Record<string, boolean>;
            const granted = ACCESS_KEYS.filter((a) => access[a.key]);
            const audience = (p.audience ?? "tous") as PlanAudience;
            return (
              <div key={p.id} className={`bg-card rounded-2xl p-5 border space-y-2 ${p.active ? "border-border/60" : "border-dashed border-border/60 opacity-70"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-serif text-lg text-primary">
                      {p.emoji ? `${p.emoji} ` : ""}{p.name} <span className="text-xs text-muted-foreground">({p.code})</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{p.tagline}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-serif text-primary">{Number(p.price_ttc).toFixed(2)} €</div>
                    <div className="text-[11px] text-muted-foreground">TTC · {durationLabel(p.duration_days)}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  <span className={`rounded-full px-2 py-0.5 ${audience === "femme" ? "bg-pink-500/15 text-pink-700 dark:text-pink-300" : audience === "homme" ? "bg-sky-500/15 text-sky-700 dark:text-sky-300" : "bg-secondary"}`}>
                    {AUDIENCE_LABEL[audience]}
                  </span>
                  {p.highlight && <span className="rounded-full bg-[color-mix(in_oklab,var(--gold)_20%,transparent)] px-2 py-0.5">Mise en avant</span>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {quotaLabel(p.likes_per_day, "likes")}/j · {quotaLabel(p.messages_per_day ?? -1, "messages")}/j · {p.super_likes} super likes · {p.boosts} boosts · {quotaLabel(p.rewinds ?? 0, "retours")} · TVA {Number(p.vat_rate)}%
                </div>
                {granted.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {granted.map((a) => (
                      <span key={a.key} className="text-[11px] rounded-full bg-secondary px-2 py-0.5">{a.label}</span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <label className="flex items-center gap-2 text-xs">
                    <Switch
                      checked={p.active}
                      onCheckedChange={(v) => toggleMut.mutate({ id: p.id, active: v })}
                      aria-label={`Activer la formule ${p.name}`}
                    />
                    {p.active ? "Active" : "Inactive"}
                  </label>
                  <div className="flex-1" />
                  <Button size="sm" variant="ghost" className="rounded-full gap-1" title="Dupliquer (autre durée / autre public)" onClick={() => { const c = toInput(p); delete c.id; c.code = `${c.code}_copie`; setDraft(c); }}>
                    <Copy className="h-4 w-4" /> Dupliquer
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => setDraft(toInput(p))}>
                    Modifier
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Supprimer la formule ${p.name} (${p.code}) ?`)) delMut.mutate(p.id); }} aria-label={`Supprimer ${p.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {shown.length === 0 && <p className="text-sm text-muted-foreground">Aucune formule pour ce public.</p>}
        </div>

        {draft && (
          <section className="bg-card rounded-2xl p-5 border border-primary/40 space-y-5">
            <h2 className="text-lg font-serif text-primary">{draft.id ? "Modifier la formule" : "Nouvelle formule"}</h2>

            <div>
              <Label>Public concerné</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {AUDIENCES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setDraft({ ...draft, audience: a })}
                    className={`rounded-full border px-3 py-1.5 text-sm ${draft.audience === a ? "bg-primary text-primary-foreground border-primary" : "border-border/60 hover:bg-secondary"}`}
                  >
                    {AUDIENCE_LABEL[a]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground pt-1">Une formule « Hommes » n'est jamais visible par une femme, et inversement.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-3">
              <div>
                <Label>Code (unique)</Label>
                <Input value={draft.code} placeholder="noor_7j" onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
              </div>
              <div>
                <Label>Nom affiché</Label>
                <Input value={draft.name} placeholder="NOOR" onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                <p className="text-[11px] text-muted-foreground">Même nom = regroupées sur une carte avec choix de la durée.</p>
              </div>
              <div>
                <Label>Emoji</Label>
                <Input value={draft.emoji ?? ""} placeholder="🌙" maxLength={4} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} />
              </div>
              <div>
                <Label>Accroche</Label>
                <Input value={draft.tagline ?? ""} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} />
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <Label>Durée</Label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {DURATION_PRESETS.map((d) => (
                    <button
                      key={d.days}
                      type="button"
                      onClick={() => setDraft({ ...draft, duration_days: d.days, ...(d.days === 0 ? { price_ttc: 0 } : {}) })}
                      className={`rounded-full border px-2.5 py-1 text-xs ${draft.duration_days === d.days ? "bg-primary text-primary-foreground border-primary" : "border-border/60 hover:bg-secondary"}`}
                    >
                      {d.label}
                    </button>
                  ))}
                  <span className={`flex items-center gap-1 text-xs rounded-full border px-2 py-1 ${!isPreset ? "border-primary" : "border-border/60"}`}>
                    Autre :
                    <Input type="number" min={0} className="h-6 w-16 px-1 text-xs" value={draft.duration_days} onChange={(e) => setDraft({ ...draft, duration_days: Math.max(0, Number(e.target.value)) })} />
                    j
                  </span>
                </div>
              </div>
              <div>
                <Label>Prix TTC (€)</Label>
                <Input type="number" step="0.01" min={0} value={draft.price_ttc} onChange={(e) => setDraft({ ...draft, price_ttc: Number(e.target.value) })} />
                {draft.duration_days > 0 && draft.price_ttc > 0 && (
                  <p className="text-[11px] text-muted-foreground">soit {(draft.price_ttc / draft.duration_days).toFixed(2)} € / jour</p>
                )}
              </div>
              <div>
                <Label>TVA (%)</Label>
                <Input type="number" step="0.1" value={draft.vat_rate} onChange={(e) => setDraft({ ...draft, vat_rate: Number(e.target.value) })} />
              </div>
            </div>

            <div>
              <Label className="text-base">Quotas</Label>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                <QuotaField label="Likes / jour" value={draft.likes_per_day} onChange={(v) => setDraft({ ...draft, likes_per_day: v, access: { ...(draft.access ?? {}), unlimited_likes: v < 0 } })} />
                <QuotaField label="Messages / jour" value={draft.messages_per_day} onChange={(v) => setDraft({ ...draft, messages_per_day: v })} />
                <QuotaField label="Retours en arrière / jour" value={draft.rewinds} onChange={(v) => setDraft({ ...draft, rewinds: v })} />
                <QuotaField label="Super likes (sur la période)" value={draft.super_likes} allowUnlimited={false} onChange={(v) => setDraft({ ...draft, super_likes: v })} />
                <QuotaField label="Boosts (sur la période)" value={draft.boosts} allowUnlimited={false} onChange={(v) => setDraft({ ...draft, boosts: v, access: { ...(draft.access ?? {}), boost: v > 0 || draft.access?.boost === true } })} />
              </div>
            </div>

            <div>
              <Label>Avantages affichés (un par ligne)</Label>
              <Textarea rows={4} value={draft.features.join("\n")} onChange={(e) => setDraft({ ...draft, features: e.target.value.split("\n").filter(Boolean) })} />
            </div>
            <div>
              <Label>Fonctionnalités & accès inclus</Label>
              <div className="grid sm:grid-cols-2 gap-2 pt-2">
                {ACCESS_KEYS.map((a) => (
                  <label key={a.key} className="flex items-center gap-2 text-sm border border-border/50 rounded-xl px-3 py-2">
                    <Switch
                      checked={draft.access?.[a.key] === true}
                      onCheckedChange={(v) => setDraft({ ...draft, access: { ...(draft.access ?? {}), [a.key]: v } })}
                      aria-label={a.label}
                    />
                    {a.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} aria-label="Formule active" /> Active
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={draft.highlight} onCheckedChange={(v) => setDraft({ ...draft, highlight: v })} aria-label="Mise en avant" /> Mise en avant
              </label>
              <div className="flex items-center gap-2 text-sm">
                Ordre
                <Input type="number" className="w-20" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="rounded-full" disabled={saveMut.isPending} onClick={() => saveMut.mutate(draft)}>
                Enregistrer
              </Button>
              <Button variant="ghost" onClick={() => setDraft(null)}>
                Annuler
              </Button>
            </div>
          </section>
        )}

        <AppVersionsSection />

        <SocialSection />
      </main>
    </div>
  );
}

function SocialSection() {
  const qc = useQueryClient();
  const list = useServerFn(adminListSocialLinks);
  const save = useServerFn(adminSaveSocialLink);
  const { data } = useQuery({ queryKey: ["admin-social-links"], queryFn: () => list() });
  const [urls, setUrls] = useState<Record<string, string>>({});

  const mut = useMutation({
    mutationFn: (p: { id: string; url?: string; active?: boolean }) => save({ data: p }),
    onSuccess: () => {
      toast.success("Réseau social mis à jour");
      qc.invalidateQueries({ queryKey: ["admin-social-links"] });
      qc.invalidateQueries({ queryKey: ["social-links"] });
    },
    onError: (e: any) => toast.error(frenchError(e, "Erreur")),
  });

  return (
    <section className="bg-card rounded-2xl p-5 border border-border/60 space-y-4">
      <div>
        <h2 className="text-lg font-serif text-primary">Réseaux sociaux</h2>
        <p className="text-sm text-muted-foreground">
          Activez ou désactivez chaque réseau : les logos apparaissent (ou disparaissent) immédiatement sur la page d'accueil.
        </p>
      </div>
      <div className="space-y-3">
        {(data ?? []).map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-3 border border-border/50 rounded-xl p-3">
            <div className="w-28 font-medium">{s.label}</div>
            <Input
              className="flex-1 min-w-[220px]"
              placeholder="https://..."
              value={urls[s.id] ?? s.url}
              onChange={(e) => setUrls({ ...urls, [s.id]: e.target.value })}
            />
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={mut.isPending}
              onClick={() => mut.mutate({ id: s.id, url: urls[s.id] ?? s.url })}
            >
              Enregistrer
            </Button>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={s.active}
                onCheckedChange={(v) => mut.mutate({ id: s.id, active: v })}
                aria-label={`Activer ${s.label}`}
              />
              {s.active ? "Activé" : "Désactivé"}
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}

const PLATFORM_LABEL: Record<string, string> = { ios: "iOS (App Store)", android: "Android (Google Play)" };

function AppVersionsSection() {
  const qc = useQueryClient();
  const list = useServerFn(adminListAppVersions);
  const save = useServerFn(adminSaveAppVersion);
  const { data } = useQuery({ queryKey: ["admin-app-versions"], queryFn: () => list() });
  const [draft, setDraft] = useState<Record<string, { version?: string; min_version?: string; notes?: string }>>({});

  const mut = useMutation({
    mutationFn: (p: { id: string; version?: string; min_version?: string; notes?: string }) => save({ data: p }),
    onSuccess: () => {
      toast.success("Version enregistrée");
      qc.invalidateQueries({ queryKey: ["admin-app-versions"] });
    },
    onError: (e: any) => toast.error(frenchError(e, "Erreur")),
  });

  return (
    <section className="bg-card rounded-2xl p-5 border border-border/60 space-y-4">
      <div>
        <h2 className="text-lg font-serif text-primary">Version des apps</h2>
        <p className="text-sm text-muted-foreground">
          Indiquez la version publiée sur chaque store et la version minimale exigée pour continuer à utiliser l'application.
        </p>
      </div>
      <div className="space-y-3">
        {(data ?? []).map((v) => {
          const d = draft[v.id] ?? {};
          return (
            <div key={v.id} className="grid gap-3 sm:grid-cols-[160px_1fr_1fr_auto] sm:items-end border border-border/50 rounded-xl p-3">
              <div className="font-medium">{PLATFORM_LABEL[v.platform] ?? v.platform}</div>
              <div>
                <Label>Version en ligne</Label>
                <Input
                  placeholder="1.0.0"
                  value={d.version ?? v.version}
                  onChange={(e) => setDraft({ ...draft, [v.id]: { ...d, version: e.target.value } })}
                />
              </div>
              <div>
                <Label>Version minimale</Label>
                <Input
                  placeholder="1.0.0"
                  value={d.min_version ?? v.min_version}
                  onChange={(e) => setDraft({ ...draft, [v.id]: { ...d, min_version: e.target.value } })}
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={mut.isPending}
                onClick={() =>
                  mut.mutate({
                    id: v.id,
                    version: d.version ?? v.version,
                    min_version: d.min_version ?? v.min_version,
                    notes: d.notes ?? v.notes ?? "",
                  })
                }
              >
                Enregistrer
              </Button>
              <div className="sm:col-span-4">
                <Label>Note de mise à jour (facultatif)</Label>
                <Textarea
                  rows={2}
                  value={d.notes ?? v.notes ?? ""}
                  onChange={(e) => setDraft({ ...draft, [v.id]: { ...d, notes: e.target.value } })}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
