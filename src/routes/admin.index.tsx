import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth, adminSeedTestProfiles } from "@/lib/admin.functions";
import { adminOverview, adminOnlineNow, adminCriteriaDistribution, adminClosureStats } from "@/lib/admin-insights.functions";
import { AdminNav } from "@/components/AdminNav";
import { AdminPeriodPicker, usePeriod } from "@/components/AdminPeriodPicker";
import { Users, UserCheck, Flag, AlertTriangle, Sparkles, BadgeCheck, Euro, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { frenchError } from "@/lib/errors";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Tableau de bord — Admin Nooryaa" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminDashboard,
});

function Distribution({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  const max = rows.reduce((m, r) => Math.max(m, r.value), 0) || 1;
  return (
    <div className="bg-card rounded-2xl p-4 border border-border/60">
      <h3 className="text-sm font-bold text-primary mb-3">{title}</h3>
      <div className="space-y-1.5">
        {rows.slice(0, 8).map((r) => (
          <div key={r.label} className="flex items-center gap-2">
            <span className="w-28 truncate text-xs text-muted-foreground" title={r.label}>{r.label}</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary/70" style={{ width: `${(r.value / max) * 100}%` }} />
            </div>
            <span className="w-10 text-right text-xs font-medium">{r.value}</span>
          </div>
        ))}
        {rows.length === 0 && <p className="text-xs text-muted-foreground">Aucune donnée.</p>}
      </div>
    </div>
  );
}

function CriteriaSection() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const fetchCriteria = useServerFn(adminCriteriaDistribution);
  const { data } = useQuery({
    queryKey: ["admin-criteria", from, to],
    queryFn: () => fetchCriteria({ data: { from: from || undefined, to: to || undefined } }),
  });

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="text-lg font-serif text-primary">Critères de la fiche profil</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="text-muted-foreground" htmlFor="crit-from">Du</label>
          <input
            id="crit-from"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-primary"
          />
          <label className="text-muted-foreground" htmlFor="crit-to">au</label>
          <input
            id="crit-to"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-primary"
          />
          {(from || to) && (
            <button type="button" onClick={() => { setFrom(""); setTo(""); }} className="text-xs text-primary underline underline-offset-2">
              Réinitialiser
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {from || to
          ? `${data?.total ?? 0} membre(s) inscrit(s) sur la période choisie.`
          : "Toutes les périodes confondues — choisissez des dates pour filtrer par date d'inscription."}
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        <Distribution title="Genre" rows={data?.gender ?? []} />
        <Distribution title="Mode d'utilisation" rows={data?.platforms ?? []} />
        <Distribution title="Villes" rows={data?.cities ?? []} />
        <Distribution title="Pays de résidence" rows={data?.countries ?? []} />
        <Distribution title="Pays d'origine" rows={data?.origins ?? []} />
        <Distribution title="Situation maritale" rows={data?.criteria.marital_status ?? []} />
        <Distribution title="Pratique religieuse" rows={data?.criteria.religious_practice ?? []} />
        <Distribution title="Niveau d'études" rows={data?.criteria.education_level ?? []} />
        <Distribution title="Objectif" rows={data?.criteria.objective ?? []} />
        <Distribution title="Corpulence" rows={data?.criteria.body_type ?? []} />
        <Distribution title="A des enfants" rows={data?.criteria.has_children ?? []} />
        <Distribution title="Souhaite des enfants" rows={data?.criteria.wants_children ?? []} />
        <Distribution title="Fumeur" rows={data?.criteria.smoker ?? []} />
      </div>
    </section>
  );
}

function ClosuresSection() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const fetchStats = useServerFn(adminClosureStats);
  const { data } = useQuery({
    queryKey: ["admin-closures", from, to],
    queryFn: () => fetchStats({ data: { from: from || undefined, to: to || undefined } }),
  });
  const block = (title: string, g?: { count: number; reasons: { label: string; value: number }[]; comments: { text: string; reason: string | null; at: string }[] }) => (
    <div className="space-y-3">
      <div className="bg-card rounded-2xl p-5 gold-frame">
        <div className="text-3xl font-serif text-primary leading-none">{g?.count ?? "—"}</div>
        <div className="text-xs text-muted-foreground mt-2">{title}</div>
      </div>
      <Distribution title={`Raisons — ${title.toLowerCase()}`} rows={g?.reasons ?? []} />
      {g && g.comments.length > 0 && (
        <details className="bg-card rounded-2xl p-4 border border-border/60 text-sm">
          <summary className="cursor-pointer font-medium text-primary">Commentaires laissés ({g.comments.length})</summary>
          <ul className="mt-2 space-y-2">
            {g.comments.map((c, i) => (
              <li key={i} className="rounded-lg bg-muted/40 p-2">
                <div className="text-[11px] text-muted-foreground">{new Date(c.at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}{c.reason ? ` · ${c.reason}` : ""}</div>
                <div className="whitespace-pre-wrap">{c.text}</div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="text-lg font-serif text-primary">Suppressions et suspensions de compte</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="text-muted-foreground" htmlFor="clo-from">Du</label>
          <input id="clo-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-primary" />
          <label className="text-muted-foreground" htmlFor="clo-to">au</label>
          <input id="clo-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-primary" />
          {(from || to) && (
            <button type="button" onClick={() => { setFrom(""); setTo(""); }} className="text-xs text-primary underline underline-offset-2">Réinitialiser</button>
          )}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {block("Comptes supprimés", data?.deleted)}
        {block("Comptes suspendus", data?.suspended)}
      </div>
    </section>
  );
}

function AdminDashboard() {
  const period = usePeriod("30j");
  const fetchOverview = useServerFn(adminOverview);
  const fetchOnline = useServerFn(adminOnlineNow);
  const { data } = useQuery({
    queryKey: ["admin-overview", period.from, period.to],
    queryFn: () => fetchOverview({ data: { from: period.from, to: period.to } }),
  });
  const { data: online } = useQuery({ queryKey: ["admin-online"], queryFn: () => fetchOnline(), refetchInterval: 15000 });

  const seedFn = useServerFn(adminSeedTestProfiles);
  const seed = useMutation({
    mutationFn: () => seedFn(),
    onSuccess: (res) => {
      const created = res.results.filter((r) => r.status === "created").length;
      const existing = res.results.filter((r) => r.status === "exists").length;
      toast.success(`${created} profil(s) créé(s), ${existing} déjà présent(s).`);
    },
    onError: (e: any) => toast.error(frenchError(e, "Erreur lors de la création")),
  });

  const c = data?.counters;
  const monthly = (data?.byMonth ?? []).map((m) => ({
    ...m,
    label: new Date(`${m.month}-01T12:00:00`).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }),
  }));


  const cards = [
    { label: "Total inscrits", value: c?.total, icon: Users, tone: "bg-primary/10 text-primary" },
    { label: "Nouveaux (période)", value: c?.newInRange, icon: Sparkles, tone: "bg-secondary text-primary" },
    { label: "En ligne maintenant", value: online?.count ?? c?.onlineNow, icon: Radio, tone: "bg-primary/10 text-primary" },
    { label: "Profils complétés", value: c?.onboarded, icon: UserCheck, tone: "bg-secondary text-primary" },
    { label: "Photos vérifiées", value: c?.verified, icon: BadgeCheck, tone: "bg-primary/10 text-primary" },
    { label: "Abonnés payants", value: c?.payingNow, icon: Euro, tone: "bg-[color-mix(in_oklab,var(--gold)_18%,transparent)] text-[color:var(--gold)]" },
    { label: "Suspendus / bannis", value: c?.suspended, icon: AlertTriangle, tone: "bg-[color-mix(in_oklab,var(--gold)_18%,transparent)] text-[color:var(--gold)]" },
    { label: "Signalements ouverts", value: c?.openReports, icon: Flag, tone: "bg-destructive/10 text-destructive" },
  ];

  return (
    <div className="min-h-screen mosaic-soft">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-serif gold-text tracking-wide">Tableau de bord</h1>
            <p className="text-sm text-muted-foreground">Vue d'ensemble de la plateforme Nooryaa.</p>
          </div>
          <AdminPeriodPicker {...period} />
        </div>

        {c && c.openReports > 0 && (
          <Link to="/admin/reports" className="inline-flex items-center gap-2 rounded-full bg-destructive/10 text-destructive px-4 py-2 text-sm font-medium hover:bg-destructive/20">
            <Flag className="h-4 w-4" /> {c.openReports} signalement{c.openReports > 1 ? "s" : ""} à traiter
          </Link>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="bg-card rounded-2xl p-5 gold-frame shadow-[var(--shadow-card)]">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${card.tone}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div className="text-3xl font-serif text-primary leading-none">{card.value ?? "—"}</div>
              <div className="text-xs text-muted-foreground mt-2">{card.label}</div>
            </div>
          ))}
        </div>

        <section className="bg-card rounded-2xl p-5 border border-border/60">
          <h2 className="text-lg font-serif text-primary mb-3">Inscriptions par mois</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Area dataKey="total" name="Inscrits" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.18} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <ClosuresSection />

        <CriteriaSection />

        <div className="bg-card rounded-2xl p-5 border border-border/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-[color-mix(in_oklab,var(--gold)_18%,transparent)] text-[color:var(--gold)] flex items-center justify-center"><Sparkles className="h-5 w-5" /></div>
            <div>
              <div className="font-medium text-primary">Profils de test</div>
              <p className="text-sm text-muted-foreground max-w-xl">Crée 6 profils de test (3 hommes / 3 femmes) avec photos, bio et infos complètes pour discuter avec vos prospects. Mot de passe : <code className="px-1 rounded bg-muted">TestNooryaa2026!</code>, emails <code className="px-1 rounded bg-muted">*@nooryaa.test</code>.</p>
            </div>
          </div>
          <Button onClick={() => seed.mutate()} disabled={seed.isPending} className="rounded-full">
            {seed.isPending ? "Création..." : "Créer / mettre à jour"}
          </Button>
        </div>
      </main>
    </div>
  );
}
