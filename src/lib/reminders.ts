/**
 * Rappels islamiques quotidiens.
 * Un rappel différent est proposé chaque jour, de façon déterministe
 * (même rappel pour tout le monde le même jour), par rotation sur l'année.
 */

export type DailyReminder = {
  title: string;
  text: string;
  source?: string;
};

export const REMINDERS: DailyReminder[] = [
  {
    title: "La sincérité attire la sérénité",
    text: "Les actes ne valent que par les intentions. Soyez authentique, la bonne personne appréciera votre vérité.",
    source: "Hadith — Bukhari & Muslim",
  },
  {
    title: "Baissez le regard",
    text: "Préserver son regard et sa pudeur, c'est préserver son cœur pour celui ou celle qu'Allah vous destine.",
    source: "Coran 24:30-31",
  },
  {
    title: "Le mariage, la moitié de la religion",
    text: "Quand le serviteur se marie, il parachève la moitié de sa religion : qu'il craigne Allah pour l'autre moitié.",
    source: "Hadith — Bayhaqi",
  },
  {
    title: "Choisir pour la religion",
    text: "On épouse une personne pour quatre raisons ; choisis celle qui a la religion, tu seras comblé.",
    source: "Hadith — Bukhari",
  },
  {
    title: "La douceur embellit tout",
    text: "La douceur n'est présente en une chose sans l'embellir. Soyez doux dans vos échanges.",
    source: "Hadith — Muslim",
  },
  {
    title: "Le bon caractère",
    text: "Les meilleurs d'entre vous sont les meilleurs envers leur épouse ou leur époux.",
    source: "Hadith — Tirmidhi",
  },
  {
    title: "La patience est lumière",
    text: "Ce qui vous est destiné ne vous manquera pas. Patientez et faites confiance au décret d'Allah.",
    source: "Hadith — Muslim",
  },
  {
    title: "Invoquez pour votre avenir",
    text: "Faites la prière de consultation (istikhara) avant toute décision importante.",
    source: "Hadith — Bukhari",
  },
  {
    title: "Protégez la vie privée",
    text: "Ne dévoilez pas ce qu'Allah a couvert : gardez vos échanges dignes et discrets.",
    source: "Hadith — Muslim",
  },
  {
    title: "Parlez en bien ou taisez-vous",
    text: "Celui qui croit en Allah et au Jour dernier, qu'il dise du bien ou qu'il se taise.",
    source: "Hadith — Bukhari & Muslim",
  },
  {
    title: "La confiance en Allah",
    text: "Si vous placiez votre confiance en Allah comme il se doit, Il vous accorderait votre subsistance.",
    source: "Hadith — Tirmidhi",
  },
  {
    title: "Le rappel apaise les cœurs",
    text: "N'est-ce point par l'évocation d'Allah que se tranquillisent les cœurs ?",
    source: "Coran 13:28",
  },
  {
    title: "L'honnêteté dans le profil",
    text: "La véracité mène à la piété. Décrivez-vous avec sincérité, sans exagération.",
    source: "Hadith — Bukhari",
  },
  {
    title: "Respect en toute circonstance",
    text: "Un refus poli vaut mieux qu'un silence blessant. Respectez celui ou celle qui vous écrit.",
  },
  {
    title: "Impliquez vos proches",
    text: "Un projet de mariage se construit dans la clarté : associez votre famille ou un wali dès que possible.",
  },
  {
    title: "La prière avant tout",
    text: "La première chose dont le serviteur sera interrogé au Jour du Jugement est la prière.",
    source: "Hadith — Tirmidhi",
  },
  {
    title: "La gratitude fait grandir",
    text: "Si vous êtes reconnaissants, Je vous accorderai davantage.",
    source: "Coran 14:7",
  },
  {
    title: "Évitez les soupçons",
    text: "Évitez de trop conjecturer : certaines conjectures sont un péché.",
    source: "Coran 49:12",
  },
  {
    title: "Le sourire est une aumône",
    text: "Ton sourire au visage de ton frère est une aumône. Commencez vos conversations avec bienveillance.",
    source: "Hadith — Tirmidhi",
  },
  {
    title: "Facilitez, ne compliquez pas",
    text: "Facilitez et ne rendez pas les choses difficiles ; annoncez la bonne nouvelle et ne repoussez pas.",
    source: "Hadith — Bukhari",
  },
  {
    title: "Demandez pardon souvent",
    text: "Quiconque s'attache à l'istighfar, Allah lui accorde une issue à chaque difficulté.",
    source: "Hadith — Abu Dawud",
  },
  {
    title: "La pudeur fait partie de la foi",
    text: "La pudeur est une branche de la foi : préservez-la dans vos échanges en ligne.",
    source: "Hadith — Bukhari & Muslim",
  },
  {
    title: "Les meilleurs mariages",
    text: "Le mariage le plus béni est celui dont les dépenses sont les plus légères.",
    source: "Hadith — Ahmad",
  },
  {
    title: "Ne désespérez jamais",
    text: "Ne désespérez pas de la miséricorde d'Allah. Après la difficulté vient la facilité.",
    source: "Coran 94:6",
  },
  {
    title: "Le bien commence chez soi",
    text: "Le meilleur d'entre vous est celui qui est le meilleur pour sa famille.",
    source: "Hadith — Ibn Majah",
  },
  {
    title: "Aimer pour l'autre",
    text: "Nul d'entre vous n'est croyant tant qu'il n'aime pas pour son frère ce qu'il aime pour lui-même.",
    source: "Hadith — Bukhari",
  },
  {
    title: "Le temps est une amana",
    text: "Deux bienfaits dont beaucoup sont privés : la santé et le temps libre. Utilisez-les avec sagesse.",
    source: "Hadith — Bukhari",
  },
  {
    title: "La générosité du cœur",
    text: "La charité ne diminue jamais un bien. Donnez, même par une bonne parole.",
    source: "Hadith — Muslim",
  },
  {
    title: "Fuir la médisance",
    text: "Ne médisez pas les uns des autres. Protégez l'honneur de ceux que vous rencontrez.",
    source: "Coran 49:12",
  },
  {
    title: "Le meilleur des trésors",
    text: "Le meilleur trésor de ce monde est une épouse ou un époux pieux.",
    source: "Hadith — Muslim",
  },
  {
    title: "Agir avec constance",
    text: "Les œuvres les plus aimées d'Allah sont les plus régulières, même modestes.",
    source: "Hadith — Bukhari & Muslim",
  },
];

/** Numéro du jour depuis l'époque, en heure locale (change chaque minuit). */
export function dayIndex(date: Date = new Date()): number {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(local.getTime() / 86_400_000);
}

/** Rappel du jour : rotation déterministe sur la liste. */
export function getDailyReminder(date: Date = new Date()): DailyReminder {
  const list = REMINDERS;
  const idx = ((dayIndex(date) % list.length) + list.length) % list.length;
  return list[idx]!;
}
