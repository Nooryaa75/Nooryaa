import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth, adminListConversations } from "@/lib/admin.functions";
import { AdminNav } from "@/components/AdminNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { MessageSquare, Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/admin/conversations/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Discussions — Admin Noorya" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminConversations,
});

function AdminConversations() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const list = useServerFn(adminListConversations);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-conversations", search],
    queryFn: () => list({ data: { q: search } }),
  });

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-4">
        <div>
          <h1 className="text-3xl font-serif text-primary">Discussions</h1>
          <p className="text-sm text-muted-foreground">Surveillez toutes les conversations entre membres (texte et photos).</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setSearch(q); }} className="bg-card rounded-2xl p-4 border border-border/60 flex gap-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer par pseudo ou email..." />
          <Button type="submit">Rechercher</Button>
        </form>
        <div className="bg-card rounded-2xl border border-border/60 divide-y divide-border/60">
          {isLoading && <div className="p-8 text-center text-sm text-muted-foreground">Chargement...</div>}
          {data && data.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Aucune conversation.</div>}
          {data?.map((c: any) => (
            <Link key={c.key} to="/admin/conversations/$pair" params={{ pair: `${c.a}__${c.b}` }} className="flex items-center justify-between gap-4 p-4 hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary"><MessageSquare className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <div className="font-medium text-primary truncate">
                    {c.aProfile?.pseudo ?? c.a.slice(0,8)} <span className="text-muted-foreground">↔</span> {c.bProfile?.pseudo ?? c.b.slice(0,8)}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{c.lastPreview || "—"}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground whitespace-nowrap">
                <span>{c.count} msg</span>
                {c.photos > 0 && <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" />{c.photos}</span>}
                <span>{new Date(c.lastAt).toLocaleString("fr-FR")}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}