import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth, adminListModeration } from "@/lib/admin.functions";
import { AdminNav } from "@/components/AdminNav";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

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

  return (
    <div className="min-h-screen bg-background">
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

        <div className="space-y-3">
          {(data ?? []).map((e: any) => (
            <div key={e.id} className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2 text-sm">
                <span className="font-medium text-primary">
                  {e.author?.pseudo ?? "—"} → {e.target?.pseudo ?? "—"}
                </span>
                <span className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${e.verdict === "block" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
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
          {data && data.length === 0 && (
            <p className="text-muted-foreground text-sm">Aucun événement de modération.</p>
          )}
        </div>
      </main>
    </div>
  );
}
