import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";

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
  const [status, setStatus] = useState<"checking" | "ok">("checking");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!userId) {
        navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;

      if (!profile?.onboarded && window.location.pathname !== "/onboarding") {
        navigate({ to: "/onboarding", replace: true });
        return;
      }

      setStatus("ok");
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, navigate]);

  if (status === "checking") {
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
      <AppHeader />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Outlet />
      </main>
    </div>
  );
}
