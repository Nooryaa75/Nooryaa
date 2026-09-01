import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type SocialRow = { id: string; network: string; label: string; url: string; active: boolean; sort_order: number };

const ICONS: Record<string, { path: string; color: string }> = {
  facebook: {
    color: "#1877F2",
    path: "M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.25 10.44 22v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22C18.34 21.25 22 17.08 22 12.06Z",
  },
  instagram: {
    color: "#E1306C",
    path: "M12 2c2.72 0 3.06.01 4.12.06 1.07.05 1.8.22 2.43.46.66.26 1.22.6 1.77 1.16.56.55.9 1.11 1.16 1.77.24.63.41 1.36.46 2.43.05 1.07.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.07-.22 1.8-.46 2.43a4.9 4.9 0 0 1-1.16 1.77c-.55.56-1.11.9-1.77 1.16-.63.24-1.36.41-2.43.46-1.07.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.07-.05-1.8-.22-2.43-.46a4.9 4.9 0 0 1-1.77-1.16 4.9 4.9 0 0 1-1.16-1.77c-.24-.63-.41-1.36-.46-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.07.22-1.8.46-2.43.26-.66.6-1.22 1.16-1.77.55-.56 1.11-.9 1.77-1.16.63-.24 1.36-.41 2.43-.46C8.94 2.01 9.28 2 12 2Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.25a3.25 3.25 0 1 1 0-6.5 3.25 3.25 0 0 1 0 6.5ZM17.25 5.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z",
  },
  tiktok: {
    color: "#010101",
    path: "M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-1.79-2.46V9.79a5.86 5.86 0 1 0 4.88 5.77V9.01a7.35 7.35 0 0 0 4.29 1.37V7.29a4.28 4.28 0 0 1-3.23-1.47Z",
  },
  snapchat: {
    color: "#000000",
    path: "M12 2c2.6 0 4.6 2.1 4.6 4.7 0 .8-.05 1.5-.1 2.1.4.2.9.2 1.4 0 .5-.2 1 .1 1.1.5.1.4-.1.8-.6 1-.6.3-1.4.6-1.6.9-.1.3.4 1.3 1.2 2.2.6.7 1.4 1.3 2.3 1.6.4.1.6.5.5.9-.2.6-1.2.9-2.3 1.1-.2.4-.2.8-.3 1.1-.1.3-.4.4-.8.3-.4-.1-.9-.2-1.6-.2-1 0-1.5.2-2.2.7-.7.5-1.4 1.1-2.6 1.1s-1.9-.6-2.6-1.1c-.7-.5-1.2-.7-2.2-.7-.7 0-1.2.1-1.6.2-.4.1-.7 0-.8-.3-.1-.3-.1-.7-.3-1.1-1.1-.2-2.1-.5-2.3-1.1-.1-.4.1-.8.5-.9.9-.3 1.7-.9 2.3-1.6.8-.9 1.3-1.9 1.2-2.2-.2-.3-1-.6-1.6-.9-.5-.2-.7-.6-.6-1 .1-.4.6-.7 1.1-.5.5.2 1 .2 1.4 0-.05-.6-.1-1.3-.1-2.1C7.4 4.1 9.4 2 12 2Z",
  },
};

export function SocialLinks() {
  const { data } = useQuery({
    queryKey: ["social-links"],
    queryFn: async () => {
      const { data } = await (supabase.from("social_links" as any) as any)
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      return (data ?? []) as SocialRow[];
    },
  });

  const links = (data ?? []).filter((l) => ICONS[l.network]);
  if (links.length === 0) return null;

  return (
    <section aria-label="Réseaux sociaux" className="flex flex-col items-center gap-2 pt-1">
      <p className="text-xs text-muted-foreground">Suivez Nooryaa</p>
      <div className="flex items-center justify-center gap-4">
        {links.map((l) => {
          const icon = ICONS[l.network];
          return (
            <a
              key={l.id}
              href={l.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={l.label}
              title={l.label}
              className="h-11 w-11 rounded-full bg-card border border-border/60 shadow-sm flex items-center justify-center transition-transform hover:scale-110"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill={icon.color} aria-hidden="true">
                <path d={icon.path} />
              </svg>
            </a>
          );
        })}
      </div>
    </section>
  );
}
