import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PhotoVerdict = "allow" | "warn" | "block";

export type PhotoModerationResult = {
  verdict: PhotoVerdict;
  categories: string[];
  reason: string;
  ai_generated: "no" | "maybe" | "yes";
  filtered: "no" | "light" | "heavy";
};

const SYSTEM_PROMPT = `Tu es le modérateur photo de Nooryaa, plateforme de mise en relation musulmane sérieuse (pudeur / hayâ).
Tu analyses une photo de profil.

Vérifie trois choses :
1. Conformité : verdict "block" si nudité, sous-vêtements, tenue très suggestive, contenu sexuel, violence, drogue, haine, contenu illicite, image pornographique, ou si ce n'est manifestement pas une photo de personne réelle utilisable comme photo de profil (capture d'écran, texte publicitaire, coordonnées visibles). Verdict "warn" si tenue limite, pose aguicheuse, photo de groupe où la personne n'est pas identifiable, photo floue ou de très mauvaise qualité, visage totalement masqué par un objet.
2. Image générée ou retouchée par IA : "yes", "maybe" ou "no" (indices : peau lissée irréelle, mains/oreilles/bijoux déformés, arrière-plan incohérent, rendu 3D/illustration).
3. Filtres : "no", "light" (retouche légère) ou "heavy" (filtre beauté marqué, déformation du visage, stickers, oreilles d'animaux).

Si ai_generated = "yes" → verdict "block". Si ai_generated = "maybe" ou filtered = "heavy" → au moins "warn".

Réponds UNIQUEMENT en JSON strict :
{"verdict":"allow|warn|block","categories":["..."],"reason":"phrase courte en français adressée à la personne","ai_generated":"no|maybe|yes","filtered":"no|light|heavy"}`;

function safeEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export const moderatePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { imageDataUrl: string }) => ({
    imageDataUrl: String(data?.imageDataUrl ?? ""),
  }))
  .handler(async ({ data, context }): Promise<PhotoModerationResult> => {
    const fallback: PhotoModerationResult = {
      verdict: "allow",
      categories: [],
      reason: "",
      ai_generated: "no",
      filtered: "no",
    };

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey || !data.imageDataUrl.startsWith("data:image/")) return fallback;

    let result: PhotoModerationResult = fallback;
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
                { type: "input_text", text: "Analyse cette photo de profil." },
                { type: "input_image", image_url: data.imageDataUrl },
              ],
            },
          ],
          max_output_tokens: 2000,
        }),
      });
      if (!res.ok) return fallback;
      const json: any = await res.json();
      const text: string =
        json.output_text ??
        json.output
          ?.flatMap((o: any) => o.content ?? [])
          .map((c: any) => c.text ?? "")
          .join("") ??
        "";
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return fallback;
      const parsed = JSON.parse(match[0]);
      result = {
        verdict: safeEnum(parsed.verdict, ["allow", "warn", "block"] as const, "allow"),
        categories: Array.isArray(parsed.categories) ? parsed.categories.slice(0, 5).map(String) : [],
        reason: typeof parsed.reason === "string" ? parsed.reason : "",
        ai_generated: safeEnum(parsed.ai_generated, ["no", "maybe", "yes"] as const, "no"),
        filtered: safeEnum(parsed.filtered, ["no", "light", "heavy"] as const, "no"),
      };
    } catch {
      return fallback;
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
          content: `Photo de profil — IA:${result.ai_generated} / filtres:${result.filtered}`,
          verdict: result.verdict,
          categories: result.categories,
          reason: result.reason,
          source: "photo",
        });
      } catch {
        // la journalisation ne doit jamais bloquer
      }
    }

    return result;
  });
