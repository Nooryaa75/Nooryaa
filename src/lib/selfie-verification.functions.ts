import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SelfieVerdict = "verified" | "review" | "rejected";

export type SelfieVerificationResult = {
  verdict: SelfieVerdict;
  single_face: "yes" | "no" | "unknown";
  same_person: "yes" | "maybe" | "no" | "unknown";
  live_capture: "yes" | "maybe" | "no";
  reason: string;
};

const SYSTEM_PROMPT = `Tu es l'agent de vérification d'identité photo de Nooryaa (plateforme de mise en relation musulmane).
On te donne le SELFIE de vérification pris en direct par la personne, puis une ou plusieurs PHOTOS DE SON PROFIL.

Sois TRÈS STRICT : en cas de doute, ne valide pas. Compare précisément la morphologie du visage (forme du visage, écartement et forme des yeux, nez, bouche, mâchoire, oreilles, grains de beauté), l'âge apparent et le genre apparent. Une simple ressemblance générale (même couleur de cheveux, même type physique, même voile) NE SUFFIT PAS : réponds "no" si un seul trait morphologique diffère nettement.

Analyse :
1. single_face : le selfie doit contenir EXACTEMENT UNE SEULE tête/personne visible. "yes" si une seule personne est clairement visible, "no" si plusieurs personnes ou plusieurs visages sont présents, "unknown" si aucun visage n'est détecté ou si le visage est trop flou/caché.
2. same_person : la personne du selfie est-elle la même que sur les photos de profil ? "yes" uniquement si tu es quasi certain (>90%) sur au moins une photo de profil nette, "maybe" si ressemblance sans certitude, "no" si les traits diffèrent, "unknown" si un visage est absent/illisible.
3. live_capture : le selfie semble-t-il pris en direct par la webcam/le téléphone ? "no" si c'est une photo d'écran, une photo d'une photo, une image téléchargée d'internet, une image générée par IA ou fortement retouchée.
4. Le selfie doit rester conforme (pas de nudité, pas de contenu choquant) : sinon verdict "rejected".

Verdict :
- "verified" si single_face = yes ET same_person = yes ET live_capture = yes.
- "rejected" si single_face = no, ou same_person = no, ou live_capture = no, ou contenu non conforme.
- "review" dans les autres cas.

Réponds UNIQUEMENT en JSON strict :
{"verdict":"verified|review|rejected","single_face":"yes|no|unknown","same_person":"yes|maybe|no|unknown","live_capture":"yes|maybe|no","reason":"phrase courte en français adressée à la personne"}`;

function safeEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

async function toDataUrl(url: string): Promise<string> {
  try {
    const img = await fetch(url);
    if (!img.ok) return url;
    const buf = new Uint8Array(await img.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]!);
    const mime = img.headers.get("content-type") || "image/jpeg";
    return `data:${mime};base64,${btoa(bin)}`;
  } catch {
    return url;
  }
}

export const verifySelfie = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { selfieDataUrl: string }) => ({
    selfieDataUrl: String(data?.selfieDataUrl ?? ""),
  }))
  .handler(async ({ data, context }): Promise<SelfieVerificationResult> => {
    const userId = (context as any).userId as string;
    const supabase = (context as any).supabase;

    // Le selfie est uniquement transmis au modèle de comparaison ; il n'est JAMAIS
    // stocké dans la fiche profil (ni dans la table photos, ni dans un bucket).
    if (!data.selfieDataUrl.startsWith("data:image/")) {
      return {
        verdict: "rejected",
        single_face: "unknown",
        same_person: "unknown",
        live_capture: "no",
        reason: "Selfie invalide.",
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("primary_photo_url")
      .eq("id", userId)
      .single();

    const { data: photos } = await supabase
      .from("photos")
      .select("url, position")
      .eq("user_id", userId)
      .order("position", { ascending: true });

    const urls = Array.from(
      new Set(
        [profile?.primary_photo_url, ...((photos ?? []) as { url: string }[]).map((p) => p.url)]
          .filter((u): u is string => typeof u === "string" && u.length > 0),
      ),
    ).slice(0, 3);

    if (urls.length === 0) {
      return {
        verdict: "review",
        single_face: "unknown",
        same_person: "unknown",
        live_capture: "maybe",
        reason: "Ajoutez d'abord vos photos de profil avant de lancer la vérification.",
      };
    }

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return {
        verdict: "review",
        single_face: "unknown",
        same_person: "unknown",
        live_capture: "maybe",
        reason: "Vérification indisponible pour le moment, réessayez plus tard.",
      };
    }

    // Les photos de profil sont converties en base64 : les URL signées ne sont
    // pas toujours accessibles par le fournisseur du modèle.
    const profileImages = await Promise.all(urls.map(toDataUrl));

    let result: SelfieVerificationResult = {
      verdict: "review",
      single_face: "unknown",
      same_person: "unknown",
      live_capture: "maybe",
      reason: "Vérification en attente de contrôle.",
    };

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "openai/gpt-5.6-luna",
          input: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: `Image 1 = selfie de vérification pris en direct. Images suivantes (${profileImages.length}) = photos du profil.`,
                },
                { type: "input_image", image_url: data.selfieDataUrl },
                ...profileImages.map((image_url) => ({ type: "input_image", image_url })),
              ],
            },
          ],
          max_output_tokens: 1500,
        }),
      });
      if (res.ok) {
        const json: any = await res.json();
        const text: string =
          json.output_text ??
          json.output
            ?.flatMap((o: any) => o.content ?? [])
            .map((c: any) => c.text ?? "")
            .join("") ??
          "";
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          result = {
            verdict: safeEnum(parsed.verdict, ["verified", "review", "rejected"] as const, "review"),
            single_face: safeEnum(parsed.single_face, ["yes", "no", "unknown"] as const, "unknown"),
            same_person: safeEnum(parsed.same_person, ["yes", "maybe", "no", "unknown"] as const, "unknown"),
            live_capture: safeEnum(parsed.live_capture, ["yes", "maybe", "no"] as const, "maybe"),
            reason: typeof parsed.reason === "string" ? parsed.reason : "",
          };
        }
      }
    } catch {
      // on garde le verdict "review"
    }

    // Garde-fous côté serveur (stricts : le doute ne valide jamais)
    if (result.single_face === "no" || result.same_person === "no" || result.live_capture === "no") {
      result.verdict = "rejected";
      if (!result.reason) {
        result.reason =
          result.single_face === "no"
            ? "Le selfie doit montrer une seule personne. Plusieurs visages ou absence de visage entraînent un refus."
            : "Le selfie ne correspond pas à vos photos de profil.";
      }
    } else if (result.single_face !== "yes" || result.same_person !== "yes" || result.live_capture !== "yes") {
      result.verdict = "review";
    }

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("profiles")
        .update({
          photo_verified: result.verdict === "verified",
          photo_verified_at: result.verdict === "verified" ? new Date().toISOString() : null,
          photo_verification_status: result.verdict,
        })
        .eq("id", userId);

      if (result.verdict !== "verified") {
        await supabaseAdmin.from("moderation_events").insert({
          user_id: userId,
          content: `Vérification selfie — une seule tête:${result.single_face} / même personne:${result.same_person} / prise en direct:${result.live_capture}`,
          verdict: result.verdict === "rejected" ? "block" : "warn",
          categories: ["selfie_verification"],
          reason: result.reason,
          source: "photo",
        });
      }
    } catch {
      // la persistance ne doit pas casser le retour
    }

    if (!result.reason) {
      result.reason =
        result.verdict === "verified"
          ? "Votre photo est vérifiée."
          : result.verdict === "rejected"
            ? "Le selfie ne correspond pas à vos photos de profil."
            : "Vérification à confirmer, réessayez avec un meilleur éclairage.";
    }

    return result;
  });
