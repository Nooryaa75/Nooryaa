import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { asMemberLocale, memberLanguageRule } from "./moderation-language";
import { ageGapMatch, appearsMinor, type AgeMatch } from "./photo-age";
import {
  enforceFaceVisible,
  enforceRealPhoto,
  NO_FACE_REASON,
  NOT_REAL_PHOTO_REASON,
  type FaceVisible,
  type RealPhoto,
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
  /** Contrôle impossible (service indisponible) : photo acceptée, revue par l'équipe. */
  technical?: boolean;
};

const SYSTEM_PROMPT = `Tu es le modérateur photo de Nooryaa, plateforme de mise en relation musulmane sérieuse (pudeur / hayâ).
Tu analyses une photo de profil.

Vérifie ces points :
0. Vraie photo (real_photo) : la photo de profil DOIT être une vraie photographie d'une vraie personne (la personne elle-même, visage ou silhouette reconnaissable ; une femme voilée ou portant le niqab reste une vraie personne). real_photo = "no" si c'est une image avec du texte, une citation, un verset, un logo, un dessin, un avatar, un emoji, un paysage, un objet, une fleur, un animal, un mème, une capture d'écran ou toute image sans vraie personne photographiée. "unsure" en cas de doute. "yes" sinon.
0 bis. Visage visible (face_visible) : le visage de la personne doit être NETTEMENT visible et reconnaissable — une seule personne principale, de face ou de trois quarts, assez proche, bien éclairée et nette. Le voile est accepté ; le niqab est accepté si les yeux sont bien visibles. face_visible = "no" si aucun visage n'apparaît (photo de dos, silhouette lointaine, mains, corps sans tête, visage caché par un objet, un masque, des lunettes de soleil couvrantes ou un emoji), si la photo est trop sombre ou trop floue pour voir les traits, ou si la personne est trop loin pour être reconnue. "unsure" si tu n'es pas sûr de pouvoir reconnaître cette personne en la croisant. "yes" sinon.
1. Conformité : verdict "block" si nudité, sous-vêtements, tenue très suggestive, contenu sexuel, violence, drogue, haine, contenu illicite, image pornographique, ou si ce n'est manifestement pas une photo de personne réelle utilisable comme photo de profil (capture d'écran, texte publicitaire, coordonnées visibles). Verdict "warn" si tenue limite, pose aguicheuse, photo de groupe où la personne n'est pas identifiable, photo floue ou de très mauvaise qualité, visage totalement masqué par un objet.
2. Image générée ou retouchée par IA : "yes", "maybe" ou "no" (indices : peau lissée irréelle, mains/oreilles/bijoux déformés, arrière-plan incohérent, rendu 3D/illustration).
3. Âge apparent : estime une fourchette d'âge apparent (apparent_age_min / apparent_age_max, entiers). Si aucun visage humain exploitable, mets 0 et 0.
4. Filtres : "no", "light" (retouche légère) ou "heavy" (filtre beauté marqué, déformation du visage, stickers, oreilles d'animaux).

Si la personne paraît mineure (moins de 18 ans) → verdict "block".
Si ai_generated = "yes" → verdict "block". Si ai_generated = "maybe" ou filtered = "heavy" → au moins "warn".

Réponds UNIQUEMENT en JSON strict :
{"verdict":"allow|warn|block","real_photo":"yes|no|unsure","face_visible":"yes|no|unsure","categories":["..."],"reason":"phrase courte adressée à la personne, dans la langue demandée","reason_fr":"la même phrase en français","ai_generated":"no|maybe|yes","filtered":"no|light|heavy","apparent_age_min":0,"apparent_age_max":0}`;

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
      technical: true,
    };
    // Contrôle impossible : la photo est acceptée pour ne pas bloquer
    // l'inscription, mais elle est signalée à l'équipe pour vérification.
    const technicalFallback = async (): Promise<PhotoModerationResult> => {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("moderation_events").insert({
          user_id: (context as any).userId,
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
        categories: Array.isArray(parsed.categories) ? parsed.categories.slice(0, 5).map(String) : [],
        reason: typeof parsed.reason === "string" ? parsed.reason : "",
        reasonFr: typeof parsed.reason_fr === "string" ? parsed.reason_fr : "",
        ai_generated: safeEnum(parsed.ai_generated, ["no", "maybe", "yes"] as const, "no"),
        filtered: safeEnum(parsed.filtered, ["no", "light", "heavy"] as const, "no"),
        apparent_age_min: Number.isFinite(Number(parsed.apparent_age_min)) ? Number(parsed.apparent_age_min) : 0,
        apparent_age_max: Number.isFinite(Number(parsed.apparent_age_max)) ? Number(parsed.apparent_age_max) : 0,
        age_match: "unknown",
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

    // Visage obligatoire : une photo sans visage nettement visible est refusée.
    if (result.real_photo !== "no" && result.face_visible !== "yes") {
      if (result.verdict !== "block") {
        result.reason = NO_FACE_REASON;
        result.reasonFr = NO_FACE_REASON;
      }
      result.verdict = enforceFaceVisible(result.verdict, result.face_visible);
      result.categories = [...result.categories, "visage_non_visible"];
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

    if (result.ai_generated === "yes") result.verdict = "block";
    else if ((result.ai_generated === "maybe" || result.filtered === "heavy") && result.verdict === "allow") {
      result.verdict = "warn";
    }

    if (result.verdict !== "allow") {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("moderation_events").insert({
          user_id: (context as any).userId,
          content: `Photo de profil — visage:${result.face_visible} / IA:${result.ai_generated} / filtres:${result.filtered} / âge apparent:${result.apparent_age_min}-${result.apparent_age_max} vs déclaré:${data.declaredAge ?? "?"} (${result.age_match})`,
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
