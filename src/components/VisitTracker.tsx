import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { trackVisit } from "@/lib/visits.functions";

/** Enregistre discrètement les visites des pages publiques (hors administration). */
export function VisitTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname.startsWith("/admin")) return;
    const referrer = document.referrer || null;
    trackVisit({ data: { path: pathname, referrer } }).catch(() => {
      /* le suivi ne doit jamais gêner la navigation */
    });
  }, [pathname]);

  return null;
}
