import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { nativePlugin } from "@/lib/native-plugin";
import {
  checkPushPermission,
  openNotificationSettings,
  registerPushNotifications,
  requestPushPermission,
  type PushState,
} from "@/lib/push";

/**
 * Bandeau affiché dans l'application Android tant que les notifications ne
 * sont pas autorisées : il demande l'autorisation, puis propose d'ouvrir les
 * réglages du téléphone si la demande a déjà été refusée.
 * Invisible dans le navigateur et une fois l'autorisation accordée.
 */
export function PushPermissionNotice({ userId }: { userId: string }) {
  const { t } = useI18n();
  const [state, setState] = useState<PushState>("unsupported");
  const [alreadyAsked, setAlreadyAsked] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Contrôle l'autorisation ; si elle est accordée, on s'assure que le
    // téléphone est bien inscrit pour recevoir les notifications.
    const refresh = async () => {
      const s = await checkPushPermission();
      if (cancelled) return;
      setState(s);
      if (s === "granted" && userId) void registerPushNotifications(userId);
    };
    void refresh();

    // Retour depuis les réglages du téléphone : on revérifie aussitôt,
    // sinon le bandeau resterait affiché alors que l'autorisation est donnée.
    // Selon la version du pont natif, addListener renvoie soit directement
    // la poignée, soit une promesse : on accepte les deux sans jamais planter.
    const app = nativePlugin("App");
    let handle: { remove?: () => void } | undefined;
    try {
      if (typeof app?.addListener === "function") {
        const res = app.addListener("appStateChange", (st: { isActive: boolean }) => {
          if (st?.isActive) void refresh();
        });
        Promise.resolve(res)
          .then((h: { remove?: () => void }) => {
            handle = h;
            if (cancelled) h?.remove?.();
          })
          .catch(() => {});
      }
    } catch {
      /* module indisponible : on ignore */
    }

    return () => {
      cancelled = true;
      try {
        handle?.remove?.();
      } catch {
        /* ignore */
      }
    };
  }, [userId]);

  if (dismissed || state !== "denied") return null;

  async function handleClick() {
    setBusy(true);
    if (alreadyAsked) {
      openNotificationSettings();
      setBusy(false);
      return;
    }
    const next = await requestPushPermission();
    setState(next);
    if (next === "granted") {
      // L'autorisation vient d'être donnée : on inscrit tout de suite le
      // téléphone, sans attendre une fermeture/réouverture de l'appli.
      if (userId) void registerPushNotifications(userId);
      setDismissed(true);
    } else {
      // Android ne rouvre pas la fenêtre d'autorisation après un premier
      // refus : on envoie directement vers les réglages du téléphone,
      // sinon le bouton donnait l'impression de ne rien faire.
      setAlreadyAsked(true);
      openNotificationSettings();
    }
    setBusy(false);
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 pt-4">
      <div
        role="status"
        className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3"
      >
        <span aria-hidden="true" className="text-xl">
          🔔
        </span>
        <div className="min-w-[200px] flex-1">
          <p className="text-sm font-medium text-foreground">
            {t("Restez informé·e de vos matchs et messages")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("Autorisez les notifications pour ne manquer aucune conversation.")}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClick}
          disabled={busy}
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {alreadyAsked ? t("Ouvrir les réglages du téléphone") : t("Activer les notifications")}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={t("Plus tard")}
          className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
