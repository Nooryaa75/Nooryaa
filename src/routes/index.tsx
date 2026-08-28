import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/nooryaa-logo.jpg.asset.json";
import heroFullAsset from "@/assets/nooryaa-hero-full.jpg";
import { SITE_TAGLINE } from "@/lib/site";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nooryaa — Application de rencontre musulmane pour mariage halal" },
      { name: "description", content: "Nooryaa : application de mise en relation dans le dîn pour un mariage halal sérieux. Connectez-vous ou créez votre compte gratuitement." },
      { property: "og:title", content: "Nooryaa — Mise en relation dans le dîn" },
      { property: "og:description", content: "Application de rencontre musulmane pour un mariage halal sérieux, abonnement gratuit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://nooryaa.lovable.app/" }],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();

    async function go() {
      const { data } = await supabase.auth.getUser();
      let target: { to: string; search?: any } = { to: "/auth", search: { mode: "signin" } };
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarded")
          .eq("id", data.user.id)
          .maybeSingle();
        target = { to: profile?.onboarded ? "/browse" : "/onboarding" };
      }
      const wait = Math.max(0, 5000 - (Date.now() - start));
      setTimeout(() => {
        if (!cancelled) navigate({ ...target, replace: true } as any);
      }, wait);
    }
    go();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex items-center justify-center">
      <img
        src={heroFullAsset}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-background/70" />

      <main className="relative z-10 flex flex-col items-center text-center px-6 animate-in fade-in zoom-in-95 duration-1000">
        <img
          src={logoAsset.url}
          alt="Logo Nooryaa"
          className="h-28 w-28 md:h-32 md:w-32 rounded-full object-cover gold-glow"
        />
        <h1 className="mt-6 font-serif text-4xl md:text-5xl tracking-[0.18em] uppercase gold-text">
          Nooryaa
        </h1>
        <div className="gold-rule w-28 my-5" />
        <p className="font-serif text-lg md:text-xl text-[color:var(--gold-deep)] max-w-md">
          {SITE_TAGLINE}
        </p>
        <p className="mt-3 text-sm text-muted-foreground max-w-sm">
          Pour une relation sincère tournée vers le dîn.
        </p>

        <div className="mt-10 flex gap-1.5" aria-label="Chargement">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-[color:var(--gold)] animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>

      </main>
    </div>
  );
}
