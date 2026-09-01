import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth } from "@/lib/admin.functions";
import { adminFinance } from "@/lib/admin-insights.functions";
import { AdminNav } from "@/components/AdminNav";
import { AdminPeriodPicker, usePeriod } from "@/components/AdminPeriodPicker";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Download } from "lucide-react";

export const Route = createFileRoute("/admin/finance")({
  ssr: false,
  head: () => ({ meta: [{ title: "Finance — Admin Nooryaa" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminFinance,
});

const euro = (n: number) => `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

function AdminFinance() {
  const period = usePeriod();
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("day");
  const fetchFinance = useServerFn(adminFinance);
  const { data } = useQuery({
    queryKey: ["admin-finance", period.from, period.to, granularity],
    queryFn: () => fetchFinance({ data: { from: period.from, to: period.to, granularity } }),
  });

  function exportCsv() {
    if (!data) return;
    const header = "date,ttc,ht,tva,hommes,femmes,transactions";
    const lines = data.series.map((s) => [s.period, s.ttc, s.ht, s.tva, s.homme, s.femme, s.count].join(","));
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nooryaa-ca-${period.from.slice(0, 10)}_${period.to.slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const kpis = [
    { label: "CA TTC", value: data ? euro(data.totals.ttc) : "—" },
    { label: "CA HT", value: data ? euro(data.totals.ht) : "—" },
    { label: "TVA collectée", value: data ? euro(data.totals.tva) : "—" },
    { label: "Transactions", value: data?.totals.transactions ?? "—" },
    { label: "Abonnés payants", value: data?.totals.payingMembers ?? "—" },
    { label: "ARPU", value: data ? euro(data.totals.arpu) : "—" },
    { label: "Taux de conversion", value: data ? `${data.totals.conversion} %` : "—" },
    { label: "Annulations", value: data?.totals.cancelled ?? "—" },
  ];

  return (
    <div className="min-h-screen mosaic-soft">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-serif gold-text tracking-wide">Finance</h1>
            <p className="text-sm text-muted-foreground">Chiffre d'affaires TTC par période, formule et genre.</p>
          </div>
          <div className="flex items-center gap-2">
            <AdminPeriodPicker {...period} />
            <select
              aria-label="Granularité"
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as typeof granularity)}
              className="h-9 rounded-full border border-border bg-card px-3 text-sm"
            >
              <option value="day">Par jour</option>
              <option value="week">Par semaine</option>
              <option value="month">Par mois</option>
            </select>
            <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={exportCsv}>
              <Download className="h-4 w-4" /> CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-card rounded-2xl p-5 gold-frame">
              <div className="text-2xl font-serif text-primary">{k.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
            </div>
          ))}
        </div>

        <section className="bg-card rounded-2xl p-5 border border-border/60">
          <h2 className="text-lg font-serif text-primary mb-3">CA TTC par période (hommes / femmes)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.series ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="period" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => euro(Number(v))} />
                <Legend />
                <Bar dataKey="homme" name="Hommes" stackId="a" fill="var(--chart-1, #4f46e5)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="femme" name="Femmes" stackId="a" fill="var(--chart-2, #db2777)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-card rounded-2xl p-5 border border-border/60">
          <h2 className="text-lg font-serif text-primary mb-3">Par formule</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="text-left py-2">Formule</th>
                  <th className="text-right">Abonnés actifs</th>
                  <th className="text-right">Transactions</th>
                  <th className="text-right">CA TTC</th>
                </tr>
              </thead>
              <tbody>
                {(data?.byPlan ?? []).map((p) => (
                  <tr key={p.code} className="border-t border-border/50">
                    <td className="py-2 font-medium">{p.name}</td>
                    <td className="text-right">{p.activeSubscribers}</td>
                    <td className="text-right">{p.count}</td>
                    <td className="text-right">{euro(p.ttc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-card rounded-2xl p-5 border border-border/60">
          <h2 className="text-lg font-serif text-primary mb-3">Dernières transactions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="text-left py-2">Date</th>
                  <th className="text-left">Formule</th>
                  <th className="text-left">Genre</th>
                  <th className="text-left">Statut</th>
                  <th className="text-right">Montant TTC</th>
                </tr>
              </thead>
              <tbody>
                {(data?.transactions ?? []).map((t) => (
                  <tr key={t.id} className="border-t border-border/50">
                    <td className="py-2">{new Date(t.created_at).toLocaleDateString("fr-FR")}</td>
                    <td>{t.plan_code}</td>
                    <td>{t.gender ?? "—"}</td>
                    <td>{t.status}</td>
                    <td className="text-right">{euro(Number(t.amount_ttc))}</td>
                  </tr>
                ))}
                {data && data.transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      Aucune transaction sur la période.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
