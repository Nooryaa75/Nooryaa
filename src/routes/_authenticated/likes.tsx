import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MapPin, Eye } from "lucide-react";
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
      <Section title="Personnes qui vous ont liké·e" items={received} me={me} />
      <Section title="Vos likes envoyés" items={sent} me={me} />
    </div>
  );
}

function Section({ title, items, me }: { title: string; items: any[] | undefined; me: any }) {
  const profiles = (items ?? []).map((it: any) => it.profiles).filter(Boolean).map((p: any) => ({ ...p, _matchPercent: matchPercent(me, p) ?? 0 }));

  return (
    <div>
      <h2 className="text-xl font-serif text-primary flex items-center gap-2 mb-4"><Heart className="h-5 w-5 text-[color:var(--gold)]" /> {title}</h2>
      {profiles.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border/60 p-8 text-center text-muted-foreground">Aucun pour le moment.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {profiles.map((p: any) => {
            const photo = Array.isArray(p.photos) ? p.photos[0] : null;
            return (
              <div key={p.id} className="relative rounded-2xl overflow-hidden border border-border/60 bg-card aspect-[3/4] group">
                {photo ? (
                  <img src={photo} alt={p.pseudo ?? "Photo de profil"} className={`absolute inset-0 w-full h-full object-cover ${p.blur_photos ? "blur-md scale-105" : ""}`} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl font-serif text-muted-foreground bg-muted">
                    {(p.pseudo ?? "?").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-10 text-white">
                  <p className="font-semibold text-sm leading-tight">
                    {p.pseudo}{p.age ? `, ${p.age}` : ""}
                    {p._matchPercent > 0 && <span className="ml-1 text-xs text-[color:var(--gold)]">· {p._matchPercent}%</span>}
                  </p>
                  {p.city && <p className="text-xs opacity-80 flex items-center gap-1"><MapPin className="h-3 w-3" />{p.city}</p>}
                  <Link
                    to="/profile/$pseudo"
                    params={{ pseudo: p.pseudo }}
                    className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/90 text-black text-xs font-medium px-3 py-1.5 hover:bg-white transition-colors"
                  >
                    <Eye className="h-3 w-3" /> Voir la fiche
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
