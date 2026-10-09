import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

type StoreRow = { id: string; network: string; label: string; url: string; active: boolean; sort_order: number };

const STORES: Record<
  string,
  { top: string; bottom: string; icon: React.ReactNode }
> = {
  appstore: {
    top: "Télécharger sur l'",
    bottom: "App Store",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M17.05 12.54c-.03-2.89 2.36-4.27 2.47-4.34-1.35-1.97-3.44-2.24-4.18-2.27-1.78-.18-3.47 1.05-4.37 1.05-.9 0-2.29-1.02-3.77-1-1.94.03-3.72 1.13-4.72 2.86-2.01 3.49-.51 8.66 1.45 11.5.96 1.38 2.1 2.93 3.6 2.87 1.44-.06 1.99-.93 3.73-.93s2.23.93 3.76.9c1.55-.03 2.54-1.4 3.49-2.79 1.1-1.6 1.55-3.16 1.58-3.24-.04-.02-3.02-1.16-3.04-4.61ZM14.16 4.06c.79-.96 1.32-2.29 1.18-3.62-1.14.05-2.52.76-3.34 1.72-.73.85-1.38 2.21-1.2 3.51 1.27.1 2.57-.65 3.36-1.61Z" />
      </svg>
    ),
  },
  googleplay: {
    top: "Disponible sur",
    bottom: "Google Play",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
        <path d="M3.6 2.3c-.3.3-.5.8-.5 1.4v16.6c0 .6.2 1.1.5 1.4l.1.1 9.3-9.3v-.2L3.7 2.2l-.1.1Zm12.1 9.2-3-3 3.9-2.2 4.6 2.6c1.3.7 1.3 1.9 0 2.6l-4.6 2.6-3.9-2.2v-.4Zm-1-.9-8.6 8.6 11.4-6.5-2.8-2.1Zm-8.6-9.2 8.6 8.6 2.8-2.1L6.1 1.4Z" fillRule="evenodd" />
      </svg>
    ),
  },
};

export function StoreBadges() {
  const [isWeb, setIsWeb] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    const cap = (window as unknown as {
      Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string; platform?: string };
    }).Capacitor;
    const platform = cap?.getPlatform?.() ?? cap?.platform;
    setIsWeb(!cap?.isNativePlatform?.() && platform !== "android" && platform !== "ios");
  }, []);

  // Hidden until hydration determines the platform, including the first native frame.
  if (!isWeb || pathname.startsWith("/admin")) return null;
  return <WebStoreBadges />;
}

function WebStoreBadges() {
  const { t } = useI18n();
  const { data } = useQuery({
    queryKey: ["store-links"],
    queryFn: async () => {
      const { data } = await (supabase.from("social_links" as any) as any)
        .select("*")
        .in("network", ["appstore", "googleplay"])
        .eq("active", true)
        .order("sort_order", { ascending: true });
      return (data ?? []) as StoreRow[];
    },
  });

  const links = (data ?? []).filter((l) => STORES[l.network] && /^https:\/\//i.test(l.url));
  if (links.length === 0) return null;

  return (
    <section data-no-translate aria-label={t("Téléchargez l'application Nooryaa")} className="flex flex-col items-center gap-2 pt-1">
      <p className="text-xs text-muted-foreground">{t("Téléchargez sur")}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {links.map((l) => {
          const store = STORES[l.network];
          return (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t(store.top)} ${store.bottom}`}
              className="flex items-center gap-2.5 rounded-xl bg-foreground text-background px-4 py-2 shadow-sm transition-transform hover:scale-105"
            >
              {store.icon}
              <span className="flex flex-col leading-tight text-left">
                <span className="text-[10px] opacity-80">{t(store.top)}</span>
                <span className="text-base font-semibold -mt-0.5">{store.bottom}</span>
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
