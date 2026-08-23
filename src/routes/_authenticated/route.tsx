import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/auth", search: { mode: "signin" } });
    }
    // Force onboarding if not done
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded")
      .eq("id", data.user.id)
      .maybeSingle();
    if (!profile?.onboarded && location.pathname !== "/onboarding") {
      throw redirect({ to: "/onboarding" });
    }
    return { userId: data.user.id };
  },
  component: () => (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 max-w-6xl"><Outlet /></main>
    </div>
  ),
});