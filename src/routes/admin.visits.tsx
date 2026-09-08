import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { adminCheckAuth } from "@/lib/admin.functions";
import { adminListVisits, adminDeleteVisits } from "@/lib/visits.functions";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export const Route = createFileRoute("/admin/visits")({
  ssr: false,
  head: () => ({ meta: [{ title: "Visites — Admin Nooryaa" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminVisits,
});

function AdminVisits() {
  const list = useServerFn(adminListVisits);
  const del = useServerFn(adminDeleteVisits);
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);

  const { data } = useQuery({
    queryKey: ["admin-visits"],
    queryFn: () => list({ data: { limit: 500 } }),
    refetchInterval: 60000,
  });

  const delMut = useMutation({
    mutationFn: (vars: { ids?: string[]; all?: boolean }) => del({ data: vars }),
    onSuccess: () => {
      toast.success("Historique mis à jour");
      setSelected([]);
      qc.invalidateQueries({ queryKey: ["admin-visits"] });
    },
    onError: () => toast.error("Suppression impossible"),
  });

  const rows = data?.rows ?? [];
  const allChecked = rows.length > 0 && selected.length === rows.length;

  const place = (r: { city: string | null; region: string | null; country: string | null }) =>
    [r.city, r.region, r.country].filter(Boolean).join(", ") || "Ville inconnue";

  return (
    <div className="min-h-screen mosaic-soft">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-serif text-primary flex items-center gap-2">
            <Eye className="h-7 w-7" /> Visites
          </h1>
          <p className="text-sm text-muted-foreground">
            Qui visite Nooryaa, depuis quelle ville et par quel canal — pour mieux cibler vos actions.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Villes les plus actives", items: data?.topCities ?? [] },
            { title: "Provenances", items: data?.topSources ?? [] },
            { title: "Pages les plus vues", items: data?.topPages ?? [] },
          ].map((block) => (
            <section key={block.title} className="bg-card rounded-2xl border border-border/60 p-4">
              <h2 className="text-sm font-semibold text-primary mb-2">{block.title}</h2>
              <ul className="space-y-1 text-sm">
                {block.items.map((i) => (
                  <li key={i.label} className="flex justify-between gap-3">
                    <span className="truncate text-muted-foreground">{i.label}</span>
                    <span className="font-semibold">{i.value}</span>
                  </li>
                ))}
                {block.items.length === 0 && <li className="text-muted-foreground">Aucune donnée.</li>}
              </ul>
            </section>
          ))}
        </div>

        <section className="bg-card rounded-2xl border border-border/60 p-4 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-serif text-primary">Visiteurs ({data?.total ?? 0})</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={selected.length === 0 || delMut.isPending}
                onClick={() => delMut.mutate({ ids: selected })}
              >
                Supprimer la sélection ({selected.length})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={delMut.isPending || rows.length === 0}
                onClick={() => {
                  if (confirm("Supprimer tout l'historique des visites ?")) delMut.mutate({ all: true });
                }}
              >
                Supprimer tout l'historique
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b border-border/60">
                  <th className="py-2 pr-3 text-left font-medium">
                    <input
                      type="checkbox"
                      aria-label="Tout sélectionner"
                      checked={allChecked}
                      onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])}
                    />
                  </th>
                  <th className="py-2 pr-3 text-left font-medium">Date</th>
                  <th className="py-2 pr-3 text-left font-medium">Heure</th>
                  <th className="py-2 pr-3 text-left font-medium">Ville</th>
                  <th className="py-2 pr-3 text-left font-medium">Page</th>
                  <th className="py-2 pr-3 text-left font-medium">Provenance</th>
                  <th className="py-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const d = new Date(r.created_at);
                  return (
                    <tr key={r.id} className="border-b border-border/40">
                      <td className="py-2 pr-3">
                        <input
                          type="checkbox"
                          aria-label="Sélectionner la visite"
                          checked={selected.includes(r.id)}
                          onChange={(e) =>
                            setSelected((s) => (e.target.checked ? [...s, r.id] : s.filter((x) => x !== r.id)))
                          }
                        />
                      </td>
                      <td className="py-2 pr-3">{d.toLocaleDateString("fr-FR")}</td>
                      <td className="py-2 pr-3">{d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="py-2 pr-3">{place(r)}</td>
                      <td className="py-2 pr-3">{r.path}</td>
                      <td className="py-2 pr-3">{r.source}</td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          className="text-destructive font-medium hover:underline"
                          onClick={() => delMut.mutate({ ids: [r.id] })}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-muted-foreground">
                      Aucune visite enregistrée pour le moment.
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
