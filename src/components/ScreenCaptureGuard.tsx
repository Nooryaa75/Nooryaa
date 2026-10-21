import { useEffect } from "react";

/**
 * Garde-fou iPhone : le contrôleur natif signale via l'événement
 * « nooryaa-screen-captured » que l'écran est enregistré ou partagé.
 * Pendant la capture, les photos des membres sont masquées à l'écran
 * (classe nooryaa-recording posée sur <html>, voir src/styles.css).
 * Sur le web, aucune détection n'existe : ce composant reste inactif.
 */
export function ScreenCaptureGuard() {
  useEffect(() => {
    const onCapture = (event: Event) => {
      const captured = Boolean((event as CustomEvent).detail);
      document.documentElement.classList.toggle("nooryaa-recording", captured);
    };
    const onDragStart = (event: DragEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest?.("[data-photo-guard] img")) event.preventDefault();
    };
    window.addEventListener("nooryaa-screen-captured", onCapture);
    document.addEventListener("dragstart", onDragStart);
    return () => {
      window.removeEventListener("nooryaa-screen-captured", onCapture);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, []);
  return null;
}
