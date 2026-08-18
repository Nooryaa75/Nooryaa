import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth, adminListContacts, adminMarkContactRead, adminDeleteContact } from "@/lib/admin.functions";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, Trash2, CheckCircle2, Circle } from "lucide-react";

export const Route = createFileRoute("/admin/contact")({
  ssr: false,
  head: () => ({ meta: [{ title: "Contact — Admin Nooryaa" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminContact,
});

function AdminContact() {
  const [onlyUnread, setOnlyUnread] = useState(false);
  const list = useServerFn(adminListContacts);
  const mark = useServerFn(adminMarkContactRead);
  const del = useServerFn(adminDeleteContact);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-contacts", onlyUnread], queryFn: () => list({ data: { onlyUnread } }) });

  const markMut = useMutation({
    mutationFn: (vars: { id: string; read: boolean }) => mark({ data: vars }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-contacts"] }); qc.invalidateQueries({ queryKey: ["admin-notif-counts"] }); },
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Supprimé"); qc.invalidateQueries({ queryKey: ["admin-contacts"] }); qc.invalidateQueries({ queryKey: ["admin-notif-counts"] }); },
  });

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-serif text-primary flex items-center gap-2"><Mail className="h-7 w-7" /> Messages de contact</h1>
            <p className="text-sm text-muted-foreground">Messages envoyés depuis le formulaire de contact de Nooryaa.</p>
          </div>
          <Button variant={onlyUnread ? "default" : "outline"} size="sm" onClick={() => setOnlyUnread((v) => !v)}>
            {onlyUnread ? "Tous" : "Non lus uniquement"}
          </Button>
        </div>

        <div className="space-y-3">
          {data?.map((m: any) => (
            <div key={m.id} className={`bg-card rounded-2xl border p-4 space-y-2 ${m.read ? "border-border/60" : "border-primary/40 shadow-[var(--shadow-card)]"}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-medium text-primary">{m.subject || "(sans sujet)"}</div>
                  <div className="text-xs text-muted-foreground">
                    De <strong>{m.name}</strong> · <a href={`mailto:${m.email}`} className="underline">{m.email}</a> · {new Date(m.created_at).toLocaleString("fr-FR")}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => markMut.mutate({ id: m.id, read: !m.read })}>
                    {m.read ? <><Circle className="h-4 w-4 mr-1" /> Marquer non lu</> : <><CheckCircle2 className="h-4 w-4 mr-1" /> Marquer lu</>}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => { if (confirm("Supprimer ce message ?")) delMut.mutate(m.id); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap text-foreground/90">{m.message}</p>
            </div>
          ))}
          {data && data.length === 0 && (
            <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-border/60 text-muted-foreground">Aucun message.</div>
          )}
        </div>
      </main>
    </div>
  );
}