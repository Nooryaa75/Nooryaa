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

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[color:var(--gold)] bg-background/80 text-[color:var(--gold-deep)] hover:bg-[color:var(--gold)]/10 transition-colors"
            aria-label="Télécharger sur l'App Store"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.84-.91.65.03 2.49.26 3.66 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 4.55c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <span className="text-sm font-medium">App Store</span>
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[color:var(--gold)] bg-background/80 text-[color:var(--gold-deep)] hover:bg-[color:var(--gold)]/10 transition-colors"
            aria-label="Télécharger sur Google Play"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35zm13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27zm3.35-4.31c.34.27.54.68.54 1.14s-.2.87-.53 1.14l-2.39 1.38-2.5-2.5 2.5-2.5 2.38 1.34zM6.05 2.66l10.76 6.22-2.27 2.27L6.05 2.66z" />
            </svg>
            <span className="text-sm font-medium">Google Play</span>
          </a>
        </div>
      </main>
    </div>
  );
}
