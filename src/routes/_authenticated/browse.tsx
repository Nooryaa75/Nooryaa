import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DeckCard, type DeckKey } from "@/components/DeckCard";
import { SwipeDeck } from "@/components/SwipeDeck";
import { useDiscovery, DEFAULT_FILTERS } from "@/hooks/useDiscovery";

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
  const { isLoading, decks, deckList } = useDiscovery(ctx.userId, DEFAULT_FILTERS);

  return (
    <div className={deck ? "space-y-2" : "space-y-6"}>
      {!deck && (
        <div>
          <h1 className="text-3xl font-serif text-primary">Accueil</h1>
          <p className="text-sm text-muted-foreground mt-1">Vos sélections du moment.</p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Chargement...</div>
      ) : deck ? (
        <>
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
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {deckList.map((meta) => (
            <DeckCard key={meta.key} meta={meta} profiles={decks[meta.key]} onClick={() => setDeck(meta.key)} />
          ))}
        </div>
      )}
    </div>
  );
}
