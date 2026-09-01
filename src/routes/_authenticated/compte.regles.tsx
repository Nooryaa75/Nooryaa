import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/compte/regles")({
  head: () => ({ meta: [{ title: "Nos règles de communauté — Nooryaa" }] }),
  component: ReglesPage,
});

const rules = [
  { emoji: "🤝", title: "LE RESPECT AVANT TOUT", body: "Chaque membre mérite bienveillance et considération." },
  { emoji: "💬", title: "ÉCHANGEZ AVEC SINCÉRITÉ", body: "Privilégiez des discussions respectueuses et authentiques." },
  { emoji: "🔒", title: "PROTÉGEZ VOTRE VIE PRIVÉE", body: "Ne partagez jamais vos informations personnelles sans prudence." },
  { emoji: "🛡️", title: "RESPECTEZ LES LIMITES", body: "Un non est un non. Chacun est libre de ses choix." },
  { emoji: "🚫", title: "AUCUN HARCÈLEMENT", body: "Les insultes, menaces et comportements déplacés ne sont pas tolérés." },
  { emoji: "❤️", title: "DES RENCONTRES SINCÈRES", body: "Soyez honnête, respectueux et authentique dans vos intentions." },
  { emoji: "⚠️", title: "SIGNALEZ CE QUI VOUS INQUIÈTE", body: "En cas de comportement suspect ou inapproprié, n'hésitez pas à le signaler." },
];

function ReglesPage() {
  return (
    <div className="space-y-4">
      <div className="relative flex items-center justify-center">
        <Link to="/compte" aria-label="Retour" className="absolute left-0 text-primary">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold text-primary flex items-center gap-2">
          <Users className="h-5 w-5" />
          Règles communauté
        </h1>
      </div>
    <div className="bg-card rounded-2xl p-6 border border-border/60 shadow-[var(--shadow-card)] space-y-6">

      <div className="space-y-4">
        {rules.map((r) => (
          <section key={r.title} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 border border-border/40">
            <span className="text-2xl leading-none" aria-hidden="true">
              {r.emoji}
            </span>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground text-sm tracking-wide">{r.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>
            </div>
          </section>
        ))}
      </div>

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center space-y-2">
        <p className="font-serif text-primary font-semibold">🌙 ENSEMBLE, CONSTRUISONS UNE COMMUNAUTÉ DE CONFIANCE.</p>
        <p className="text-sm text-muted-foreground italic">
          La bienveillance nous rapproche, le respect nous unit.
        </p>
      </div>
    </div>
  );
}
