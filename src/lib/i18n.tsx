import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { TRANSLATIONS as BASE_TRANSLATIONS } from "./i18n-catalog";
import { GEO_TRANSLATIONS } from "./geo-catalog";
import { useRouterState } from "@tanstack/react-router";

export const TRANSLATIONS: Record<string, { en: string; ar: string }> = {
  ...GEO_TRANSLATIONS,
  ...BASE_TRANSLATIONS,
};

export type Locale = "fr" | "en" | "ar";

const STORAGE_KEY = "nooryaa-language";
const localeNames: Record<Locale, string> = { fr: "Français", en: "English", ar: "العربية" };

const pageTitles: Record<Locale, string> = {
  fr: "Nooryaa — Rencontre musulmane pour un mariage halal",
  en: "Nooryaa — Muslim matchmaking for halal marriage",
  ar: "Nooryaa — تعارف إسلامي من أجل زواج حلال",
};

type I18nValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  localeName: string;
  setLocale: (locale: Locale) => void;
  t: (source: string) => string;
  formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

/** Traduit un lieu composé : "Ville (Département)" ou "Ville, Pays". */
function translatePlace(core: string, locale: Exclude<Locale, "fr">): string | null {
  const parenthesis = core.match(/^(.+?)\s*\((.+)\)$/);
  if (parenthesis) {
    const city = parenthesis[1].trim();
    const area = parenthesis[2].trim();
    const cityValue = GEO_TRANSLATIONS[city]?.[locale];
    const areaValue = GEO_TRANSLATIONS[area]?.[locale];
    if (cityValue || areaValue) return `${cityValue ?? city} (${areaValue ?? area})`;
    return null;
  }
  if (core.includes(",")) {
    const parts = core.split(",").map((part) => part.trim());
    if (parts.length > 3 || parts.some((part) => !part)) return null;
    const values = parts.map((part) => GEO_TRANSLATIONS[part]?.[locale]);
    if (!values.some(Boolean)) return null;
    return parts.map((part, index) => values[index] ?? part).join(locale === "ar" ? "، " : ", ");
  }
  return null;
}

export function translateText(source: string, locale: Locale) {
  if (locale === "fr" || !source.trim()) return source;
  const direct = TRANSLATIONS[source]?.[locale];
  if (direct) return direct;

  const leading = source.match(/^\s*/)?.[0] ?? "";
  const trailing = source.match(/\s*$/)?.[0] ?? "";
  const core = source.trim();
  const translated = TRANSLATIONS[core]?.[locale] ?? translatePlace(core, locale);
  return translated ? `${leading}${translated}${trailing}` : source;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [memberLocale, updateLocale] = useState<Locale>("fr");
  const isAdmin = useRouterState({ select: (state) => state.location.pathname === "/admin" || state.location.pathname.startsWith("/admin/") });
  const locale: Locale = isAdmin ? "fr" : memberLocale;

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const browser = window.navigator.language.toLowerCase();
    const next: Locale = stored === "en" || stored === "ar" || stored === "fr"
      ? stored
      : browser.startsWith("ar") ? "ar" : browser.startsWith("en") ? "en" : "fr";
    updateLocale(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.body.dataset.locale = locale;
    const currentTitle = document.title;
    const knownTitle = locale === "fr" ? currentTitle : TRANSLATIONS[currentTitle]?.[locale];
    document.title = knownTitle ?? pageTitles[locale];
  }, [locale, isAdmin]);

  const setLocale = useCallback((next: Locale) => {
    if (isAdmin) return;
    updateLocale(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    // Mémorise la langue sur le profil : les emails et notifications
    // seront rédigés dans cette langue.
    void (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) {
          await supabase.from("profiles").update({ locale: next }).eq("id", data.user.id);
        }
      } catch {
        /* silencieux : la langue reste stockée localement */
      }
    })();
  }, [isAdmin]);
  const t = useCallback((source: string) => translateText(source, locale), [locale]);

  const value = useMemo<I18nValue>(() => ({
    locale,
    dir: locale === "ar" ? "rtl" : "ltr",
    localeName: localeNames[locale],
    setLocale,
    t,
    formatDate: (value, options) => new Intl.DateTimeFormat(locale, options).format(new Date(value)),
    formatNumber: (value, options) => new Intl.NumberFormat(locale, options).format(value),
  }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "fr";
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "en" || value === "ar" ? value : "fr";
}
