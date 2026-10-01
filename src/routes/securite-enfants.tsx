import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, ChevronLeft, Baby } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Section = { title: string; body: string };

const CONTENT: Record<"fr" | "en" | "ar", { title: string; intro: string; sections: Section[] }> = {
  fr: {
    title: "Normes de sécurité des enfants",
    intro:
      "Nooryaa applique une politique de tolérance zéro à l'égard de toute forme d'exploitation ou d'abus sexuel de mineurs, conformément au Règlement sur les normes liées à la sécurité des enfants de Google Play et à la législation applicable.",
    sections: [
      {
        title: "1. Service strictement réservé aux adultes",
        body: "Nooryaa est un service de mise en relation réservé exclusivement aux personnes de 18 ans et plus. L'âge est contrôlé à l'inscription (date de naissance obligatoire). Tout compte identifié comme appartenant à un mineur, ou toute photo ou contenu représentant un mineur, est immédiatement supprimé et le compte est banni définitivement.",
      },
      {
        title: "2. Interdictions absolues",
        body: "Sont strictement interdits et immédiatement sanctionnés, sans avertissement : tout contenu sexualisé impliquant des mineurs ; toute tentative de contacter des mineurs ; toute usurpation d'identité d'un mineur ou prétendue mineure ; toute sollicitation d'un mineur ; toute publication, partage ou sollicitation de contenu de maltraitance ou d'abus sexuel sur mineur, y compris sous forme de dessins, images générées ou simulées.",
      },
      {
        title: "3. Vérification de l'identité",
        body: "Chaque profil est vérifié par selfie (comparaison avec les photos de profil, analysées automatiquement puis validées). Les photos incohérentes avec l'âge déclaré ou représentant des mineurs sont refusées. L'unicité du compte (email, téléphone, prénom et nom) limite la création de faux profils.",
      },
      {
        title: "4. Modération et détection",
        body: "Les photos, le texte de profil et les messages signalés font l'objet d'une modération automatique et humaine. Tout contenu suspect impliquant un mineur est supprimé, le compte est banni et, lorsque la loi l'exige, les éléments sont signalés aux autorités compétentes et aux organisations de lutte contre les abus sur mineurs.",
      },
      {
        title: "5. Signalement",
        body: "Tout membre peut signaler un profil, une photo ou un message depuis la fiche ou la conversation concernée (bouton Signaler). Chaque signalement est examiné par notre équipe de modération. Les signalements graves concernant la sécurité d'un enfant sont traités en priorité et transmis aux autorités lorsque la loi l'exige.",
      },
      {
        title: "6. Blocage et contrôle par les utilisateurs",
        body: "Chaque membre peut bloquer un autre membre depuis une conversation ou une fiche profil : le contact bloqué ne peut plus envoyer de messages ni voir le profil. Les photos de profil peuvent être floutées à la demande du propriétaire et révélées uniquement à qui il décide.",
      },
      {
        title: "7. Coopération avec les autorités",
        body: "Nooryaa coopère pleinement avec les autorités judiciaires et les organisations compétentes en matière de protection de l'enfance, et communique les informations nécessaires dans le cadre légal (réquisitions, mandats) tout en protégeant les données des membres.",
      },
      {
        title: "8. Ressources d'aide",
        body: "En France : 3018 (numéro gratuit contre les violences numériques faites aux mineurs) et e-Enfance (www.e-enfance.org). En Europe : la ligne 116 111 (Enfance en danger en France, www.enfance-et-partage.org / 119 allo enfance en danger). En cas d'urgence impliquant la sécurité d'un enfant, contactez immédiatement les services de police ou de gendarmerie (17).",
      },
      {
        title: "9. Contact",
        body: "Pour toute question relative aux présentes normes : contact@nooryaa.com. Éditeur : BK Company, 7 bis allée de Chelles, 93340 Le Raincy, RCS Bobigny n° 130 260 730.",
      },
    ],
  },
  en: {
    title: "Child Safety Standards",
    intro:
      "Nooryaa enforces a zero-tolerance policy against any form of child exploitation or sexual abuse, in line with Google Play's Child Safety Standards policy and applicable law.",
    sections: [
      {
        title: "1. Strictly adults only",
        body: "Nooryaa is a matchmaking service exclusively for people aged 18 and over. Age is verified at sign-up (mandatory date of birth). Any account identified as belonging to a minor, or any photo or content depicting a minor, is immediately removed and the account is permanently banned.",
      },
      {
        title: "2. Absolute prohibitions",
        body: "The following are strictly prohibited and immediately sanctioned, without warning: any sexualized content involving minors; any attempt to contact minors; impersonating a minor or pretending to be one; soliciting a minor; any publication, sharing or solicitation of child sexual abuse material, including drawings, AI-generated or simulated content.",
      },
      {
        title: "3. Identity verification",
        body: "Every profile is verified by selfie (compared with profile photos, analysed automatically then reviewed). Photos inconsistent with the stated age or depicting minors are rejected. One account per person (email, phone, first and last name) limits fake profile creation.",
      },
      {
        title: "4. Moderation and detection",
        body: "Photos, profile text and reported messages are subject to automated and human moderation. Any suspicious content involving a minor is removed, the account is banned and, where required by law, the evidence is reported to the relevant authorities and child protection organisations.",
      },
      {
        title: "5. Reporting",
        body: "Any member can report a profile, photo or message directly from the profile or conversation (Report button). Every report is reviewed by our moderation team. Serious reports concerning child safety are prioritised and escalated to the authorities where required by law.",
      },
      {
        title: "6. User controls",
        body: "Members can block other members from a conversation or profile: blocked members can no longer send messages or see the profile. Profile photos can be blurred at the owner's request and revealed only to people the owner chooses.",
      },
      {
        title: "7. Cooperation with authorities",
        body: "Nooryaa fully cooperates with law enforcement and child protection organisations and provides the necessary information within the legal framework (requests, warrants) while protecting members' data.",
      },
      {
        title: "8. Help resources",
        body: "In France: 3018 (free helpline against digital violence against minors) and 119 (Allô Enfance en danger). In Europe: 116 111 child helpline. In any emergency involving a child's safety, contact the police immediately.",
      },
      {
        title: "9. Contact",
        body: "For any question about these standards: contact@nooryaa.com. Publisher: BK Company, 7 bis allée de Chelles, 93340 Le Raincy, France, RCS Bobigny no. 130 260 730.",
      },
    ],
  },
  ar: {
    title: "معايير سلامة الأطفال",
    intro:
      "تطبّق Nooryaa سياسة تسامح مطلق تجاه أي شكل من أشكال استغلال الأطفال أو الاعتداء عليهم، وفقاً لمعايير سلامة الأطفال في متجر Google Play والقوانين المعمول بها.",
    sections: [
      {
        title: "1. خدمة مخصّصة للبالغين فقط",
        body: "خدمة Nooryaa مخصّصة حصرياً للأشخاص البالغين 18 عاماً وأكثر. يتم التحقق من العمر عند التسجيل (تاريخ الميلاد إلزامي). أي حساب يُتبين أنه يعود لقاصر، أو أي صورة أو محتوى يمثل قاصراً، يُحذف فوراً ويُحظر الحساب نهائياً.",
      },
      {
        title: "2. ممنوعات مطلقة",
        body: "يُمنع منعاً باتاً ويُعاقَب عليه فوراً دون إنذار: أي محتوى جنسي يتضمن قاصراً؛ أي محاولة للتواصل مع قاصراً؛ انتحال شخصية قاصر أو التظاهر بأنّه قاصر؛ استدراج قاصر؛ نشر أو مشاركة أو طلب أي محتوى لاستغلال أو اعتداء على الأطفال، بما في ذلك الرسومات أو المحتوى المُولَّد بالذكاء الاصطناعي أو المُحاكى.",
      },
      {
        title: "3. التحقق من الهوية",
        body: "يتم التحقق من كل ملف شخصي عبر سيلفي (مقارنة مع صور الملف الشخصي، تُحلَّل آلياً ثم تُراجَع). تُرفض الصور غير المتوافقة مع العمر المعلن أو التي تمثل قاصراً. حساب واحد لكل شخص (البريد، الهاتف، الاسم الأول والعائلة) يحدّ من إنشاء الحسابات المزيفة.",
      },
      {
        title: "4. الإشراف والكشف",
        body: "تخضع الصور ونصوص الملف الشخصي والرسائل المُبلَّغ عنها لإشراف آلي وبشري. يُحذف أي محتوى مريب يتضمن قاصراً، ويُحظر الحساب، وعندما يقتضي القانون، تُبلَّغ الجهات المختصة والمنظمات المعنية بحماية الأطفال.",
      },
      {
        title: "5. الإبلاغ",
        body: "يمكن لأي عضو الإبلاغ عن ملف شخصي أو صورة أو رسالة من الملف أو المحادثة نفسها (زر الإبلاغ). تدرس فريق الإشراف كل بلاغ. تُعالَج البلاغات الخطيرة المتعلقة بسلامة الأطفال كأولوية وتُحال إلى الجهات المختصة عند الاقتضاء.",
      },
      {
        title: "6. إجراءات الحماية للمستخدمين",
        body: "يمكن للأعضاء حظر بعضهم البعض من المحادثة أو الملف الشخصي: لا يستطيع المحظور إرسال الرسائل أو الاطلاع على الملف. يمكن ضبابية صور الملف الشخصي بطلب صاحبها وإظهارها فقط لمن يقرر هو.",
      },
      {
        title: "7. التعاون مع الجهات المختصة",
        body: "تتعاون Nooryaa بشكل كامل مع السلطات القضائية والمنظمات المعنية بحماية الطفل، وتقدّم المعلومات اللازمة في الإطار القانوني مع حماية بيانات الأعضاء.",
      },
      {
        title: "8. مصادر المساعدة",
        body: "في فرنسا: الرقم 3018 (مجاني لمحاربة العنف الرقمي ضد الأطفال) و119. في أوروبا: خط الطفل 116 111. في أي حالة طارئة تخص سلامة طفل، اتصل بالشرطة فوراً.",
      },
      {
        title: "9. التواصل",
        body: "لأي سؤال حول هذه المعايير: contact@nooryaa.com. الناشر: BK Company، 7 شارع Chelles، 93340 Le Raincy، فرنسا، سجل تجاري Bobigny رقم 130 260 730.",
      },
    ],
  },
};

export const Route = createFileRoute("/securite-enfants")({
  head: () => ({
    meta: [
      { title: "Normes de sécurité des enfants — Nooryaa" },
      { name: "description", content: "Normes publiées de Nooryaa contre l'exploitation et les abus sexuels sur mineurs." },
      { property: "og:title", content: "Normes de sécurité des enfants — Nooryaa" },
      { property: "og:description", content: "Normes publiées de Nooryaa contre l'exploitation et les abus sexuels sur mineurs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChildSafetyPage,
});

function ChildSafetyPage() {
  const { locale, formatDate, t } = useI18n();
  const content = CONTENT[locale] ?? CONTENT.fr;
  return (
    <div className="min-h-screen bg-background px-4 py-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="relative flex items-center justify-center">
          <Link to="/" aria-label={t("Accueil")} className="absolute start-0 text-primary">
            <ChevronLeft className="h-6 w-6 rtl-flip" />
          </Link>
          <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
            <ShieldCheck className="h-5 w-5" />
            {content.title}
          </h1>
        </div>
        <div className="space-y-5 rounded-2xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)]">
          <p className="text-xs text-muted-foreground">
            {t("Dernière mise à jour :")} {formatDate(new Date("2026-10-01"), { dateStyle: "long" })}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground flex gap-2">
            <Baby className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            {content.intro}
          </p>
          {content.sections.map((section, index) => (
            <section key={`${section.title}-${index}`} className="space-y-1.5">
              <h3 className="font-semibold">{section.title}</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
