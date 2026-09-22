import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth, adminSeedTestProfiles } from "@/lib/admin.functions";
import { adminOverview, adminOnlineNow } from "@/lib/admin-insights.functions";
import { AdminNav } from "@/components/AdminNav";
import { AdminPeriodPicker, usePeriod } from "@/components/AdminPeriodPicker";
import {
  Users, UserCheck, Flag, MessageCircle, AlertTriangle, MessageSquare, ArrowRight, Sparkles, Megaphone, Mail,
  Heart, BadgeCheck, Euro, Radio, LifeBuoy, SlidersHorizontal, Zap, BarChart3, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
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
  const e = data?.engagement;

  const cards = [
    { label: "Total inscrits", value: c?.total, icon: Users, tone: "bg-primary/10 text-primary" },
    { label: "Nouveaux (période)", value: c?.newInRange, icon: Sparkles, tone: "bg-secondary text-primary" },
    { label: "En ligne maintenant", value: online?.count ?? c?.onlineNow, icon: Radio, tone: "bg-primary/10 text-primary" },
    { label: "Profils complétés", value: c?.onboarded, icon: UserCheck, tone: "bg-secondary text-primary" },
    { label: "Photos vérifiées", value: c?.verified, icon: BadgeCheck, tone: "bg-primary/10 text-primary" },
    { label: "Abonnés payants", value: c?.payingNow, icon: Euro, tone: "bg-[color-mix(in_oklab,var(--gold)_18%,transparent)] text-[color:var(--gold)]" },
    { label: "Suspendus / bannis", value: c?.suspended, icon: AlertTriangle, tone: "bg-[color-mix(in_oklab,var(--gold)_18%,transparent)] text-[color:var(--gold)]" },
    { label: "Signalements ouverts", value: c?.openReports, icon: Flag, tone: "bg-destructive/10 text-destructive" },
    { label: "Likes (période)", value: e?.likes, icon: Heart, tone: "bg-secondary text-primary" },
    { label: "Messages (période)", value: e?.messages, icon: MessageCircle, tone: "bg-secondary text-primary" },
    { label: "Membres actifs (msg)", value: e?.activeSenders, icon: Users, tone: "bg-muted text-muted-foreground" },
    { label: "Âge moyen", value: e?.avgAge, icon: Users, tone: "bg-muted text-muted-foreground" },
  ];

  const shortcuts = [
    { to: "/admin/profiles", label: "Gérer les profils", desc: "Voir, filtrer, suspendre, bannir ou supprimer un membre.", icon: Users },
    { to: "/admin/finance", label: "Finance", desc: "CA TTC/HT, TVA par jour, semaine, mois, formule et genre.", icon: Euro },
    { to: "/admin/analytics", label: "Analytics", desc: "Entonnoir de conversion, rétention et activité horaire.", icon: BarChart3 },
    { to: "/admin/support", label: "Support", desc: "Tickets, statuts et historique des échanges.", icon: LifeBuoy },
    { to: "/admin/credits", label: "Consommation", desc: "Likes, super likes et boosts par membre.", icon: Zap },
    { to: "/admin/config", label: "Configurateur", desc: "Prix, durées et quotas des abonnements.", icon: SlidersHorizontal },
    { to: "/admin/conversations", label: "Discussions", desc: "Lire les échanges entre membres pour modération.", icon: MessageSquare },
    { to: "/admin/reports", label: "Signalements", desc: "Examiner et résoudre les signalements ouverts.", icon: Flag },
    { to: "/admin/contact", label: "Messages de contact", desc: "Répondre aux messages du formulaire d'accueil.", icon: Mail },
    { to: "/admin/ads", label: "Publicités", desc: "Gérer le carrousel d'annonces partenaires.", icon: Megaphone },
    { to: "/admin/rgpd", label: "RGPD", desc: "Registre des traitements, hébergement et conformité.", icon: ShieldCheck },
  ] as const;

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

        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-card rounded-2xl p-5 border border-border/60">
            <h2 className="text-lg font-serif text-primary mb-3">Inscriptions (homme / femme)</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.series ?? []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" fontSize={10} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="homme" name="Hommes" stackId="g" fill="#4f46e5" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="femme" name="Femmes" stackId="g" fill="#db2777" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-card rounded-2xl p-5 border border-border/60">
            <h2 className="text-lg font-serif text-primary mb-3">Inscrits cumulés</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.cumulative ?? []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" fontSize={10} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Area dataKey="total" name="Total" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.18} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <section>
          <h2 className="text-lg font-serif text-primary mb-3">Répartition par tranche d'âge</h2>
          <div className="bg-card rounded-2xl p-5 border border-border/60 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.ageBuckets ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="homme" name="Hommes" fill="#4f46e5" />
                <Bar dataKey="femme" name="Femmes" fill="#db2777" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-serif text-primary mb-3">Critères de la fiche profil</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Distribution title="Genre" rows={data?.gender ?? []} />
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

        <div>
          <h2 className="text-lg font-serif text-primary mb-3">Raccourcis</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {shortcuts.map((s) => (
              <Link key={s.to} to={s.to} className="group bg-card rounded-2xl p-5 border border-border/60 hover:border-primary/40 hover:shadow-[var(--shadow-card)] transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><s.icon className="h-5 w-5" /></div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="font-medium text-primary">{s.label}</div>
                <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
              </Link>
            ))}
          </div>
        </div>

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
