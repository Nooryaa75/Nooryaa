import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PhotoIdentityResult = {
  verdict: "allow" | "review" | "block";
  same_person: "yes" | "maybe" | "no" | "unknown";
  gender_match: "yes" | "no" | "unknown";
  /** true : la personne doit (re)faire la vérification par selfie. */
  require_selfie: boolean;
  reason: string;
};

const SYSTEM_PROMPT = `Tu es l'agent de contrôle d'identité photo de Nooryaa (plateforme de mise en relation musulmane).
On te donne la NOUVELLE photo que la personne veut ajouter à son profil, puis (éventuellement) ses PHOTOS DE PROFIL DÉJÀ VALIDÉES, ainsi que le sexe déclaré.

Analyse :
1. same_person : la personne de la nouvelle photo est-elle la même que sur les photos déjà validées ? "yes" si tu es quasi certain (>90%), "maybe" si ressemblance sans certitude, "no" si les traits morphologiques diffèrent nettement (forme du visage, yeux, nez, bouche, mâchoire), "unknown" si aucune photo de référence n'est fournie ou si aucun visage n'est exploitable.
2. gender_match : le genre apparent de la personne sur la nouvelle photo correspond-il au sexe déclaré ? "yes", "no" ou "unknown" si indéterminable.

Sois strict : le doute ne valide pas.

Réponds UNIQUEMENT en JSON strict :
{"same_person":"yes|maybe|no|unknown","gender_match":"yes|no|unknown","reason":"phrase courte en français adressée à la personne"}`;

function safeEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function bytesToDataUrl(buf: Uint8Array, mime: string): string {
  let bin = "";
  const chunk = 8192;
  for (let i = 0; i < buf.length; i += chunk) bin += String.fromCharCode(...buf.subarray(i, i + chunk));
  return `data:${mime || "image/jpeg"};base64,${btoa(bin)}`;
}

function storagePathFromUrl(url: string): string | null {
  const m = url.match(/\/object\/(?:sign|public)\/profile-photos\/([^?]+)/);
  return m ? decodeURIComponent(m[1]!) : null;
}

async function downloadPhoto(path: string): Promise<string | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bucket = supabaseAdmin.storage.from("profile-photos");
    let res = await bucket.download(path, {
      transform: { width: 768, height: 768, resize: "contain", quality: 70 },
    });
    if (res.error || !res.data || res.data.size === 0 || res.data.size > 2_000_000) {
      const raw = await bucket.download(path);
      if (raw.error || !raw.data || raw.data.size === 0 || raw.data.size > 2_000_000) return null;
      res = raw;
    }
    const buf = new Uint8Array(await res.data.arrayBuffer());
    return bytesToDataUrl(buf, res.data.type || "image/jpeg");
  } catch (e) {
    console.error("photo-identity: échec téléchargement photo", path, e);
    return null;
  }
}

/**
 * Contrôle d'identité d'une nouvelle photo de profil :
 * comparaison avec les photos déjà présentes + cohérence avec le sexe déclaré.
 */
export const verifyPhotoIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { imageDataUrl: string }) => ({
    imageDataUrl: String(data?.imageDataUrl ?? ""),
  }))
  .handler(async ({ data, context }): Promise<PhotoIdentityResult> => {
    const userId = (context as any).userId as string;
    const supabase = (context as any).supabase;

    const pass: PhotoIdentityResult = {
      verdict: "allow",
      same_person: "unknown",
      gender_match: "unknown",
      require_selfie: false,
      reason: "",
    };

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey || !data.imageDataUrl.startsWith("data:image/")) return pass;

    const { data: profile } = await supabase
      .from("profiles")
      .select("gender, photo_verified, primary_photo_url, email, first_name, pseudo")
      .eq("id", userId)
      .single();

    const { data: photos } = await supabase
      .from("photos")
      .select("url, storage_path, position")
      .eq("user_id", userId)
      .order("position", { ascending: true });

    const paths = Array.from(
      new Set(
        ((photos ?? []) as { url: string; storage_path: string | null }[])
          .map((p) => p.storage_path || storagePathFromUrl(p.url ?? ""))
          .filter((p): p is string => typeof p === "string" && p.length > 0),
      ),
    ).slice(0, 3);

    const references = (await Promise.all(paths.map(downloadPhoto))).filter(
      (i): i is string => !!i,
    );

    const genderLabel =
      profile?.gender === "homme" ? "un homme" : profile?.gender === "femme" ? "une femme" : "non précisé";

    let parsed: any = null;
    for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
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
                    text: `Image 1 = nouvelle photo proposée. ${
                      references.length
                        ? `Images suivantes (${references.length}) = photos de profil déjà validées.`
                        : "Aucune photo de référence disponible."
                    } Sexe déclaré : ${genderLabel}.`,
                  },
                  { type: "input_image", image_url: data.imageDataUrl },
                  ...references.map((image_url) => ({ type: "input_image", image_url })),
                ],
              },
            ],
            max_output_tokens: 1200,
          }),
        });
        if (!res.ok) {
          console.error("photo-identity gateway error", res.status, (await res.text()).slice(0, 300));
          continue;
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
        if (!match) continue;
        parsed = JSON.parse(match[0]);
      } catch (e) {
        console.error("photo-identity exception", e);
      }
    }

    if (!parsed) {
      // Service indisponible : on n'ajoute pas la photo sans contrôle.
      return {
        verdict: "review",
        same_person: "unknown",
        gender_match: "unknown",
        require_selfie: false,
        reason: "Le contrôle de la photo n'a pas répondu. Merci de réessayer dans un instant.",
      };
    }

    const result: PhotoIdentityResult = {
      verdict: "allow",
      same_person: safeEnum(parsed.same_person, ["yes", "maybe", "no", "unknown"] as const, "unknown"),
      gender_match: safeEnum(parsed.gender_match, ["yes", "no", "unknown"] as const, "unknown"),
      require_selfie: false,
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
    };

    if (result.gender_match === "no") {
      result.verdict = "block";
      result.reason =
        "Cette photo ne correspond pas au sexe déclaré sur votre profil. Merci d'utiliser une photo de vous.";
    } else if (references.length > 0 && result.same_person === "no") {
      result.verdict = "block";
      result.reason =
        "Cette photo ne semble pas être vous : elle ne correspond pas à vos photos de profil. Ajoutez une photo de vous ou refaites la vérification par selfie.";
    } else if (references.length > 0 && result.same_person !== "yes") {
      // Doute : la photo est acceptée mais la vérification par selfie est à refaire.
      result.verdict = "review";
      result.require_selfie = true;
      result.reason =
        result.reason ||
        "Nous n'avons pas pu confirmer que cette photo est bien vous : refaites la vérification par selfie.";
    } else if (references.length === 0 && profile?.photo_verified) {
      result.require_selfie = true;
    }

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      if (result.verdict !== "allow") {
        await supabaseAdmin.from("moderation_events").insert({
          user_id: userId,
          content: `Contrôle identité photo — même personne:${result.same_person} / sexe cohérent:${result.gender_match}`,
          verdict: result.verdict === "block" ? "block" : "warn",
          categories: ["photo_identity"],
          reason: result.reason,
          source: "photo",
        });
      }
      // Toute photo ajoutée sans certitude invalide le badge « vérifié ».
      if (result.require_selfie && profile?.photo_verified) {
        await supabaseAdmin
          .from("profiles")
          .update({
            photo_verified: false,
            photo_verified_at: null,
            photo_verification_status: "review",
          })
          .eq("id", userId);

        // C'est Nooryaa qui contacte le membre : notification in-app + email
        // lui demandant de refaire son selfie (le bloc réapparaît dans Mon compte).
        if (profile.email) {
          const { requestSelfieRedo } = await import("@/lib/notify.functions");
          await requestSelfieRedo({
            userId,
            email: profile.email,
            firstName: profile.first_name || profile.pseudo,
            reason: result.reason || null,
          });
        }
      }
    } catch {
      // la journalisation ne doit pas bloquer
    }

    return result;
  });
