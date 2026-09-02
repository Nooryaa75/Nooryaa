import { createServerFn } from "@tanstack/react-start";

type Range = { from?: string; to?: string };

function bounds(data: Range) {
  const to = data.to ? new Date(data.to) : new Date();
  const from = data.from ? new Date(data.from) : new Date(Date.now() - 30 * 86400000);
  return { fromISO: from.toISOString(), toISO: to.toISOString() };
}

function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function ageFromBirthdate(b?: string | null) {
  if (!b) return null;
  const d = new Date(b);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 86400000));
}

function tally<T extends string | number>(items: (T | null | undefined)[]) {
  const map = new Map<string, number>();
  for (const it of items) {
    const key = it === null || it === undefined || it === "" ? "Non renseigné" : String(it);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

// ---------------- Tableau de bord ----------------

export const adminOverview = createServerFn({ method: "GET" })
  .inputValidator((data: Range) => data ?? {})
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { fromISO, toISO } = bounds(data);
    const online = new Date(Date.now() - 5 * 60000).toISOString();

    const [{ data: profiles }, { data: likes }, { data: messages }, { data: subs }, { data: reports }] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select(
            "id, pseudo, email, gender, birthdate, city, country, country_origin, marital_status, religious_practice, education_level, objective, has_children, wants_children, smoker, body_type, photo_verified, onboarded, status, created_at, last_active, last_seen",
          )
          .limit(20000),
        supabaseAdmin.from("likes").select("from_user, to_user, created_at").gte("created_at", fromISO).lte("created_at", toISO),
        supabaseAdmin.from("messages").select("sender, created_at").gte("created_at", fromISO).lte("created_at", toISO),
        supabaseAdmin.from("subscriptions").select("user_id, plan_code, amount_ttc, status, created_at"),
        supabaseAdmin.from("reports").select("id, status, created_at"),
      ]);

    const all = profiles ?? [];
    const inRange = all.filter((p) => p.created_at >= fromISO && p.created_at <= toISO);

    const signupsByDay = new Map<string, { total: number; homme: number; femme: number }>();
    for (const p of inRange) {
      const k = dayKey(p.created_at);
      const cur = signupsByDay.get(k) ?? { total: 0, homme: 0, femme: 0 };
      cur.total += 1;
      if (p.gender === "homme") cur.homme += 1;
      if (p.gender === "femme") cur.femme += 1;
      signupsByDay.set(k, cur);
    }
    const series = [...signupsByDay.entries()]
      .map(([day, v]) => ({ day, ...v }))
      .sort((a, b) => a.day.localeCompare(b.day));
    let cumul = all.filter((p) => p.created_at < fromISO).length;
    const cumulative = series.map((s) => {
      cumul += s.total;
      return { day: s.day, total: cumul };
    });

    const ages = all.map((p) => ageFromBirthdate(p.birthdate)).filter((a): a is number => a !== null);
    const ageBuckets = ["18-24", "25-29", "30-34", "35-39", "40-49", "50+"].map((label) => ({ label, homme: 0, femme: 0 }));
    const bucketOf = (a: number) => (a < 25 ? 0 : a < 30 ? 1 : a < 35 ? 2 : a < 40 ? 3 : a < 50 ? 4 : 5);
    for (const p of all) {
      const a = ageFromBirthdate(p.birthdate);
      if (a === null || a < 18) continue;
      const b = ageBuckets[bucketOf(a)];
      if (p.gender === "femme") b.femme += 1;
      else b.homme += 1;
    }

    const activeSubs = (subs ?? []).filter((s) => s.status === "active");

    return {
      counters: {
        total: all.length,
        onboarded: all.filter((p) => p.onboarded).length,
        active: all.filter((p) => p.status === "active").length,
        suspended: all.filter((p) => p.status !== "active").length,
        onlineNow: all.filter((p) => (p.last_seen ?? p.last_active) >= online).length,
        newInRange: inRange.length,
        verified: all.filter((p) => p.photo_verified).length,
        payingNow: activeSubs.filter((s) => s.plan_code !== "gratuit").length,
        openReports: (reports ?? []).filter((r) => r.status === "open" || r.status === "pending").length,
      },
      engagement: {
        likes: (likes ?? []).length,
        messages: (messages ?? []).length,
        activeSenders: new Set((messages ?? []).map((m) => m.sender)).size,
        avgAge: ages.length ? Math.round((ages.reduce((s, a) => s + a, 0) / ages.length) * 10) / 10 : 0,
      },
      series,
      cumulative,
      gender: tally(all.map((p) => p.gender)),
      ageBuckets,
      cities: tally(all.map((p) => p.city)).slice(0, 12),
      countries: tally(all.map((p) => p.country)).slice(0, 12),
      origins: tally(all.map((p) => p.country_origin)).slice(0, 12),
      criteria: {
        marital_status: tally(all.map((p) => p.marital_status)),
        religious_practice: tally(all.map((p) => p.religious_practice)),
        education_level: tally(all.map((p) => p.education_level)),
        objective: tally(all.map((p) => p.objective)).slice(0, 10),
        body_type: tally(all.map((p) => p.body_type)),
        has_children: tally(all.map((p) => (p.has_children === null ? null : p.has_children ? "Oui" : "Non"))),
        wants_children: tally(all.map((p) => (p.wants_children === null ? null : p.wants_children ? "Oui" : "Non"))),
        smoker: tally(all.map((p) => (p.smoker === null ? null : p.smoker ? "Oui" : "Non"))),
      },
    };
  });

export const adminOnlineNow = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdminOrThrow } = await import("./admin-session.server");
  await requireAdminOrThrow();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date(Date.now() - 5 * 60000).toISOString();
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, pseudo, gender, city, last_seen")
    .gte("last_seen", since)
    .order("last_seen", { ascending: false })
    .limit(100);
  return { count: (data ?? []).length, users: data ?? [] };
});

// ---------------- Finance ----------------

export const adminFinance = createServerFn({ method: "GET" })
  .inputValidator((data: Range & { granularity?: "day" | "week" | "month" }) => data ?? {})
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { fromISO, toISO } = bounds(data);
    const gran = data.granularity ?? "day";

    const [{ data: subs }, { data: plans }, { data: profiles }] = await Promise.all([
      supabaseAdmin.from("subscriptions").select("*").gte("created_at", fromISO).lte("created_at", toISO),
      supabaseAdmin.from("plans").select("*").order("sort_order"),
      supabaseAdmin.from("profiles").select("id, gender, city, created_at"),
    ]);

    const genderOf = new Map((profiles ?? []).map((p) => [p.id, p.gender]));
    const rows = subs ?? [];

    const keyFor = (iso: string) => {
      const d = new Date(iso);
      if (gran === "month") return iso.slice(0, 7);
      if (gran === "week") {
        const day = (d.getUTCDay() + 6) % 7;
        const monday = new Date(d.getTime() - day * 86400000);
        return monday.toISOString().slice(0, 10);
      }
      return iso.slice(0, 10);
    };

    const byPeriod = new Map<string, { ttc: number; ht: number; tva: number; homme: number; femme: number; count: number }>();
    const byPlan = new Map<string, { ttc: number; count: number }>();
    let ttc = 0;
    let ht = 0;
    for (const s of rows) {
      const amount = Number(s.amount_ttc ?? 0);
      const vat = Number(s.vat_rate ?? 20);
      const netto = amount / (1 + vat / 100);
      ttc += amount;
      ht += netto;
      const k = keyFor(s.created_at);
      const cur = byPeriod.get(k) ?? { ttc: 0, ht: 0, tva: 0, homme: 0, femme: 0, count: 0 };
      cur.ttc += amount;
      cur.ht += netto;
      cur.tva += amount - netto;
      cur.count += 1;
      const g = genderOf.get(s.user_id);
      if (g === "femme") cur.femme += amount;
      else cur.homme += amount;
      byPeriod.set(k, cur);
      const p = byPlan.get(s.plan_code) ?? { ttc: 0, count: 0 };
      p.ttc += amount;
      p.count += 1;
      byPlan.set(s.plan_code, p);
    }

    const { data: activeSubs } = await supabaseAdmin.from("subscriptions").select("user_id, plan_code, status, amount_ttc").eq("status", "active");
    const paying = (activeSubs ?? []).filter((s) => s.plan_code !== "gratuit");
    const totalMembers = (profiles ?? []).length;

    return {
      totals: {
        ttc: Math.round(ttc * 100) / 100,
        ht: Math.round(ht * 100) / 100,
        tva: Math.round((ttc - ht) * 100) / 100,
        transactions: rows.length,
        payingMembers: new Set(paying.map((s) => s.user_id)).size,
        arpu: totalMembers ? Math.round((ttc / totalMembers) * 100) / 100 : 0,
        conversion: totalMembers ? Math.round((new Set(paying.map((s) => s.user_id)).size / totalMembers) * 1000) / 10 : 0,
        cancelled: rows.filter((s) => s.status === "cancelled").length,
      },
      series: [...byPeriod.entries()]
        .map(([period, v]) => ({
          period,
          ttc: Math.round(v.ttc * 100) / 100,
          ht: Math.round(v.ht * 100) / 100,
          tva: Math.round(v.tva * 100) / 100,
          homme: Math.round(v.homme * 100) / 100,
          femme: Math.round(v.femme * 100) / 100,
          count: v.count,
        }))
        .sort((a, b) => a.period.localeCompare(b.period)),
      byPlan: (plans ?? []).map((p) => ({
        code: p.code,
        name: p.name,
        ttc: Math.round((byPlan.get(p.code)?.ttc ?? 0) * 100) / 100,
        count: byPlan.get(p.code)?.count ?? 0,
        activeSubscribers: (activeSubs ?? []).filter((s) => s.plan_code === p.code).length,
      })),
      transactions: rows
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 200)
        .map((s) => ({ ...s, gender: genderOf.get(s.user_id) ?? null })),
    };
  });

// ---------------- Analytics ----------------

export const adminAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdminOrThrow } = await import("./admin-session.server");
  await requireAdminOrThrow();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [{ data: profiles }, { data: likes }, { data: messages }, { data: subs }] = await Promise.all([
    supabaseAdmin.from("profiles").select("id, created_at, onboarded, photo_verified, last_seen, last_active").limit(20000),
    supabaseAdmin.from("likes").select("from_user"),
    supabaseAdmin.from("messages").select("sender, created_at").limit(20000),
    supabaseAdmin.from("subscriptions").select("user_id, plan_code, status"),
  ]);

  const all = profiles ?? [];
  const likers = new Set((likes ?? []).map((l) => l.from_user));
  const senders = new Set((messages ?? []).map((m) => m.sender));
  const payers = new Set((subs ?? []).filter((s) => s.plan_code !== "gratuit").map((s) => s.user_id));

  const funnel = [
    { step: "Inscription", value: all.length },
    { step: "Profil complété", value: all.filter((p) => p.onboarded).length },
    { step: "Photo vérifiée", value: all.filter((p) => p.photo_verified).length },
    { step: "1er like", value: all.filter((p) => likers.has(p.id)).length },
    { step: "1er message", value: all.filter((p) => senders.has(p.id)).length },
    { step: "Abonnement payant", value: all.filter((p) => payers.has(p.id)).length },
  ];

  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: `${String(h).padStart(2, "0")}h`, value: 0 }));
  for (const m of messages ?? []) hours[new Date(m.created_at).getUTCHours()].value += 1;

  const retention = [1, 7, 30].map((d) => {
    const cohort = all.filter((p) => Date.now() - new Date(p.created_at).getTime() >= d * 86400000);
    const retained = cohort.filter(
      (p) => new Date(p.last_seen ?? p.last_active).getTime() - new Date(p.created_at).getTime() >= d * 86400000,
    );
    return { label: `J${d}`, value: cohort.length ? Math.round((retained.length / cohort.length) * 1000) / 10 : 0 };
  });

  return { funnel, hours, retention };
});

// ---------------- Configurateur (formules) ----------------

export const adminListPlans = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdminOrThrow } = await import("./admin-session.server");
  await requireAdminOrThrow();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("plans").select("*").order("sort_order");
  return data ?? [];
});

export type PlanInput = {
  id?: string;
  code: string;
  name: string;
  tagline?: string | null;
  duration_days: number;
  price_ttc: number;
  vat_rate: number;
  likes_per_day: number;
  super_likes: number;
  boosts: number;
  features: string[];
  highlight: boolean;
  active: boolean;
  sort_order: number;
  access?: Record<string, boolean>;
};

/** Active ou désactive une formule sans passer par l'éditeur complet. */
export const adminTogglePlan = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; active: boolean }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    const who = await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("plans").update({ active: data.active }).eq("id", data.id);
    if (error) throw error;
    await supabaseAdmin.from("admin_actions").insert({
      action: data.active ? "plan_enable" : "plan_disable",
      details: { id: data.id, by: who.email ?? who.via },
    });
    return { ok: true };
  });


export const adminSavePlan = createServerFn({ method: "POST" })
  .inputValidator((data: PlanInput) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    const who = await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = { ...data };
    delete (payload as any).id;
    const query = data.id
      ? supabaseAdmin.from("plans").update(payload).eq("id", data.id)
      : supabaseAdmin.from("plans").insert(payload);
    const { error } = await query;
    if (error) throw error;
    await supabaseAdmin.from("admin_actions").insert({
      action: data.id ? "plan_update" : "plan_create",
      details: { code: data.code, by: who.email ?? who.via },
    });
    return { ok: true };
  });

export const adminDeletePlan = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("plans").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------------- Support / tickets ----------------

export const adminListTickets = createServerFn({ method: "GET" })
  .inputValidator((data: { status?: string; q?: string }) => data ?? {})
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(300);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    const { data: rows } = await q;
    const ids = [...new Set((rows ?? []).map((r) => r.user_id))];
    const { data: profs } = await supabaseAdmin.from("profiles").select("id, pseudo, email, status").in("id", ids);
    const byId = new Map((profs ?? []).map((p) => [p.id, p]));
    let list = (rows ?? []).map((r) => ({ ...r, profile: byId.get(r.user_id) ?? null }));
    if (data.q?.trim()) {
      const t = data.q.trim().toLowerCase();
      list = list.filter(
        (r) =>
          (r.profile?.pseudo ?? "").toLowerCase().includes(t) ||
          (r.profile?.email ?? "").toLowerCase().includes(t) ||
          r.message.toLowerCase().includes(t),
      );
    }
    return list;
  });

export const adminTicketThread = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ticket } = await supabaseAdmin.from("support_tickets").select("*").eq("id", data.id).maybeSingle();
    if (!ticket) throw new Error("Ticket introuvable");
    const [{ data: replies }, { data: profile }] = await Promise.all([
      supabaseAdmin.from("ticket_replies").select("*").eq("ticket_id", data.id).order("created_at"),
      supabaseAdmin.from("profiles").select("id, pseudo, email, status, phone, city").eq("id", ticket.user_id).maybeSingle(),
    ]);
    return { ticket, replies: replies ?? [], profile };
  });

export const adminReplyTicket = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; content: string; internal?: boolean; status?: string }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    const who = await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("ticket_replies").insert({
      ticket_id: data.id,
      author: who.email ?? "admin",
      author_id: who.adminId,
      content: data.content,
      internal: data.internal ?? false,
    });
    if (error) throw error;
    await supabaseAdmin
      .from("support_tickets")
      .update({ last_reply_at: new Date().toISOString(), status: data.status ?? "in_progress" })
      .eq("id", data.id);
    return { ok: true };
  });

export const adminUpdateTicket = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; status?: string; priority?: string; assigned_to?: string }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {};
    if (data.status) patch.status = data.status;
    if (data.priority) patch.priority = data.priority;
    if (data.assigned_to !== undefined) patch.assigned_to = data.assigned_to;
    const { error } = await supabaseAdmin.from("support_tickets").update(patch as never).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ---------------- Consommation / crédits ----------------

export const adminListCredits = createServerFn({ method: "GET" })
  .inputValidator((data: { q?: string }) => data ?? {})
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let pq = supabaseAdmin.from("profiles").select("id, pseudo, email, gender, status").limit(200);
    if (data.q?.trim()) {
      const term = `%${data.q.trim()}%`;
      pq = pq.or(`pseudo.ilike.${term},email.ilike.${term}`);
    }
    const { data: profs } = await pq;
    const ids = (profs ?? []).map((p) => p.id);
    const [{ data: credits }, { data: subs }, { data: likes }] = await Promise.all([
      supabaseAdmin.from("user_credits").select("*").in("user_id", ids),
      supabaseAdmin.from("subscriptions").select("user_id, plan_code, status").in("user_id", ids).eq("status", "active"),
      supabaseAdmin.from("likes").select("from_user").in("from_user", ids),
    ]);
    const cr = new Map((credits ?? []).map((c) => [c.user_id, c]));
    const sb = new Map((subs ?? []).map((s) => [s.user_id, s.plan_code]));
    const likeCount = new Map<string, number>();
    for (const l of likes ?? []) likeCount.set(l.from_user, (likeCount.get(l.from_user) ?? 0) + 1);
    return (profs ?? []).map((p) => ({
      ...p,
      plan: sb.get(p.id) ?? "gratuit",
      credits: cr.get(p.id) ?? null,
      likesSent: likeCount.get(p.id) ?? 0,
    }));
  });

export const adminAdjustCredits = createServerFn({ method: "POST" })
  .inputValidator((data: { userId: string; kind: "likes" | "super_likes" | "boosts"; amount: number; reason: string }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    const who = await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin.from("user_credits").select("*").eq("user_id", data.userId).maybeSingle();
    const column = data.kind === "likes" ? "likes_balance" : data.kind;
    const current = existing ? Number((existing as any)[column] ?? 0) : 0;
    const next = Math.max(0, current + data.amount);
    if (existing) {
      await supabaseAdmin.from("user_credits").update({ [column]: next, updated_at: new Date().toISOString() } as never).eq("user_id", data.userId);
    } else {
      await supabaseAdmin.from("user_credits").insert({ user_id: data.userId, [column]: next } as never);
    }
    await supabaseAdmin.from("credit_events").insert({
      user_id: data.userId,
      kind: data.kind,
      amount: data.amount,
      reason: data.reason,
      created_by: who.email ?? who.via,
    });
    return { ok: true, balance: next };
  });

export const adminCreditHistory = createServerFn({ method: "GET" })
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("credit_events")
      .select("*")
      .eq("user_id", data.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    return rows ?? [];
  });

// ---------------- Journal d'audit ----------------

export const adminAuditLog = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdminOrThrow } = await import("./admin-session.server");
  await requireAdminOrThrow();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("admin_actions").select("*").order("created_at", { ascending: false }).limit(200);
  return data ?? [];
});

// ---------------- Réseaux sociaux ----------------

export type SocialLinkRow = { id: string; network: string; label: string; url: string; active: boolean; sort_order: number };

export const adminListSocialLinks = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdminOrThrow } = await import("./admin-session.server");
  await requireAdminOrThrow();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await (supabaseAdmin.from("social_links" as any) as any)
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []) as SocialLinkRow[];
});

export const adminSaveSocialLink = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; url?: string; active?: boolean }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    const who = await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof data.url === "string") patch.url = data.url;
    if (typeof data.active === "boolean") patch.active = data.active;
    const { error } = await (supabaseAdmin.from("social_links" as any) as any).update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    await (supabaseAdmin.from("admin_actions" as any) as any).insert({
      action: "social_link_update",
      details: { id: data.id, ...patch, by: who.email ?? who.via },
    });
    return { ok: true };
  });
