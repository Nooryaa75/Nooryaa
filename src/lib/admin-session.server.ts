import { useSession } from "@tanstack/react-start/server";

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

export async function requireAdminOrThrow() {
  const session = await getAdminSession();
  if (!session.data.authed) {
    throw new Error("Admin unauthorized");
  }
  return session;
}