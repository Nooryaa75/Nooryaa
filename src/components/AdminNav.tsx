import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminLogout, adminNotificationCounts } from "@/lib/admin.functions";
import { LayoutDashboard, Users, Flag, LogOut, MessageSquare, Megaphone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { to: "/admin/profiles", label: "Profils", icon: Users, exact: false },
  { to: "/admin/conversations", label: "Discussions", icon: MessageSquare, exact: false },
  { to: "/admin/reports", label: "Signalements", icon: Flag, exact: false, badge: "reports" as const },
  { to: "/admin/contact", label: "Contact", icon: Mail, exact: false, badge: "contacts" as const },
  { to: "/admin/ads", label: "Publicités", icon: Megaphone, exact: false },
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
    await logout();
    navigate({ to: "/admin/login" });
  }

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground border-b border-border/60">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 max-w-6xl">
        <Link to="/admin" className="text-lg font-serif font-semibold">Nooryaa · Administration</Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = l.exact ? pathname === l.to : pathname.startsWith(l.to);
            const n = badgeValue((l as any).badge);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  active ? "bg-primary-foreground/15" : "opacity-80 hover:opacity-100"
                }`}
              >
                <l.icon className="h-4 w-4" />
                {l.label}
                {n > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">{n}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <Button onClick={handleLogout} variant="ghost" size="sm" className="gap-1.5 text-primary-foreground hover:bg-primary-foreground/10">
          <LogOut className="h-4 w-4" /> Déconnexion
        </Button>
      </div>
      <nav className="md:hidden border-t border-primary-foreground/10 flex justify-around py-1.5 overflow-x-auto">
        {links.map((l) => {
          const active = l.exact ? pathname === l.to : pathname.startsWith(l.to);
          const n = badgeValue((l as any).badge);
          return (
            <Link key={l.to} to={l.to} className={`relative flex flex-col items-center gap-0.5 px-3 py-1 text-xs whitespace-nowrap ${active ? "" : "opacity-70"}`}>
              <l.icon className="h-5 w-5" />
              {n > 0 && <span className="absolute top-0 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{n}</span>}
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}