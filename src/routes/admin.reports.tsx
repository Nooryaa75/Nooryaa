import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth, adminListReports, adminResolveReport, adminUpdateStatus } from "@/lib/admin.functions";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reports")({
  ssr: false,
  head: () => ({ meta: [{ title: "Signalements — Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminReports,
});

function AdminReports() {
  const [status, setStatus] = useState("open");
  const list = useServerFn(adminListReports);
  const resolve = useServerFn(adminResolveReport);
  const setProfileStatus = useServerFn(adminUpdateStatus);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["admin-reports", status],
    queryFn: () => list({ data: { status } }),
  });

  const resolveMut = useMutation({
    mutationFn: (vars: { id: string; status: "resolved" | "rejected" }) => resolve({ data: vars }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-reports"] }); toast.success("Mis à jour"); },
  });

  const suspendMut = useMutation({
    mutationFn: (id: string) => setProfileStatus({ data: { id, status: "suspended" } }),
    onSuccess: () => toast.success("Profil suspendu"),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-3xl font-serif text-primary">Signalements</h1>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="open">Ouverts</SelectItem>
              <SelectItem value="resolved">Résolus</SelectItem>
              <SelectItem value="rejected">Rejetés</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-2xl border border-border/60 overflow-hidden divide-y divide-border/60">
          {!data || data.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Aucun signalement.</div>
          ) : data.map((r: any) => (
            <div key={r.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Signalé : </span>
                  <Link to="/admin/profiles/$id" params={{ id: r.reported }} className="font-medium text-primary underline">{r.reportedProfile?.pseudo ?? r.reported.slice(0,8)}</Link>
                  <span className="text-muted-foreground"> par </span>
                  <Link to="/admin/profiles/$id" params={{ id: r.reporter }} className="font-medium text-primary underline">{r.reporterProfile?.pseudo ?? r.reporter.slice(0,8)}</Link>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "open" ? "bg-[color-mix(in_oklab,var(--gold)_20%,transparent)] text-[color:var(--gold)]" : r.status === "resolved" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{r.status}</span>
              </div>
              <p className="text-sm">{r.reason}</p>
              <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("fr-FR")}</div>
              {r.status === "open" && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="destructive" onClick={() => suspendMut.mutate(r.reported)}>Suspendre le profil</Button>
                  <Button size="sm" variant="outline" onClick={() => resolveMut.mutate({ id: r.id, status: "resolved" })}>Marquer résolu</Button>
                  <Button size="sm" variant="ghost" onClick={() => resolveMut.mutate({ id: r.id, status: "rejected" })}>Rejeter</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}