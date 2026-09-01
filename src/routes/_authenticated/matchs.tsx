import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { ProfileVignette } from "@/components/ProfileVignette";
import { useMatches } from "@/hooks/useMatches";

export const Route = createFileRoute("/_authenticated/matchs")({
  head: () => ({
    meta: [
      { title: "Mes matchs — Nooryaa" },
      { name: "description", content: "Tous vos matchs : les personnes avec qui vous vous êtes likés mutuellement." },
      { property: "og:title", content: "Mes matchs — Nooryaa" },
      { property: "og:description", content: "Tous vos matchs sur Nooryaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Matchs,
});

function formatMatchDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function Matchs() {
  const ctx = Route.useRouteContext();
  const { data: matches = [], isLoading } = useMatches(ctx.userId);

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5 text-[#E83E8C] fill-[#E83E8C]" />
        <h1 className="text-2xl font-bold text-primary">Mes matchs</h1>
        {matches.length > 0 && (
          <span className="text-xs font-bold bg-[#E83E8C] text-white rounded-full px-2 py-0.5">{matches.length}</span>
        )}
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        Vous vous êtes likés mutuellement — discutez ensemble 💞
      </p>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Chargement...</div>
      ) : matches.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border/60 p-8 text-center text-muted-foreground">
          Aucun match pour le moment. Continuez à liker des profils 💜
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {matches.map((p: any) => (
            <ProfileVignette
              key={p.id}
              profile={p}
              chatBadge
              extraInfo={formatMatchDate(p._matchedAt) ? `Match le ${formatMatchDate(p._matchedAt)}` : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
