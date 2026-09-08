import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

function sourceFromReferrer(ref: string | null | undefined): string {
  if (!ref) return "Accès direct";
  let host = "";
  try {
    host = new URL(ref).hostname.replace(/^www\./, "");
  } catch {
    return "Accès direct";
  }
  if (!host || host.includes("nooryaa") || host.includes("localhost") || host.includes("lovable.app")) return "Accès direct";
  if (/google\./.test(host)) return "Google";
  if (/bing\./.test(host)) return "Bing";
  if (/duckduckgo\./.test(host)) return "DuckDuckGo";
  if (/yahoo\./.test(host)) return "Yahoo";
  if (/facebook|fb\./.test(host)) return "Facebook";
  if (/instagram/.test(host)) return "Instagram";
  if (/tiktok/.test(host)) return "TikTok";
  if (/snapchat/.test(host)) return "Snapchat";
  if (/t\.co$|twitter|x\.com/.test(host)) return "X (Twitter)";
  if (/linkedin/.test(host)) return "LinkedIn";
  if (/whatsapp/.test(host)) return "WhatsApp";
  return host;
}

async function hash(value: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

function headerValue(h: Headers, names: string[]): string | null {
  for (const n of names) {
    const v = h.get(n);
    if (v && v.trim() && v.trim() !== "unknown") return decodeURIComponent(v.trim());
  }
  return null;
}

async function geoFromIp(ip: string) {
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return null;
    const j = (await res.json()) as { city?: string; region?: string; country_name?: string };
    if (!j.city && !j.country_name) return null;
    return { city: j.city ?? null, region: j.region ?? null, country: j.country_name ?? null };
  } catch {
    return null;
  }
}

/** Enregistre une visite (appelée depuis le navigateur, aucune donnée sensible stockée). */
export const trackVisit = createServerFn({ method: "POST" })
  .inputValidator((data: { path: string; referrer?: string | null }) => ({
    path: String(data?.path ?? "/").slice(0, 300),
    referrer: data?.referrer ? String(data.referrer).slice(0, 500) : null,
  }))
  .handler(async ({ data }) => {
    try {
      const request = getRequest();
      const h = request.headers;
      const ipRaw =
        headerValue(h, ["cf-connecting-ip", "x-real-ip"]) ??
        (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ??
        "";
      const ip = ipRaw || "0.0.0.0";
      const ipHash = await hash(ip);

      let city = headerValue(h, ["cf-ipcity", "x-vercel-ip-city"]);
      let region = headerValue(h, ["cf-region", "x-vercel-ip-country-region"]);
      let country = headerValue(h, ["cf-ipcountry", "x-vercel-ip-country"]);

      if (!city && ip !== "0.0.0.0" && !ip.startsWith("127.") && !ip.startsWith("192.168.")) {
        const geo = await geoFromIp(ip);
        if (geo) {
          city = geo.city;
          region = geo.region;
          country = geo.country ?? country;
        }
      }

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      // Évite les doublons : même visiteur, même page, dans les 30 dernières minutes.
      const since = new Date(Date.now() - 30 * 60000).toISOString();
      const { data: recent } = await supabaseAdmin
        .from("visits")
        .select("id")
        .eq("ip_hash", ipHash)
        .eq("path", data.path)
        .gte("created_at", since)
        .limit(1);
      if (recent && recent.length > 0) return { ok: true };

      await supabaseAdmin.from("visits").insert({
        path: data.path,
        referrer: data.referrer,
        source: sourceFromReferrer(data.referrer),
        city,
        region,
        country,
        ip_hash: ipHash,
        user_agent: (h.get("user-agent") ?? "").slice(0, 300),
      });
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });

export const adminListVisits = createServerFn({ method: "GET" })
  .inputValidator((data: { limit?: number } | undefined) => ({ limit: Math.min(data?.limit ?? 500, 2000) }))
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: rows }, { count }] = await Promise.all([
      supabaseAdmin
        .from("visits")
        .select("id, created_at, city, region, country, path, source, referrer")
        .order("created_at", { ascending: false })
        .limit(data.limit),
      supabaseAdmin.from("visits").select("id", { count: "exact", head: true }),
    ]);

    const list = rows ?? [];
    const tally = (key: "city" | "source" | "path") => {
      const m = new Map<string, number>();
      for (const r of list) {
        const k = (r[key] as string | null) || "Inconnu";
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8);
    };

    return { total: count ?? list.length, rows: list, topCities: tally("city"), topSources: tally("source"), topPages: tally("path") };
  });

export const adminDeleteVisits = createServerFn({ method: "POST" })
  .inputValidator((data: { ids?: string[]; all?: boolean }) => ({ ids: data?.ids ?? [], all: !!data?.all }))
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.all) {
      await supabaseAdmin.from("visits").delete().gte("created_at", "1970-01-01");
    } else if (data.ids.length > 0) {
      await supabaseAdmin.from("visits").delete().in("id", data.ids);
    }
    return { ok: true };
  });
