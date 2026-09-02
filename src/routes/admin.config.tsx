import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth } from "@/lib/admin.functions";
import { adminListPlans, adminSavePlan, adminDeletePlan, adminTogglePlan, adminListSocialLinks, adminSaveSocialLink, type PlanInput } from "@/lib/admin-insights.functions";
import { ACCESS_KEYS } from "@/lib/entitlements";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

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
  duration_days: 30,
  price_ttc: 0,
  vat_rate: 20,
  likes_per_day: 10,
  super_likes: 0,
  boosts: 0,
  features: [],
  highlight: false,
  active: true,
  sort_order: 10,
  access: {},
};


function AdminConfig() {
  const qc = useQueryClient();
  const list = useServerFn(adminListPlans);
  const save = useServerFn(adminSavePlan);
  const remove = useServerFn(adminDeletePlan);
  const { data } = useQuery({ queryKey: ["admin-plans"], queryFn: () => list() });
  const [draft, setDraft] = useState<PlanInput | null>(null);

  const saveMut = useMutation({
    mutationFn: (p: PlanInput) => save({ data: p }),
    onSuccess: () => {
      toast.success("Formule enregistrée");
      setDraft(null);
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erreur"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Formule supprimée");
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
    },
  });

  return (
    <div className="min-h-screen mosaic-soft">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-serif gold-text tracking-wide">Configurateur</h1>
            <p className="text-sm text-muted-foreground">Prix, durées et quotas des formules — appliqués immédiatement côté membre.</p>
          </div>
          <Button onClick={() => setDraft({ ...EMPTY })} className="rounded-full gap-1.5">
            <Plus className="h-4 w-4" /> Nouvelle formule
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {(data ?? []).map((p) => (
            <div key={p.id} className="bg-card rounded-2xl p-5 border border-border/60 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-serif text-lg text-primary">
                    {p.name} <span className="text-xs text-muted-foreground">({p.code})</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.tagline}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-serif text-primary">{Number(p.price_ttc).toFixed(2)} €</div>
                  <div className="text-[11px] text-muted-foreground">TTC / {p.duration_days} j</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {p.likes_per_day} likes/j · {p.super_likes} super likes · {p.boosts} boosts · TVA {Number(p.vat_rate)}%
              </div>
              <div className="flex items-center gap-2 pt-2">
                <span className={`text-xs rounded-full px-2 py-0.5 ${p.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {p.active ? "Active" : "Inactive"}
                </span>
                {p.highlight && <span className="text-xs rounded-full bg-[color-mix(in_oklab,var(--gold)_20%,transparent)] px-2 py-0.5">Mise en avant</span>}
                <div className="flex-1" />
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => setDraft({ ...(p as unknown as PlanInput), id: p.id })}>
                  Modifier
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => delMut.mutate(p.id)} aria-label={`Supprimer ${p.name}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {draft && (
          <section className="bg-card rounded-2xl p-5 border border-primary/40 space-y-4">
            <h2 className="text-lg font-serif text-primary">{draft.id ? "Modifier la formule" : "Nouvelle formule"}</h2>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label>Code</Label>
                <Input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} />
              </div>
              <div>
                <Label>Nom</Label>
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div>
                <Label>Accroche</Label>
                <Input value={draft.tagline ?? ""} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} />
              </div>
              <div>
                <Label>Prix TTC (€)</Label>
                <Input type="number" step="0.01" value={draft.price_ttc} onChange={(e) => setDraft({ ...draft, price_ttc: Number(e.target.value) })} />
              </div>
              <div>
                <Label>TVA (%)</Label>
                <Input type="number" step="0.1" value={draft.vat_rate} onChange={(e) => setDraft({ ...draft, vat_rate: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Durée (jours)</Label>
                <Input type="number" value={draft.duration_days} onChange={(e) => setDraft({ ...draft, duration_days: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Likes / jour</Label>
                <Input type="number" value={draft.likes_per_day} onChange={(e) => setDraft({ ...draft, likes_per_day: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Super likes</Label>
                <Input type="number" value={draft.super_likes} onChange={(e) => setDraft({ ...draft, super_likes: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Boosts</Label>
                <Input type="number" value={draft.boosts} onChange={(e) => setDraft({ ...draft, boosts: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>Avantages (un par ligne)</Label>
              <Textarea rows={4} value={draft.features.join("\n")} onChange={(e) => setDraft({ ...draft, features: e.target.value.split("\n").filter(Boolean) })} />
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
    onError: (e: any) => toast.error(e?.message ?? "Erreur"),
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
