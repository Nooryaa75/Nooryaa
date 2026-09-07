import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth } from "@/lib/admin.functions";
import { adminListCredits, adminAdjustCredits, adminCreditHistory } from "@/lib/admin-insights.functions";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { frenchError } from "@/lib/errors";

export const Route = createFileRoute("/admin/credits")({
  ssr: false,
  head: () => ({ meta: [{ title: "Consommation — Admin Nooryaa" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminCredits,
});

function AdminCredits() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [openUser, setOpenUser] = useState<string | null>(null);
  const list = useServerFn(adminListCredits);
  const adjust = useServerFn(adminAdjustCredits);
  const history = useServerFn(adminCreditHistory);

  const { data } = useQuery({ queryKey: ["admin-credits", q], queryFn: () => list({ data: { q } }) });
  const { data: events } = useQuery({
    queryKey: ["admin-credit-history", openUser],
    queryFn: () => history({ data: { userId: openUser! } }),
    enabled: !!openUser,
  });

  const mut = useMutation({
    mutationFn: (p: { userId: string; kind: "likes" | "super_likes" | "boosts"; amount: number }) =>
      adjust({ data: { ...p, reason: p.amount > 0 ? "Crédit administrateur" : "Débit administrateur" } }),
    onSuccess: () => {
      toast.success("Crédits mis à jour");
      qc.invalidateQueries({ queryKey: ["admin-credits"] });
      qc.invalidateQueries({ queryKey: ["admin-credit-history"] });
    },
    onError: (e: any) => toast.error(frenchError(e, "Erreur")),
  });

  const kinds = [
    { key: "likes" as const, label: "Likes" },
    { key: "super_likes" as const, label: "Super likes" },
    { key: "boosts" as const, label: "Boosts" },
  ];

  return (
    <div className="min-h-screen mosaic-soft">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-5">
        <div>
          <h1 className="text-3xl font-serif gold-text tracking-wide">Consommation</h1>
          <p className="text-sm text-muted-foreground">Likes, super likes et boosts par membre — crédit ou débit en un clic.</p>
        </div>

        <Input placeholder="Rechercher un membre…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />

        <div className="bg-card rounded-2xl border border-border/60 divide-y divide-border/60 overflow-hidden">
          {(data ?? []).map((u) => {
            const c = u.credits;
            return (
              <div key={u.id} className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to="/admin/profiles/$id" params={{ id: u.id }} className="font-medium text-primary hover:underline">
                    {u.pseudo}
                  </Link>
                  <span className="text-xs text-muted-foreground">{u.email}</span>
                  <span className="text-xs rounded-full bg-secondary px-2 py-0.5">{u.plan}</span>
                  <span className="text-xs text-muted-foreground">{u.likesSent} likes envoyés</span>
                  <div className="flex-1" />
                  <Button size="sm" variant="ghost" onClick={() => setOpenUser(openUser === u.id ? null : u.id)}>
                    {openUser === u.id ? "Masquer l'historique" : "Historique"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-4">
                  {kinds.map((k) => {
                    const value = c ? Number((c as any)[k.key === "likes" ? "likes_balance" : k.key] ?? 0) : 0;
                    return (
                      <div key={k.key} className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
                        <span className="text-xs text-muted-foreground">{k.label}</span>
                        <span className="text-sm font-semibold">{value}</span>
                        <button
                          type="button"
                          aria-label={`Retirer un ${k.label}`}
                          className="h-6 w-6 rounded-full bg-card border border-border text-sm"
                          onClick={() => mut.mutate({ userId: u.id, kind: k.key, amount: -1 })}
                        >
                          −
                        </button>
                        <button
                          type="button"
                          aria-label={`Ajouter un ${k.label}`}
                          className="h-6 w-6 rounded-full bg-card border border-border text-sm"
                          onClick={() => mut.mutate({ userId: u.id, kind: k.key, amount: 1 })}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          className="text-xs text-primary underline"
                          onClick={() => mut.mutate({ userId: u.id, kind: k.key, amount: 10 })}
                        >
                          +10
                        </button>
                      </div>
                    );
                  })}
                </div>
                {openUser === u.id && (
                  <div className="rounded-xl bg-muted/50 p-3 space-y-1">
                    {(events ?? []).map((e) => (
                      <div key={e.id} className="text-xs text-muted-foreground flex justify-between gap-3">
                        <span>
                          {e.amount > 0 ? "+" : ""}
                          {e.amount} {e.kind} — {e.reason} ({e.created_by})
                        </span>
                        <span>{new Date(e.created_at).toLocaleString("fr-FR")}</span>
                      </div>
                    ))}
                    {events && events.length === 0 && <p className="text-xs text-muted-foreground">Aucun mouvement.</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
