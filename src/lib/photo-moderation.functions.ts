import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { asMemberLocale, memberLanguageRule } from "./moderation-language";
import { ageGapMatch, appearsMinor, type AgeMatch } from "./photo-age";
import {
  BARE_CHEST_REASON,
  enforceFaceVisible,
  enforceModestDress,
  enforceRealPhoto,
  enforceSinglePerson,
  NO_FACE_REASON,
  NOT_REAL_PHOTO_REASON,
  checksSummary,
  parsePhotoRuleChecks,
  PHOTO_RULES_PROMPT,
  photoRuleViolation,
  SINGLE_PERSON_REASON,
  type PhotoRuleChecks,
  type BareChest,
  type FaceVisible,
  type RealPhoto,
  type SinglePerson,
  UNCERTAIN_PHOTO_REASON,
} from "./photo-rules";

export type PhotoVerdict = "allow" | "warn" | "block";

export type PhotoModerationResult = {
  verdict: PhotoVerdict;
  categories: string[];
  reason: string;
  /** Copie française conservée pour le journal de modération. */
  reasonFr?: string;
  ai_generated: "no" | "maybe" | "yes";
  filtered: "no" | "light" | "heavy";
  apparent_age_min: number;
  apparent_age_max: number;
  age_match: AgeMatch;
  real_photo: RealPhoto;
  face_visible: FaceVisible;
  bare_chest: BareChest;
  single_person: SinglePerson;
  /** Règles de refus communes photo/selfie (sombre, short, visage, profil, sexe, texte…). */
  checks?: PhotoRuleChecks;
  /** Contrôle impossible (service indisponible) : photo acceptée, revue par l'équipe. */
  technical?: boolean;
};

const SYSTEM_PROMPT = `Tu es le modérateur photo de Nooryaa, plateforme de mise en relation musulmane sérieuse (pudeur / hayâ).
Tu analyses une photo de profil.

Vérifie ces points :
0. Vraie photo (real_photo) : la photo de profil DOIT être une vraie photographie d'une vraie personne (la personne elle-même, visage ou silhouette reconnaissable ; une femme voilée ou portant le niqab reste une vraie personne). real_photo = "no" si c'est une image avec du texte, une citation, un verset, un logo, un dessin, un avatar, un emoji, un paysage, un objet, une fleur, un animal, un mème, une capture d'écran ou toute image sans vraie personne photographiée. "unsure" en cas de doute. "yes" sinon.
0 bis. Visage visible (face_visible) : le visage de la personne doit être NETTEMENT visible et reconnaissable — une seule personne principale, de face ou de trois quarts, assez proche, bien éclairée et nette. Le voile est accepté ; le niqab est accepté si les yeux sont bien visibles. face_visible = "no" si aucun visage n'apparaît (photo de dos, silhouette lointaine, mains, corps sans tête, visage caché par un objet, un masque, des lunettes de soleil couvrantes ou un emoji), si la photo est trop sombre ou trop floue pour voir les traits, ou si la personne est trop loin pour être reconnue. "unsure" si tu n'es pas sûr de pouvoir reconnaître cette personne en la croisant. "yes" sinon.
0 quater. Une seule personne (single_person) : sur Nooryaa la photo de profil doit montrer UNE SEULE personne. Les photos de groupe, à deux (couple, ami, enfant, parent dans les bras ou à côté), ou avec une autre personne visible à côté ou derrière sont INTERDITES. single_person = "no" dès qu'une deuxième personne (visage ou corps) est clairement visible sur la photo, même en partie ou en arrière-plan proche. "unsure" si une silhouette lointaine et floue pourrait être une autre personne. "yes" si une seule personne apparaît. Une personne sur une affiche, un tableau ou un écran derrière compte aussi comme une autre personne si son visage est visible.
0 ter. Torse nu (bare_chest) : sur Nooryaa les photos torse nu sont INTERDITES, pour les hommes comme pour les femmes. bare_chest = "yes" si la personne a le torse, la poitrine ou le ventre nus (sans t-shirt, sans haut, en maillot de bain, à la plage ou à la piscine sans haut, débardeur ouvert laissant le torse nu), même si seule une partie du torse est visible au bas de la photo. "unsure" si on ne voit pas assez pour savoir si la personne porte un haut. "no" si la personne porte un haut qui couvre le torse.
1. Conformité : verdict "block" si torse nu, maillot de bain, nudité, sous-vêtements, tenue très suggestive, contenu sexuel, violence, drogue, haine, contenu illicite, image pornographique, ou si ce n'est manifestement pas une photo de personne réelle utilisable comme photo de profil (capture d'écran, texte publicitaire, coordonnées visibles). Verdict "block" aussi pour toute photo de groupe ou avec plus d'une personne. Verdict "warn" si tenue limite, pose aguicheuse, photo floue ou de très mauvaise qualité, visage totalement masqué par un objet.
2. Image générée ou retouchée par IA : voir ai_generated ci-dessous.
3. Âge apparent : estime une fourchette d'âge apparent (apparent_age_min / apparent_age_max, entiers). Si aucun visage humain exploitable, mets 0 et 0.
4. Filtres : voir filtered ci-dessous.

${PHOTO_RULES_PROMPT}

Si la personne paraît mineure (moins de 18 ans) → verdict "block".
Si ai_generated = "yes" ou filtered = "heavy" → verdict "block". Si ai_generated = "maybe" → au moins "warn".

Réponds UNIQUEMENT en JSON strict :
{"verdict":"allow|warn|block","real_photo":"yes|no|unsure","face_visible":"yes|no|unsure","bare_chest":"yes|no|unsure","single_person":"yes|no|unsure","too_dark":"yes|no|unsure","shorts":"yes|no|unsure","face_complete":"yes|no|unsure","tilted":"yes|no|unsure","face_angle":"front|three_quarter|profile|unknown","apparent_gender":"homme|femme|unknown","sexual":"yes|no|unsure","added_text":"yes|no|unsure","categories":["..."],"reason":"phrase courte adressée à la personne, dans la langue demandée","reason_fr":"la même phrase en français","ai_generated":"no|maybe|yes","filtered":"no|light|heavy","apparent_age_min":0,"apparent_age_max":0}`;

function safeEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export const moderatePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { imageDataUrl: string; declaredAge?: number | null; locale?: string }) => ({
    imageDataUrl: String(data?.imageDataUrl ?? ""),
    declaredAge:
      typeof data?.declaredAge === "number" && Number.isFinite(data.declaredAge)
        ? Math.round(data.declaredAge)
        : null,
    locale: asMemberLocale(data?.locale),
  }))
  .handler(async ({ data, context }): Promise<PhotoModerationResult> => {
    const fallback: PhotoModerationResult = {
      verdict: "allow",
      categories: [],
      reason: "",
      ai_generated: "no",
      filtered: "no",
      apparent_age_min: 0,
      apparent_age_max: 0,
      age_match: "unknown",
      real_photo: "unsure",
      face_visible: "unsure",
      bare_chest: "unsure",
      single_person: "unsure",
      technical: true,
    };
    // Contrôle impossible : la photo est acceptée pour ne pas bloquer
    // l'inscription, mais elle est signalée à l'équipe pour vérification.
    const technicalFallback = async (): Promise<PhotoModerationResult> => {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { keepModerationImage, MODERATION_MEDIA_BUCKET } = await import("./moderation-media.server");
        const mediaPath = await keepModerationImage((context as any).userId, data.imageDataUrl);
        await supabaseAdmin.from("moderation_events").insert({
          user_id: (context as any).userId,
          media_bucket: mediaPath ? MODERATION_MEDIA_BUCKET : null,
          media_path: mediaPath,
          content: "Photo de profil non contrôlée (problème technique) — photo à vérifier",
          verdict: "warn",
          categories: ["photo_non_controlee"],
          reason: "Le contrôle automatique de la photo n'a pas pu être effectué.",
          source: "photo",
        });
      } catch {
        // la journalisation ne doit jamais bloquer
      }
      return fallback;
    };

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!data.imageDataUrl.startsWith("data:image/")) return fallback;
    if (!apiKey) return await technicalFallback();

    let result: PhotoModerationResult = fallback;
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "openai/gpt-5.6-luna",
          input: [
            { role: "system", content: `${SYSTEM_PROMPT}\n${memberLanguageRule(data.locale)}` },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: data.declaredAge
                    ? `Analyse cette photo de profil. Âge déclaré par la personne : ${data.declaredAge} ans.`
                    : "Analyse cette photo de profil.",
                },
                { type: "input_image", image_url: data.imageDataUrl },
              ],
            },
          ],
          max_output_tokens: 2000,
        }),
      });
      if (!res.ok) {
        console.error("photo-moderation gateway error", res.status);
        return await technicalFallback();
      }
      const json: any = await res.json();
      const text: string =
        json.output_text ??
        json.output
          ?.flatMap((o: any) => o.content ?? [])
          .map((c: any) => c.text ?? "")
          .join("") ??
        "";
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return await technicalFallback();
      const parsed = JSON.parse(match[0]);
      result = {
        verdict: safeEnum(parsed.verdict, ["allow", "warn", "block"] as const, "allow"),
        real_photo: safeEnum(parsed.real_photo, ["yes", "no", "unsure"] as const, "unsure"),
        face_visible: safeEnum(parsed.face_visible, ["yes", "no", "unsure"] as const, "unsure"),
        bare_chest: safeEnum(parsed.bare_chest, ["yes", "no", "unsure"] as const, "unsure"),
        single_person: safeEnum(parsed.single_person, ["yes", "no", "unsure"] as const, "unsure"),
        categories: Array.isArray(parsed.categories) ? parsed.categories.slice(0, 5).map(String) : [],
        reason: typeof parsed.reason === "string" ? parsed.reason : "",
        reasonFr: typeof parsed.reason_fr === "string" ? parsed.reason_fr : "",
        ai_generated: safeEnum(parsed.ai_generated, ["no", "maybe", "yes"] as const, "no"),
        filtered: safeEnum(parsed.filtered, ["no", "light", "heavy"] as const, "no"),
        apparent_age_min: Number.isFinite(Number(parsed.apparent_age_min)) ? Number(parsed.apparent_age_min) : 0,
        apparent_age_max: Number.isFinite(Number(parsed.apparent_age_max)) ? Number(parsed.apparent_age_max) : 0,
        age_match: "unknown",
        checks: parsePhotoRuleChecks(parsed),
      };
    } catch {
      return await technicalFallback();
    }

    const realVerdict = enforceRealPhoto(result.verdict, result.real_photo);
    if (result.real_photo === "no") {
      result.categories = [...result.categories, "pas_une_vraie_photo"];
      if (result.verdict !== "block") {
        // Le motif de l'analyse ne parlait pas de ce problème : message clair.
        result.reason = NOT_REAL_PHOTO_REASON;
        result.reasonFr = NOT_REAL_PHOTO_REASON;
      }
    }
    result.verdict = realVerdict;

    // Une seule personne : photo de groupe ou à deux refusée, avec un message clair.
    if (result.real_photo !== "no" && result.single_person !== "yes") {
      result.verdict = enforceSinglePerson(result.verdict, result.single_person);
      if (result.single_person === "no") {
        result.categories = [...result.categories, "plusieurs_personnes"];
        result.reason = SINGLE_PERSON_REASON;
        result.reasonFr = SINGLE_PERSON_REASON;
      }
    }

    // Visage obligatoire : une photo sans visage nettement visible est refusée.
    if (result.real_photo !== "no" && result.face_visible !== "yes") {
      if (result.verdict !== "block") {
        result.reason = NO_FACE_REASON;
        result.reasonFr = NO_FACE_REASON;
      }
      result.verdict = enforceFaceVisible(result.verdict, result.face_visible);
      result.categories = [...result.categories, "visage_non_visible"];
    }

    // Pudeur : photo torse nu interdite (hommes et femmes).
    if (result.bare_chest !== "no") {
      const before = result.verdict;
      result.verdict = enforceModestDress(result.verdict, result.bare_chest);
      if (result.bare_chest === "yes") {
        result.categories = [...result.categories, "torse_nu"];
        if (before !== "block" || !result.reason) {
          result.reason = BARE_CHEST_REASON;
          result.reasonFr = BARE_CHEST_REASON;
        }
      }
    }

    const { apparent_age_min: lo, apparent_age_max: hi } = result;
    if (lo > 0 && hi > 0) {
      if (appearsMinor(lo, hi)) {
        result.verdict = "block";
        result.categories = [...result.categories, "mineur_apparent"];
        result.reason = result.reason || "La personne sur la photo paraît mineure.";
        result.reasonFr = result.reasonFr || "La personne sur la photo paraît mineure.";
      } else if (data.declaredAge) {
        // Un écart moyen (jusqu'à 10 ans) laisse passer la photo, sans message
        // ni signalement : une photo un peu ancienne ne doit pas pénaliser une
        // personne honnête. Seul un écart supérieur à 10 ans est refusé.
        result.age_match = ageGapMatch(data.declaredAge, lo, hi);
        if (result.age_match === "mismatch") {
          result.verdict = "block";
          result.categories = [...result.categories, "age_incoherent"];
          result.reason =
            "L'âge visible sur cette photo ne correspond pas à votre âge déclaré. Merci d'utiliser une photo récente de vous.";
          result.reasonFr = `L'âge apparent sur la photo (environ ${lo}-${hi} ans) est trop éloigné de votre âge déclaré (${data.declaredAge} ans). Merci d'utiliser une photo récente de vous.`;
        }
      }
    }

    // Règles de refus communes (sombre, short, visage à moitié, photo de profil,
    // IA, sexe différent de celui indiqué, caractère sexuel, texte ajouté).
    if (result.checks) {
      let declaredGender: "homme" | "femme" | null = null;
      try {
        const { data: me } = await (context as any).supabase
          .from("profiles")
          .select("gender")
          .eq("id", (context as any).userId)
          .maybeSingle();
        declaredGender = me?.gender === "homme" || me?.gender === "femme" ? me.gender : null;
      } catch {
        // sans sexe connu, la règle « sexe indiqué » ne s'applique pas
      }
      const violation = photoRuleViolation(result.checks, declaredGender);
      if (violation) {
        result.categories = [...result.categories, violation.category];
        // Motif précis (sombre, de profil, visage à moitié…) plutôt que le message général sur le visage.
        if (violation.verdict === "block" && (result.verdict !== "block" || result.reason === NO_FACE_REASON)) {
          result.verdict = "block";
          result.reason = violation.reason;
          result.reasonFr = violation.reason;
        }
      }
    }

    // Plus de statut « averti » : tout doute refuse la photo.
    if (result.verdict === "warn") {
      result.verdict = "block";
      if (!result.reason) result.reason = UNCERTAIN_PHOTO_REASON;
      if (!result.reasonFr) result.reasonFr = result.reason;
    }

    if (result.verdict !== "allow") {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { keepModerationImage, MODERATION_MEDIA_BUCKET } = await import("./moderation-media.server");
        const mediaPath = await keepModerationImage((context as any).userId, data.imageDataUrl);
        await supabaseAdmin.from("moderation_events").insert({
          user_id: (context as any).userId,
          media_bucket: mediaPath ? MODERATION_MEDIA_BUCKET : null,
          media_path: mediaPath,
          content: `Photo de profil — visage:${result.face_visible} / une seule personne:${result.single_person} / torse nu:${result.bare_chest} / IA:${result.ai_generated} / filtres:${result.filtered} / âge apparent:${result.apparent_age_min}-${result.apparent_age_max} vs déclaré:${data.declaredAge ?? "?"} (${result.age_match})${checksSummary(result.checks)}`,
          verdict: result.verdict,
          categories: result.categories,
          reason: result.reasonFr || result.reason,
          source: "photo",
        });
      } catch {
        // la journalisation ne doit jamais bloquer
      }
    }

    return result;
  });
