import { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Prise de photo via la caméra de l'appareil (web app + webview native).
 * Utilise getUserMedia ; l'appelant gère le repli <input capture> si indisponible.
 */
/** Part du cadre occupée par le cercle de cadrage du visage. */
const GUIDE_RATIO = 0.74;

export function CameraCapture({
  open,
  onClose,
  onCapture,
  faceGuide = false,
  hint,
}: {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  /** Affiche un cercle de cadrage : seul le contenu du cercle est conservé. */
  faceGuide?: boolean;
  hint?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [error, setError] = useState<string | null>(null);
  const [shot, setShot] = useState<string | null>(null);

  useEffect(() => {
    if (!open || shot) return;
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        if (!cancelled) setError("Impossible d'accéder à la caméra. Vérifiez les autorisations.");
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open, facing, shot]);

  useEffect(() => {
    if (!open) {
      setShot(null);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  function take() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    if (facing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setShot(canvas.toDataURL("image/jpeg", 0.9));
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function confirm() {
    if (!shot) return;
    const blob = await (await fetch(shot)).blob();
    onCapture(new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" }));
    setShot(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="relative w-full max-w-sm aspect-square overflow-hidden rounded-2xl bg-black">
        {shot ? (
          <img src={shot} alt="Aperçu" className="h-full w-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className={`h-full w-full object-cover ${facing === "user" ? "scale-x-[-1]" : ""}`}
          />
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white">
            {error}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-4">
        {shot ? (
          <>
            <Button type="button" variant="secondary" onClick={() => setShot(null)}>
              <RefreshCw className="mr-2 h-4 w-4" /> Reprendre
            </Button>
            <Button type="button" onClick={confirm}>
              <Check className="mr-2 h-4 w-4" /> Utiliser cette photo
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Caméra
            </Button>
            <Button type="button" disabled={!!error} onClick={take}>
              <Camera className="mr-2 h-4 w-4" /> Prendre la photo
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
