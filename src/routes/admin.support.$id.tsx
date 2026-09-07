import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth } from "@/lib/admin.functions";
import { adminTicketThread, adminReplyTicket, adminUpdateTicket } from "@/lib/admin-insights.functions";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { frenchError } from "@/lib/errors";

export const Route = createFileRoute("/admin/support/$id")({
  ssr: false,
  head: () => ({ meta: [{ title: "Ticket — Admin Nooryaa" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: TicketDetail,
});

function TicketDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const thread = useServerFn(adminTicketThread);
  const reply = useServerFn(adminReplyTicket);
  const update = useServerFn(adminUpdateTicket);
  const [content, setContent] = useState("");
  const [internal, setInternal] = useState(false);

  const { data } = useQuery({ queryKey: ["admin-ticket", id], queryFn: () => thread({ data: { id } }) });

  const send = useMutation({
    mutationFn: () => reply({ data: { id, content, internal } }),
    onSuccess: () => {
      setContent("");
      toast.success("Réponse enregistrée");
      qc.invalidateQueries({ queryKey: ["admin-ticket", id] });
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
    },
    onError: (e: any) => toast.error(frenchError(e, "Erreur")),
  });

  const setStatus = useMutation({
    mutationFn: (status: string) => update({ data: { id, status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ticket", id] });
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
    },
  });

  const setPriority = useMutation({
    mutationFn: (priority: string) => update({ data: { id, priority } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ticket", id] }),
  });

  return (
    <div className="min-h-screen mosaic-soft">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-5">
        <Link to="/admin/support" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Retour aux tickets
        </Link>

        <div className="bg-card rounded-2xl p-5 border border-border/60 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-serif text-primary">{data?.ticket.category}</h1>
              <p className="text-sm text-muted-foreground">
                {data?.profile?.pseudo} · {data?.profile?.email} · {data?.ticket.created_at && new Date(data.ticket.created_at).toLocaleString("fr-FR")}
              </p>
            </div>
            <div className="flex gap-2">
              <select
                aria-label="Statut du ticket"
                value={data?.ticket.status ?? "open"}
                onChange={(e) => setStatus.mutate(e.target.value)}
                className="h-9 rounded-full border border-border bg-card px-3 text-sm"
              >
                <option value="open">Non traité</option>
                <option value="in_progress">En cours</option>
                <option value="resolved">Traité</option>
                <option value="closed">Fermé</option>
              </select>
              <select
                aria-label="Priorité"
                value={data?.ticket.priority ?? "normal"}
                onChange={(e) => setPriority.mutate(e.target.value)}
                className="h-9 rounded-full border border-border bg-card px-3 text-sm"
              >
                <option value="basse">Priorité basse</option>
                <option value="normal">Priorité normale</option>
                <option value="haute">Priorité haute</option>
              </select>
            </div>
          </div>
          <p className="text-sm whitespace-pre-wrap">{data?.ticket.message}</p>
          {data?.profile && (
            <Link to="/admin/profiles/$id" params={{ id: data.profile.id }} className="text-sm text-primary underline">
              Voir la fiche membre
            </Link>
          )}
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-bold">Historique des échanges</h2>
          {(data?.replies ?? []).map((r) => (
            <div
              key={r.id}
              className={`rounded-2xl p-4 border ${r.internal ? "border-dashed border-border bg-muted/40" : "border-border/60 bg-card"}`}
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>{r.internal ? "Note interne" : r.author}</span>
                <span>{new Date(r.created_at).toLocaleString("fr-FR")}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{r.content}</p>
            </div>
          ))}
          {data && data.replies.length === 0 && <p className="text-sm text-muted-foreground">Aucune réponse pour l'instant.</p>}
        </section>

        <section className="bg-card rounded-2xl p-5 border border-border/60 space-y-3">
          <Textarea placeholder="Votre réponse au membre…" rows={4} value={content} onChange={(e) => setContent(e.target.value)} />
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={internal} onCheckedChange={setInternal} aria-label="Note interne" /> Note interne (invisible pour le membre)
            </label>
            <Button disabled={!content.trim() || send.isPending} onClick={() => send.mutate()} className="rounded-full">
              {send.isPending ? "Envoi…" : "Envoyer"}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
