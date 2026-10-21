import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { appBrowser, IOS_APP_OPEN_URL, type AppBrowser } from "@/lib/open-in-app";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.nooryaa.app";
const APP_INTENT_URL = `intent://open#Intent;scheme=nooryaa;package=com.nooryaa.app;S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;

/**
 * Browser-only return to the installed app on Android and iOS.
 * The native onboarding screen must never show this prompt.
 */
export function OpenInAppButton() {
  const { t } = useI18n();
  const [browser, setBrowser] = useState<AppBrowser>(null);

  useEffect(() => {
    const cap = (window as unknown as {
      Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string; platform?: string };
    }).Capacitor;
    const platform = cap?.getPlatform?.() ?? cap?.platform;
    setBrowser(appBrowser(navigator.userAgent, Boolean(cap?.isNativePlatform?.()), platform, navigator.maxTouchPoints));
  }, []);

  if (!browser) return null;

  return (
    <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
      <Smartphone className="h-6 w-6 text-primary shrink-0" aria-hidden />
      <div className="flex-1 text-sm">
        <p className="font-medium text-foreground">{t("Vous avez déjà l'application Nooryaa ?")}</p>
        <Button asChild variant="link" className="h-auto p-0 font-semibold underline underline-offset-2">
          <a href={browser === "ios" ? IOS_APP_OPEN_URL : APP_INTENT_URL}>
            {t("Ouvrir l'application")}
          </a>
        </Button>
      </div>
    </div>
  );
}
