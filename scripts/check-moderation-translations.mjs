// Vérifie que chaque phrase affichée à un membre par la modération existe dans le
// catalogue FR/EN/AR (src/lib/i18n-catalog.ts), avec une traduction anglaise et arabe.
// Lancement : bun scripts/check-moderation-translations.mjs
import { readFileSync } from "node:fs";

const { TRANSLATIONS } = await import("../src/lib/i18n-catalog.ts");

const FILES = [
  "src/lib/moderation-rules.ts",
  "src/lib/moderation.functions.ts",
  "src/lib/photo-moderation.functions.ts",
  "src/lib/photo-identity.functions.ts",
  "src/lib/selfie-verification.functions.ts",
  "src/components/PhotoManager.tsx",
  "src/components/SelfieVerification.tsx",
  "src/components/SwipeDeck.tsx",
  "src/components/ProfileVignette.tsx",
  "src/routes/_authenticated/profile.$pseudo.tsx",
  "src/routes/_authenticated/blocked.tsx",
  "src/routes/_authenticated/messages.$pseudo.tsx",
];

// Une phrase destinée à un membre : assez longue, sans code ni interpolation.
function isMemberSentence(s) {
  if (s.length < 20) return false;
  if (s.split(/\s+/).length < 3) return false;
  if (/[$<{]|\\n|https?:/.test(s)) return false;
  return true;
}

// Les phrases membres sont assignées à `reason` (serveur) ou passées à un toast
// ou à translateText (client). Tout le reste (prompt, journal admin, schéma JSON)
// est ignoré.
function collect(src) {
  const lines = src.split("\n");
  const found = new Set();
  lines.forEach((line, i) => {
    const window = lines.slice(Math.max(0, i - 3), i + 2).join("\n");
    const relevant = /\breason\b/.test(window) || /\btoast\./.test(window) || /translateText\(/.test(line);
    if (!relevant) return;
    for (const m of line.matchAll(/"((?:[^"\\]|\\.)*)"/g)) {
      const s = m[1].replace(/\\"/g, '"');
      if (isMemberSentence(s)) found.add(s);
    }
  });
  return found;
}

const missing = [];
const checked = new Set();
for (const file of FILES) {
  for (const s of collect(readFileSync(file, "utf8"))) {
    if (checked.has(s)) continue;
    checked.add(s);
    const entry = TRANSLATIONS[s];
    if (!entry) missing.push([file, s, "absent du catalogue"]);
    else if (!entry.en?.trim()) missing.push([file, s, "traduction anglaise vide"]);
    else if (!entry.ar?.trim()) missing.push([file, s, "traduction arabe vide"]);
  }
}

if (missing.length) {
  for (const [file, s, why] of missing) console.log(`- [${why}] ${file} : ${s}`);
  console.log(`\n${missing.length} phrase(s) à traduire sur ${checked.size} contrôlée(s).`);
  process.exit(1);
}
console.log(`OK : ${checked.size} phrases de modération sont traduites en anglais et en arabe.`);
