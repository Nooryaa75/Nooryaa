import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  User, Bell, CreditCard, Headphones, Users, FileText, ShieldCheck, Database,
  ChevronRight, Settings, Camera, MapPin, Briefcase, Crown, LogOut,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/compte/")({
  head: () => ({ meta: [{ title: "Mon compte — Nooryaa" }] }),
  component: CompteHome,
});

const menu = [
  { to: "/compte/profil", label: "Mon profil", icon: User },
  { to: "/compte/notifications", label: "Mes notifications", icon: Bell },
  { to: "/compte/abonnement", label: "Mon abonnement", icon: CreditCard },
  { to: "/compte/service-client", label: "Service client", icon: Headphones },
  { to: "/compte/regles", label: "Règles communauté", icon: Users },
  { to: "/compte/cgu", label: "CGU", icon: FileText },
  { to: "/compte/confidentialite", label: "Politique de confidentialité", icon: ShieldCheck },
  { to: "/compte/donnees", label: "Mes données personnelles", icon: Database },
] as const;

function CompteHome() {
  const ctx = Route.useRouteContext();
  const navigate = useNavigate();
  const { t } = useI18n();

  const { data: profile } = useQuery({
    queryKey: ["me", ctx.userId],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", ctx.userId).single()).data,
  });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">Mon compte</h1>
        <Link to="/compte/notifications" aria-label="Paramètres" className="text-muted-foreground hover:text-primary transition-colors">
          <Settings className="h-5 w-5" />
        </Link>
      </div>

      {/* Carte profil */}
      <Link to="/compte/profil" className="block bg-card rounded-2xl p-4 border border-border/60 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="h-20 w-20 rounded-full overflow-hidden bg-secondary">
              {profile?.primary_photo_url ? (
                <img src={profile.primary_photo_url} alt={profile.pseudo} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground rounded-full p-1.5">
              <Camera className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-lg text-primary flex items-center gap-1.5">
              {profile?.pseudo ?? "…"}
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" aria-label={t("En ligne")} />
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <MapPin className="h-3.5 w-3.5" />
              {[profile?.city, profile?.country].filter(Boolean).join(", ") || "—"}
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Briefcase className="h-3.5 w-3.5" />
              {profile?.profession ?? "—"}
            </p>
          </div>
        </div>
      </Link>

      {/* Langue */}
      <div className="bg-card rounded-2xl p-4 border border-border/60 shadow-[var(--shadow-card)]">
        <p className="mb-3 text-sm font-medium text-primary">{t("Langue")}</p>
        <LanguageSwitcher inline />
      </div>

      {/* Bannière Premium */}
      <Link
        to="/compte/abonnement"
        className="flex items-center gap-4 rounded-2xl p-5 text-primary-foreground shadow-[var(--glow-gold)]"
        style={{ background: "var(--gradient-gold)" }}
      >
        <span className="bg-white/20 rounded-full p-3 shrink-0">
          <Crown className="h-6 w-6" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-bold">Passez Premium</span>
          <span className="block text-sm text-white/85">
            Débloquez toutes les fonctionnalités et trouvez votre bonheur plus vite.
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0" />
      </Link>

      {/* Menu */}
      <nav className="bg-card rounded-2xl border border-border/60 shadow-[var(--shadow-card)] divide-y divide-border/60 overflow-hidden">
        {menu.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors"
          >
            <m.icon className="h-5 w-5 text-primary" />
            <span className="flex-1 text-sm font-medium">{m.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </nav>

      {/* Déconnexion */}
      <button
        type="button"
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-accent/60 text-accent font-semibold py-3.5 hover:bg-accent/5 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Se déconnecter
      </button>

    </div>
  );
}
