import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SelfieVerdict = "verified" | "review" | "rejected";

export type SelfieVerificationResult = {
  verdict: SelfieVerdict;
  same_person: "yes" | "maybe" | "no" | "unknown";
  live_capture: "yes" | "maybe" | "no";
  gesture_ok: boolean;
  reason: string;
};

const SYSTEM_PROMPT = `Tu es l'agent de vérification d'identité photo de Nooryaa (plateforme de mise en relation musulmane).
On te donne deux images : (1) le SELFIE de vérification pris en direct par la personne, (2) sa PHOTO DE PROFIL.

Analyse :
1. same_person : la personne du selfie est-elle la même que sur la photo de profil ? "yes", "maybe", "no", ou "unknown" si un visage est absent/illisible.
2. live_capture : le selfie semble-t-il pris en direct par la webcam/le téléphone ? "no" si c'est une photo d'écran, une photo d'une photo, une image téléchargée d'internet, une image générée par IA ou fortement retouchée.
3. gesture_ok : la personne réalise-t-elle le geste demandé décrit par l'utilisateur ? true/false.
4. Le selfie doit rester conforme (pas de nudité, pas de contenu choquant) : sinon verdict "rejected".

Verdict :
- "verified" si same_person = yes ET live_capture = yes ET gesture_ok = true.
- "rejected" si same_person = no, ou live_capture = no, ou contenu non conforme.
- "review" dans les autres cas.

Réponds UNIQUEMENT en JSON strict :
{"verdict":"verified|review|rejected","same_person":"yes|maybe|no|unknown","live_capture":"yes|maybe|no","gesture_ok":true,"reason":"phrase courte en français adressée à la personne"}`;

function safeEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Geste aléatoire demandé pour prouver que le selfie est bien pris en direct. */
export const GESTURES = [
  "Levez la main droite à côté de votre visage",
  "Faites un pouce en l'air à côté de votre visage",
  "Tournez légèrement la tête vers la droite",
  "Posez votre main ouverte, paume vers la caméra, à côté du visage",
  "Faites un signe de victoire (deux doigts) à côté du visage",
] as const;

export const verifySelfie = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { selfieDataUrl: string; gesture: string }) => ({
    selfieDataUrl: String(data?.selfieDataUrl ?? ""),
    gesture: String(data?.gesture ?? "").slice(0, 200),
  }))
  .handler(async ({ data, context }): Promise<SelfieVerificationResult> => {
    const userId = (context as any).userId as string;
    const supabase = (context as any).supabase;

    if (!data.selfieDataUrl.startsWith("data:image/")) {
      return {
        verdict: "rejected",
        same_person: "unknown",
        live_capture: "no",
        gesture_ok: false,
        reason: "Selfie invalide.",
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("primary_photo_url")
      .eq("id", userId)
      .single();

    const photoUrl: string | null = profile?.primary_photo_url ?? null;
    if (!photoUrl) {
      return {
        verdict: "review",
        same_person: "unknown",
        live_capture: "maybe",
        gesture_ok: false,
        reason: "Ajoutez d'abord une photo de profil principale avant de lancer la vérification.",
      };
    }

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return {
        verdict: "review",
        same_person: "unknown",
        live_capture: "maybe",
        gesture_ok: false,
        reason: "Vérification indisponible pour le moment, réessayez plus tard.",
      };
    }

    // La photo de profil est convertie en base64 : l'URL signée n'est pas
    // toujours accessible par le fournisseur du modèle.
    let profileDataUrl = photoUrl;
    try {
      const img = await fetch(photoUrl);
      if (img.ok) {
        const buf = new Uint8Array(await img.arrayBuffer());
        let bin = "";
        for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]!);
        const mime = img.headers.get("content-type") || "image/jpeg";
        profileDataUrl = `data:${mime};base64,${btoa(bin)}`;
      }
    } catch {
      // on retombe sur l'URL directe
    }

    let result: SelfieVerificationResult = {
      verdict: "review",
      same_person: "unknown",
      live_capture: "maybe",
      gesture_ok: false,
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
                  text: `Geste demandé à la personne : "${data.gesture}". Image 1 = selfie de vérification. Image 2 = photo de profil.`,
                },
                { type: "input_image", image_url: data.selfieDataUrl },
                { type: "input_image", image_url: profileDataUrl },
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
            same_person: safeEnum(parsed.same_person, ["yes", "maybe", "no", "unknown"] as const, "unknown"),
            live_capture: safeEnum(parsed.live_capture, ["yes", "maybe", "no"] as const, "maybe"),
            gesture_ok: parsed.gesture_ok === true,
            reason: typeof parsed.reason === "string" ? parsed.reason : "",
          };
        }
      }
    } catch {
      // on garde le verdict "review"
    }

    // Garde-fous côté serveur
    if (result.same_person === "no" || result.live_capture === "no") result.verdict = "rejected";
    else if (result.verdict === "verified" && (result.same_person !== "yes" || !result.gesture_ok)) {
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
          content: `Vérification selfie — même personne:${result.same_person} / prise en direct:${result.live_capture} / geste:${result.gesture_ok ? "ok" : "ko"} (geste demandé: ${data.gesture})`,
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
            ? "Le selfie ne correspond pas à votre photo de profil."
            : "Vérification à confirmer, réessayez avec un meilleur éclairage.";
    }

    return result;
  });
