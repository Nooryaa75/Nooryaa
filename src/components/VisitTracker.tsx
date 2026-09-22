import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { trackVisit } from "@/lib/visits.functions";
import { analyticsAllowed, onCookieChoiceChange } from "@/lib/cookie-consent";

/**
 * Enregistre les visites des pages publiques (hors administration)
 * uniquement si le visiteur a accepté la mesure d'audience (RGPD).
 */
export function VisitTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = () => setAllowed(analyticsAllowed());
    sync();
    return onCookieChoiceChange(sync);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!allowed) return;
    if (pathname.startsWith("/admin")) return;
    const referrer = document.referrer || null;
    trackVisit({ data: { path: pathname, referrer } }).catch(() => {
      /* le suivi ne doit jamais gêner la navigation */
    });
  }, [pathname, allowed]);

  return null;
}
