import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth, adminStats, adminSeedTestProfiles } from "@/lib/admin.functions";
import { AdminNav } from "@/components/AdminNav";
import { Users, UserCheck, Flag, Ban, MessageCircle, AlertTriangle, MessageSquare, ArrowRight, Sparkles, Megaphone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Tableau de bord — Admin Nooryaa" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const fetchStats = useServerFn(adminStats);
  const { data } = useQuery({ queryKey: ["admin-stats"], queryFn: () => fetchStats() });
  const seedFn = useServerFn(adminSeedTestProfiles);
  const seed = useMutation({
    mutationFn: () => seedFn(),
    onSuccess: (res) => {
      const created = res.results.filter((r) => r.status === "created").length;
      const existing = res.results.filter((r) => r.status === "exists").length;
      toast.success(`${created} profil(s) créé(s), ${existing} déjà présent(s).`);
    },
    onError: (e: any) => toast.error(e?.message ?? "Erreur lors de la création"),
  });

  const cards = [
    { label: "Total profils", value: data?.total, icon: Users, tone: "bg-blue-50 text-blue-700" },
    { label: "Actifs", value: data?.active, icon: UserCheck, tone: "bg-green-50 text-green-700" },
    { label: "Connectés (24h)", value: data?.activeToday, icon: UserCheck, tone: "bg-sky-50 text-sky-700" },
    { label: "Suspendus / bannis", value: data?.suspended, icon: AlertTriangle, tone: "bg-orange-50 text-orange-700" },
    { label: "Signalements ouverts", value: data?.openReports, icon: Flag, tone: "bg-red-50 text-red-700" },
    { label: "Blocages totaux", value: data?.blocks, icon: Ban, tone: "bg-gray-100 text-gray-700" },
    { label: "Messages (24h)", value: data?.messages24h, icon: MessageCircle, tone: "bg-purple-50 text-purple-700" },
  ];

  const shortcuts = [
    { to: "/admin/profiles", label: "Gérer les profils", desc: "Voir, filtrer, suspendre, bannir ou supprimer un membre.", icon: Users },
    { to: "/admin/conversations", label: "Suivre les discussions", desc: "Lire tous les échanges (texte et photos) entre membres.", icon: MessageSquare },
    { to: "/admin/reports", label: "Traiter les signalements", desc: "Examiner et résoudre les signalements ouverts.", icon: Flag },
    { to: "/admin/contact", label: "Messages de contact", desc: "Répondre aux messages envoyés depuis le formulaire d'accueil.", icon: Mail },
    { to: "/admin/ads", label: "Espace publicités", desc: "Gérer le carrousel d'annonces partenaires sur l'accueil.", icon: Megaphone },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-serif text-primary">Tableau de bord</h1>
            <p className="text-sm text-muted-foreground">Vue d'ensemble de la plateforme Nooryaa.</p>
          </div>
          {data && data.openReports > 0 && (
            <Link to="/admin/reports" className="inline-flex items-center gap-2 rounded-full bg-red-50 text-red-700 px-4 py-2 text-sm font-medium hover:bg-red-100">
              <Flag className="h-4 w-4" /> {data.openReports} signalement{data.openReports > 1 ? "s" : ""} à traiter
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="bg-card rounded-2xl p-5 border border-border/60 shadow-[var(--shadow-card)]">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${c.tone}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div className="text-3xl font-serif text-primary leading-none">{c.value ?? "—"}</div>
              <div className="text-xs text-muted-foreground mt-2">{c.label}</div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-serif text-primary mb-3">Raccourcis de modération</h2>
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
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center"><Sparkles className="h-5 w-5" /></div>
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