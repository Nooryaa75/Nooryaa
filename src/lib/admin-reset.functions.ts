import { createServerFn } from "@tanstack/react-start";

export type SectionKey =
  | "messages"
  | "likes"
  | "passes"
  | "notifications"
  | "email_notifications"
  | "reports"
  | "blocks"
  | "moderation"
  | "support_tickets"
  | "ticket_replies"
  | "contacts"
  | "subscriptions"
  | "credit_events"
  | "saved_searches"
  | "audit"
  | "ads"
  | "test_profiles";

type SectionDef = {
  key: SectionKey;
  label: string;
  desc: string;
  table: string;
  timeCol: string;
  extraTables?: string[];
  danger?: boolean;
};

export const SECTIONS: SectionDef[] = [
  { key: "messages", label: "Discussions", desc: "Messages échangés entre membres (texte, photo, vocal).", table: "messages", timeCol: "created_at" },
  { key: "likes", label: "Likes", desc: "Likes envoyés entre membres.", table: "likes", timeCol: "created_at" },
  { key: "passes", label: "Profils passés", desc: "Profils écartés depuis l'accueil.", table: "profile_passes", timeCol: "created_at" },
  { key: "notifications", label: "Notifications in-app", desc: "Historique de la cloche des membres.", table: "notifications", timeCol: "created_at" },
  { key: "email_notifications", label: "Journal des emails", desc: "Emails de notification envoyés.", table: "email_notifications", timeCol: "created_at" },
  { key: "reports", label: "Signalements", desc: "Signalements déposés par les membres.", table: "reports", timeCol: "created_at" },
  { key: "blocks", label: "Blocages", desc: "Membres bloqués entre eux.", table: "blocks", timeCol: "created_at" },
  { key: "moderation", label: "Modération", desc: "Incidents détectés (texte, vocal, photo).", table: "moderation_events", timeCol: "created_at" },
  { key: "support_tickets", label: "Tickets support", desc: "Tickets ouverts par les membres.", table: "support_tickets", timeCol: "created_at", extraTables: ["ticket_replies"] },
  { key: "ticket_replies", label: "Réponses support", desc: "Réponses échangées sur les tickets.", table: "ticket_replies", timeCol: "created_at" },
  { key: "contacts", label: "Messages de contact", desc: "Formulaire de contact du site public.", table: "contact_messages", timeCol: "created_at" },
  { key: "subscriptions", label: "Abonnements", desc: "Abonnements souscrits par les membres.", table: "subscriptions", timeCol: "created_at" },
  { key: "credit_events", label: "Consommation", desc: "Likes, super likes et boosts consommés.", table: "credit_events", timeCol: "created_at" },
  { key: "saved_searches", label: "Recherches sauvegardées", desc: "Recherches enregistrées par les membres.", table: "saved_searches", timeCol: "created_at" },
  { key: "audit", label: "Journal admin", desc: "Historique des actions d'administration.", table: "admin_actions", timeCol: "created_at" },
  { key: "ads", label: "Publicités", desc: "Annonces partenaires du carrousel.", table: "ads", timeCol: "created_at" },
  { key: "test_profiles", label: "Profils de test", desc: "Comptes @nooryaa.test créés pour les essais.", table: "profiles", timeCol: "created_at", danger: true },
];

const ALL_ROWS = "1970-01-01T00:00:00Z";
const EXPORT_LIMIT = 5000;

function def(key: SectionKey): SectionDef {
  const found = SECTIONS.find((s) => s.key === key);
  if (!found) throw new Error("Rubrique inconnue");
  return found;
}

async function admin() {
  const { requireAdminOrThrow } = await import("./admin-session.server");
  const identity = await requireAdminOrThrow();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return { identity, supabaseAdmin };
}

function scoped(query: any, s: SectionDef) {
  return s.key === "test_profiles" ? query.like("email", "%@nooryaa.test") : query;
}

export const adminSectionSummary = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await admin();
  const counts = await Promise.all(
    SECTIONS.map(async (s) => {
      const { count } = await scoped(supabaseAdmin.from(s.table as any).select("*", { count: "exact", head: true }), s);
      return [s.key, count ?? 0] as const;
    }),
  );
  const { data: archives } = await supabaseAdmin
    .from("section_archives")
    .select("section, created_at, row_count")
    .order("created_at", { ascending: false })
    .limit(200);
  const lastArchive: Record<string, { created_at: string; row_count: number }> = {};
  for (const a of archives ?? []) if (!lastArchive[a.section]) lastArchive[a.section] = { created_at: a.created_at, row_count: a.row_count };
  return {
    counts: Object.fromEntries(counts) as Record<SectionKey, number>,
    lastArchive,
  };
});

export const adminSectionRows = createServerFn({ method: "GET" })
  .inputValidator((data: { section: SectionKey; limit?: number }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await admin();
    const s = def(data.section);
    const { data: rows, error } = await scoped(
      supabaseAdmin.from(s.table as any).select("*").order(s.timeCol, { ascending: false }).limit(Math.min(data.limit ?? 500, EXPORT_LIMIT)),
      s,
    );
    if (error) throw new Error(error.message);
    return { section: s.key, label: s.label, rows: (rows ?? []) as any[] };
  });

export const adminSectionArchive = createServerFn({ method: "POST" })
  .inputValidator((data: { section: SectionKey; purge?: boolean; note?: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin, identity } = await admin();
    const s = def(data.section);
    const { data: rows, error } = await scoped(
      supabaseAdmin.from(s.table as any).select("*").order(s.timeCol, { ascending: false }).limit(EXPORT_LIMIT),
      s,
    );
    if (error) throw new Error(error.message);
    const payload = (rows ?? []) as any[];
    const { error: insErr } = await supabaseAdmin.from("section_archives").insert({
      section: s.key,
      label: s.label,
      row_count: payload.length,
      payload: payload as any,
      note: data.note ?? null,
      created_by: identity.email ?? identity.via,
    });
    if (insErr) throw new Error(insErr.message);

    let purged = 0;
    if (data.purge) {
      purged = await purgeSection(supabaseAdmin, s);
    }
    return { ok: true as const, archived: payload.length, purged };
  });

async function purgeSection(supabaseAdmin: any, s: SectionDef) {
  if (s.key === "test_profiles") {
    const { data: adminRoles } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
    const protectedIds = new Set((adminRoles ?? []).map((r: any) => r.user_id));
    const { data: rows } = await supabaseAdmin.from("profiles").select("id").like("email", "%@nooryaa.test");
    let n = 0;
    for (const row of rows ?? []) {
      if (protectedIds.has(row.id)) continue;
      const { error } = await supabaseAdmin.auth.admin.deleteUser(row.id);
      if (!error) n++;
    }
    return n;
  }
  for (const t of s.extraTables ?? []) {
    const { error } = await supabaseAdmin.from(t).delete().gte("created_at", ALL_ROWS);
    if (error) throw new Error(`${t}: ${error.message}`);
  }
  const { count } = await supabaseAdmin.from(s.table).select("*", { count: "exact", head: true });
  const { error } = await supabaseAdmin.from(s.table).delete().gte(s.timeCol, ALL_ROWS);
  if (error) throw new Error(`${s.table}: ${error.message}`);
  return count ?? 0;
}

export const adminSectionReset = createServerFn({ method: "POST" })
  .inputValidator((data: { section: SectionKey; confirm: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await admin();
    if (data.confirm.trim().toUpperCase() !== "EFFACER") throw new Error("Confirmation invalide : saisissez EFFACER.");
    const s = def(data.section);
    const purged = await purgeSection(supabaseAdmin, s);
    if (s.key !== "audit") {
      await supabaseAdmin.from("admin_actions").insert({ action: `reset:${s.key}`, details: { purged, at: new Date().toISOString() } });
    }
    return { ok: true as const, purged };
  });

export const adminListArchives = createServerFn({ method: "GET" })
  .inputValidator((data: { section?: SectionKey } | undefined) => data ?? {})
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await admin();
    let q = supabaseAdmin.from("section_archives").select("id, section, label, row_count, note, created_by, created_at");
    if (data.section) q = q.eq("section", data.section);
    const { data: rows } = await q.order("created_at", { ascending: false }).limit(100);
    return rows ?? [];
  });

export const adminGetArchive = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await admin();
    const { data: row, error } = await supabaseAdmin.from("section_archives").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminDeleteArchive = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await admin();
    const { error } = await supabaseAdmin.from("section_archives").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
