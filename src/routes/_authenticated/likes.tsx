import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart, User, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SwipeDeck } from "@/components/SwipeDeck";
import { ageFromBirthdate } from "@/lib/profile";
import { useMarkLikesSeen } from "@/hooks/useUnreadCounts";
import { matchPercent, useMyProfile } from "@/lib/match";
import { useLikeGraph, isBlurred } from "@/lib/reveal";

export const Route = createFileRoute("/_authenticated/likes")({
  head: () => ({ meta: [{ title: "Coups de cœur — Nooryaa" }] }),
  component: Likes,
});

function Likes() {
  const ctx = Route.useRouteContext();
  useMarkLikesSeen();
  const { data: me } = useMyProfile(ctx.userId);
  const { data: graph } = useLikeGraph(ctx.userId);

  const { data: received } = useQuery({
    queryKey: ["likes-received", ctx.userId],
    queryFn: async () => {
      const { data } = await supabase.from("likes").select("from_user, created_at, profiles!likes_from_user_fkey(*)").eq("to_user", ctx.userId).order("created_at", { ascending: false }).limit(20);
      return data ?? [];
    },
  });
  const { data: sent } = useQuery({
    queryKey: ["likes-sent", ctx.userId],
    queryFn: async () => {
      const { data } = await supabase.from("likes").select("to_user, created_at, profiles!likes_to_user_fkey(*)").eq("from_user", ctx.userId).order("created_at", { ascending: false }).limit(20);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Section title="Personnes qui vous ont liké·e" items={received} me={me} graph={graph} userId={ctx.userId} />
      <Section title="Vos likes envoyés" items={sent} me={me} graph={graph} userId={ctx.userId} />
    </div>
  );
}

function Section({ title, items, me, graph, userId }: { title: string; items: any[] | undefined; me: any; graph: any; userId: string }) {
  const [view, setView] = useState<"grid" | "swipe">("grid");
  const profiles = (items ?? []).map((it: any) => it.profiles).filter(Boolean).map((p: any) => ({ ...p, _matchPercent: matchPercent(me, p) ?? 0 }));

  return (
    <div>
      {view !== "swipe" && (
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-serif text-primary flex items-center gap-2"><Heart className="h-5 w-5 text-[color:var(--gold)]" /> {title}</h2>
          {profiles.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setView("swipe")}>
              <Layers className="h-4 w-4 mr-1" /> Mode swipe
            </Button>
          )}
        </div>
      )}
      {profiles.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border/60 p-8 text-center text-muted-foreground">Aucun pour le moment.</div>
      ) : view === "swipe" ? (
        <>
          <SwipeDeck title={title} profiles={profiles} userId={userId} onBack={() => setView("grid")} persistPass={false} hideHeader />
          <div className="mt-6 text-center">
            <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => setView("grid")}>
              <Layers className="h-4 w-4 mr-1" /> Vue grille
            </Button>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {profiles.map((p: any, i: number) => {
            const pct = p._matchPercent;
            return (
              <Link key={i} to="/profile/$pseudo" params={{ pseudo: p.pseudo }} className="bg-card rounded-xl overflow-hidden border border-border/60">
                <div className="aspect-square bg-secondary relative">
                  {p.primary_photo_url ? <img src={p.primary_photo_url} alt="" className={`w-full h-full object-cover ${isBlurred(p, me, graph) ? "blur-md scale-110" : ""}`} /> : <div className="w-full h-full flex items-center justify-center"><User className="h-10 w-10 text-muted-foreground/40" /></div>}
                  {typeof pct === "number" && (
                    <div className="absolute top-2 right-2 flex flex-col items-center">
                      <span className="text-[9px] uppercase tracking-wider text-primary-foreground font-semibold drop-shadow-sm">Compatibilité</span>
                      <span className="inline-flex items-center justify-center rounded-full bg-[color:var(--gold)] text-primary font-bold text-[10px] h-9 w-9 shadow-md border-2 border-background">
                        {pct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-2"><div className="font-serif text-primary text-sm truncate">{p.pseudo}</div><div className="text-xs text-muted-foreground">{ageFromBirthdate(p.birthdate)} ans</div></div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

