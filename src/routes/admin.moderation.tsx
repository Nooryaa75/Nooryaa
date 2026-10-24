import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth, adminListModeration } from "@/lib/admin.functions";
import { AdminNav } from "@/components/AdminNav";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/moderation")({
  ssr: false,
  head: () => ({ meta: [{ title: "Modération automatique — Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminModeration,
});

function AdminModeration() {
  const [verdict, setVerdict] = useState("all");
  const list = useServerFn(adminListModeration);
  const { data } = useQuery({
    queryKey: ["admin-moderation", verdict],
    queryFn: () => list({ data: { verdict } }),
  });
  const [qName, setQName] = useState("");
  const [qReason, setQReason] = useState("");
  const [qDate, setQDate] = useState("");
  const norm = (s: unknown) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filtered = (data ?? []).filter((e: any) => {
    if (qName.trim()) {
      const n = norm(qName.trim());
      const hay = [e.author?.pseudo, e.target?.pseudo, e.author?.first_name, e.author?.last_name, e.target?.first_name, e.target?.last_name, e.author?.email, e.target?.email].map(norm).join(" ");
      if (!hay.includes(n)) return false;
    }
    if (qReason.trim()) {
      const r = norm(qReason.trim());
      const hay = [e.reason, ...(e.categories ?? []), e.content].map(norm).join(" ");
      if (!hay.includes(r)) return false;
    }
    if (qDate) {
      const d = new Date(e.created_at);
      const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (local !== qDate) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen mosaic-soft">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-3xl font-serif text-primary">Modération automatique</h1>
          <Select value={verdict} onValueChange={setVerdict}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="block">Messages bloqués</SelectItem>
              <SelectItem value="warn">Avertissements</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          Chaque message privé est analysé avant envoi : lexique interdit, ton et contexte. Les messages contraires à la charte sont bloqués, les cas limites sont signalés ici.
        </p>

        <div className="flex flex-wrap gap-2">
          <Input className="flex-1 min-w-[180px]" placeholder="Rechercher un nom ou pseudo" value={qName} onChange={(e) => setQName(e.target.value)} />
          <Input className="flex-1 min-w-[180px]" placeholder="Rechercher une raison" value={qReason} onChange={(e) => setQReason(e.target.value)} />
          <Input type="date" className="w-[170px]" value={qDate} onChange={(e) => setQDate(e.target.value)} aria-label="Date" />
        </div>

        <div className="space-y-3">
          {filtered.map((e: any) => (
            <div key={e.id} className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2 text-sm">
                <span className="font-medium text-primary">
                  {e.author?.pseudo ?? "—"} → {e.target?.pseudo ?? "—"}
                </span>
                <span className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${e.verdict === "block" ? "bg-destructive/10 text-destructive" : "bg-[color-mix(in_oklab,var(--gold)_20%,transparent)] text-[color:var(--gold)]"}`}>
                    {e.verdict === "block" ? "Bloqué" : "Averti"}
                  </span>
                  <span className="text-muted-foreground text-xs">{new Date(e.created_at).toLocaleString("fr-FR")}</span>
                </span>
              </div>
              {e.categories?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {e.categories.map((c: string) => (
                    <span key={c} className="text-xs rounded-full bg-secondary px-2 py-0.5">{c}</span>
                  ))}
                </div>
              )}
              <p className="text-sm italic text-muted-foreground">« {e.content} »</p>
              {e.reason && <p className="text-xs text-muted-foreground">Motif : {e.reason}</p>}
            </div>
          ))}
          {data && filtered.length === 0 && (
            <p className="text-muted-foreground text-sm">Aucun événement de modération.</p>
          )}
        </div>
      </main>
    </div>
  );
}
