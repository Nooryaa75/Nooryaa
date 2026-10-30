import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getStoredLocale, translateText } from "@/lib/i18n";
import { BadgeCheck, Loader2, ScanFace, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/CameraCapture";
import { verifySelfie } from "@/lib/selfie-verification.functions";
import { useI18n } from "@/lib/i18n";

async function toDataUrl(file: File, max = 768): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function SelfieVerification({
  userId,
  onVerified,
}: {
  userId: string;
  onVerified?: () => void;
}) {
  const qc = useQueryClient();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const run = useServerFn(verifySelfie);

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
      const res = await run({ data: { selfieDataUrl, locale: getStoredLocale() } });
      if (res.verdict === "verified") {
        toast.success(translateText(res.reason || "Photo vérifiée ✅", getStoredLocale()));
        onVerified?.();
      } else if (res.technical) {
        toast.success(translateText("Selfie reçu ✅ Notre équipe le vérifiera, vous pouvez continuer.", getStoredLocale()));
        onVerified?.();
      } else if (res.verdict === "rejected") toast.error(translateText(res.reason || "Vérification refusée", getStoredLocale()));
      else toast.warning(translateText(res.reason || "Vérification à confirmer", getStoredLocale()));
      await qc.invalidateQueries({ queryKey: ["me", userId] });
    } catch {
      toast.error(translateText("La vérification a échoué, réessayez.", getStoredLocale()));
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
      toast.error(translateText("Caméra indisponible sur cet appareil ou ce navigateur.", getStoredLocale()));
      return;
    }
    setOpen(true);
  }

  // Profil déjà vérifié : on affiche uniquement le badge. C'est l'équipe Nooryaa
  // qui demande un nouveau selfie si besoin, pas le membre.
  if (verified) {
    return (
      <div className="rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2">
          <BadgeCheck className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-serif text-primary">Profil vérifié</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Votre identité a été confirmée. Si une nouvelle vérification est nécessaire,
          notre équipe vous contactera.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ScanFace className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-serif text-primary">Vérification par selfie</h2>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-secondary/40 p-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
        <div className="text-sm">
          <p className="font-medium text-primary">{t("Votre selfie reste confidentiel")}</p>
          <p className="text-muted-foreground">{t("Il ne sera jamais affiché sur la plateforme ni visible par les autres membres. Il sert uniquement à vérifier que c'est bien vous et à éviter les faux profils.")}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{t("Prenez un selfie en direct : il est comparé à vos photos de profil. Le selfie n'est pas enregistré dans votre fiche ; seul le résultat de la vérification est conservé.")}</p>

      {status === "rejected" && (
        <p className="flex items-start gap-2 text-sm text-destructive">
          <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
          Dernière tentative refusée : le selfie ne correspondait pas à vos photos ou n'était pas pris en direct.
        </p>
      )}
      {status === "review" && (
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
        ) : (
          "Lancer la vérification"
        )}
      </Button>

      <CameraCapture
        open={open}
        onClose={() => setOpen(false)}
        onCapture={onCapture}
        faceGuide
        hint="Placez votre visage dans le cercle — une seule personne visible."
      />
    </div>
  );
}
