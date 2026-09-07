import { createServerFn } from "@tanstack/react-start";

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const { createHash, timingSafeEqual } = await import("node:crypto");
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) throw new Error("ADMIN_PASSWORD non configuré");
    const a = createHash("sha256").update(data.password, "utf8").digest();
    const b = createHash("sha256").update(expected, "utf8").digest();
    if (!timingSafeEqual(a, b)) return { ok: false as const };
    const { getAdminSession } = await import("./admin-session.server");
    const session = await getAdminSession();
    await session.update({ authed: true, loggedAt: Date.now() });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("admin_actions").insert({ action: "login", details: { at: new Date().toISOString() } });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { getAdminSession } = await import("./admin-session.server");
  const session = await getAdminSession();
  await session.clear();
  return { ok: true };
});

export const adminCheckAuth = createServerFn({ method: "GET" }).handler(async () => {
  const { getAdminIdentity } = await import("./admin-session.server");
  const identity = await getAdminIdentity();
  return { authed: !!identity, email: identity?.email ?? null, via: identity?.via ?? null };
});


export const adminStats = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdminOrThrow } = await import("./admin-session.server");
  await requireAdminOrThrow();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const [total, active, recent, suspended, openReports, blocks, msgs] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("last_active", since24h),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).neq("status", "active"),
    supabaseAdmin.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabaseAdmin.from("blocks").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("messages").select("id", { count: "exact", head: true }).gte("created_at", since24h),
  ]);
  return {
    total: total.count ?? 0,
    active: active.count ?? 0,
    activeToday: recent.count ?? 0,
    suspended: suspended.count ?? 0,
    openReports: openReports.count ?? 0,
    blocks: blocks.count ?? 0,
    messages24h: msgs.count ?? 0,
  };
});

export const adminListProfiles = createServerFn({ method: "GET" })
  .inputValidator((data: { q?: string; status?: string; gender?: string; page?: number }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const page = data.page ?? 0;
    const pageSize = 30;
    let q = supabaseAdmin.from("profiles").select("*", { count: "exact" });
    if (data.q && data.q.trim()) {
      const term = `%${data.q.trim()}%`;
      q = q.or(`pseudo.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
    }
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.gender === "homme" || data.gender === "femme") q = q.eq("gender", data.gender);
    const { data: rows, count } = await q.order("created_at", { ascending: false }).range(page * pageSize, page * pageSize + pageSize - 1);
    return { rows: rows ?? [], count: count ?? 0, page, pageSize };
  });

export const adminGetProfile = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [profile, photos, likesIn, likesOut, msgsIn, msgsOut, reportsIn, reportsOut, blocks] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", data.id).maybeSingle(),
      supabaseAdmin.from("photos").select("*").eq("user_id", data.id).order("position"),
      supabaseAdmin.from("likes").select("from_user, created_at").eq("to_user", data.id),
      supabaseAdmin.from("likes").select("to_user, created_at").eq("from_user", data.id),
      supabaseAdmin.from("messages").select("id, sender, content, created_at").eq("receiver", data.id).order("created_at", { ascending: false }).limit(50),
      supabaseAdmin.from("messages").select("id, receiver, content, created_at").eq("sender", data.id).order("created_at", { ascending: false }).limit(50),
      supabaseAdmin.from("reports").select("*").eq("reported", data.id).order("created_at", { ascending: false }),
      supabaseAdmin.from("reports").select("*").eq("reporter", data.id).order("created_at", { ascending: false }),
      supabaseAdmin.from("blocks").select("*").or(`blocker.eq.${data.id},blocked.eq.${data.id}`),
    ]);
    return {
      profile: profile.data,
      photos: photos.data ?? [],
      likesReceived: likesIn.data ?? [],
      likesSent: likesOut.data ?? [],
      messagesReceived: msgsIn.data ?? [],
      messagesSent: msgsOut.data ?? [],
      reportsAgainst: reportsIn.data ?? [],
      reportsBy: reportsOut.data ?? [],
      blocks: blocks.data ?? [],
    };
  });

export const adminUpdateStatus = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; status: "active" | "suspended" | "banned" }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").update({ status: data.status }).eq("id", data.id);
    if (error) throw error;
    await supabaseAdmin.from("admin_actions").insert({ action: `set_status:${data.status}`, target_user: data.id });
    return { ok: true };
  });

export const adminDeleteProfile = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // delete from auth.users cascade → profile, photos, likes, messages, blocks, reports
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw error;
    await supabaseAdmin.from("admin_actions").insert({ action: "delete_profile", target_user: data.id });
    return { ok: true };
  });

export const adminListReports = createServerFn({ method: "GET" })
  .inputValidator((data: { status?: string }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("reports").select("*").order("created_at", { ascending: false }).limit(200);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    const { data: rows } = await q;
    const ids = new Set<string>();
    (rows ?? []).forEach((r) => { ids.add(r.reporter); ids.add(r.reported); });
    const { data: profs } = await supabaseAdmin.from("profiles").select("id, pseudo, email, status").in("id", [...ids]);
    const byId = new Map((profs ?? []).map((p) => [p.id, p]));
    return (rows ?? []).map((r) => ({ ...r, reporterProfile: byId.get(r.reporter), reportedProfile: byId.get(r.reported) }));
  });

export const adminResolveReport = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; status: "resolved" | "rejected" }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("reports").update({ status: data.status }).eq("id", data.id);
    await supabaseAdmin.from("admin_actions").insert({ action: `report_${data.status}`, details: { report_id: data.id } });
    return { ok: true };
  });

// ---------- Discussions / messagerie ----------

function pairKey(a: string, b: string) { return a < b ? `${a}|${b}` : `${b}|${a}`; }

export const adminListConversations = createServerFn({ method: "GET" })
  .inputValidator((data: { q?: string }) => data ?? {})
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("messages")
      .select("id, sender, receiver, content, image_path, created_at")
      .order("created_at", { ascending: false })
      .limit(2000);
    const pairs = new Map<string, { a: string; b: string; last: any; count: number; photos: number }>();
    for (const m of rows ?? []) {
      const key = pairKey(m.sender, m.receiver);
      const cur = pairs.get(key);
      if (!cur) pairs.set(key, { a: m.sender < m.receiver ? m.sender : m.receiver, b: m.sender < m.receiver ? m.receiver : m.sender, last: m, count: 1, photos: m.image_path ? 1 : 0 });
      else { cur.count += 1; if (m.image_path) cur.photos += 1; }
    }
    const ids = new Set<string>();
    pairs.forEach((p) => { ids.add(p.a); ids.add(p.b); });
    const { data: profs } = await supabaseAdmin.from("profiles").select("id, pseudo, email, status").in("id", [...ids]);
    const byId = new Map((profs ?? []).map((p) => [p.id, p]));
    let list = [...pairs.values()].map((c) => ({
      key: pairKey(c.a, c.b),
      a: c.a, b: c.b,
      aProfile: byId.get(c.a),
      bProfile: byId.get(c.b),
      count: c.count,
      photos: c.photos,
      lastAt: c.last.created_at,
      lastPreview: c.last.image_path ? "📷 Photo" : (c.last.content ?? ""),
    }));
    if (data.q && data.q.trim()) {
      const term = data.q.trim().toLowerCase();
      list = list.filter((c) => (c.aProfile?.pseudo ?? "").toLowerCase().includes(term) || (c.bProfile?.pseudo ?? "").toLowerCase().includes(term) || (c.aProfile?.email ?? "").toLowerCase().includes(term) || (c.bProfile?.email ?? "").toLowerCase().includes(term));
    }
    list.sort((x, y) => +new Date(y.lastAt) - +new Date(x.lastAt));
    return list.slice(0, 200);
  });

export const adminGetConversation = createServerFn({ method: "GET" })
  .inputValidator((data: { a: string; b: string }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: msgs }, { data: profs }] = await Promise.all([
      supabaseAdmin.from("messages")
        .select("id, sender, receiver, content, image_path, created_at")
        .or(`and(sender.eq.${data.a},receiver.eq.${data.b}),and(sender.eq.${data.b},receiver.eq.${data.a})`)
        .order("created_at"),
      supabaseAdmin.from("profiles").select("id, pseudo, email, status").in("id", [data.a, data.b]),
    ]);
    // Sign image URLs (admin uses service role; signed URLs work for private bucket)
    const withImg = await Promise.all((msgs ?? []).map(async (m: any) => {
      if (!m.image_path) return m;
      const { data: s } = await supabaseAdmin.storage.from("message-photos").createSignedUrl(m.image_path, 3600);
      return { ...m, image_url: s?.signedUrl };
    }));
    return { messages: withImg, participants: profs ?? [] };
  });

export const adminDeleteMessage = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: m } = await supabaseAdmin.from("messages").select("image_path").eq("id", data.id).maybeSingle();
    if (m?.image_path) await supabaseAdmin.storage.from("message-photos").remove([m.image_path]);
    await supabaseAdmin.from("messages").delete().eq("id", data.id);
    await supabaseAdmin.from("admin_actions").insert({ action: "delete_message", details: { id: data.id } });
    return { ok: true };
  });

// ---------- Profils de test ----------

const TEST_PROFILES = [
  { pseudo: "amina_test", gender: "femme" as const, looking_for: "homme" as const, birthdate: "1995-04-12", city: "Paris", country: "France", country_origin: "Algérie", profession: "Infirmière", education_level: "Bac +3 / Licence", religious_practice: "pratiquant" as const, marital_status: "celibataire" as const, activities: "Lecture, randonnée, cuisine orientale", objective: "Mariage rapide", bio: "Salam, je cherche un mari sérieux, pratiquant et bienveillant in sha Allah." },
  { pseudo: "yacine_test", gender: "homme" as const, looking_for: "femme" as const, birthdate: "1990-09-03", city: "Lyon", country: "France", country_origin: "Maroc", profession: "Ingénieur", education_level: "Bac +5 / Master", religious_practice: "pratiquant" as const, marital_status: "celibataire" as const, activities: "Sport, Coran, voyages", objective: "Mariage dans 6 mois", bio: "29 ans, pratiquant, je recherche une sœur sérieuse pour fonder un foyer halal." },
  { pseudo: "khadija_test", gender: "femme" as const, looking_for: "homme" as const, birthdate: "1992-01-22", city: "Marseille", country: "France", country_origin: "Tunisie", profession: "Enseignante", education_level: "Bac +5 / Master", religious_practice: "tres_pratiquant" as const, marital_status: "divorce" as const, activities: "Tafsir, marche, pâtisserie", objective: "Mariage rapide", bio: "Divorcée sans enfants, je souhaite un nouveau départ avec un frère sincère." },
  { pseudo: "omar_test", gender: "homme" as const, looking_for: "femme" as const, birthdate: "1988-06-17", city: "Bruxelles", country: "Belgique", country_origin: "Égypte", profession: "Médecin", education_level: "Doctorat", religious_practice: "tres_pratiquant" as const, marital_status: "celibataire" as const, activities: "Médecine humanitaire, lecture, équitation", objective: "Mariage dans 1 an", bio: "Médecin, pratiquant, je cherche une épouse douce, pieuse et ambitieuse." },
  { pseudo: "salma_test", gender: "femme" as const, looking_for: "homme" as const, birthdate: "1998-11-08", city: "Montréal", country: "Canada", country_origin: "Maroc", profession: "Étudiante en droit", education_level: "Bac +3 / Licence", religious_practice: "en_apprentissage" as const, marital_status: "celibataire" as const, activities: "Bénévolat, calligraphie, cinéma", objective: "Mariage dans 2 ans", bio: "Jeune sœur en apprentissage, j'aimerais échanger avec un frère respectueux." },
  { pseudo: "ibrahim_test", gender: "homme" as const, looking_for: "femme" as const, birthdate: "1985-02-28", city: "Toulouse", country: "France", country_origin: "Sénégal", profession: "Entrepreneur", education_level: "Bac +5 / Master", religious_practice: "pratiquant" as const, marital_status: "veuf" as const, activities: "Affaires, lecture du Coran, football", objective: "Mariage dans 6 mois", bio: "Veuf, père de 2 enfants. Je cherche une co-épouse aimante in sha Allah." },
];

export const adminSeedTestProfiles = createServerFn({ method: "POST" }).handler(async () => {
  const { requireAdminOrThrow } = await import("./admin-session.server");
  await requireAdminOrThrow();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const results: { pseudo: string; status: string }[] = [];

  for (const p of TEST_PROFILES) {
    const email = `${p.pseudo}@nooryaa.test`;
    // Skip if already exists
    const { data: existing } = await supabaseAdmin.from("profiles").select("id").eq("pseudo", p.pseudo).maybeSingle();
    if (existing) { results.push({ pseudo: p.pseudo, status: "exists" }); continue; }

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: "TestNooryaa2026!",
      email_confirm: true,
      user_metadata: { test_profile: true },
    });
    if (createErr || !created?.user) { results.push({ pseudo: p.pseudo, status: `error: ${createErr?.message ?? "unknown"}` }); continue; }

    const userId = created.user.id;
    const photoUrl = `https://i.pravatar.cc/600?u=${p.pseudo}`;
    await supabaseAdmin.from("profiles").update({
      pseudo: p.pseudo,
      email,
      gender: p.gender,
      looking_for: p.looking_for,
      birthdate: p.birthdate,
      city: p.city,
      country: p.country,
      country_origin: p.country_origin,
      profession: p.profession,
      education_level: p.education_level,
      religious_practice: p.religious_practice,
      marital_status: p.marital_status,
      activities: p.activities,
      objective: p.objective,
      bio: p.bio,
      religion: "Islam",
      primary_photo_url: photoUrl,
      onboarded: true,
      status: "active",
    }).eq("id", userId);

    await supabaseAdmin.from("photos").insert({ user_id: userId, url: photoUrl, storage_path: `external/${p.pseudo}`, position: 0 });
    await supabaseAdmin.from("admin_actions").insert({ action: "seed_test_profile", target_user: userId, details: { pseudo: p.pseudo } });
    results.push({ pseudo: p.pseudo, status: "created" });
  }
  return { results };
});

// ---------- Notifications ----------

export const adminNotificationCounts = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdminOrThrow } = await import("./admin-session.server");
  await requireAdminOrThrow();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [reports, contacts] = await Promise.all([
    supabaseAdmin.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabaseAdmin.from("contact_messages").select("id", { count: "exact", head: true }).eq("read", false),
  ]);
  return {
    openReports: reports.count ?? 0,
    unreadContacts: contacts.count ?? 0,
    total: (reports.count ?? 0) + (contacts.count ?? 0),
  };
});

// ---------- Contact messages ----------

export const adminListContacts = createServerFn({ method: "GET" })
  .inputValidator((data: { onlyUnread?: boolean }) => data ?? {})
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200);
    if (data.onlyUnread) q = q.eq("read", false);
    const { data: rows } = await q;
    return rows ?? [];
  });

export const adminMarkContactRead = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; read: boolean }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("contact_messages").update({ read: data.read }).eq("id", data.id);
    return { ok: true };
  });

export const adminDeleteContact = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("contact_messages").delete().eq("id", data.id);
    return { ok: true };
  });

// Public: submit contact form
export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; email: string; subject?: string; message: string }) => {
    if (!data.name?.trim() || !data.email?.trim() || !data.message?.trim()) throw new Error("Champs obligatoires manquants");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) throw new Error("Email invalide");
    if (data.message.length > 4000) throw new Error("Message trop long");
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      subject: data.subject?.trim() || null,
      message: data.message.trim(),
    });
    if (error) throw error;
    return { ok: true };
  });

// ---------- Ads / Publicités ----------

export const adminListAds = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdminOrThrow } = await import("./admin-session.server");
  await requireAdminOrThrow();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: rows } = await supabaseAdmin.from("ads").select("*").order("sort_order").order("created_at", { ascending: false });
  return rows ?? [];
});

export const adminUpsertAd = createServerFn({ method: "POST" })
  .inputValidator((data: { id?: string; title?: string; image_url: string; link_url?: string; active: boolean; sort_order: number }) => {
    if (!data.image_url?.trim()) throw new Error("Image obligatoire");
    return data;
  })
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      title: data.title?.trim() || null,
      image_url: data.image_url.trim(),
      link_url: data.link_url?.trim() || null,
      active: data.active,
      sort_order: data.sort_order ?? 0,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("ads").update(payload).eq("id", data.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin.from("ads").insert(payload);
      if (error) throw error;
    }
    return { ok: true };
  });

export const adminDeleteAd = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("ads").delete().eq("id", data.id);
    return { ok: true };
  });

// Public: list active ads for homepage carousel
export const listActiveAds = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("ads")
    .select("id, title, image_url, link_url")
    .eq("active", true)
    .order("sort_order")
    .limit(20);
  return data ?? [];
});
// ---------- Modération automatique ----------

export const adminListModeration = createServerFn({ method: "GET" })
  .inputValidator((data: { verdict?: string }) => data ?? {})
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("moderation_events").select("*").order("created_at", { ascending: false }).limit(200);
    if (data.verdict && data.verdict !== "all") q = q.eq("verdict", data.verdict);
    const { data: rows } = await q;
    const ids = new Set<string>();
    (rows ?? []).forEach((r: any) => { ids.add(r.user_id); if (r.target_user) ids.add(r.target_user); });
    const { data: profs } = await supabaseAdmin.from("profiles").select("id, pseudo, email, status").in("id", [...ids]);
    const byId = new Map((profs ?? []).map((p) => [p.id, p]));
    return (rows ?? []).map((r: any) => ({ ...r, author: byId.get(r.user_id), target: r.target_user ? byId.get(r.target_user) : null }));
  });
