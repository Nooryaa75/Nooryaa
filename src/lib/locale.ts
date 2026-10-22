export type Locale = "fr" | "en" | "ar";

/** A deliberate language choice wins; otherwise follow the device's primary language. */
export function resolveLocale(stored: string | null | undefined, deviceLanguage?: string): Locale {
  if (stored === "fr" || stored === "en" || stored === "ar") return stored;
  const language = deviceLanguage?.trim().toLowerCase().split(/[-_]/)[0];
  return language === "fr" || language === "ar" ? language : "en";
}