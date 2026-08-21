import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Search, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/nooryaa-logo.jpg.asset.json";

const links = [
  { to: "/browse", label: "Découvrir", icon: Search },
  { to: "/likes", label: "Likes", icon: Heart },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/me", label: "Profil", icon: User },
] as const;

export function AppHeader() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
  }

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur border-b border-border/60">
      <div className="container mx-auto flex items-start justify-between px-4 pt-2 pb-2 max-w-6xl">
        <Link to="/browse" className="flex items-start gap-2.5 -mt-1">
          <img src={logoAsset.url} alt="Logo Nooryaa" className="h-10 w-10 rounded-full object-cover gold-glow -mt-0.5" />
          <div className="flex flex-col leading-none">
            <span className="text-xl font-serif font-semibold tracking-[0.16em] uppercase gold-text">Nooryaa</span>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)] font-sans w-fit mt-1">100% gratuit</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  active ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <l.icon className="h-4 w-4" />
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
      <nav className="md:hidden border-t border-border/60 flex justify-around py-1.5">
        {links.map((l) => {
          const active = pathname.startsWith(l.to);
          return (
            <Link key={l.to} to={l.to} className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${active ? "text-primary" : "text-muted-foreground"}`}>
              <l.icon className="h-5 w-5" />
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}