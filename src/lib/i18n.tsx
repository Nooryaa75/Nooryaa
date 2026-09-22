import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { TRANSLATIONS as BASE_TRANSLATIONS } from "./i18n-catalog";
import { GEO_TRANSLATIONS } from "./geo-catalog";

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

function translateText(source: string, locale: Locale) {
  if (locale === "fr" || !source.trim()) return source;
  const direct = TRANSLATIONS[source]?.[locale];
  if (direct) return direct;

  const leading = source.match(/^\s*/)?.[0] ?? "";
  const trailing = source.match(/\s*$/)?.[0] ?? "";
  const core = source.trim();
  const translated = TRANSLATIONS[core]?.[locale];
  return translated ? `${leading}${translated}${trailing}` : source;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, updateLocale] = useState<Locale>("fr");

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
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    updateLocale(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);
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
