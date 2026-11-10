// Visibilité des offres payantes.
// L'application iPhone ne propose jamais d'offre payante : Apple impose son
// propre système d'achat (règles App Store 3.1.1 et 5.6), qui n'est pas en place.
// Ailleurs, les offres n'apparaissent que si l'interrupteur des abonnements est
// allumé dans l'administration — sinon aucune bannière « Premium ».

export type NativePlatform = "ios" | "android" | null;

export function showPaidPlans(subscriptionsEnabled: boolean, platform: NativePlatform): boolean {
  return subscriptionsEnabled === true && platform !== "ios";
}

/** Plateforme de l'application installée (null sur le site web). À lire après l'hydratation. */
export function detectNativePlatform(): NativePlatform {
  if (typeof window === "undefined") return null;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string; platform?: string } }).Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  const p = cap.getPlatform?.() ?? cap.platform;
  return p === "ios" || p === "android" ? p : null;
}
