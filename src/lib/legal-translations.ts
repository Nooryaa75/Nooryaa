import type { LegalTranslation } from "./legal-documents";

export const LEGAL_TRANSLATIONS: Record<"en" | "ar", Record<"terms" | "privacy", LegalTranslation>> = {
  "en": {
    "terms": {
      "title": "General Terms of Use",
      "sections": [
        {
          "title": "1. Purpose",
          "body": "These General Terms of Use (GTU) govern access to and use of the Nooryaa application, a matchmaking service intended for adults seeking a sincere relationship oriented towards dîn. By creating an account, you accept these GTU without reservation."
        },
        {
          "title": "2. Access Requirements",
          "body": "Registration is reserved for persons aged 18 or over. You undertake to provide accurate, up-to-date and complete information. Verification of your profile by selfie is mandatory: it helps ensure the authenticity of members. Only one account per person is permitted."
        },
        {
          "title": "3. Rules of Conduct (Adab)",
          "body": "Interactions on Nooryaa must respect a framework of benevolence and adab. The following are specifically prohibited: statements or content of a sexual, hateful, discriminatory or violent nature; harassment; identity theft or impersonation; financial solicitation; and commercial solicitation. Any breach may result in the suspension or deletion of the account."
        },
        {
          "title": "4. Moderation",
          "body": "Published content (photos, bios, and reported messages) may be subject to automated and human moderation. Non-compliant photos (nudity, a face inconsistent with the declared age, or an AI-generated image) are rejected. Reports submitted by members are handled by our moderation team."
        },
        {
          "title": "5. Intellectual Property",
          "body": "All elements of the application (trademark, logo, graphic identity and texts) are the exclusive property of Nooryaa. Any reproduction or use without authorization is prohibited. You retain the rights to the content you publish, while granting Nooryaa a license to use it as necessary for the operation of the service."
        },
        {
          "title": "6. Account Suspension and Deletion",
          "body": "Nooryaa reserves the right to suspend or delete any account that fails to comply with these GTU, without prejudice to any potential legal proceedings. You may delete your account at any time from your personal area."
        },
        {
          "title": "7. Liability",
          "body": "Nooryaa is a matchmaking service and cannot be held responsible for interactions or meetings between members. We encourage you to remain vigilant during your interactions and to prioritize exchanges within a framework consistent with dîn (moutabala)."
        },
        {
          "title": "8. Amendments to the GTU",
          "body": "Nooryaa may amend these GTU at any time. Members will be informed of any substantial amendment. Continued use of the service constitutes acceptance of the new terms."
        }
      ]
    },
    "privacy": {
      "title": "Privacy Policy",
      "sections": [
        {
          "title": "1. Data Collected",
          "body": "As part of the service, Nooryaa collects the data you provide: identity (first name, surname, username), contact details (email, telephone), date of birth, approximate location (city, GPS coordinates of your city), profile information (religious practice, family situation, activities and photos), as well as your exchanges via the messaging service."
        },
        {
          "title": "2. Purposes",
          "body": "Your data is used exclusively to: create and manage your account; offer you compatible profiles (compatibility algorithm and search by geographical proximity); ensure the moderation and security of the community; and notify you of likes, messages and service events."
        },
        {
          "title": "3. Selfie Verification",
          "body": "The verification photo (selfie) is transmitted solely for comparison with your profile photos. It is neither recorded nor retained: only the verification status (verified / unverified) is retained on your account."
        },
        {
          "title": "4. Data Sharing",
          "body": "Your data is neither sold nor shared with third parties for commercial purposes. Certain processing activities (hosting and content analysis for moderation) are carried out by technical processors subject to strict confidentiality and security obligations."
        },
        {
          "title": "5. Retention",
          "body": "Your data is retained for as long as your account remains active. If the account is deleted, the data is erased or anonymized within a reasonable period, except where legal retention obligations apply (for example, for reports that are still being processed)."
        },
        {
          "title": "6. Your Rights",
          "body": "In accordance with the RGPD, you have the right to access, rectify, erase and port your data, as well as the right to object to its processing. You may exercise these rights from your “My Account” area or by contacting us. You may also lodge a complaint with the CNIL."
        },
        {
          "title": "7. Security",
          "body": "We implement appropriate technical and organizational measures: encryption of exchanges, access controls, database-level security rules, and systematic verification of members’ identities."
        },
        {
          "title": "8. Cookies",
          "body": "The application uses only cookies and local storage that are strictly necessary for its operation (login session and preferences). No advertising cookie or third-party tracking cookie is used."
        }
      ]
    }
  },
  "ar": {
    "terms": {
      "title": "الشروط العامة للاستخدام",
      "sections": [
        {
          "title": "1. الغرض",
          "body": "تنظّم هذه الشروط العامة للاستخدام (CGU) الوصول إلى تطبيق Nooryaa واستخدامه، وهو خدمة للتوفيق بين الأشخاص مخصّصة للبالغين الذين يبحثون عن علاقة صادقة موجّهة نحو dîn. بإنشاء حساب، فإنكم تقبلون هذه الشروط العامة للاستخدام دون تحفظ."
        },
        {
          "title": "2. شروط الوصول",
          "body": "يقتصر التسجيل على الأشخاص الذين تبلغ أعمارهم 18 سنة على الأقل. وتتعهدون بتقديم معلومات دقيقة ومحدّثة وكاملة. ويُعدّ التحقق من ملفكم الشخصي بواسطة صورة سيلفي إلزامياً، إذ يساهم في ضمان أصالة الأعضاء. ولا يُسمح إلا بحساب واحد لكل شخص."
        },
        {
          "title": "3. قواعد السلوك (adab)",
          "body": "يجب أن تحترم التبادلات على Nooryaa إطاراً من اللطف وadab. ويُحظر، على وجه الخصوص، ما يلي: الأقوال أو المحتويات ذات الطابع الجنسي أو القائم على الكراهية أو التمييز أو العنف؛ التحرش؛ انتحال الهوية؛ طلب الأموال؛ والاستدراج التجاري. وقد يؤدي أي إخلال إلى تعليق الحساب أو حذفه."
        },
        {
          "title": "4. الإشراف",
          "body": "قد تخضع المحتويات المنشورة (الصور، النبذات التعريفية، والرسائل التي يتم الإبلاغ عنها) لإشراف آلي وبشري. وتُرفض الصور غير المطابقة (العري، أو وجه لا يتوافق مع السن المصرّح به، أو صورة مولّدة بالذكاء الاصطناعي). ويتولى فريق الإشراف لدينا معالجة بلاغات الأعضاء."
        },
        {
          "title": "5. الملكية الفكرية",
          "body": "تُعدّ جميع عناصر التطبيق (العلامة التجارية، والشعار، والهوية البصرية، والنصوص) ملكاً حصرياً لـ Nooryaa. ويُحظر أي نسخ أو استخدام دون إذن. وتحتفظون بحقوقكم في المحتويات التي تنشرونها، مع منح Nooryaa ترخيصاً لاستخدامها بالقدر اللازم لتشغيل الخدمة."
        },
        {
          "title": "6. تعليق الحساب وحذفه",
          "body": "تحتفظ Nooryaa بحق تعليق أو حذف أي حساب لا يحترم هذه الشروط العامة للاستخدام، دون الإخلال بأي ملاحقات قضائية محتملة. ويمكنكم حذف حسابكم في أي وقت من مساحتكم الشخصية."
        },
        {
          "title": "7. المسؤولية",
          "body": "Nooryaa هي خدمة للتوفيق بين الأشخاص، ولا يمكن تحميلها المسؤولية عن التبادلات أو اللقاءات بين الأعضاء. ونحثكم على توخي اليقظة أثناء تفاعلاتكم، وعلى إعطاء الأولوية للتبادلات ضمن إطار يتوافق مع dîn (moutabala)."
        },
        {
          "title": "8. تعديل الشروط العامة للاستخدام",
          "body": "يجوز لـ Nooryaa تعديل هذه الشروط العامة للاستخدام في أي وقت. وسيتم إبلاغ الأعضاء بأي تعديل جوهري. ويُعدّ استمرار استخدام الخدمة قبولاً بالشروط الجديدة."
        }
      ]
    },
    "privacy": {
      "title": "سياسة الخصوصية",
      "sections": [
        {
          "title": "1. البيانات المجمّعة",
          "body": "في إطار الخدمة، تجمع Nooryaa البيانات التي تقدمونها: الهوية (الاسم الأول، اسم العائلة، الاسم المستعار)، وبيانات الاتصال (البريد الإلكتروني، الهاتف)، وتاريخ الميلاد، والموقع التقريبي (المدينة، وإحداثيات GPS لمدينتكم)، ومعلومات الملف الشخصي (الممارسة الدينية، والوضع العائلي، والأنشطة، والصور)، بالإضافة إلى تبادلاتكم عبر خدمة المراسلة."
        },
        {
          "title": "2. الأغراض",
          "body": "تُستخدم بياناتكم حصراً من أجل: إنشاء حسابكم وإدارته؛ واقتراح ملفات شخصية متوافقة معكم (خوارزمية التوافق والبحث حسب القرب الجغرافي)؛ وضمان الإشراف على المجتمع وأمنه؛ وإخطاركم بالإعجابات والرسائل وفعاليات الخدمة."
        },
        {
          "title": "3. التحقق بواسطة صورة سيلفي",
          "body": "تُرسل صورة التحقق (سيلفي) حصراً لمقارنتها بصور ملفكم الشخصي. ولا يتم تسجيلها أو الاحتفاظ بها؛ إذ لا يُحتفظ في حسابكم سوى بحالة التحقق (تم التحقق / لم يتم التحقق)."
        },
        {
          "title": "4. مشاركة البيانات",
          "body": "لا تُباع بياناتكم ولا تتم مشاركتها مع أطراف ثالثة لأغراض تجارية. وتُنفَّذ بعض عمليات المعالجة (الاستضافة وتحليل المحتوى لأغراض الإشراف) بواسطة معالِجين تقنيين خاضعين لالتزامات صارمة بالسرية والأمن."
        },
        {
          "title": "5. الاحتفاظ بالبيانات",
          "body": "يُحتفظ ببياناتكم ما دام حسابكم نشطاً. وفي حال حذف الحساب، تُمحى البيانات أو تُجهّل الهوية خلال مدة معقولة، باستثناء حالات وجود التزامات قانونية بالاحتفاظ بها (مثل البلاغات التي لا تزال قيد المعالجة)."
        },
        {
          "title": "6. حقوقكم",
          "body": "وفقاً لـ RGPD، تتمتعون بحق الوصول إلى بياناتكم وتصحيحها ومحوها ونقلها، وكذلك بحق الاعتراض على معالجتها. ويمكنكم ممارسة هذه الحقوق من خلال مساحة «حسابي» أو عن طريق التواصل معنا. كما يمكنكم تقديم شكوى إلى CNIL."
        },
        {
          "title": "7. الأمن",
          "body": "نطبّق تدابير تقنية وتنظيمية مناسبة، تشمل تشفير التبادلات، وضوابط الوصول، وقواعد أمن على مستوى قاعدة البيانات، والتحقق المنهجي من هويات الأعضاء."
        },
        {
          "title": "8. ملفات تعريف الارتباط",
          "body": "يستخدم التطبيق فقط ملفات تعريف الارتباط ووسائل التخزين المحلية الضرورية حصراً لتشغيله (جلسة تسجيل الدخول والتفضيلات). ولا يتم استخدام أي ملف تعريف ارتباط إعلاني أو ملف تعريف ارتباط لتتبع من طرف ثالث."
        }
      ]
    }
  }
};
