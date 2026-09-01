import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Navigation, Clock, Heart, BadgeCheck, User, Quote } from "lucide-react";
import { DeckCard, type DeckKey } from "@/components/DeckCard";
import { SwipeDeck } from "@/components/SwipeDeck";
import { useDiscovery, DEFAULT_FILTERS } from "@/hooks/useDiscovery";
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
  const { me, isLoading, decks, deckList } = useDiscovery(ctx.userId, DEFAULT_FILTERS);

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

  const recommended = decks.match.slice(0, 4);

  return (
    <div className="space-y-8 pb-8">
      {/* Bienvenue */}
      <div>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          Bienvenue sur Nooryaa <Heart className="h-5 w-5 text-[#E83E8C] fill-[#E83E8C]" />
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
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
            <div className="grid gap-4 sm:grid-cols-3">
              {deckList.map((meta) => (
                <DeckCard key={meta.key} meta={meta} profiles={decks[meta.key]} onClick={() => setDeck(meta.key)} />
              ))}
            </div>
          </section>

          {/* Recommandé pour vous */}
          {recommended.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-primary">Recommandé pour vous</h2>
                <button
                  type="button"
                  onClick={() => setDeck("match")}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Voir tout
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {recommended.map((p: any) => (
                  <RecommendedCard key={p.id} profile={p} userId={ctx.userId} />
                ))}
              </div>
            </section>
          )}

          {/* Conseil du jour */}
          <section>
            <h2 className="text-base font-bold text-primary mb-3">Conseil du jour</h2>
            <div className="bg-card rounded-2xl border border-border/60 p-5 flex items-start gap-3 shadow-[var(--shadow-card)]">
              <Quote className="h-6 w-6 text-primary shrink-0 rotate-180" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-primary">La sincérité attire la sérénité.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Soyez authentique, la bonne personne appréciera votre vérité.
                </p>
              </div>
              <Heart className="h-5 w-5 text-primary shrink-0" />
            </div>
          </section>

          {/* Bannière Premium */}
          <section>
            <div className="rounded-3xl bg-gradient-to-r from-[#5D2A8C] to-[#E83E8C] p-6 text-white relative overflow-hidden shadow-[var(--shadow-soft)]">
              <div className="relative z-10 max-w-[70%]">
                <p className="font-bold text-lg">Passez à Nooryaa Premium</p>
                <p className="text-sm text-white/85 mt-1">
                  Accédez à plus de fonctionnalités et multipliez vos chances de trouver la bonne personne.
                </p>
                <Link
                  to="/compte/abonnement"
                  className="inline-block mt-4 bg-white text-primary font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-white/90 transition-colors"
                >
                  Découvrir Premium
                </Link>
              </div>
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl select-none" aria-hidden="true">👑</span>
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
          <Heart className={`h-4.5 w-4.5 h-5 w-5 transition-colors ${liked ? "text-[#E83E8C] fill-[#E83E8C]" : "text-[#E83E8C]"}`} />
        </button>
      </div>
      <div className="p-3">
        <Link to="/profile/$pseudo" params={{ pseudo: profile.pseudo }} className="flex items-center gap-1.5">
          <span className="font-bold text-sm text-foreground truncate">
            {profile.pseudo}{age ? `, ${age} ans` : ""}
          </span>
          {profile.selfie_verified && <BadgeCheck className="h-4 w-4 text-primary fill-primary text-white shrink-0" />}
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
