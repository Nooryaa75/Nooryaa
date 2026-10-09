import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth, adminListConversations } from "@/lib/admin.functions";
import { AdminNav } from "@/components/AdminNav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { MessageSquare, Image as ImageIcon } from "lucide-react";
import { frenchError } from "@/lib/errors";

export const Route = createFileRoute("/admin/conversations/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Discussions — Admin Nooryaa" }, { name: "description", content: "Gestion des discussions entre membres Nooryaa." }, { property: "og:title", content: "Discussions — Admin Nooryaa" }, { property: "og:description", content: "Gestion des discussions entre membres Nooryaa." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminConversations,
});

function AdminConversations() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 30;
  const list = useServerFn(adminListConversations);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-conversations", search],
    queryFn: () => list({ data: { q: search } }),
    refetchInterval: 30000,
  });
  const currentPage = Math.min(page, Math.max(0, Math.ceil((data?.length ?? 0) / pageSize) - 1));

  return (
    <div className="min-h-screen mosaic-soft">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-4">
        <div>
          <h1 className="text-3xl font-serif text-primary">Discussions</h1>
          {data && <p className="text-sm text-muted-foreground">{data.length} discussion(s)</p>}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setSearch(q); setPage(0); }} className="bg-card rounded-2xl p-4 border border-border/60 flex gap-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer par pseudo ou email..." />
          <Button type="submit">Rechercher</Button>
        </form>
        <div className="bg-card rounded-2xl border border-border/60 divide-y divide-border/60">
          {isLoading && <div className="p-8 text-center text-sm text-muted-foreground">Chargement...</div>}
          {error && <div className="p-8 text-center space-y-3"><p className="text-sm text-destructive">{frenchError(error)}</p><Button variant="outline" onClick={() => refetch()}>Réessayer</Button></div>}
          {data && data.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Aucune conversation.</div>}
          {data?.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((c: any) => (
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
                <span>{c.count === 0 ? "Non démarrée" : `${c.count} message(s)`}</span>
                {c.photos > 0 && <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" />{c.photos}</span>}
                <span>{new Date(c.lastAt).toLocaleString("fr-FR")}</span>
              </div>
            </Link>
          ))}
        </div>
        {data && data.length > pageSize && <div className="flex justify-between items-center gap-3 text-sm">
          <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Précédent</Button>
          <span className="text-muted-foreground">Page {currentPage + 1} / {Math.ceil(data.length / pageSize)}</span>
          <Button variant="outline" size="sm" disabled={(currentPage + 1) * pageSize >= data.length} onClick={() => setPage(currentPage + 1)}>Suivant</Button>
        </div>}
      </main>
    </div>
  );
}