import { toast } from "sonner";

/**
 * Avertissement important (photo refusée, selfie à refaire…) : il reste affiché
 * jusqu'à ce que le membre le ferme lui-même avec la croix, pour avoir le temps de lire.
 */
export function persistentAlert(kind: "error" | "warning", message: string) {
  return toast[kind](message, {
    duration: Infinity,
    closeButton: true,
    className: "nooryaa-alert",
  });
}
