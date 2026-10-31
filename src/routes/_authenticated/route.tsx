import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { registerPushNotifications } from "@/lib/push";
import { PushPermissionNotice } from "@/components/PushPermissionNotice";
import { isValidPhone } from "@/components/PhoneInput";
import { onboardingDestination, showAccessGate } from "@/lib/onboarding-access";
import { registrationComplete } from "@/lib/registration-requirements";


export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    return { userId: data.user?.id ?? "" };
  },
  component: AuthenticatedLayout,
});

/**
 * La redirection est faite après l'hydratation (et non via `throw redirect`
 * dans beforeLoad) : changer de route pendant l'hydratation provoquait une
 * "hydration mismatch" React (écran blanc / "Uncaught undefined").
 */
function AuthenticatedLayout() {
  const { userId } = Route.useRouteContext();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [verified, setVerified] = useState<{ userId: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!userId) {
        navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
        return;
      }

      const [{ data: profile }, { data: roles }, { count: photoCount }] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin"),
        supabase.from("photos").select("id", { count: "exact", head: true }).eq("user_id", userId),
      ]);
      if (cancelled) return;

      // Compte administrateur sans profil membre : accès uniquement à l'administration.
      if (roles && roles.length > 0 && !profile?.onboarded) {
        navigate({ to: "/admin", replace: true });
        return;
      }

      // Un selfie validé ou un ancien drapeau onboarded ne remplacent pas les réponses obligatoires.
      const complete = registrationComplete(profile, photoCount ?? 0, isValidPhone(profile?.phone ?? ""));
      const destination = onboardingDestination(!complete && !(roles && roles.length > 0), pathname);
      if (destination) {
        await navigate({ to: destination, replace: true });
        return;
      }

      setVerified({ userId });
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, navigate, pathname]);

  // Notifications push mobiles : enregistre l'appareil (application Android
  // uniquement ; ne fait rien dans le navigateur).
  useEffect(() => {
    if (!userId) return;
    void registerPushNotifications(userId);
  }, [userId]);

  // Présence temps réel : on rafraîchit last_seen toutes les 2 minutes.
  useEffect(() => {
    if (!userId) return;
    const ping = () => {
      supabase
        .from("profiles")
        .update({ last_seen: new Date().toISOString() } as never)
        .eq("id", userId)
        .then(() => {});
    };
    ping();
    const t = setInterval(ping, 120000);
    return () => clearInterval(t);
  }, [userId]);

  if (showAccessGate(verified?.userId ?? null, userId)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex gap-1.5" aria-label="Chargement">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {pathname !== "/onboarding" && <AppHeader />}
      {pathname !== "/onboarding" && <PushPermissionNotice userId={userId} />}
      <main className="container mx-auto px-4 pt-6 pb-24 md:py-8 max-w-6xl">

        <Outlet />
      </main>
    </div>
  );
}
