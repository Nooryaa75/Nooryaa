import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import {
  checkPushPermission,
  openNotificationSettings,
  requestPushPermission,
  type PushState,
} from "@/lib/push";

/**
 * Bandeau affiché dans l'application Android tant que les notifications ne
 * sont pas autorisées : il demande l'autorisation, puis propose d'ouvrir les
 * réglages du téléphone si la demande a déjà été refusée.
 * Invisible dans le navigateur et une fois l'autorisation accordée.
 */
export function PushPermissionNotice() {
  const { t } = useI18n();
  const [state, setState] = useState<PushState>("unsupported");
  const [alreadyAsked, setAlreadyAsked] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void checkPushPermission().then((s) => {
      if (!cancelled) setState(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
    if (next === "granted") setDismissed(true);
    else setAlreadyAsked(true);
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
