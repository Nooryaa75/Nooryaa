import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Users,
  ChevronLeft,
  HeartHandshake,
  MessageCircleHeart,
  ShieldCheck,
  LockKeyhole,
  Ban,
  Heart,
  Flag,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/compte/regles")({
  head: () => ({ meta: [{ title: "Nos règles de communauté — Nooryaa" }] }),
  component: ReglesPage,
});

const rules = [
  {
    icon: HeartHandshake,
    title: "Respect avant tout",
    body: "Chaque membre mérite bienveillance et considération.",
  },
  {
    icon: MessageCircleHeart,
    title: "Sincérité dans les échanges",
    body: "Discussions authentiques, sans masque ni fausse promesse.",
  },
  {
    icon: LockKeyhole,
    title: "Vie privée protégée",
    body: "Ne partagez jamais vos informations personnelles à la légère.",
  },
  {
    icon: ShieldCheck,
    title: "Limites respectées",
    body: "Un non est un non. Chacun est libre de ses choix.",
  },
  {
    icon: Ban,
    title: "Zéro harcèlement",
    body: "Insultes, menaces et comportements déplacés sont exclus.",
  },
  {
    icon: Heart,
    title: "Intentions sincères",
    body: "Soyez honnêtes et respectueux dans vos démarches.",
  },
  {
    icon: Flag,
    title: "Signalement encouragé",
    body: "Un comportement suspect ? Aidez-nous à protéger la communauté.",
  },
];

function ReglesPage() {
  return (
    <div className="space-y-3">
      <div className="relative flex items-center justify-center">
        <Link to="/compte" aria-label="Retour" className="absolute left-0 text-primary">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-base font-bold text-primary flex items-center gap-2">
          <Users className="h-5 w-5" />
          Règles de communauté
        </h1>
      </div>

      <div className="bg-card rounded-2xl p-4 border border-border/60 shadow-[var(--shadow-card)] space-y-4">
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">
            Bienvenue dans la communauté Nooryaa
          </p>
          <p className="text-xs text-muted-foreground leading-snug">
            Ces règles simples garantissent un espace serein, sûr et digne pour chacun.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {rules.map((r) => {
            const Icon = r.icon;
            return (
              <section
                key={r.title}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-secondary/30 border border-border/40"
              >
                <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-xs leading-tight">
                    {r.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {r.body}
                  </p>
                </div>
              </section>
            );
          })}
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-primary font-semibold text-sm">
            <Sparkles className="h-4 w-4" />
            <span>Ensemble, construisons une communauté de confiance.</span>
          </div>
          <p className="text-xs text-muted-foreground italic">
            La bienveillance nous rapproche, le respect nous unit.
          </p>
        </div>
      </div>
    </div>
  );
}
