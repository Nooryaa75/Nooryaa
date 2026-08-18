import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth, adminGetConversation, adminDeleteMessage } from "@/lib/admin.functions";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/conversations/$pair")({
  ssr: false,
  head: () => ({ meta: [{ title: "Conversation — Admin Noorya" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminConversationView,
});

function AdminConversationView() {
  const { pair } = Route.useParams();
  const [a, b] = pair.split("__");
  const qc = useQueryClient();
  const get = useServerFn(adminGetConversation);
  const del = useServerFn(adminDeleteMessage);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-conv", a, b],
    queryFn: () => get({ data: { a, b } }),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-conv", a, b] }); toast.success("Message supprimé"); },
    onError: (e: any) => toast.error(e.message),
  });

  const pA = data?.participants.find((p: any) => p.id === a);
  const pB = data?.participants.find((p: any) => p.id === b);

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
        <Link to="/admin/conversations" className="text-sm text-muted-foreground inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Retour aux discussions</Link>
        <div className="bg-card rounded-2xl p-5 border border-border/60 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <Link to="/admin/profiles/$id" params={{ id: a }} className="font-medium text-primary underline">{pA?.pseudo ?? a.slice(0,8)}</Link>
            <span className="text-muted-foreground">↔</span>
            <Link to="/admin/profiles/$id" params={{ id: b }} className="font-medium text-primary underline">{pB?.pseudo ?? b.slice(0,8)}</Link>
          </div>
          <div className="text-xs text-muted-foreground">{data?.messages.length ?? 0} message(s)</div>
        </div>
        <div className="bg-card rounded-2xl border border-border/60 p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {isLoading && <div className="text-center text-sm text-muted-foreground py-10">Chargement...</div>}
          {data?.messages.map((m: any) => {
            const fromA = m.sender === a;
            const author = fromA ? pA : pB;
            return (
              <div key={m.id} className={`flex ${fromA ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[75%] rounded-2xl overflow-hidden text-sm border ${fromA ? "bg-secondary/60 border-border/60" : "bg-primary/10 border-primary/20"}`}>
                  <div className="px-3 pt-2 text-[10px] uppercase tracking-wide text-muted-foreground flex items-center justify-between gap-3">
                    <span>{author?.pseudo ?? m.sender.slice(0,8)} · {new Date(m.created_at).toLocaleString("fr-FR")}</span>
                    <button onClick={() => { if (confirm("Supprimer ce message ?")) delMut.mutate(m.id); }} className="text-red-600 hover:text-red-700"><Trash2 className="h-3 w-3" /></button>
                  </div>
                  {m.image_url && (
                    <a href={m.image_url} target="_blank" rel="noopener noreferrer">
                      <img src={m.image_url} alt="Photo partagée" className="max-h-80 w-auto object-cover mt-2" />
                    </a>
                  )}
                  {m.content && <div className="px-4 py-2">{m.content}</div>}
                </div>
              </div>
            );
          })}
          {data && data.messages.length === 0 && <div className="text-center text-sm text-muted-foreground py-10">Aucun message.</div>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/profiles/$id" params={{ id: a }}><Button variant="outline" size="sm">Voir le profil de {pA?.pseudo ?? "A"}</Button></Link>
          <Link to="/admin/profiles/$id" params={{ id: b }}><Button variant="outline" size="sm">Voir le profil de {pB?.pseudo ?? "B"}</Button></Link>
        </div>
      </main>
    </div>
  );
}