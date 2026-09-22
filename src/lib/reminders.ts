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

const REMINDER_TRANSLATIONS: Record<"en" | "ar", Array<Pick<DailyReminder, "title" | "text">>> = {
  en: [
    { title: "Sincerity brings serenity", text: "Actions are judged by intentions. Be genuine; the right person will appreciate your honesty." },
    { title: "Lower your gaze", text: "Guarding your gaze and modesty protects your heart for the person Allah has destined for you." },
    { title: "Marriage, half of faith", text: "When a servant marries, they complete half of their faith; let them remain mindful of Allah regarding the other half." },
    { title: "Choose for faith", text: "A person is married for four reasons; choose the one committed to faith and you will prosper." },
    { title: "Gentleness beautifies everything", text: "Gentleness is not found in anything without beautifying it. Be gentle in your conversations." },
    { title: "Good character", text: "The best among you are those who are best to their spouse." },
    { title: "Patience is light", text: "What is meant for you will not pass you by. Be patient and trust Allah’s decree." },
    { title: "Pray for your future", text: "Perform the prayer of guidance (istikhara) before every important decision." },
    { title: "Protect privacy", text: "Do not reveal what Allah has concealed; keep your conversations dignified and discreet." },
    { title: "Speak good or remain silent", text: "Whoever believes in Allah and the Last Day should speak good or remain silent." },
    { title: "Trust in Allah", text: "If you relied upon Allah as He deserves, He would provide for you." },
    { title: "Remembrance calms hearts", text: "Surely, it is in the remembrance of Allah that hearts find peace." },
    { title: "Honesty in your profile", text: "Truthfulness leads to righteousness. Describe yourself sincerely, without exaggeration." },
    { title: "Respect in every situation", text: "A polite refusal is better than hurtful silence. Respect the person who writes to you." },
    { title: "Involve those close to you", text: "A marriage project is built with clarity: involve your family or a wali as soon as possible." },
    { title: "Prayer comes first", text: "The first thing a servant will be questioned about on the Day of Judgment is prayer." },
    { title: "Gratitude brings increase", text: "If you are grateful, I will certainly give you more." },
    { title: "Avoid suspicion", text: "Avoid excessive suspicion, for some suspicions are sinful." },
    { title: "A smile is charity", text: "Your smile to your brother is charity. Begin your conversations with kindness." },
    { title: "Make things easy", text: "Make things easy and do not make them difficult; give glad tidings and do not drive people away." },
    { title: "Seek forgiveness often", text: "Whoever persists in seeking forgiveness, Allah grants them a way out of every difficulty." },
    { title: "Modesty is part of faith", text: "Modesty is a branch of faith; preserve it in your online conversations." },
    { title: "The best marriages", text: "The most blessed marriage is the one with the least expense." },
    { title: "Never despair", text: "Never despair of Allah’s mercy. With hardship comes ease." },
    { title: "Goodness begins at home", text: "The best among you is the one who is best to their family." },
    { title: "Love for others", text: "None of you truly believes until they love for their brother what they love for themselves." },
    { title: "Time is a trust", text: "Two blessings many people waste are health and free time. Use them wisely." },
    { title: "Generosity of heart", text: "Charity never decreases wealth. Give, even if only through a kind word." },
    { title: "Avoid backbiting", text: "Do not backbite one another. Protect the honour of those you meet." },
    { title: "The finest treasure", text: "The finest treasure in this world is a righteous wife or husband." },
    { title: "Be consistent", text: "The deeds most beloved to Allah are those done consistently, even if small." },
  ],
  ar: [
    { title: "الإخلاص يجلب الطمأنينة", text: "إنما الأعمال بالنيات. كن صادقًا، فالشخص المناسب سيقدّر صدقك." },
    { title: "غضّ البصر", text: "حفظ البصر والحياء يصون قلبك لمن قدّره الله لك." },
    { title: "الزواج نصف الدين", text: "إذا تزوج العبد فقد استكمل نصف دينه، فليتق الله في النصف الباقي." },
    { title: "الاختيار على أساس الدين", text: "تُنكح المرأة لأربع؛ فاظفر بذات الدين تسعد." },
    { title: "الرفق يزيّن كل شيء", text: "ما كان الرفق في شيء إلا زانه. تحلَّ بالرفق في حواراتك." },
    { title: "حسن الخلق", text: "خيركم خيركم لأهله وزوجه." },
    { title: "الصبر نور", text: "ما كُتب لك لن يفوتك. اصبر وثق بقضاء الله." },
    { title: "ادعُ لمستقبلك", text: "صلِّ صلاة الاستخارة قبل كل قرار مهم." },
    { title: "احفظ الخصوصية", text: "لا تكشف ما ستره الله، وحافظ على كرامة وسرية حواراتك." },
    { title: "قل خيرًا أو اصمت", text: "من كان يؤمن بالله واليوم الآخر فليقل خيرًا أو ليصمت." },
    { title: "التوكل على الله", text: "لو توكلتم على الله حق توكله لرزقكم." },
    { title: "ذكر الله يطمئن القلوب", text: "ألا بذكر الله تطمئن القلوب." },
    { title: "الصدق في ملفك الشخصي", text: "الصدق يهدي إلى البر. عرّف بنفسك بصدق ومن دون مبالغة." },
    { title: "الاحترام في كل الأحوال", text: "الرفض بلطف خير من صمت جارح. احترم من يراسلك." },
    { title: "أشرك المقرّبين منك", text: "مشروع الزواج يُبنى على الوضوح؛ أشرك عائلتك أو وليّك في أقرب وقت." },
    { title: "الصلاة أولًا", text: "أول ما يُحاسب عليه العبد يوم القيامة صلاته." },
    { title: "الشكر سبب للزيادة", text: "لئن شكرتم لأزيدنكم." },
    { title: "اجتنب سوء الظن", text: "اجتنبوا كثيرًا من الظن، إن بعض الظن إثم." },
    { title: "الابتسامة صدقة", text: "تبسّمك في وجه أخيك صدقة. ابدأ حواراتك بلطف." },
    { title: "يسّر ولا تعسّر", text: "يسّروا ولا تعسّروا، وبشّروا ولا تنفّروا." },
    { title: "أكثر من الاستغفار", text: "من لزم الاستغفار جعل الله له من كل ضيق مخرجًا." },
    { title: "الحياء من الإيمان", text: "الحياء شعبة من الإيمان؛ فحافظ عليه في حواراتك عبر الإنترنت." },
    { title: "أبرك الزيجات", text: "أعظم الزواج بركة أيسره مؤونة." },
    { title: "لا تيأس أبدًا", text: "لا تيأس من رحمة الله. إن مع العسر يسرًا." },
    { title: "الخير يبدأ من البيت", text: "خيركم خيركم لأهله." },
    { title: "أحب لغيرك", text: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه." },
    { title: "الوقت أمانة", text: "نعمتان مغبون فيهما كثير من الناس: الصحة والفراغ. فاستعملهما بحكمة." },
    { title: "سخاء القلب", text: "ما نقص مال من صدقة. أعطِ ولو بكلمة طيبة." },
    { title: "اجتنب الغيبة", text: "لا يغتب بعضكم بعضًا. احفظ كرامة من تقابلهم." },
    { title: "خير متاع الدنيا", text: "خير متاع الدنيا الزوج أو الزوجة الصالحة." },
    { title: "داوم على العمل", text: "أحب الأعمال إلى الله أدومها وإن قل." },
  ],
};

const SOURCE_NAMES: Record<string, { en: string; ar: string }> = {
  "Bukhari & Muslim": { en: "Bukhari & Muslim", ar: "البخاري ومسلم" },
  Bukhari: { en: "Bukhari", ar: "البخاري" },
  Muslim: { en: "Muslim", ar: "مسلم" },
  Tirmidhi: { en: "Tirmidhi", ar: "الترمذي" },
};

function localizeSource(source: string | undefined, locale: "fr" | "en" | "ar") {
  if (!source || locale === "fr") return source;
  let out = locale === "en" ? source.replace("Coran", "Quran") : source.replace("Hadith", "حديث").replace("Coran", "القرآن");
  if (locale === "ar") {
    for (const [name, tr] of Object.entries(SOURCE_NAMES)) {
      out = out.replace(name, tr.ar);
    }
  }
  return out;
}

/** Numéro du jour depuis l'époque, en heure locale (change chaque minuit). */
export function dayIndex(date: Date = new Date()): number {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(local.getTime() / 86_400_000);
}

/** Rappel du jour : rotation déterministe sur la liste. */
export function getDailyReminder(date: Date = new Date(), locale: "fr" | "en" | "ar" = "fr"): DailyReminder {
  const list = REMINDERS;
  const idx = ((dayIndex(date) % list.length) + list.length) % list.length;
  const reminder = list[idx]!;
  if (locale === "fr") return reminder;
  const translated = REMINDER_TRANSLATIONS[locale][idx];
  return translated ? { ...translated, source: localizeSource(reminder.source, locale) } : reminder;
}
