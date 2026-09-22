import { useI18n } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";
import { useMarkLikesSeen } from "@/hooks/useUnreadCounts";
import { matchPercent, useMyProfile } from "@/lib/match";
import { ProfileVignette } from "@/components/ProfileVignette";

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

  // Les likes mutuels deviennent des matchs (affichés sur l'accueil) : on les retire d'ici.
  const mutual = new Set(
    (received ?? [])
      .map((r: any) => r.from_user as string)
      .filter((id) => (sent ?? []).some((s: any) => s.to_user === id)),
  );
  const receivedOnly = (received ?? []).filter((r: any) => !mutual.has(r.from_user));
  const sentOnly = (sent ?? []).filter((s: any) => !mutual.has(s.to_user));

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Section title="Personnes qui vous ont liké·e" items={receivedOnly} me={me} userId={ctx.userId} />
      <Section title="Vos likes envoyés" items={sentOnly} me={me} userId={ctx.userId} />
    </div>
  );
}

function Section({ title, items, me, userId }: { title: string; items: any[] | undefined; me: any; userId: string }) {
  const { locale } = useI18n();
  const wanted = me?.gender === "homme" ? "femme" : me?.gender === "femme" ? "homme" : null;
  const profiles = (items ?? [])
    .map((it: any) => it.profiles)
    .filter(Boolean)
    // Un homme ne voit que des femmes, une femme que des hommes
    .filter((p: any) => wanted != null && p.gender === wanted)
    .map((p: any) => {
      const pct = matchPercent(me, p) ?? 0;
      return { ...p, _matchPercent: pct, personality: p.personality ?? (pct > 0 ? (locale === "en" ? `${pct}% match` : locale === "ar" ? `توافق ${pct}%` : `${pct}% compatible`) : null) };
    });

  return (
    <div>
      <h2 className="text-base font-bold text-primary flex items-center gap-2 mb-4">
        <Heart className="h-4 w-4 text-[#E83E8C] fill-[#E83E8C]" /> {title}
      </h2>
      {profiles.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border/60 p-8 text-center text-muted-foreground">Aucun pour le moment.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {profiles.map((p: any) => (
            <ProfileVignette key={p.id} profile={p} userId={userId} />
          ))}
        </div>
      )}
    </div>
  );
}
