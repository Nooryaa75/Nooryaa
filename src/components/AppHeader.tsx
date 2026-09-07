import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Search, User, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import logoAsset from "@/assets/nooryaa-logo.png.asset.json";

const links = [
  { to: "/browse", label: "Accueil", icon: Home },
  { to: "/recherche", label: "Découvrir", icon: Search },
  { to: "/likes", label: "Likes", icon: Heart },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/compte", label: "Compte", icon: User },
] as const;

const mobileLinks = [
  { to: "/browse", label: "Accueil", icon: Home, fillActive: true },
  { to: "/recherche", label: "Découvrir", icon: Search, fillActive: false },
  { to: "/likes", label: "Likes", icon: Heart, fillActive: false },
  { to: "/messages", label: "Messages", icon: MessageCircle, fillActive: false },
  { to: "/compte", label: "Compte", icon: User, fillActive: false },
] as const;

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold leading-[18px] text-center">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function resetHomeDeck() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("reset-home-deck"));
  }
}

export function AppHeader() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: counts } = useUnreadCounts();

  function countFor(to: string) {
    if (to === "/likes") return counts?.likes ?? 0;
    if (to === "/messages") return counts?.messages ?? 0;
    return 0;
  }


  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
  }

  return (
    <>
      <header className="hidden md:block sticky top-0 z-40 bg-background/85 backdrop-blur border-b border-border/60">
        <div className="container mx-auto flex items-center justify-between px-4 pt-2 pb-2 max-w-6xl">
          <nav className="flex items-center gap-1">
            {links.map((l) => {
              const active = pathname.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={l.to === "/browse" ? resetHomeDeck : undefined}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-colors ${
                    active ? "bg-secondary text-primary font-bold" : "text-muted-foreground font-medium hover:text-foreground"
                  }`}
                >
                  <span className="relative flex items-center">
                    <l.icon className="h-4 w-4" />
                    <Badge count={countFor(l.to)} />
                  </span>
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <Button onClick={signOut} variant="ghost" size="sm" className="gap-1.5">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </Button>
        </div>
      </header>

      {/* Barre de navigation basse (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card rounded-t-3xl shadow-[0_-4px_24px_rgba(31,34,48,0.08)] flex justify-around pt-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {mobileLinks.map((l) => {
          const active = pathname.startsWith(l.to);
          return (
            <Link
              key={l.to}
              to={l.to}
              onClick={l.to === "/browse" ? resetHomeDeck : undefined}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 px-2 text-[11px] ${
                active ? "text-primary font-bold" : "text-primary/70 font-medium"
              }`}
            >
              <span className="relative flex items-center">
                <l.icon className={`h-6 w-6 ${active && l.fillActive ? "fill-primary" : ""}`} strokeWidth={active ? 2.2 : 1.8} />
                <Badge count={countFor(l.to)} />
              </span>
              {l.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}