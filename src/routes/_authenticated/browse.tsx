import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Bell } from "lucide-react";
import { DailyReminder } from "@/components/DailyReminder";
import { SocialLinks } from "@/components/SocialLinks";
import { PrayerTimeBadge } from "@/components/PrayerTimeBadge";
import { DeckCard, type DeckKey } from "@/components/DeckCard";

import { SwipeDeck } from "@/components/SwipeDeck";
import { useDiscovery, DEFAULT_FILTERS, distanceKm } from "@/hooks/useDiscovery";
import { useMatches } from "@/hooks/useMatches";
import { useUnreadNotificationsCount } from "@/hooks/useNotifications";
import { ProfileVignette, ageFrom } from "@/components/ProfileVignette";

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold leading-[18px] text-center">
      {count > 99 ? "99+" : count}
    </span>
  );
}

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

function Home() {
  const ctx = Route.useRouteContext();
  const [deck, setDeck] = useState<DeckKey | null>(null);
  const { decks, deckList, me, isLoading, originLat, originLng } = useDiscovery(ctx.userId, DEFAULT_FILTERS);

  // Matchs = likes croisés, triés du plus récent au plus ancien
  const { data: matches = [] } = useMatches(ctx.userId);


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
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-primary">Accueil</h1>
          <NotificationsBell />
        </div>
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

          {/* Mes matchs — les 4 derniers */}
          {matches.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-primary flex items-center gap-2">
                  <Heart className="h-4 w-4 text-[#E83E8C] fill-[#E83E8C]" />
                  Mes matchs
                </h2>
                {matches.length > 4 && (
                  <Link to="/matchs" className="text-sm text-primary hover:underline">
                    Voir les autres ({matches.length})
                  </Link>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Vous vous êtes likés mutuellement — discutez ensemble 💞
              </p>
              <div className="grid grid-cols-2 gap-3">
                {matches.slice(0, 4).map((p: any) => (
                  <ProfileVignette key={p.id} profile={p} chatBadge />
                ))}
              </div>
              <div className="mt-3 text-center">
                <Link to="/matchs" className="text-sm font-medium text-primary hover:underline">
                  Voir tous mes matchs
                </Link>
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
              <div className="grid grid-cols-2 gap-3">
                {recommended.slice(0, 2).map((p: any) => (
                  <ProfileVignette key={p.id} profile={p} userId={ctx.userId} likeable />
                ))}
              </div>
            </section>
          )}

          {/* Rappel du jour */}
          <DailyReminder />

          {/* Réseaux sociaux */}
          <SocialLinks />



        </>
      )}
    </div>
  );
}
