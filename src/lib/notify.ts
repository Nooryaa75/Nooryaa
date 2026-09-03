import { supabase } from "@/integrations/supabase/client";
import { sendNotificationEmail, type NotifyKind } from "./notify.functions";

/** Envoi d'email en arrière-plan : ne bloque jamais l'action de l'utilisateur. */
export function notifyByEmail(kind: NotifyKind, recipientId: string, preview?: string | null) {
  if (!recipientId) return;
  void sendNotificationEmail({ data: { kind, recipientId, preview: preview ?? null } }).catch(() => {});
}

/**
 * Après un like : envoie un email « match » si le like est réciproque,
 * sinon un email « nouveau like ».
 */
export async function notifyLike(userId: string, targetId: string) {
  if (!userId || !targetId || userId === targetId) return;
  try {
    const { data } = await supabase
      .from("likes")
      .select("id")
      .eq("from_user", targetId)
      .eq("to_user", userId)
      .maybeSingle();
    notifyByEmail(data ? "match" : "like", targetId);
  } catch {
    notifyByEmail("like", targetId);
  }
}
