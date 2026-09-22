/** Gestion du consentement cookies / mesure d'audience (RGPD). */
export type CookieChoice = "all" | "essential";

const KEY = "nooryaa-cookie-consent";
const EVENT = "nooryaa-cookie-consent-change";

export function getCookieChoice(): CookieChoice | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(KEY);
  return value === "all" || value === "essential" ? value : null;
}

export function setCookieChoice(choice: CookieChoice) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, choice);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: choice }));
}

export function clearCookieChoice() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: null }));
}

/** true uniquement si la mesure d'audience a été acceptée. */
export function analyticsAllowed() {
  return getCookieChoice() === "all";
}

export function onCookieChoiceChange(handler: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
