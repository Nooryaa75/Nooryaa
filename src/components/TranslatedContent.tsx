import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { TRANSLATIONS } from "@/lib/i18n-catalog";

const attributes = ["placeholder", "title", "aria-label"] as const;
const originals = new WeakMap<Text | Element, Map<string, string>>();
const phrases = Object.keys(TRANSLATIONS).sort((a, b) => b.length - a.length);

function remember(node: Text | Element, key: string, value: string) {
  let values = originals.get(node);
  if (!values) {
    values = new Map();
    originals.set(node, values);
  }
  if (!values.has(key)) values.set(key, value);
  return values.get(key) ?? value;
}

function translated(source: string, locale: "fr" | "en" | "ar") {
  if (locale === "fr") return source;
  const direct = TRANSLATIONS[source]?.[locale];
  if (direct) return direct;
  const core = source.trim();
  const value = TRANSLATIONS[core]?.[locale];
  if (value) return source.replace(core, value);

  let result = source;
  for (const phrase of phrases) {
    if (phrase.length < 4 || !result.includes(phrase)) continue;
    result = result.split(phrase).join(TRANSLATIONS[phrase]?.[locale] ?? phrase);
  }
  return result;
}

function translateTree(root: HTMLElement, locale: "fr" | "en" | "ar") {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    const text = current as Text;
    const parent = text.parentElement;
    if (parent && !parent.closest("[data-no-translate]") && !["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName)) {
      const source = remember(text, "text", text.nodeValue ?? "");
      const next = translated(source, locale);
      if (text.nodeValue !== next) text.nodeValue = next;
    }
    current = walker.nextNode();
  }
  root.querySelectorAll<HTMLElement>("[placeholder], [title], [aria-label]").forEach((element) => {
    if (element.closest("[data-no-translate]")) return;
    for (const attribute of attributes) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      const source = remember(element, attribute, value);
      const next = translated(source, locale);
      if (value !== next) element.setAttribute(attribute, next);
    }
  });
}

export function TranslatedContent() {
  const { locale } = useI18n();
  const localeRef = useRef(locale);
  localeRef.current = locale;

  useEffect(() => {
    const run = () => translateTree(document.body, localeRef.current);
    run();
    const observer = new MutationObserver((records) => {
      if (records.some((record) => record.addedNodes.length > 0 || record.type === "characterData")) run();
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [locale]);

  return null;
}