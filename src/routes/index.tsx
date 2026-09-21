import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoTextless from "@/assets/nooryaa-logo-textless.png";

import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();

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

  const tagline = t("Mise en relation dans le dîn pour le mariage");

  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex items-center justify-center">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(93,42,140,0.14), transparent 70%), radial-gradient(ellipse 70% 55% at 50% 100%, rgba(232,62,140,0.12), transparent 70%), linear-gradient(180deg, #F3E8FF 0%, #FAFAFC 55%, #FFB6A322 100%)",
        }}
      />

      <main className="relative z-10 flex flex-col items-center text-center px-6 animate-in fade-in zoom-in-95 duration-1000">
        <img
          src={logoTextless}
          alt="Nooryaa"
          width={1024}
          height={1024}
          className="w-64 md:w-80 rounded-3xl shadow-2xl"
        />
        <h1 className="sr-only">Nooryaa — {tagline}</h1>
        <p className="mt-6 text-sm md:text-base text-muted-foreground max-w-xs md:max-w-sm leading-relaxed">
          {tagline}
        </p>

        <div className="mt-10 flex gap-1.5" aria-label={t("Chargement")}>
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
