import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth, adminListReports, adminResolveReport, adminUpdateStatus } from "@/lib/admin.functions";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { frenchError } from "@/lib/errors";

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
    mutationFn: (vars: { id: string; status: "open" | "resolved" | "rejected"; comment?: string }) => resolve({ data: vars }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-reports"] }); toast.success("Mis à jour"); },
    onError: (e: any) => toast.error(frenchError(e)),
  });

  const suspendMut = useMutation({
    mutationFn: (id: string) => setProfileStatus({ data: { id, status: "suspended" } }),
    onSuccess: () => toast.success("Profil suspendu"),
    onError: (e: any) => toast.error(frenchError(e)),
  });

  return (
    <div className="min-h-screen mosaic-soft">
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
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "open" ? "bg-[color-mix(in_oklab,var(--gold)_20%,transparent)] text-[color:var(--gold)]" : r.status === "resolved" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{r.status === "open" ? "Ouvert" : r.status === "resolved" ? "Résolu" : "Rejeté"}</span>
              </div>
              <p className="text-sm">{r.reason}</p>
              <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("fr-FR")}</div>
              <details className="rounded-xl border border-border/60 bg-muted/30 p-3 text-sm">
                <summary className="cursor-pointer font-medium text-primary">Échanges avant le signalement ({r.chat?.length ?? 0})</summary>
                {!r.chat?.length ? (
                  <p className="mt-2 text-muted-foreground">Aucun message échangé entre ces deux membres.</p>
                ) : (
                  <div className="mt-2 space-y-2 max-h-80 overflow-y-auto">
                    {r.chat.map((m: any) => {
                      const byReported = m.sender === r.reported;
                      return (
                        <div key={m.id} className={`rounded-lg px-3 py-2 ${byReported ? "bg-destructive/10" : "bg-card"}`}>
                          <div className="text-[11px] text-muted-foreground">
                            <strong>{byReported ? (r.reportedProfile?.pseudo ?? "Signalé") : (r.reporterProfile?.pseudo ?? "Auteur")}</strong> · {new Date(m.created_at).toLocaleString("fr-FR")}
                          </div>
                          <div className="whitespace-pre-wrap">
                            {m.deleted_at ? <em>Message supprimé</em> : m.audio_path ? <em>Message vocal</em> : m.image_path ? <em>Photo</em> : m.content}
                            {m.deleted_at && m.content ? <span className="text-muted-foreground"> — {m.content}</span> : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </details>
              <ReportActions
                report={r}
                saving={resolveMut.isPending}
                onSave={(st, comment) => resolveMut.mutate({ id: r.id, status: st, comment })}
                onSuspend={() => suspendMut.mutate(r.reported)}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
function ReportActions({ report, saving, onSave, onSuspend }: {
  report: any;
  saving: boolean;
  onSave: (status: "open" | "resolved" | "rejected", comment: string) => void;
  onSuspend: () => void;
}) {
  const [comment, setComment] = useState<string>(report.admin_comment ?? "");
  const [st, setSt] = useState<"open" | "resolved" | "rejected">(report.status);
  return (
    <div className="space-y-2 pt-1">
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Commentaire de l'équipe (visible uniquement par l'administration)"
        maxLength={2000}
        rows={2}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Select value={st} onValueChange={(v) => setSt(v as any)}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Ouvert</SelectItem>
            <SelectItem value="resolved">Résolu</SelectItem>
            <SelectItem value="rejected">Rejeté</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" disabled={saving} onClick={() => onSave(st, comment)}>Enregistrer</Button>
        <Button size="sm" variant="destructive" onClick={onSuspend}>Suspendre le profil</Button>
      </div>
    </div>
  );
}
