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
 * Trace de diagnostic (journal serveur uniquement, rien n'est stocké) :
 * ce que la vérification de version a vu sur le téléphone.
 */
export const reportAppVersionCheck = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    const o = (d ?? {}) as Record<string, unknown>;
    const s = (v: unknown) => String(v ?? "").slice(0, 60);
    return { platform: s(o.platform), installed: s(o.installed), outcome: s(o.outcome) };
  })
  .handler(async ({ data }) => {
    console.log("[app-version-check]", JSON.stringify(data));
    return { ok: true };
  });
