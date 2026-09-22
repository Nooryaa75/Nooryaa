import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminLogout, adminNotificationCounts } from "@/lib/admin.functions";
import { LayoutDashboard, Users, Flag, LogOut, MessageSquare, Megaphone, Mail, ShieldAlert, Euro, BarChart3, LifeBuoy, SlidersHorizontal, Zap, RotateCcw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/nooryaa-logo.png.asset.json";

const links = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { to: "/admin/profiles", label: "Profils", icon: Users, exact: false },
  { to: "/admin/finance", label: "Finance", icon: Euro, exact: false },
  { to: "/admin/visits", label: "Visites", icon: Eye, exact: false },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, exact: false },
  { to: "/admin/support", label: "Support", icon: LifeBuoy, exact: false },
  { to: "/admin/credits", label: "Consommation", icon: Zap, exact: false },
  { to: "/admin/config", label: "Configurateur", icon: SlidersHorizontal, exact: false },
  { to: "/admin/conversations", label: "Discussions", icon: MessageSquare, exact: false },
  { to: "/admin/reports", label: "Signalements", icon: Flag, exact: false, badge: "reports" as const },
  { to: "/admin/moderation", label: "Modération", icon: ShieldAlert, exact: false },
  { to: "/admin/contact", label: "Contact", icon: Mail, exact: false, badge: "contacts" as const },
  { to: "/admin/ads", label: "Publicités", icon: Megaphone, exact: false },
  { to: "/admin/rgpd", label: "RGPD", icon: ShieldCheck, exact: false },
  
  { to: "/admin/reset", label: "Données", icon: RotateCcw, exact: false },

] as const;

export function AdminNav() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const logout = useServerFn(adminLogout);
  const counts = useServerFn(adminNotificationCounts);
  const { data: notif } = useQuery({
    queryKey: ["admin-notif-counts"],
    queryFn: () => counts(),
    refetchInterval: 20000,
  });
  const badgeValue = (b?: "reports" | "contacts") => {
    if (!notif) return 0;
    if (b === "reports") return notif.openReports;
    if (b === "contacts") return notif.unreadContacts;
    return 0;
  };

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // on poursuit quand même la déconnexion côté membre
    }
    // Si l'admin est aussi connecté via son compte membre (rôle admin),
    // il faut fermer cette session sinon la page de login le renvoie dans l'admin.
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    navigate({ to: "/admin/login" });
  }

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur border-b border-border/60">
      <div className="container mx-auto flex items-center justify-between gap-2 px-4 pt-3 max-w-7xl">
        <Link to="/admin" className="flex items-center gap-2.5 shrink-0">
          <img src={logoAsset.url} alt="Logo Nooryaa" className="h-9 w-9 rounded-xl object-cover shadow-sm" />
          <span className="text-lg font-serif font-semibold tracking-[0.14em] uppercase gold-text">Administration</span>
        </Link>
        <Button onClick={handleLogout} variant="ghost" size="sm" className="gap-1.5 shrink-0">
          <LogOut className="h-4 w-4" /> Déconnexion
        </Button>
      </div>
      <nav className="hidden md:block border-t border-border/40 mt-2">
        <div className="container mx-auto max-w-7xl px-2 flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 py-1.5">
          {links.map((l) => {
            const active = l.exact ? pathname === l.to : pathname.startsWith(l.to);
            const n = badgeValue((l as any).badge);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  active ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <l.icon className="h-4 w-4" />
                {l.label}
                {n > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">{n}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
      <nav className="md:hidden border-t border-border/60 flex justify-around py-1.5 overflow-x-auto">
        {links.map((l) => {
          const active = l.exact ? pathname === l.to : pathname.startsWith(l.to);
          const n = badgeValue((l as any).badge);
          return (
            <Link key={l.to} to={l.to} className={`relative flex flex-col items-center gap-0.5 px-3 py-1 text-xs whitespace-nowrap ${active ? "text-primary" : "text-muted-foreground"}`}>
              <l.icon className="h-5 w-5" />
              {n > 0 && <span className="absolute top-0 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">{n}</span>}
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}