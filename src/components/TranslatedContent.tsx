import { useEffect, useRef } from "react";
import { useI18n, translateText } from "@/lib/i18n";
import { TRANSLATIONS } from "@/lib/i18n-catalog";

const attributes = ["placeholder", "title", "aria-label"] as const;
const originals = new WeakMap<Text | Element, Map<string, string>>();
const phrases = Object.keys(TRANSLATIONS).sort((a, b) => b.length - a.length);

function translated(source: string, locale: "fr" | "en" | "ar") {
  if (locale === "fr") return source;
  const exact = translateText(source, locale);
  if (exact !== source) return exact;

  let result = source;
  for (const phrase of phrases) {
    if (phrase.length < 4 || !result.includes(phrase)) continue;
    result = result.split(phrase).join(TRANSLATIONS[phrase]?.[locale] ?? phrase);
  }
  return result;
}

/**
 * Renvoie le texte à afficher pour un noeud ou un attribut.
 *
 * La première valeur rencontrée est mémorisée comme source française, afin de
 * pouvoir retraduire quand la langue change. Si l'application remplace
 * elle-même cette valeur (compteur qui avance, bouton qui change d'intitulé),
 * la nouvelle valeur devient la source : on ne la remet jamais à l'ancienne.
 */
function desired(node: Text | Element, key: string, current: string, locale: "fr" | "en" | "ar") {
  let values = originals.get(node);
  if (!values) {
    values = new Map();
    originals.set(node, values);
  }
  if (!values.has(key)) {
    values.set(key, current);
    return translated(current, locale);
  }
  const source = values.get(key)!;
  const rendered = translated(source, locale);
  if (current === source || current === rendered) return rendered;
  values.set(key, current);
  return translated(current, locale);
}

function translateTree(root: HTMLElement, locale: "fr" | "en" | "ar") {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    const text = current as Text;
    const parent = text.parentElement;
    if (parent && !parent.closest("[data-no-translate]") && !["SCRIPT", "STYLE", "TEXTAREA"].includes(parent.tagName)) {
      const next = desired(text, "text", text.nodeValue ?? "", locale);
      if (text.nodeValue !== next) text.nodeValue = next;
    }
    current = walker.nextNode();
  }
  root.querySelectorAll<HTMLElement>("[placeholder], [title], [aria-label]").forEach((element) => {
    if (element.closest("[data-no-translate]")) return;
    for (const attribute of attributes) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      const next = desired(element, attribute, value, locale);
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
      if (records.some((record) => record.addedNodes.length > 0 || record.type === "characterData" || record.type === "attributes")) run();
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["title", "placeholder", "aria-label"],
    });
    return () => observer.disconnect();
  }, [locale]);

  return null;
}
