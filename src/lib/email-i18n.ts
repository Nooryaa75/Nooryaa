/**
 * Textes des notifications (emails + centre de notifications in-app)
 * traduits en français, anglais et arabe.
 * Utilisé côté serveur : aucun import React ici.
 */

export type MailLocale = "fr" | "en" | "ar";

export function normalizeLocale(value: unknown): MailLocale {
  const v = String(value ?? "").toLowerCase();
  if (v.startsWith("en")) return "en";
  if (v.startsWith("ar")) return "ar";
  return "fr";
}

export function isRtl(locale: MailLocale) {
  return locale === "ar";
}

type Copy = {
  greeting: (name: string) => string;
  footer: (accountUrl: string) => string;
  memberFallback: string;
  // notifications sociales
  like: { subject: (who: string, site: string) => string; title: string; body: (who: string, site: string) => string; cta: string; inApp: (who: string) => string };
  match: { subject: (who: string) => string; title: string; body: (who: string, site: string) => string; cta: string; inApp: (who: string) => string };
  message: { subject: (who: string) => string; title: string; body: (who: string, site: string) => string; cta: string; inApp: (who: string) => string };
  visit: { subject: (who: string) => string; title: string; body: (who: string, site: string) => string; cta: string; inApp: (who: string) => string };
  // transactionnels
  welcome: { subject: (site: string) => string; title: (site: string) => string; body: (site: string) => string; cta: string };
  confirmation: { subject: (site: string) => string; title: string; body: (site: string) => string; cta: string };
  reset: { subject: (site: string) => string; title: string; body: (site: string) => string; cta: string };
  suspend: { subject: (site: string) => string; title: string; body: (site: string) => string; cta: string };
  deleted: { subject: (site: string) => string; title: string; body: (site: string) => string; cta: (site: string) => string };
  reasonLabel: string;
  selfie: {
    subject: (site: string) => string;
    title: string;
    body: (site: string) => string;
    cta: string;
    inAppTitle: string;
    inAppBody: string;
  };
};

const fr: Copy = {
  greeting: (name) => `Assalamu alaykum ${name},`.replace(/\s+,/, ","),
  footer: (url) =>
    `Vous recevez cet email car vos préférences de notification l'autorisent. Vous pouvez les modifier à tout moment dans <a href="${url}" style="color:#3b2a7a;">Mon compte → Mes notifications</a>.`,
  memberFallback: "Un membre",
  like: {
    subject: (who, site) => `${who} vous a liké sur ${site} 💜`,
    title: "Vous avez un nouveau coup de cœur",
    body: (who, site) => `<strong>${who}</strong> vient de vous liker sur ${site}. Découvrez son profil et, si le cœur y est, likez à votre tour pour ouvrir la conversation.`,
    cta: "Voir qui m'a liké",
    inApp: (who) => `${who} vous a liké`,
  },
  match: {
    subject: (who) => `C'est un match avec ${who} ! 🎉`,
    title: "Vous avez un nouveau match",
    body: (who, site) => `Vous et <strong>${who}</strong> vous êtes likés mutuellement. Vous pouvez désormais échanger dans le respect de la charte ${site}.`,
    cta: "Démarrer la conversation",
    inApp: (who) => `C'est un match avec ${who} !`,
  },
  message: {
    subject: (who) => `Nouveau message de ${who}`,
    title: "Vous avez reçu un message",
    body: (who, site) => `<strong>${who}</strong> vous a envoyé un message sur ${site}.`,
    cta: "Lire le message",
    inApp: (who) => `Nouveau message de ${who}`,
  },
  visit: {
    subject: (who) => `${who} a consulté votre profil`,
    title: "Votre profil a été consulté",
    body: (who, site) => `<strong>${who}</strong> a récemment visité votre profil sur ${site}.`,
    cta: "Voir mon profil",
    inApp: (who) => `${who} a consulté votre profil`,
  },
  welcome: {
    subject: (site) => `Bienvenue sur ${site} 🌙`,
    title: (site) => `Bienvenue sur ${site}`,
    body: (site) => `<p>Bienvenue sur <strong>${site}</strong>, la plateforme de rencontre pensée pour les musulmans qui souhaitent construire une relation sérieuse, dans le respect et la bienveillance.</p>
       <p>Pour bien démarrer :</p>
       <ul style="margin:0;padding-left:20px;">
         <li>Complétez votre fiche profil (photos, pratique, projets…) ;</li>
         <li>Réalisez votre selfie de vérification pour obtenir le badge ;</li>
         <li>Découvrez les profils recommandés près de chez vous.</li>
       </ul>
       <p style="margin-top:12px;">Qu'Allah facilite vos démarches et vous accorde un compagnon ou une compagne qui vous apaise le cœur.</p>`,
    cta: "Compléter mon profil",
  },
  confirmation: {
    subject: (site) => `Confirmez votre inscription sur ${site}`,
    title: "Confirmez votre adresse email",
    body: (site) => `<p>Merci de rejoindre <strong>${site}</strong>. Pour activer votre compte et accéder à la plateforme, cliquez sur le bouton ci-dessous :</p>`,
    cta: "Confirmer mon email",
  },
  reset: {
    subject: (site) => `Réinitialisez votre mot de passe ${site}`,
    title: "Réinitialisation de votre mot de passe",
    body: (site) => `<p>Vous avez demandé à réinitialiser le mot de passe de votre compte <strong>${site}</strong>.</p>
       <p>Ce lien est valable <strong>1 heure</strong> et ne peut être utilisé qu'une seule fois.</p>
       <p style="color:#8a83a6;font-size:13px;">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email : votre mot de passe reste inchangé.</p>`,
    cta: "Choisir un nouveau mot de passe",
  },
  suspend: {
    subject: (site) => `Confirmation : votre compte ${site} est suspendu`,
    title: "Votre compte est suspendu",
    body: (site) => `<p>Nous confirmons la <strong>suspension</strong> de votre compte ${site}.</p>
       <p>Concrètement :</p>
       <ul style="margin:0;padding-left:20px;">
         <li>Votre profil n'est plus visible par les autres membres ;</li>
         <li>Vos conversations, photos et coups de cœur sont conservés ;</li>
         <li>Vous ne recevez plus aucune notification ;</li>
         <li>Vous pouvez réactiver votre compte à tout moment en contactant notre service client.</li>
       </ul>`,
    cta: "Contacter le service client",
  },
  deleted: {
    subject: (site) => `Confirmation : votre compte ${site} a été supprimé`,
    title: "Votre compte a été supprimé",
    body: (site) => `<p>Nous confirmons la <strong>suppression définitive</strong> de votre compte ${site}.</p>
       <p>Concrètement :</p>
       <ul style="margin:0;padding-left:20px;">
         <li>Votre profil, vos photos, vos messages, vos coups de cœur et vos recherches ont été effacés ;</li>
         <li>Votre abonnement éventuel n'est plus renouvelé ;</li>
         <li>Cette action est irréversible : ces données ne peuvent pas être restaurées ;</li>
         <li>Vous pouvez créer un nouveau compte plus tard si vous le souhaitez.</li>
       </ul>`,
    cta: (site) => `Revenir sur ${site}`,
  },
  reasonLabel: "Motif indiqué",
  selfie: {
    subject: (site) => `${site} : refaites votre vérification par selfie`,
    title: "Vérification de votre profil à refaire",
    body: (site) => `<p>Lors de l'ajout d'une nouvelle photo sur votre profil <strong>${site}</strong>, notre contrôle automatique n'a pas pu confirmer qu'il s'agit bien de vous. Par mesure de sécurité, votre badge « Profil vérifié » a été temporairement retiré.</p>`,
    cta: "Refaire ma vérification",
    inAppTitle: "Vérification de votre profil à refaire",
    inAppBody: "Une de vos nouvelles photos n'a pas pu être confirmée. Refaites la vérification par selfie depuis Mon compte pour retrouver votre badge « Profil vérifié ».",
  },
};

const en: Copy = {
  greeting: (name) => `Assalamu alaykum ${name},`.replace(/\s+,/, ","),
  footer: (url) =>
    `You are receiving this email because your notification preferences allow it. You can change them any time in <a href="${url}" style="color:#3b2a7a;">My account → My notifications</a>.`,
  memberFallback: "A member",
  like: {
    subject: (who, site) => `${who} liked you on ${site} 💜`,
    title: "You have a new like",
    body: (who, site) => `<strong>${who}</strong> just liked you on ${site}. Take a look at their profile and, if you feel the same, like them back to start the conversation.`,
    cta: "See who liked me",
    inApp: (who) => `${who} liked you`,
  },
  match: {
    subject: (who) => `It's a match with ${who}! 🎉`,
    title: "You have a new match",
    body: (who, site) => `You and <strong>${who}</strong> liked each other. You can now chat, respecting the ${site} charter.`,
    cta: "Start the conversation",
    inApp: (who) => `It's a match with ${who}!`,
  },
  message: {
    subject: (who) => `New message from ${who}`,
    title: "You have a new message",
    body: (who, site) => `<strong>${who}</strong> sent you a message on ${site}.`,
    cta: "Read the message",
    inApp: (who) => `New message from ${who}`,
  },
  visit: {
    subject: (who) => `${who} viewed your profile`,
    title: "Your profile was viewed",
    body: (who, site) => `<strong>${who}</strong> recently visited your profile on ${site}.`,
    cta: "View my profile",
    inApp: (who) => `${who} viewed your profile`,
  },
  welcome: {
    subject: (site) => `Welcome to ${site} 🌙`,
    title: (site) => `Welcome to ${site}`,
    body: (site) => `<p>Welcome to <strong>${site}</strong>, the dating platform made for Muslims who want to build a serious relationship, with respect and kindness.</p>
       <p>To get started:</p>
       <ul style="margin:0;padding-left:20px;">
         <li>Complete your profile (photos, practice, plans…);</li>
         <li>Take your verification selfie to earn the badge;</li>
         <li>Discover recommended profiles near you.</li>
       </ul>
       <p style="margin-top:12px;">May Allah make your journey easy and grant you a spouse who brings peace to your heart.</p>`,
    cta: "Complete my profile",
  },
  confirmation: {
    subject: (site) => `Confirm your ${site} registration`,
    title: "Confirm your email address",
    body: (site) => `<p>Thank you for joining <strong>${site}</strong>. To activate your account and access the platform, click the button below:</p>`,
    cta: "Confirm my email",
  },
  reset: {
    subject: (site) => `Reset your ${site} password`,
    title: "Reset your password",
    body: (site) => `<p>You asked to reset the password of your <strong>${site}</strong> account.</p>
       <p>This link is valid for <strong>1 hour</strong> and can only be used once.</p>
       <p style="color:#8a83a6;font-size:13px;">If you did not request this, simply ignore this email: your password stays unchanged.</p>`,
    cta: "Choose a new password",
  },
  suspend: {
    subject: (site) => `Confirmation: your ${site} account is suspended`,
    title: "Your account is suspended",
    body: (site) => `<p>We confirm the <strong>suspension</strong> of your ${site} account.</p>
       <p>What this means:</p>
       <ul style="margin:0;padding-left:20px;">
         <li>Your profile is no longer visible to other members;</li>
         <li>Your conversations, photos and likes are kept;</li>
         <li>You no longer receive any notification;</li>
         <li>You can reactivate your account any time by contacting our support team.</li>
       </ul>`,
    cta: "Contact support",
  },
  deleted: {
    subject: (site) => `Confirmation: your ${site} account has been deleted`,
    title: "Your account has been deleted",
    body: (site) => `<p>We confirm the <strong>permanent deletion</strong> of your ${site} account.</p>
       <p>What this means:</p>
       <ul style="margin:0;padding-left:20px;">
         <li>Your profile, photos, messages, likes and searches have been erased;</li>
         <li>Any subscription is no longer renewed;</li>
         <li>This action is irreversible: this data cannot be restored;</li>
         <li>You can create a new account later if you wish.</li>
       </ul>`,
    cta: (site) => `Back to ${site}`,
  },
  reasonLabel: "Reason given",
  selfie: {
    subject: (site) => `${site}: please redo your selfie verification`,
    title: "Your profile verification must be redone",
    body: (site) => `<p>When a new photo was added to your <strong>${site}</strong> profile, our automatic check could not confirm that it is really you. As a security measure, your "Verified profile" badge was temporarily removed.</p>`,
    cta: "Redo my verification",
    inAppTitle: "Your profile verification must be redone",
    inAppBody: "One of your new photos could not be confirmed. Redo the selfie verification from My account to get your \"Verified profile\" badge back.",
  },
};

const ar: Copy = {
  greeting: (name) => `السلام عليكم ${name}،`.replace(/\s+،/, "،"),
  footer: (url) =>
    `تصلك هذه الرسالة لأن تفضيلات الإشعارات لديك تسمح بذلك. يمكنك تعديلها في أي وقت من <a href="${url}" style="color:#3b2a7a;">حسابي ← إشعاراتي</a>.`,
  memberFallback: "أحد الأعضاء",
  like: {
    subject: (who, site) => `${who} أعجب بك على ${site} 💜`,
    title: "لديك إعجاب جديد",
    body: (who, site) => `<strong>${who}</strong> أبدى إعجابه بك على ${site}. اطّلع على الملف الشخصي، وإن أعجبك بدوره فبادل الإعجاب لبدء المحادثة.`,
    cta: "من أعجب بي",
    inApp: (who) => `${who} أعجب بك`,
  },
  match: {
    subject: (who) => `توافق جديد مع ${who}! 🎉`,
    title: "لديك توافق جديد",
    body: (who, site) => `أنت و<strong>${who}</strong> أبديتما إعجابًا متبادلًا. يمكنكما الآن التحادث مع احترام ميثاق ${site}.`,
    cta: "بدء المحادثة",
    inApp: (who) => `توافق جديد مع ${who}!`,
  },
  message: {
    subject: (who) => `رسالة جديدة من ${who}`,
    title: "لديك رسالة جديدة",
    body: (who, site) => `أرسل لك <strong>${who}</strong> رسالة على ${site}.`,
    cta: "قراءة الرسالة",
    inApp: (who) => `رسالة جديدة من ${who}`,
  },
  visit: {
    subject: (who) => `${who} زار ملفك الشخصي`,
    title: "تمت زيارة ملفك الشخصي",
    body: (who, site) => `زار <strong>${who}</strong> ملفك الشخصي مؤخرًا على ${site}.`,
    cta: "عرض ملفي",
    inApp: (who) => `${who} زار ملفك الشخصي`,
  },
  welcome: {
    subject: (site) => `مرحبًا بك في ${site} 🌙`,
    title: (site) => `مرحبًا بك في ${site}`,
    body: (site) => `<p>مرحبًا بك في <strong>${site}</strong>، منصة التعارف المخصصة للمسلمين الراغبين في علاقة جادة قائمة على الاحترام وحسن الخلق.</p>
       <p>للبدء:</p>
       <ul style="margin:0;padding-right:20px;">
         <li>أكمل ملفك الشخصي (الصور، الالتزام، المشاريع…)؛</li>
         <li>التقط صورة سيلفي للتحقق للحصول على الشارة؛</li>
         <li>اكتشف الملفات المقترحة القريبة منك.</li>
       </ul>
       <p style="margin-top:12px;">نسأل الله أن ييسر أمرك ويرزقك زوجًا تسكن إليه.</p>`,
    cta: "إكمال ملفي",
  },
  confirmation: {
    subject: (site) => `أكد تسجيلك في ${site}`,
    title: "أكد بريدك الإلكتروني",
    body: (site) => `<p>شكرًا لانضمامك إلى <strong>${site}</strong>. لتفعيل حسابك والدخول إلى المنصة، اضغط على الزر أدناه:</p>`,
    cta: "تأكيد بريدي",
  },
  reset: {
    subject: (site) => `إعادة تعيين كلمة مرور ${site}`,
    title: "إعادة تعيين كلمة المرور",
    body: (site) => `<p>لقد طلبت إعادة تعيين كلمة مرور حسابك على <strong>${site}</strong>.</p>
       <p>هذا الرابط صالح لمدة <strong>ساعة واحدة</strong> ويُستعمل مرة واحدة فقط.</p>
       <p style="color:#8a83a6;font-size:13px;">إن لم تكن صاحب الطلب، تجاهل هذه الرسالة: كلمة مرورك تبقى كما هي.</p>`,
    cta: "اختيار كلمة مرور جديدة",
  },
  suspend: {
    subject: (site) => `تأكيد: تم تعليق حسابك على ${site}`,
    title: "تم تعليق حسابك",
    body: (site) => `<p>نؤكد <strong>تعليق</strong> حسابك على ${site}.</p>
       <p>ما يعنيه ذلك:</p>
       <ul style="margin:0;padding-right:20px;">
         <li>لم يعد ملفك ظاهرًا للأعضاء الآخرين؛</li>
         <li>يتم الاحتفاظ بمحادثاتك وصورك وإعجاباتك؛</li>
         <li>لن تصلك أي إشعارات؛</li>
         <li>يمكنك إعادة تفعيل حسابك في أي وقت بالتواصل مع خدمة العملاء.</li>
       </ul>`,
    cta: "التواصل مع خدمة العملاء",
  },
  deleted: {
    subject: (site) => `تأكيد: تم حذف حسابك على ${site}`,
    title: "تم حذف حسابك",
    body: (site) => `<p>نؤكد <strong>الحذف النهائي</strong> لحسابك على ${site}.</p>
       <p>ما يعنيه ذلك:</p>
       <ul style="margin:0;padding-right:20px;">
         <li>تم محو ملفك وصورك ورسائلك وإعجاباتك وعمليات بحثك؛</li>
         <li>لن يتم تجديد أي اشتراك؛</li>
         <li>هذا الإجراء نهائي ولا يمكن استرجاع البيانات؛</li>
         <li>يمكنك إنشاء حساب جديد لاحقًا إن رغبت.</li>
       </ul>`,
    cta: (site) => `العودة إلى ${site}`,
  },
  reasonLabel: "السبب المذكور",
  selfie: {
    subject: (site) => `${site}: أعد التحقق بصورة سيلفي`,
    title: "يجب إعادة التحقق من ملفك",
    body: (site) => `<p>عند إضافة صورة جديدة إلى ملفك على <strong>${site}</strong>، لم يتمكن الفحص التلقائي من تأكيد أنها لك. ولأسباب أمنية، تم سحب شارة «ملف موثّق» مؤقتًا.</p>`,
    cta: "إعادة التحقق",
    inAppTitle: "يجب إعادة التحقق من ملفك",
    inAppBody: "تعذّر تأكيد إحدى صورك الجديدة. أعد التحقق بصورة سيلفي من «حسابي» لاستعادة شارة «ملف موثّق».",
  },
};

export const EMAIL_COPY: Record<MailLocale, Copy> = { fr, en, ar };

export function copyFor(locale: unknown): Copy {
  return EMAIL_COPY[normalizeLocale(locale)];
}
