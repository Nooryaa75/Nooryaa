import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.nooryaa.app";
const APP_INTENT_URL = `intent://open#Intent;scheme=nooryaa;package=com.nooryaa.app;S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;

/**
 * Bouton « Ouvrir l'application » affiché uniquement sur Android (navigateur).
 * Ouvre l'appli Nooryaa si elle est installée, sinon propose le Play Store.
 */
export function OpenInAppButton() {
  const { t } = useI18n();
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const cap = (window as unknown as {
      Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string; platform?: string };
    }).Capacitor;
    const platform = cap?.getPlatform?.() ?? cap?.platform;
    const native = cap?.isNativePlatform?.() || platform === "android" || platform === "ios";
    setIsAndroid(!native && /android/i.test(navigator.userAgent));
  }, []);

  if (!isAndroid) return null;

  return (
    <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
      <Smartphone className="h-6 w-6 text-primary shrink-0" aria-hidden />
      <div className="flex-1 text-sm">
        <p className="font-medium text-foreground">{t("Vous avez déjà l'application Nooryaa ?")}</p>
        <a href={APP_INTENT_URL} className="text-primary font-semibold underline underline-offset-2">
          {t("Ouvrir l'application")}
        </a>
      </div>
    </div>
  );
}
