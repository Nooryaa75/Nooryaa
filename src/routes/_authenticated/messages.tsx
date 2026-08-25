import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Messages — Nooryaa" }] }),
  component: MessagesLayout,
});

function MessagesLayout() {
  const ctx = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDetail = pathname !== "/messages";

  const { data: convos } = useQuery({
    queryKey: ["conversations", ctx.userId],
    queryFn: async () => {
      // Toute personne avec qui j'ai échangé un message OU à qui j'ai envoyé un coup de cœur
      const [{ data: sent }, { data: received }, { data: likes }, { data: iBlock }, { data: blockedMe }] = await Promise.all([
        supabase.from("messages").select("receiver, hidden_for").eq("sender", ctx.userId),
        supabase.from("messages").select("sender, hidden_for").eq("receiver", ctx.userId),
        supabase.from("likes").select("to_user").eq("from_user", ctx.userId),
        supabase.from("blocks").select("blocked").eq("blocker", ctx.userId),
        supabase.from("blocks").select("blocker").eq("blocked", ctx.userId),
      ]);
      const excluded = new Set<string>([
        ...(iBlock ?? []).map((r) => r.blocked),
        ...(blockedMe ?? []).map((r) => r.blocker),
      ]);
      // Une conversation supprimée de mon côté n'apparaît plus dans la liste
      const visible = new Set<string>();
      const hiddenOnly = new Set<string>();
      for (const [rows, key] of [[sent ?? [], "receiver"], [received ?? [], "sender"]] as const) {
        for (const r of rows as any[]) {
          const peerId = r[key];
          if (((r.hidden_for ?? []) as string[]).includes(ctx.userId)) hiddenOnly.add(peerId);
          else visible.add(peerId);
        }
      }
      for (const id of visible) hiddenOnly.delete(id);
      const ids = new Set<string>([
        ...visible,
        ...(likes ?? []).map((r) => r.to_user).filter((id) => !hiddenOnly.has(id)),
      ]);
      const filtered = [...ids].filter((id) => !excluded.has(id));
      if (filtered.length === 0) return [];
      const { data: profs } = await supabase.from("profiles").select("id, pseudo, primary_photo_url").in("id", filtered);
      return profs ?? [];
    },
  });

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-4 h-[calc(100vh-200px)]">
      <aside className={`bg-card rounded-2xl border border-border/60 overflow-hidden ${isDetail ? "hidden md:block" : ""}`}>
        <div className="p-4 border-b border-border/60"><h2 className="font-serif text-primary">Conversations</h2></div>
        <div className="overflow-y-auto h-full">
          {!convos || convos.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <MessageCircle className="mx-auto h-8 w-8 mb-2" />
              Aucune conversation pour le moment. Cliquez sur un profil pour démarrer.
            </div>
          ) : convos.map((p) => (
            <Link key={p.id} to="/messages/$pseudo" params={{ pseudo: p.pseudo }} className={`flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 ${pathname.endsWith(`/${p.pseudo}`) ? "bg-secondary" : ""}`}>
              <div className="h-10 w-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center">
                {p.primary_photo_url ? <img src={p.primary_photo_url} alt="" className="w-full h-full object-cover" /> : <User className="h-5 w-5 text-muted-foreground" />}
              </div>
              <span className="font-medium text-primary">{p.pseudo}</span>
            </Link>
          ))}
        </div>
      </aside>
      <section className={`bg-card rounded-2xl border border-border/60 overflow-hidden ${!isDetail ? "hidden md:flex" : "flex"} flex-col`}>
        {isDetail ? <Outlet /> : (
          <div className="m-auto text-muted-foreground text-center">
            <MessageCircle className="mx-auto h-10 w-10 mb-2" />
            Sélectionnez une conversation
          </div>
        )}
      </section>
    </div>
  );
}