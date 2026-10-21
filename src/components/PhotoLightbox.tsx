import { useCallback, useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { PhotoWatermark } from "@/components/PhotoWatermark";

export interface LightboxPhoto {
  url: string;
  caption?: string;
}

interface PhotoLightboxProps {
  /** Photos affichées, dans l'ordre de la galerie. */
  photos: LightboxPhoto[];
  /** Position de la photo ouverte (index dans photos). */
  index: number;
  /** Appelé quand on passe à la photo précédente ou suivante. */
  onIndexChange: (index: number) => void;
  /** Appelé pour fermer l'affichage en grand. */
  onClose: () => void;
  /** Filigrane de dissuasion ; désactivé dans l'administration. */
  watermarked?: boolean;
}

/**
 * Affiche une photo en grand par-dessus la page.
 * Flèches du clavier et boutons pour changer de photo, Échap ou un clic
 * hors de la photo pour fermer, et clic sur la photo pour l'afficher
 * à sa taille réelle.
 */
export function PhotoLightbox({ photos, index, onIndexChange, onClose, watermarked = true }: PhotoLightboxProps) {
  const [zoomed, setZoomed] = useState(false);
  const count = photos.length;
  const photo = photos[index];

  const go = useCallback(
    (delta: number) => {
      if (count < 2) return;
      setZoomed(false);
      onIndexChange((index + delta + count) % count);
    },
    [count, index, onIndexChange],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    setZoomed(false);
  }, [index]);

  if (!photo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.caption ? `Photo de ${photo.caption} en grand` : "Photo en grand"}
      className="fixed inset-0 z-[100] bg-black/90 flex flex-col"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white/90" onClick={(e) => e.stopPropagation()}>
        <span className="text-sm tabular-nums">
          {index + 1} / {count}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            aria-label={zoomed ? "Réduire la photo" : "Afficher à la taille réelle"}
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            {zoomed ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className={`relative flex-1 flex items-center justify-center p-4 ${zoomed ? "overflow-auto" : "overflow-hidden"}`}
        data-photo-guard
      >
        <img
          src={photo.url}
          alt={photo.caption ?? ""}
          onClick={(e) => {
            e.stopPropagation();
            setZoomed((z) => !z);
          }}
          className={`rounded-lg shadow-2xl select-none ${
            zoomed ? "max-w-none max-h-none cursor-zoom-out" : "max-h-full max-w-full object-contain cursor-zoom-in"
          }`}
        />
        {watermarked && <PhotoWatermark />}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label="Photo précédente"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label="Photo suivante"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {photo.caption && (
        <p className="px-4 pb-4 text-center text-sm text-white/70" onClick={(e) => e.stopPropagation()}>
          {photo.caption}
        </p>
      )}
    </div>
  );
}
