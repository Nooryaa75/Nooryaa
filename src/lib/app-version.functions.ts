import { createServerFn } from "@tanstack/react-start";

export type PublicAppVersion = {
  platform: "ios" | "android";
  version: string;
  min_version: string;
};

/**
 * Lecture publique des versions publiées (configurateur admin).
 * Aucune donnée sensible : uniquement plateforme, version courante et
 * version minimale exigée. Accessible sans connexion car l'application
 * doit pouvoir vérifier sa version avant même l'authentification.
 */
export const getPublicAppVersions = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await (supabaseAdmin.from("app_versions" as any) as any)
    .select("platform, version, min_version");
  return (data ?? []) as PublicAppVersion[];
});

/**
 * Trace de diagnostic : ce que la vérification de version a vu sur le
 * téléphone. Stockée dans app_version_checks (lecture réservée au service).
 */
export const reportAppVersionCheck = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    const o = (d ?? {}) as Record<string, unknown>;
    const s = (v: unknown, n = 60) => String(v ?? "").slice(0, n);
    // Les rapports de plantage (« crash: ») gardent le message et le début de
    // la pile d'appels pour pouvoir diagnostiquer l'erreur sur le téléphone.
    const outcome = String(o.outcome ?? "");
    return {
      platform: s(o.platform),
      installed: s(o.installed),
      outcome: s(outcome, outcome.startsWith("crash") ? 1500 : 60),
    };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin.from("app_version_checks") as any).insert({
      platform: data.platform,
      installed: data.installed,
      outcome: data.outcome,
    });
    return { ok: true };
  });
