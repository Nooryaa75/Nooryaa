import { useSession, getRequest } from "@tanstack/react-start/server";

export type AdminSession = { authed?: boolean; loggedAt?: number };

export const ADMIN_SESSION_CONFIG = {
  password: process.env.SESSION_SECRET ?? "nooryaa-dev-session-secret-please-replace-32chars",
  name: "nooryaa-admin",
  maxAge: 60 * 60 * 8, // 8h
  cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
};

export async function getAdminSession() {
  return useSession<AdminSession>(ADMIN_SESSION_CONFIG);
}

export type AdminIdentity = { via: "password" | "role"; adminId: string | null; email: string | null };

/**
 * Identifie un administrateur connecté via son compte membre (rôle `admin`).
 * Le jeton est attaché automatiquement à toutes les fonctions serveur.
 */
export async function getBearerAdmin(): Promise<AdminIdentity | null> {
  try {
    const request = getRequest();
    const authHeader = request?.headers?.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.slice(7);
    if (token.split(".").length !== 3) return null;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return null;

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin");
    if (!roles || roles.length === 0) return null;

    return { via: "role", adminId: data.user.id, email: data.user.email ?? null };
  } catch {
    return null;
  }
}

export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const byRole = await getBearerAdmin();
  if (byRole) return byRole;
  const session = await getAdminSession();
  if (session.data.authed) return { via: "password", adminId: null, email: null };
  return null;
}

export async function requireAdminOrThrow(): Promise<AdminIdentity> {
  const identity = await getAdminIdentity();
  if (!identity) throw new Error("Admin unauthorized");
  return identity;
}
