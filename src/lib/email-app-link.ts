export const EMAIL_APP_ORIGIN = "https://app.nooryaa.com";
export const EMAIL_APP_PATH = "/verification-email";

export function emailVerificationUrl(tokenHash: string, type: "signup" | "magiclink") {
  if (!tokenHash) throw new Error("Lien de confirmation indisponible.");
  // Fragment: never transmitted to the website server or in the Referer header.
  return `${EMAIL_APP_ORIGIN}${EMAIL_APP_PATH}#${new URLSearchParams({ token_hash: tokenHash, type })}`;
}

export function parseEmailVerification(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const token_hash = params.get("token_hash");
  const type = params.get("type");
  if (!token_hash || (type !== "signup" && type !== "magiclink")) return null;
  return { token_hash, type };
}

/** Android intent that hands the (unused) token to the installed app. */
export function androidAppVerificationIntent(hash: string) {
  const credentials = parseEmailVerification(hash);
  if (!credentials) return null;
  const query = new URLSearchParams(credentials).toString();
  const fallback = encodeURIComponent(`${EMAIL_APP_ORIGIN}${EMAIL_APP_PATH}#${query}`);
  return `intent://open${EMAIL_APP_PATH}?${query}#Intent;scheme=nooryaa;package=com.nooryaa.app;S.browser_fallback_url=${fallback};end`;
}

export function nativeEmailDestination(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.username || url.password) return null;
    // Custom scheme from the browser hand-off: nooryaa://open/verification-email?token_hash=…
    if (url.protocol === "nooryaa:") {
      if (url.host !== "open" || url.pathname !== EMAIL_APP_PATH) return null;
      const hash = `#${url.search.replace(/^\?/, "")}`;
      if (!parseEmailVerification(hash)) return null;
      return `${EMAIL_APP_PATH}${hash}`;
    }
    if (url.origin !== EMAIL_APP_ORIGIN || url.pathname !== EMAIL_APP_PATH) return null;
    if (!parseEmailVerification(url.hash)) return null;
    return `${EMAIL_APP_PATH}${url.hash}`;
  } catch {
    return null;
  }
}