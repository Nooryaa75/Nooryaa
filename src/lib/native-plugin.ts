/**
 * Accès à un module natif du téléphone (Capacitor).
 * Le site étant chargé à distance dans l'appli, les modules ne sont pas
 * toujours présents dans `Capacitor.Plugins` : on les relie alors au pont
 * natif avec `registerPlugin`, qui fonctionne dès que le module est intégré
 * au build.
 */
const cache: Record<string, any> = {};

export function nativePlugin(name: string): any {
  if (typeof window === "undefined") return null;
  const cap = (window as unknown as { Capacitor?: any }).Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  const existing = cap.Plugins?.[name];
  if (existing) return existing;
  if (cache[name]) return cache[name];
  if (cap.isPluginAvailable && !cap.isPluginAvailable(name)) return null;
  if (typeof cap.registerPlugin !== "function") return null;
  try {
    cache[name] = cap.registerPlugin(name);
    return cache[name];
  } catch {
    return null;
  }
}
