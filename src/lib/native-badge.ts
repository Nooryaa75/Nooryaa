import { supabase } from "@/integrations/supabase/client";
import { nativePlugin } from "@/lib/native-plugin";

/** Clear the iOS icon only after both notifications and messages are read. */
export async function clearReadNativeBadge() {
  const cap = (window as unknown as { Capacitor?: any }).Capacitor;
  if (!cap?.isNativePlatform?.() || (cap.getPlatform?.() ?? cap.platform) !== "ios") return;
  const push = nativePlugin("PushNotifications");
  if (!push?.removeAllDeliveredNotifications) return;

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return;
  const userId = auth.user.id;
  const [notifications, messages] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true })
      .eq("user_id", userId).is("read_at", null),
    supabase.from("messages").select("id", { count: "exact", head: true })
      .eq("receiver", userId).is("read_at", null).is("deleted_at", null),
  ]);
  // Unknown counts or failed reads must never erase an unread badge.
  if (notifications.error || messages.error || notifications.count !== 0 || messages.count !== 0) return;
  // Capacitor PushNotifications v6 also sets applicationIconBadgeNumber to 0.
  await push.removeAllDeliveredNotifications();
}