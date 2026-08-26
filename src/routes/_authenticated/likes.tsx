import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";
import { SwipeDeck } from "@/components/SwipeDeck";
import { useMarkLikesSeen } from "@/hooks/useUnreadCounts";
import { matchPercent, useMyProfile } from "@/lib/match";

export const Route = createFileRoute("/_authenticated/likes")({
  head: () => ({ meta: [{ title: "Coups de cœur — Nooryaa" }] }),
  component: Likes,
});

function Likes() {
  const ctx = Route.useRouteContext();
  useMarkLikesSeen();
  const { data: me } = useMyProfile(ctx.userId);

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
      <Section title="Personnes qui vous ont liké·e" items={received} me={me} userId={ctx.userId} />
      <Section title="Vos likes envoyés" items={sent} me={me} userId={ctx.userId} />
    </div>
  );
}

function Section({ title, items, me, userId }: { title: string; items: any[] | undefined; me: any; userId: string }) {
  const profiles = (items ?? []).map((it: any) => it.profiles).filter(Boolean).map((p: any) => ({ ...p, _matchPercent: matchPercent(me, p) ?? 0 }));

  return (
    <div>
      <h2 className="text-xl font-serif text-primary flex items-center gap-2 mb-4"><Heart className="h-5 w-5 text-[color:var(--gold)]" /> {title}</h2>
      {profiles.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border/60 p-8 text-center text-muted-foreground">Aucun pour le moment.</div>
      ) : (
        <SwipeDeck title={title} profiles={profiles} userId={userId} persistPass={false} hideHeader />
      )}
    </div>
  );
}
