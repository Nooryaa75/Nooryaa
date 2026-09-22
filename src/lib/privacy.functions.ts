import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Types de consentement enregistrés (preuve RGPD). */
export type ConsentKind = "terms" | "privacy" | "cookies" | "marketing";

const KINDS: ConsentKind[] = ["terms", "privacy", "cookies", "marketing"];

function clean(value: unknown, max = 40) {
  return typeof value === "string" ? value.trim().slice(0, max) : null;
}

/** Enregistre un consentement daté pour le membre connecté. */
export const recordConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { kind: ConsentKind; accepted?: boolean; locale?: string; source?: string }) => ({
    kind: (KINDS.includes(data?.kind) ? data.kind : "privacy") as ConsentKind,
    accepted: data?.accepted !== false,
    locale: clean(data?.locale, 5),
    source: clean(data?.source, 40),
  }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("user_consents").insert({
      user_id: context.userId,
      kind: data.kind,
      accepted: data.accepted,
      locale: data.locale,
      source: data.source,
    });
    if (error) throw error;
    return { ok: true };
  });

/** Historique des consentements du membre connecté. */
export const fetchMyConsents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_consents")
      .select("kind, accepted, locale, source, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  });

/**
 * Export complet des données personnelles (droit d'accès et de portabilité, art. 15 et 20 RGPD).
 * Renvoie un objet JSON prêt à être téléchargé par le membre.
 */
export const exportMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    const sb = context.supabase;

    const [
      profile,
      photos,
      likesGiven,
      likesReceived,
      messagesSent,
      messagesReceived,
      notifications,
      subscriptions,
      credits,
      savedSearches,
      blocks,
      reports,
      tickets,
      consents,
      emails,
    ] = await Promise.all([
      sb.from("profiles").select("*").eq("id", uid).maybeSingle(),
      sb.from("photos").select("url, position, blurred, created_at").eq("user_id", uid),
      sb.from("likes").select("to_user, created_at").eq("from_user", uid),
      sb.from("likes").select("from_user, created_at").eq("to_user", uid),
      sb.from("messages").select("receiver, content, created_at, read_at").eq("sender", uid).order("created_at"),
      sb.from("messages").select("sender, content, created_at, read_at").eq("receiver", uid).order("created_at"),
      sb.from("notifications").select("kind, title, body, created_at, read_at").eq("user_id", uid),
      sb.from("subscriptions").select("plan_code, status, amount_ttc, started_at, ends_at, cancelled_at").eq("user_id", uid),
      sb.from("user_credits").select("*").eq("user_id", uid).maybeSingle(),
      sb.from("saved_searches").select("name, filters, created_at").eq("user_id", uid),
      sb.from("blocks").select("blocked, created_at").eq("blocker", uid),
      sb.from("reports").select("reported, reason, status, created_at").eq("reporter", uid),
      sb.from("support_tickets").select("category, message, status, created_at").eq("user_id", uid),
      sb.from("user_consents").select("kind, accepted, locale, source, created_at").eq("user_id", uid),
      sb.from("email_notifications").select("kind, status, created_at").eq("user_id", uid),
    ]);

    return {
      export_genere_le: new Date().toISOString(),
      service: "Nooryaa",
      contact_donnees: "contact@nooryaa.com",
      profil: profile.data ?? null,
      photos: photos.data ?? [],
      likes_envoyes: likesGiven.data ?? [],
      likes_recus: likesReceived.data ?? [],
      messages_envoyes: messagesSent.data ?? [],
      messages_recus: messagesReceived.data ?? [],
      notifications: notifications.data ?? [],
      abonnements: subscriptions.data ?? [],
      credits: credits.data ?? null,
      recherches_sauvegardees: savedSearches.data ?? [],
      blocages: blocks.data ?? [],
      signalements: reports.data ?? [],
      demandes_support: tickets.data ?? [],
      consentements: consents.data ?? [],
      emails_envoyes: emails.data ?? [],
    };
  });
