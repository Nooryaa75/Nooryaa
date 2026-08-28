import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { User, Bell, CreditCard, FileText, ShieldCheck, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/compte")({
  head: () => ({ meta: [{ title: "Mon compte — Nooryaa" }] }),
  component: CompteLayout,
});

const menu = [
  { to: "/compte/profil", label: "Mon profil", icon: User },
  { to: "/compte/notifications", label: "Mes notifications", icon: Bell },
  { to: "/compte/abonnement", label: "Mon abonnement", icon: CreditCard },
  { to: "/compte/cgu", label: "CGU", icon: FileText },
  { to: "/compte/confidentialite", label: "Politique de confidentialité", icon: ShieldCheck },
] as const;

function CompteLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-serif text-primary">Mon compte</h1>
      <nav className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {menu.map((m) => {
          const active = pathname.startsWith(m.to);
          return (
            <Link
              key={m.to}
              to={m.to}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm whitespace-nowrap border transition-colors ${
                active
                  ? "bg-secondary text-primary font-bold border-primary/40"
                  : "text-muted-foreground font-medium border-border/60 hover:text-foreground"
              }`}
            >
              <m.icon className="h-4 w-4" />
              {m.label}
            </Link>
          );
        })}
      </nav>
      <Outlet />
    </div>
  );
}
