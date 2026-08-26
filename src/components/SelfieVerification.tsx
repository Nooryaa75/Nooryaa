import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BadgeCheck, Loader2, ScanFace, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/CameraCapture";
import { GESTURES, verifySelfie } from "@/lib/selfie-verification.functions";

async function toDataUrl(file: File, max = 768): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function SelfieVerification({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const run = useServerFn(verifySelfie);

  const gesture = useMemo(() => GESTURES[Math.floor(Math.random() * GESTURES.length)]!, []);

  const { data: profile } = useQuery({
    queryKey: ["me", userId],
    queryFn: async () =>
      (await supabase.from("profiles").select("*").eq("id", userId).single()).data,
  });

  const status = (profile as any)?.photo_verification_status ?? "none";
  const verified = !!(profile as any)?.photo_verified;

  async function onCapture(file: File) {
    setOpen(false);
    setBusy(true);
    try {
      const selfieDataUrl = await toDataUrl(file);
      const res = await run({ data: { selfieDataUrl, gesture } });
      if (res.verdict === "verified") toast.success(res.reason || "Photo vérifiée ✅");
      else if (res.verdict === "rejected") toast.error(res.reason || "Vérification refusée");
      else toast.warning(res.reason || "Vérification à confirmer");
      await qc.invalidateQueries({ queryKey: ["me", userId] });
    } catch {
      toast.error("La vérification a échoué, réessayez.");
    } finally {
      setBusy(false);
    }
  }

  function start() {
    const hasMedia =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      window.isSecureContext;
    if (!hasMedia) {
      toast.error("Caméra indisponible sur cet appareil ou ce navigateur.");
      return;
    }
    setOpen(true);
  }

  return (
    <div className="rounded-2xl border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ScanFace className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-serif text-primary">Vérification par selfie</h2>
        {verified && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2 py-1">
            <BadgeCheck className="h-4 w-4" /> Vérifié
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Prenez un selfie en direct : il est comparé à votre photo principale pour confirmer que
        c'est bien vous. Les autres membres verront alors un badge « Photo vérifiée ».
      </p>

      {!verified && (
        <div className="rounded-xl bg-secondary/40 p-3 text-sm">
          <span className="font-medium text-primary">Geste demandé : </span>
          {gesture}
        </div>
      )}

      {status === "rejected" && !verified && (
        <p className="flex items-start gap-2 text-sm text-destructive">
          <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
          Dernière tentative refusée : le selfie ne correspondait pas ou n'était pas pris en direct.
        </p>
      )}
      {status === "review" && !verified && (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
          Vérification à confirmer : réessayez avec un bon éclairage, visage bien visible.
        </p>
      )}

      <Button type="button" onClick={start} disabled={busy}>
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Vérification…
          </>
        ) : verified ? (
          "Refaire la vérification"
        ) : (
          "Lancer la vérification"
        )}
      </Button>

      <CameraCapture open={open} onClose={() => setOpen(false)} onCapture={onCapture} />
    </div>
  );
}
