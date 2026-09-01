import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth } from "@/lib/admin.functions";
import { adminAnalytics, adminOnlineNow } from "@/lib/admin-insights.functions";
import { AdminNav } from "@/components/AdminNav";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/admin/analytics")({
  ssr: false,
  head: () => ({ meta: [{ title: "Analytics — Admin Nooryaa" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminAnalytics,
});

function AdminAnalytics() {
  const fetchAnalytics = useServerFn(adminAnalytics);
  const fetchOnline = useServerFn(adminOnlineNow);
  const { data } = useQuery({ queryKey: ["admin-analytics"], queryFn: () => fetchAnalytics() });
  const { data: online } = useQuery({ queryKey: ["admin-online"], queryFn: () => fetchOnline(), refetchInterval: 15000 });

  const max = data?.funnel[0]?.value || 1;

  return (
    <div className="min-h-screen mosaic-soft">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-serif gold-text tracking-wide">Analytics</h1>
          <p className="text-sm text-muted-foreground">Entonnoir, rétention et activité de la plateforme.</p>
        </div>

        <section className="bg-card rounded-2xl p-5 border border-border/60">
          <h2 className="text-lg font-serif text-primary mb-4">Entonnoir de conversion</h2>
          <div className="space-y-2">
            {(data?.funnel ?? []).map((f) => (
              <div key={f.step} className="flex items-center gap-3">
                <div className="w-40 text-sm text-muted-foreground shrink-0">{f.step}</div>
                <div className="flex-1 h-7 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary/80 rounded-full" style={{ width: `${(f.value / max) * 100}%` }} />
                </div>
                <div className="w-24 text-right text-sm font-semibold">
                  {f.value} <span className="text-muted-foreground font-normal">({Math.round((f.value / max) * 100)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-card rounded-2xl p-5 border border-border/60">
            <h2 className="text-lg font-serif text-primary mb-3">Rétention</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.retention ?? []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" fontSize={11} />
                  <YAxis fontSize={11} unit="%" />
                  <Tooltip formatter={(v: number) => `${v} %`} />
                  <Bar dataKey="value" fill="var(--chart-1, #4f46e5)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-card rounded-2xl p-5 border border-border/60">
            <h2 className="text-lg font-serif text-primary mb-3">Activité par heure (messages)</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.hours ?? []}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="hour" fontSize={10} interval={2} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Area dataKey="value" stroke="var(--chart-2, #db2777)" fill="var(--chart-2, #db2777)" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <section className="bg-card rounded-2xl p-5 border border-border/60">
          <h2 className="text-lg font-serif text-primary mb-1">Connectés en temps réel</h2>
          <p className="text-sm text-muted-foreground mb-3">{online?.count ?? 0} membre(s) actifs dans les 5 dernières minutes.</p>
          <div className="flex flex-wrap gap-2">
            {(online?.users ?? []).map((u) => (
              <span key={u.id} className="rounded-full bg-secondary px-3 py-1 text-xs">
                {u.pseudo} {u.city ? `· ${u.city}` : ""}
              </span>
            ))}
            {online && online.count === 0 && <span className="text-sm text-muted-foreground">Personne en ligne actuellement.</span>}
          </div>
        </section>
      </main>
    </div>
  );
}
