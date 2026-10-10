import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Enregistre le mode d'utilisation du membre (site web, application Android
 * ou iPhone) sur sa fiche profil, à chaque ouverture de l'application.
 * Silencieux : aucun affichage, aucune erreur remontée au membre.
 */
export function PlatformTracker() {
  useEffect(() => {
    let cancelled = false;

    const detect = (): "web" | "android" | "ios" => {
      const cap = (window as unknown as { Capacitor?: { platform?: string } }).Capacitor;
      if (cap?.platform === "android" || cap?.platform === "ios") return cap.platform;
      return "web";
    };

    const track = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id;
        if (!userId || cancelled) return;
        const platform = detect();
        await supabase
          .from("profiles")
          .update({ last_platform: platform } as never)
          .eq("id", userId)
          .neq("last_platform", platform);
      } catch {
        // Silencieux : le suivi ne doit jamais gêner le membre.
      }
    };

    track();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") track();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return null;
}
