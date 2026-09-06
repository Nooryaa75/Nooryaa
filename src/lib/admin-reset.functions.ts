import { createServerFn } from "@tanstack/react-start";

export type ResetScope =
  | "messages"
  | "likes"
  | "notifications"
  | "reports"
  | "support"
  | "subscriptions"
  | "audit"
  | "test_profiles"
  | "members";

export const RESET_SCOPES: { key: ResetScope; label: string; desc: string; danger?: boolean }[] = [
  { key: "messages", label: "Discussions", desc: "Tous les messages échangés (textes, photos, vocaux)." },
  { key: "likes", label: "Likes & passes", desc: "Likes, profils passés et conversations masquées." },
  { key: "notifications", label: "Notifications", desc: "Notifications in-app et journal des emails." },
  { key: "reports", label: "Signalements & blocages", desc: "Signalements, blocages et incidents de modération." },
  { key: "support", label: "Support & contact", desc: "Tickets, réponses et messages du formulaire de contact." },
  { key: "subscriptions", label: "Abonnements & crédits", desc: "Abonnements, crédits et historique de consommation." },
  { key: "audit", label: "Journal admin", desc: "Historique des actions d'administration." },
  { key: "test_profiles", label: "Profils de test", desc: "Supprime les comptes @nooryaa.test.", danger: true },
  { key: "members", label: "Tous les membres", desc: "Supprime tous les comptes membres (sauf administrateurs).", danger: true },
];

const ALL_ROWS = "1970-01-01T00:00:00Z";

export const adminResetCounts = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdminOrThrow } = await import("./admin-session.server");
  await requireAdminOrThrow();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const head = (t: string) => supabaseAdmin.from(t as any).select("*", { count: "exact", head: true });
  const [messages, likes, passes, notifications, reports, blocks, moderation, tickets, contacts, subs, credits, audit, testProfiles, profiles] =
    await Promise.all([
      head("messages"), head("likes"), head("profile_passes"), head("notifications"),
      head("reports"), head("blocks"), head("moderation_events"), head("support_tickets"),
      head("contact_messages"), head("subscriptions"), head("credit_events"), head("admin_actions"),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).like("email", "%@nooryaa.test"),
      head("profiles"),
    ]);
  return {
    messages: messages.count ?? 0,
    likes: (likes.count ?? 0) + (passes.count ?? 0),
    notifications: notifications.count ?? 0,
    reports: (reports.count ?? 0) + (blocks.count ?? 0) + (moderation.count ?? 0),
    support: (tickets.count ?? 0) + (contacts.count ?? 0),
    subscriptions: (subs.count ?? 0) + (credits.count ?? 0),
    audit: audit.count ?? 0,
    test_profiles: testProfiles.count ?? 0,
    members: profiles.count ?? 0,
  } as Record<ResetScope, number>;
});

export const adminReset = createServerFn({ method: "POST" })
  .inputValidator((data: { scopes: ResetScope[]; confirm: string }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    if (data.confirm.trim().toUpperCase() !== "REINITIALISER") {
      throw new Error("Confirmation invalide : saisissez REINITIALISER.");
    }
    const scopes = new Set(data.scopes);
    if (scopes.size === 0) throw new Error("Sélectionnez au moins un élément à réinitialiser.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const wipe = async (table: string) => {
      const { error } = await supabaseAdmin.from(table as any).delete().gte("created_at", ALL_ROWS);
      if (error) throw new Error(`${table}: ${error.message}`);
    };
    const done: string[] = [];

    if (scopes.has("messages")) { await wipe("messages"); done.push("messages"); }
    if (scopes.has("likes")) {
      await wipe("likes"); await wipe("profile_passes"); await wipe("conversation_hides");
      done.push("likes");
    }
    if (scopes.has("notifications")) { await wipe("notifications"); await wipe("email_notifications"); done.push("notifications"); }
    if (scopes.has("reports")) { await wipe("reports"); await wipe("blocks"); await wipe("moderation_events"); done.push("reports"); }
    if (scopes.has("support")) { await wipe("ticket_replies"); await wipe("support_tickets"); await wipe("contact_messages"); done.push("support"); }
    if (scopes.has("subscriptions")) {
      await wipe("credit_events"); await wipe("subscriptions");
      const { error } = await supabaseAdmin.from("user_credits").delete().gte("updated_at", ALL_ROWS);
      if (error) throw new Error(`user_credits: ${error.message}`);
      done.push("subscriptions");
    }

    let deletedUsers = 0;
    if (scopes.has("members") || scopes.has("test_profiles")) {
      const { data: adminRoles } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
      const protectedIds = new Set((adminRoles ?? []).map((r) => r.user_id));
      let query = supabaseAdmin.from("profiles").select("id, email");
      if (!scopes.has("members")) query = query.like("email", "%@nooryaa.test");
      const { data: rows } = await query;
      for (const row of rows ?? []) {
        if (protectedIds.has(row.id)) continue;
        const { error } = await supabaseAdmin.auth.admin.deleteUser(row.id);
        if (!error) deletedUsers++;
      }
      done.push(scopes.has("members") ? "membres" : "profils de test");
    }

    if (scopes.has("audit")) { await wipe("admin_actions"); done.push("journal admin"); }
    else {
      await supabaseAdmin.from("admin_actions").insert({
        action: "reset",
        details: { scopes: data.scopes, deletedUsers, at: new Date().toISOString() },
      });
    }

    return { ok: true as const, done, deletedUsers };
  });
