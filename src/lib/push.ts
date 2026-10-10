import { supabase } from "@/integrations/supabase/client";
import { nativePlugin } from "@/lib/native-plugin";

type PushToken = { value: string };

/**
 * Canal de notification Android : c'est lui qui apparaît dans les réglages
 * du téléphone (« Réglages > Applications > Nooryaa > Notifications »).
 */
export const PUSH_CHANNEL_ID = "nooryaa";
const CHANNEL_NAME = "Notifications Nooryaa";
const CHANNEL_DESCRIPTION = "Messages, matchs, likes et rappels Nooryaa";

export type PushState = "unsupported" | "granted" | "denied";

function capacitor(): any {
  return (window as unknown as { Capacitor?: any }).Capacitor;
}

function pushPlugin(): any {
  return nativePlugin("PushNotifications");
}

function appPlugin(): any {
  return nativePlugin("App");
}

/**
 * Plateforme du téléphone : Android ou iPhone. Le pont Capacitor l'indique
 * directement ; le reste ne sert que de filet si l'information manque.
 */
export function devicePlatform(): "ios" | "android" {
  const cap = capacitor();
  if (cap?.platform === "ios" || cap?.platform === "android") return cap.platform;
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) ? "ios" : "android";
}

/**
 * Déclare le canal de notification. Sans canal, Android n'affiche rien dans
 * les réglages et l'interrupteur reste grisé.
 */
async function ensureChannel(push: any) {
  try {
    // Les canaux sont propres à Android ; iPhone gère cela autrement.
    if (devicePlatform() !== "android") return;
    if (typeof push?.createChannel !== "function") return;
    await push.createChannel({
      id: PUSH_CHANNEL_ID,
      name: CHANNEL_NAME,
      description: CHANNEL_DESCRIPTION,
      importance: 4,
      visibility: 1,
      vibration: true,
    });
  } catch {
    // Le canal existe déjà : rien à faire.
  }
}

/** État courant de l'autorisation (sans rien demander à l'utilisateur). */
export async function checkPushPermission(): Promise<PushState> {
  const push = pushPlugin();
  if (!push) return "unsupported";
  try {
    const res = await push.checkPermissions();
    return res?.receive === "granted" ? "granted" : "denied";
  } catch {
    return "denied";
  }
}

/**
 * Demande l'autorisation des notifications au téléphone.
 * Si l'utilisateur a déjà refusé, Android ne rouvre pas la fenêtre :
 * il faut alors passer par openNotificationSettings().
 */
export async function requestPushPermission(): Promise<PushState> {
  const push = pushPlugin();
  if (!push) return "unsupported";
  try {
    await ensureChannel(push);
    // Le pont natif peut ne jamais répondre (fenêtre déjà refusée par le
    // téléphone) : on abandonne au bout de 5 secondes pour ne pas bloquer
    // le bouton « Activer les notifications ».
    const res = await Promise.race([
      push.requestPermissions(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);
    return res?.receive === "granted" ? "granted" : "denied";
  } catch {
    return "denied";
  }
}

/**
 * Diagnostic : réponse brute du module de notifications, envoyée dans les
 * rapports du téléphone pour comprendre pourquoi l'autorisation échoue.
 */
export async function pushDiagnostic(action: "check" | "request"): Promise<string> {
  const cap = capacitor();
  const push = pushPlugin();
  const base = `avail=${cap?.isPluginAvailable?.("PushNotifications")} inPlugins=${!!cap?.Plugins?.PushNotifications} plugin=${!!push}`;
  if (!push) return base;
  try {
    const call = action === "check" ? push.checkPermissions() : push.requestPermissions();
    const res = await Promise.race([
      Promise.resolve(call),
      new Promise((resolve) => setTimeout(() => resolve("timeout"), 8000)),
    ]);
    return `${base} ${action}=${JSON.stringify(res)}`;
  } catch (e) {
    return `${base} ${action}-error=${(e as Error)?.message ?? String(e)}`;
  }
}

/**
 * Ouvre la page de réglages de l'application sur le téléphone.
 * Renvoie false si l'appli installée ne sait pas le faire : il faut alors
 * guider l'utilisateur à la main.
 */
export function openNotificationSettings(): boolean {
  const candidates = [nativePlugin("NativeSettings"), appPlugin()];
  for (const p of candidates) {
    try {
      if (typeof p?.openAndroid === "function") {
        void Promise.resolve(p.openAndroid({ option: "app_notification" })).catch(() => {});
        return true;
      }
      if (typeof p?.openSettings === "function") {
        void Promise.resolve(p.openSettings()).catch(() => {});
        return true;
      }
    } catch {
      /* essai suivant */
    }
  }
  return false;
}

let listenersReady = false;

/**
 * Enregistre le téléphone pour recevoir les notifications push.
 * Ne fait rien dans le navigateur : uniquement dans l'application Android
 * (le pont Capacitor est injecté dans la page chargée par l'appli).
 */
export async function registerPushNotifications(userId: string): Promise<PushState> {
  const push = pushPlugin();
  if (!push) return "unsupported";

  try {
    const state = await requestPushPermission();
    if (state !== "granted") return state;

    if (!listenersReady) {
      listenersReady = true;

      await push.addListener("registration", async (token: PushToken) => {
        if (!token?.value) return;
        // La table push_tokens est récente : les types automatiques ne la
        // connaissent pas encore, d'où le contournement de typage.
        await (supabase.from("push_tokens" as never) as any).upsert(
          {
            user_id: userId,
            token: token.value,
            platform: devicePlatform(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "token" },
        );
      });

      // Un jeton périmé est remplacé automatiquement par Google.
      await push.addListener("registrationError", (err: unknown) => {
        console.error("Push registration error", err);
      });

      // Tap sur une notification : ouvre la bonne page dans l'appli.
      await push.addListener("pushNotificationActionPerformed", (action: any) => {
        const path = action?.notification?.data?.path;
        if (typeof path === "string" && path.startsWith("/")) {
          window.location.href = path;
        }
      });
    }

    await push.register();
    return "granted";
  } catch (e) {
    console.error("Push setup failed", e);
    return "denied";
  }
}
