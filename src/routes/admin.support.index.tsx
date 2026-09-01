import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth } from "@/lib/admin.functions";
import { adminListTickets } from "@/lib/admin-insights.functions";
import { AdminNav } from "@/components/AdminNav";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/support/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Support — Admin Nooryaa" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminSupport,
});

export const STATUS_LABEL: Record<string, string> = {
  open: "Non traité",
  in_progress: "En cours",
  resolved: "Traité",
  closed: "Fermé",
};

const STATUS_TONE: Record<string, string> = {
  open: "bg-destructive/10 text-destructive",
  in_progress: "bg-secondary text-primary",
  resolved: "bg-primary/10 text-primary",
  closed: "bg-muted text-muted-foreground",
};

function AdminSupport() {
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const list = useServerFn(adminListTickets);
  const { data } = useQuery({
    queryKey: ["admin-tickets", status, q],
    queryFn: () => list({ data: { status, q } }),
    refetchInterval: 30000,
  });

  return (
    <div className="min-h-screen mosaic-soft">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-5">
        <div>
          <h1 className="text-3xl font-serif gold-text tracking-wide">Support</h1>
          <p className="text-sm text-muted-foreground">Tickets des membres, statut et historique des échanges.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Input placeholder="Rechercher un membre ou un message…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <select
            aria-label="Statut"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-md border border-border bg-card px-3 text-sm"
          >
            <option value="all">Tous les statuts</option>
            <option value="open">Non traité</option>
            <option value="in_progress">En cours</option>
            <option value="resolved">Traité</option>
            <option value="closed">Fermé</option>
          </select>
        </div>

        <div className="bg-card rounded-2xl border border-border/60 divide-y divide-border/60 overflow-hidden">
          {(data ?? []).map((t) => (
            <Link key={t.id} to="/admin/support/$id" params={{ id: t.id }} className="flex items-start gap-3 p-4 hover:bg-muted/40">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-primary">{t.profile?.pseudo ?? "Membre supprimé"}</span>
                  <span className="text-xs text-muted-foreground">{t.profile?.email}</span>
                  <span className="text-xs rounded-full bg-muted px-2 py-0.5">{t.category}</span>
                  {t.priority !== "normal" && (
                    <span className="text-xs rounded-full bg-[color-mix(in_oklab,var(--gold)_20%,transparent)] px-2 py-0.5">{t.priority}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{t.message}</p>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-xs rounded-full px-2 py-0.5 ${STATUS_TONE[t.status] ?? "bg-muted"}`}>
                  {STATUS_LABEL[t.status] ?? t.status}
                </span>
                <div className="text-[11px] text-muted-foreground mt-1">{new Date(t.created_at).toLocaleDateString("fr-FR")}</div>
              </div>
            </Link>
          ))}
          {data && data.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">Aucun ticket.</div>}
        </div>
      </main>
    </div>
  );
}
