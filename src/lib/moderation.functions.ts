import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { lexiconCheck, type ModerationResult } from "./moderation-rules";

const SYSTEM_PROMPT = `Tu es le modérateur de Nooryaa, une plateforme de mise en relation musulmane sérieuse orientée dîn.
Tu analyses un message privé envoyé entre deux membres.

Règles de la maison (adab) :
- Respect, pudeur (hayâ) et bienveillance obligatoires.
- Interdits (verdict "block") : propos sexuels ou vulgaires, séduction déplacée, insultes, racisme, haine religieuse, menaces, harcèlement, arnaque ou demande d'argent, prostitution, drogue, contenu illicite.
- À signaler (verdict "warn") : ton sec, agressif ou méprisant, pression insistante, demande de coordonnées privées permettant de sortir de la plateforme (numéro de téléphone, email, WhatsApp, Snapchat, Instagram, Telegram), sous-entendus ambigus.
- TOUJOURS "allow" pour les questions normales de connaissance mutuelle : ville, région, pays, quartier ("tu habites où ?", "tu es de quelle ville ?"), âge, métier, études, famille, pratique religieuse, projet de mariage, loisirs, langue, origine. Ce ne sont NI des coordonnées privées NI un manque d'adab.
- Dans le doute, choisis "allow". Ne bloque que les cas manifestement graves listés plus haut.

Réponds UNIQUEMENT en JSON strict :
{"verdict":"allow|warn|block","categories":["..."],"reason":"phrase courte en français adressée à l'expéditeur"}`;

async function aiCheck(content: string): Promise<ModerationResult | null> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "openai/gpt-5.6-luna",
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Message à analyser :\n"""${content.slice(0, 2000)}"""` },
        ],
        max_output_tokens: 2000,
      }),
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    const text: string =
      json.output_text ??
      json.output
        ?.flatMap((o: any) => o.content ?? [])
        .map((c: any) => c.text ?? "")
        .join("") ??
      "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    const verdict = ["allow", "warn", "block"].includes(parsed.verdict) ? parsed.verdict : "allow";
    return {
      verdict,
      categories: Array.isArray(parsed.categories) ? parsed.categories.slice(0, 5).map(String) : [],
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
    };
  } catch {
    return null;
  }
}

export const moderateMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { content: string; targetUserId?: string }) => {
    const content = String(data?.content ?? "").slice(0, 2000);
    return { content, targetUserId: data?.targetUserId };
  })
  .handler(async ({ data, context }): Promise<ModerationResult> => {
    const content = data.content.trim();
    if (!content) return { verdict: "allow", categories: [], reason: "" };

    const lex = lexiconCheck(content);
    let result: ModerationResult = lex;

    if (lex.verdict !== "block") {
      const ai = await aiCheck(content);
      if (ai) {
        const rank = { allow: 0, warn: 1, block: 2 } as const;
        result = rank[ai.verdict] >= rank[lex.verdict] ? ai : lex;
        if (result.categories.length === 0 && lex.categories.length > 0) result.categories = lex.categories;
      }
    }

    if (result.verdict !== "allow") {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("moderation_events").insert({
          user_id: (context as any).userId,
          target_user: data.targetUserId ?? null,
          content,
          verdict: result.verdict,
          categories: result.categories,
          reason: result.reason,
          source: "message",
        });
      } catch {
        // la journalisation ne doit jamais bloquer l'envoi
      }
    }

    return result;
  });

async function transcribeAudio(bytes: Uint8Array, mime: string): Promise<string | null> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return null;
  try {
    const ext = mime.includes("mp4") || mime.includes("m4a") ? "m4a"
      : mime.includes("wav") ? "wav"
      : mime.includes("mpeg") ? "mp3"
      : "webm";
    const form = new FormData();
    form.append("model", "openai/gpt-4o-transcribe");
    form.append("file", new Blob([bytes as unknown as BlobPart], { type: mime || "audio/webm" }), `voice.${ext}`);
    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    return typeof json?.text === "string" ? json.text : null;
  } catch {
    return null;
  }
}

/** Modère un message vocal déjà déposé dans le stockage : transcription puis mêmes règles que le texte. */
export const moderateVoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { audioPath: string; mimeType?: string; targetUserId?: string }) => ({
    audioPath: String(data?.audioPath ?? ""),
    mimeType: String(data?.mimeType ?? "audio/webm"),
    targetUserId: data?.targetUserId,
  }))
  .handler(async ({ data, context }): Promise<ModerationResult & { transcript: string }> => {
    const empty = { verdict: "allow" as const, categories: [] as string[], reason: "", transcript: "" };
    if (!data.audioPath) return empty;
    // le vocal doit appartenir à l'expéditeur (dossier = son identifiant)
    if (!data.audioPath.startsWith(`${(context as any).userId}/`)) return empty;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const dl = await supabaseAdmin.storage.from("message-audio").download(data.audioPath);
    if (dl.error || !dl.data) return empty;
    const bytes = new Uint8Array(await dl.data.arrayBuffer());

    const transcript = (await transcribeAudio(bytes, data.mimeType))?.trim() ?? "";
    if (!transcript) return empty;


    const lex = lexiconCheck(transcript);
    let result: ModerationResult = lex;
    if (lex.verdict !== "block") {
      const ai = await aiCheck(transcript);
      if (ai) {
        const rank = { allow: 0, warn: 1, block: 2 } as const;
        result = rank[ai.verdict] >= rank[lex.verdict] ? ai : lex;
        if (result.categories.length === 0 && lex.categories.length > 0) result.categories = lex.categories;
      }
    }

    if (result.verdict !== "allow") {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("moderation_events").insert({
          user_id: (context as any).userId,
          target_user: data.targetUserId ?? null,
          content: transcript.slice(0, 2000),
          verdict: result.verdict,
          categories: result.categories,
          reason: result.reason,
          source: "voice",
        });
      } catch {
        // la journalisation ne doit jamais bloquer l'envoi
      }
    }

    return { ...result, transcript };
  });
