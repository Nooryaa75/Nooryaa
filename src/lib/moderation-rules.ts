// Règles de modération partagées (client + serveur).
// Le lexique sert de premier filtre rapide ; l'IA affine ensuite le ton et le contexte.

export type ModerationVerdict = "allow" | "warn" | "block";

export interface ModerationResult {
  verdict: ModerationVerdict;
  categories: string[];
  reason: string;
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // déjoue les contournements simples (l33t / séparateurs)
    .replace(/[0]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[4@]/g, "a")
    .replace(/[5$]/g, "s")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsPhrase(text: string, phrase: string): boolean {
  const normalizedPhrase = normalize(phrase);
  return (` ${text} `).includes(` ${normalizedPhrase} `);
}

/** Questions ordinaires sur le lieu de vie, avec tolérance aux fautes courantes. */
export function isSafeLocationQuestion(rawText: string): boolean {
  const text = normalize(rawText);
  const asksWhere = /\b(?:ou|quel(?:le)?|qu elle|quelle ville|dans quelle ville)\b/.test(text);
  const mentionsLiving = /\b(?:habite|habites|habitez|habiter|habites?|vis|vit|vivez|ville|region|pays|quartier)\b/.test(text);
  const containsContactDetails = WARN_PATTERNS[0].words.some((word) => containsPhrase(text, word))
    || PHONE_RE.test(rawText)
    || EMAIL_RE.test(rawText);

  return asksWhere && mentionsLiving && !containsContactDetails;
}

// Interdits stricts : le message est refusé.
const BLOCK_PATTERNS: { category: string; words: string[] }[] = [
  {
    category: "Propos sexuels",
    words: [
      "sexe", "sexy", "nue", "nu au lit", "nudes", "seins", "fesses", "penis", "vagin",
      "baiser toi", "coucher avec toi", "faire l amour", "porno", "xxx", "salope", "pute", "putain",
      "bite", "chatte", "sodomie", "masturb",
    ],
  },
  {
    category: "Insultes / haine",
    words: [
      "connard", "connasse", "enculé", "encule", "fdp", "batard", "batarde", "ta gueule",
      "sale arabe", "sale juif", "sale noir", "sale blanc", "bougnoule", "negre", "youpin",
      "kouffar sale", "mecreant sale", "je vais te tuer", "creve", "nique ta", "nique sa",
    ],
  },
  {
    category: "Arnaque / argent",
    words: [
      "bitcoin", "crypto investissement", "western union", "mandat cash", "envoie moi de l argent",
      "prete moi de l argent", "carte cadeau", "paypal me", "virement urgent", "iban",
    ],
  },
  {
    category: "Contenu illicite",
    words: ["drogue", "cocaine", "cannabis a vendre", "escort", "prostitu"],
  },
];

// Sensibles : le message passe mais l'utilisateur est averti / l'événement est journalisé.
const WARN_PATTERNS: { category: string; words: string[] }[] = [
  {
    category: "Coordonnées personnelles",
    words: ["whatsapp", "snapchat", "snap", "instagram", "insta", "telegram", "mon numero", "appelle moi au"],
  },
  {
    category: "Ton irrespectueux",
    words: ["ferme la", "t es moche", "tu es moche", "debile", "idiot", "imbecile", "nulle", "degage"],
  },
  {
    category: "Pression / insistance",
    words: ["repond moi vite", "pourquoi tu reponds pas", "tu m ignores", "je te previens"],
  },
];

const PHONE_RE = /(?:\+?\d[\s.-]?){9,}/;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

export function lexiconCheck(rawText: string): ModerationResult {
  const text = normalize(rawText);
  const categories: string[] = [];

  for (const group of BLOCK_PATTERNS) {
    if (group.words.some((word) => containsPhrase(text, word))) categories.push(group.category);
  }
  if (categories.length > 0) {
    return {
      verdict: "block",
      categories,
      reason:
        "Ce message contient des propos contraires à l'adab et à la charte de Nooryaa (" +
        categories.join(", ") +
        "). Merci de reformuler avec respect.",
    };
  }

  const warnCats: string[] = [];
  for (const group of WARN_PATTERNS) {
    if (group.words.some((word) => containsPhrase(text, word))) warnCats.push(group.category);
  }
  if (PHONE_RE.test(rawText) || EMAIL_RE.test(rawText)) warnCats.push("Coordonnées personnelles");

  if (warnCats.length > 0) {
    return {
      verdict: "warn",
      categories: [...new Set(warnCats)],
      reason:
        "Message envoyé, mais prudence : évitez de partager vos coordonnées trop tôt et gardez un ton bienveillant.",
    };
  }

  // Excès de majuscules = ton agressif
  const letters = rawText.replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (letters.length > 20 && letters.replace(/[^A-ZÀ-Þ]/g, "").length / letters.length > 0.7) {
    return {
      verdict: "warn",
      categories: ["Ton agressif"],
      reason: "Écrire en majuscules peut être perçu comme agressif. Préférez un ton posé.",
    };
  }

  return { verdict: "allow", categories: [], reason: "" };
}
