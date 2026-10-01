import { supabase } from "@/integrations/supabase/client";

type PushToken = { value: string };

/**
 * Enregistre le téléphone pour recevoir les notifications push.
 * Ne fait rien dans le navigateur : uniquement dans l'application Android
 * (le pont Capacitor est injecté dans la page chargée par l'appli).
 */
export async function registerPushNotifications(userId: string) {
  try {
    const cap = (window as unknown as { Capacitor?: any }).Capacitor;
    if (!cap?.isNativePlatform?.()) return;
    const push = cap.Plugins?.PushNotifications;
    if (!push) return;

    const perm = await push.requestPermissions();
    if (perm?.receive !== "granted") return;

    await push.addListener("registration", async (token: PushToken) => {
      if (!token?.value) return;
      await supabase.from("push_tokens").upsert(
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

    await push.register();
  } catch (e) {
    console.error("Push setup failed", e);
  }
}
