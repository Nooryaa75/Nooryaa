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
