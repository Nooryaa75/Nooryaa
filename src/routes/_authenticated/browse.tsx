import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Quote, User, MessageCircle, BadgeCheck } from "lucide-react";
import { PrayerTimeBadge } from "@/components/PrayerTimeBadge";
import { DeckCard, type DeckKey } from "@/components/DeckCard";

import { SwipeDeck } from "@/components/SwipeDeck";
import { useDiscovery, DEFAULT_FILTERS, distanceKm } from "@/hooks/useDiscovery";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/browse")({
  head: () => ({
    meta: [
      { title: "Accueil — Nooryaa" },
      { name: "description", content: "Vos sélections du jour : profils compatibles, près de chez vous et nouvelles inscriptions." },
      { property: "og:title", content: "Accueil — Nooryaa" },
      { property: "og:description", content: "Vos sélections du jour sur Nooryaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

function ageFrom(birthdate?: string | null) {
  if (!birthdate) return null;
  const d = new Date(birthdate);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function Home() {
  const ctx = Route.useRouteContext();
  const [deck, setDeck] = useState<DeckKey | null>(null);
  const { decks, deckList, me, allProfiles, isLoading, originLat, originLng } = useDiscovery(ctx.userId, DEFAULT_FILTERS);

  // Likes envoyés + reçus → matchs = likes croisés (sent ∩ received)
  const { data: likeGraph = { sent: [] as string[], received: [] as string[] } } = useQuery({
    queryKey: ["match-likes", ctx.userId],
    queryFn: async () => {
      const [{ data: sent }, { data: received }] = await Promise.all([
        supabase.from("likes").select("to_user").eq("from_user", ctx.userId),
        supabase.from("likes").select("from_user").eq("to_user", ctx.userId),
      ]);
      return {
        sent: (sent ?? []).map((l: any) => l.to_user as string),
        received: (received ?? []).map((l: any) => l.from_user as string),
      };
    },
  });

  const matches = (profiles ?? []).filter(
    (p: any) => likeGraph.sent.includes(p.id) && likeGraph.received.includes(p.id),
  );

  if (deck) {
    return (
      <div className="space-y-2">
        <SwipeDeck
          title={deckList.find((d) => d.key === deck)!.title}
          profiles={decks[deck]}
          userId={ctx.userId}
          onBack={() => setDeck(null)}
          hideHeader
        />
        <div className="mt-6 text-center">
          <button type="button" onClick={() => setDeck(null)} className="text-xs text-muted-foreground underline">
            Revenir aux sélections
          </button>
        </div>
      </div>
    );
  }

  // Recommandé pour vous : ≥ 60 % de compatibilité, ±10 ans d'écart d'âge, triés du plus proche au plus loin.
  const myAge = ageFrom((me as any)?.birthdate);
  const recommended = decks.match
    .filter((p: any) => (p._matchPercent ?? 0) >= 60)
    .filter((p: any) => {
      if (myAge == null) return true;
      const age = ageFrom(p.birthdate);
      return age == null || Math.abs(age - myAge) <= 10;
    })
    .map((p: any) => {
      const d =
        typeof p._distance === "number"
          ? p._distance
          : originLat != null && originLng != null && p.latitude != null && p.longitude != null
            ? distanceKm(originLat, originLng, p.latitude, p.longitude)
            : null;
      return { ...p, _distance: d };
    })
    .sort((a: any, b: any) => (a._distance ?? Infinity) - (b._distance ?? Infinity))
    .slice(0, 4);

  return (
    <div className="space-y-7 pb-8">
      {/* Titre de page */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-primary">Accueil</h1>
        <PrayerTimeBadge />
      </div>


      {/* Bienvenue */}
      <div>
        <p className="text-xl font-bold text-primary flex items-center gap-2">
          Bienvenue sur Nooryaa <Heart className="h-5 w-5 text-[#E83E8C] fill-[#E83E8C]" />
        </p>
        <p className="text-sm text-muted-foreground mt-1.5 leading-snug">
          Un espace dédié aux célibataires sérieux en quête d'une relation halal et durable.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Chargement...</div>
      ) : (
        <>
          {/* Vos sélections du moment */}
          <section>
            <h2 className="text-base font-bold text-primary mb-3">Vos sélections du moment</h2>
            <div className="flex flex-col gap-3">
              {deckList.map((meta) => (
                <DeckCard key={meta.key} meta={meta} profiles={decks[meta.key]} onClick={() => setDeck(meta.key)} />
              ))}
            </div>
          </section>

          {/* Mes matchs */}
          {matches.length > 0 && (
            <section>
              <h2 className="text-base font-bold text-primary mb-3 flex items-center gap-2">
                <Heart className="h-4 w-4 text-[#E83E8C] fill-[#E83E8C]" />
                Mes matchs
              </h2>
              <div className="bg-card rounded-2xl border border-border/60 shadow-[var(--shadow-card)] p-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Vous vous êtes likés mutuellement — discutez ensemble 💞
                </p>
                <div className="flex gap-4 overflow-x-auto pb-1">
                  {matches.map((p: any) => (
                    <Link
                      key={p.id}
                      to="/messages/$pseudo"
                      params={{ pseudo: p.pseudo }}
                      className="flex flex-col items-center gap-1.5 shrink-0 group"
                    >
                      <div className="relative">
                        <div className="h-16 w-16 rounded-full overflow-hidden ring-2 ring-[#E83E8C]/40 group-hover:ring-[#E83E8C] transition">
                          {p.primary_photo_url ? (
                            <img
                              src={p.primary_photo_url}
                              alt={p.pseudo}
                              className={`w-full h-full object-cover ${p.primary_photo_blurred ? "blur-md scale-110" : ""}`}
                            />
                          ) : (
                            <div className="w-full h-full bg-secondary flex items-center justify-center">
                              <User className="h-6 w-6 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-br from-[#5D2A8C] to-[#E83E8C] flex items-center justify-center shadow">
                          <MessageCircle className="h-3.5 w-3.5 text-white" />
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-foreground max-w-[72px] truncate">
                        {p.pseudo}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Recommandé pour vous */}
          {recommended.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-primary">Recommandé pour vous</h2>
                <button
                  type="button"
                  onClick={() => setDeck("match")}
                  className="text-sm text-primary hover:underline"
                >
                  Voir tout
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {recommended.slice(0, 2).map((p: any) => (
                  <RecommendedCard key={p.id} profile={p} userId={ctx.userId} />
                ))}
              </div>
            </section>
          )}

          {/* Conseil du jour */}
          <section>
            <h2 className="text-base font-bold text-primary mb-3">Conseil du jour</h2>
            <div className="bg-[#F3E8FF] rounded-2xl p-5 flex items-start gap-3">
              <Quote className="h-5 w-5 text-primary shrink-0 rotate-180" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-primary">La sincérité attire la sérénité.</p>
                <p className="text-sm text-muted-foreground mt-1 leading-snug">
                  Soyez authentique, la bonne personne appréciera votre vérité.
                </p>
              </div>
              <Heart className="h-5 w-5 text-primary shrink-0 self-center" />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function RecommendedCard({ profile, userId }: { profile: any; userId: string }) {
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(false);
  const age = ageFrom(profile.birthdate);
  const distance = typeof profile._distance === "number" ? Math.round(profile._distance) : null;

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (liked) {
        const { error } = await supabase.from("likes").delete().eq("from_user", userId).eq("to_user", profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("likes").insert({ from_user: userId, to_user: profile.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setLiked(!liked);
      queryClient.invalidateQueries({ queryKey: ["browse", userId] });
      queryClient.invalidateQueries({ queryKey: ["sent-likes-discovery", userId] });
      queryClient.invalidateQueries({ queryKey: ["match-likes", userId] });
      queryClient.invalidateQueries({ queryKey: ["unread-counts", userId] });
      if (!liked) toast.success(`Vous avez liké ${profile.pseudo} 💜`);
    },
    onError: () => toast.error("Une erreur est survenue"),
  });

  const tags: { label: string; tone: "pink" | "lavender" }[] = [];
  if (profile.personality) tags.push({ label: profile.personality, tone: "pink" });
  if (profile.porte_voile === true) tags.push({ label: "Voilée", tone: "lavender" });
  else if (profile.objective) tags.push({ label: profile.objective, tone: "lavender" });

  return (
    <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-[var(--shadow-card)]">
      <div className="relative aspect-[4/5] bg-secondary">
        <Link to="/profile/$pseudo" params={{ pseudo: profile.pseudo }} className="block w-full h-full">
          {profile.primary_photo_url ? (
            <img
              src={profile.primary_photo_url}
              alt={profile.pseudo}
              className={`w-full h-full object-cover ${profile.primary_photo_blurred ? "blur-md scale-110" : ""}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
        </Link>
        <button
          type="button"
          aria-label={liked ? "Retirer le like" : "Liker"}
          onClick={() => likeMutation.mutate()}
          className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        >
          <Heart className={`h-5 w-5 transition-colors ${liked ? "text-[#E83E8C] fill-[#E83E8C]" : "text-[#E83E8C]"}`} />
        </button>
      </div>
      <div className="p-3">
        <Link to="/profile/$pseudo" params={{ pseudo: profile.pseudo }} className="flex items-center gap-1.5">
          <span className="font-bold text-sm text-foreground truncate">
            {profile.pseudo}{age ? `, ${age} ans` : ""}
          </span>
          {profile.selfie_verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {profile.city ?? ""}{profile.country ? `, ${profile.country}` : ""}{distance != null ? ` • ${distance} km` : ""}
        </p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.slice(0, 2).map((t) => (
              <span
                key={t.label}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                  t.tone === "pink" ? "bg-[#E83E8C]/10 text-[#E83E8C]" : "bg-[#5D2A8C]/10 text-[#5D2A8C]"
                }`}
              >
                {t.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
