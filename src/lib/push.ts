import { supabase } from "@/integrations/supabase/client";

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
  const cap = capacitor();
  if (!cap?.isNativePlatform?.()) return null;
  return cap.Plugins?.PushNotifications ?? null;
}

function appPlugin(): any {
  const cap = capacitor();
  return cap?.Plugins?.App ?? null;
}

/**
 * Déclare le canal de notification. Sans canal, Android n'affiche rien dans
 * les réglages et l'interrupteur reste grisé.
 */
async function ensureChannel(push: any) {
  try {
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
    const res = await push.requestPermissions();
    return res?.receive === "granted" ? "granted" : "denied";
  } catch {
    return "denied";
  }
}

/** Ouvre la page de réglages de l'application sur le téléphone. */
export function openNotificationSettings(): boolean {
  const app = appPlugin();
  if (typeof app?.openSettings !== "function") return false;
  void app.openSettings();
  return true;
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
            platform: "android",
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
