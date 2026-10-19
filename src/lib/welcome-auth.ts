export function needsSocialWelcome(user: {
  id: string;
  app_metadata?: { provider?: string; providers?: string[] };
} | null | undefined): boolean {
  if (!user?.id) return false;
  const providers = user.app_metadata?.providers ?? [user.app_metadata?.provider];
  return providers.some((provider) => provider === "google" || provider === "apple");
}