import { useEffect, useState } from "react";
import { getPublicAppVersions, type PublicAppVersion } from "@/lib/app-version.functions";
import { useI18n } from "@/lib/i18n";
import { devicePlatform } from "@/lib/push";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.nooryaa.app";

// Identifiant App Store à renseigner dès la première publication de l'app iPhone.
// Tant qu'il est vide, le bouton ouvre la recherche Nooryaa sur l'App Store.
const APP_STORE_ID = "";
const APP_STORE_URL = APP_STORE_ID
  ? `https://apps.apple.com/app/id${APP_STORE_ID}`
  : "https://apps.apple.com/fr/search?term=nooryaa";

/** Compare deux versions "1.0.2" : -1 si a < b, 0 si égales, 1 si a > b. */
function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x < y) return -1;
    if (x > y) return 1;
  }
  return 0;
}

/**
 * Vérifie la version de l'application installée (Android ou iPhone) et la
 * compare à celle définie dans le configurateur admin :
 * - version installée < version minimale → fenêtre bloquante (mise à jour obligatoire) ;
 * - version installée < version publiée → fenêtre simple (mise à jour proposée).
 * Ne fait rien dans le navigateur.
 */
export function AppUpdateChecker() {
  const { t } = useI18n();
  const [state, setState] = useState<{
    required: boolean;
    latest: string;
    platform: "ios" | "android";
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const cap = (window as unknown as { Capacitor?: any }).Capacitor;
        if (!cap?.isNativePlatform?.()) return;
        const info = await cap.Plugins?.App?.getInfo?.();
        const installed: string | undefined = info?.version;
        if (!installed) return;

        const platform = devicePlatform();
        const rows: PublicAppVersion[] = await getPublicAppVersions();
        const row = rows.find((r) => r.platform === platform);
        if (!row?.version || cancelled) return;

        if (row.min_version && compareVersions(installed, row.min_version) < 0) {
          setState({ required: true, latest: row.version, platform });
        } else if (compareVersions(installed, row.version) < 0) {
          setState({ required: false, latest: row.version, platform });
        }
      } catch {
        // Silencieux : un échec de vérification ne doit jamais bloquer l'app.
      }
    };
    void check();
    // Revérifie quand on revient dans l'appli (elle reste souvent ouverte
    // en arrière-plan : sans cela, la fenêtre n'apparaît qu'au prochain
    // lancement complet).
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!state) return null;

  const openStore = () => {
    window.open(state.platform === "ios" ? APP_STORE_URL : PLAY_STORE_URL, "_blank");
  };

  return (
    <AlertDialog open onOpenChange={state.required ? () => {} : (o) => !o && setState(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {state.required ? t("Mise à jour obligatoire") : t("Mise à jour disponible")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {state.required
              ? t("Pour continuer à utiliser Nooryaa, vous devez installer la dernière version de l'application.")
              : state.platform === "ios"
                ? t("Une nouvelle version de Nooryaa est disponible sur l'App Store. Mettez à jour pour profiter des dernières améliorations.")
                : t("Une nouvelle version de Nooryaa est disponible sur Google Play. Mettez à jour pour profiter des dernières améliorations.")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!state.required && (
            <AlertDialogCancel onClick={() => setState(null)}>{t("Plus tard")}</AlertDialogCancel>
          )}
          <AlertDialogAction onClick={openStore}>{t("Mettre à jour")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
