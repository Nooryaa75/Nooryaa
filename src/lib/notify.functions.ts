import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SITE_NAME = "Nooryaa";
const SITE_URL = "https://nooryaa.lovable.app";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

export type NotifyKind = "like" | "match" | "message" | "visit";

/** Correspondance entre un événement et la clé de préférence enregistrée dans le profil. */
const PREF_KEY: Record<NotifyKind, string> = {
  like: "likes",
  match: "matchs",
  message: "messages",
  visit: "visites",
};

/** Anti-spam : délai minimum (en minutes) entre deux emails du même type pour le même destinataire. */
const THROTTLE_MINUTES: Record<NotifyKind, number> = {
  like: 60,
  match: 0,
  message: 30,
  visit: 1440,
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(title: string, body: string, ctaLabel: string, ctaUrl: string) {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f6f5fb;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5fb;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e3f2;">
        <tr><td style="background:#3b2a7a;padding:20px 24px;color:#ffffff;font-size:20px;font-weight:bold;">${SITE_NAME}</td></tr>
        <tr><td style="padding:24px;">
          <h1 style="margin:0 0 12px;font-size:18px;color:#2b1f57;">${title}</h1>
          <div style="font-size:15px;line-height:1.6;color:#4a4468;">${body}</div>
          <div style="margin-top:24px;">
            <a href="${ctaUrl}" style="display:inline-block;background:#c2185b;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:15px;font-weight:bold;">${ctaLabel}</a>
          </div>
        </td></tr>
        <tr><td style="padding:16px 24px;background:#faf9ff;font-size:12px;color:#8a83a6;">
          Vous recevez cet email car vos préférences de notification l'autorisent.
          Vous pouvez les modifier à tout moment dans <a href="${SITE_URL}/compte/notifications" style="color:#3b2a7a;">Mon compte → Mes notifications</a>.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildEmail(kind: NotifyKind, recipientName: string, actorName: string, preview?: string | null) {
  const who = escapeHtml(actorName || "Un membre");
  const hi = `Assalamu alaykum ${escapeHtml(recipientName || "")},`.trim();

  switch (kind) {
    case "like":
      return {
        subject: `${who} vous a liké sur ${SITE_NAME} 💜`,
        html: layout(
          "Vous avez un nouveau coup de cœur",
          `<p>${hi}</p><p><strong>${who}</strong> vient de vous liker sur ${SITE_NAME}. Découvrez son profil et, si le cœur y est, likez à votre tour pour ouvrir la conversation.</p>`,
          "Voir qui m'a liké",
          `${SITE_URL}/likes`,
        ),
      };
    case "match":
      return {
        subject: `C'est un match avec ${who} ! 🎉`,
        html: layout(
          "Vous avez un nouveau match",
          `<p>${hi}</p><p>Vous et <strong>${who}</strong> vous êtes likés mutuellement. Vous pouvez désormais échanger dans le respect de la charte ${SITE_NAME}.</p>`,
          "Démarrer la conversation",
          `${SITE_URL}/matchs`,
        ),
      };
    case "message":
      return {
        subject: `Nouveau message de ${who}`,
        html: layout(
          "Vous avez reçu un message",
          `<p>${hi}</p><p><strong>${who}</strong> vous a envoyé un message sur ${SITE_NAME}.</p>${
            preview ? `<p style="padding:12px 14px;background:#faf9ff;border-radius:12px;color:#2b1f57;">« ${escapeHtml(preview.slice(0, 140))} »</p>` : ""
          }`,
          "Lire le message",
          `${SITE_URL}/messages`,
        ),
      };
    case "visit":
      return {
        subject: `${who} a consulté votre profil`,
        html: layout(
          "Votre profil a été consulté",
          `<p>${hi}</p><p><strong>${who}</strong> a récemment visité votre profil sur ${SITE_NAME}.</p>`,
          "Voir mon profil",
          `${SITE_URL}/compte/profil`,
        ),
      };
  }
}

/**
 * Envoie une notification email (like, match, message, visite) au destinataire,
 * en respectant ses préférences et un anti-spam par type d'événement.
 */
export const sendNotificationEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { kind: NotifyKind; recipientId: string; preview?: string | null }) => {
    if (!data?.recipientId || !["like", "match", "message", "visit"].includes(data.kind)) {
      throw new Error("Paramètres de notification invalides");
    }
    return data;
  })
  .handler(async ({ context, data }) => {
    if (data.recipientId === context.userId) return { sent: false, reason: "self" as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: recipient }, { data: actor }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, email, pseudo, first_name, preferences")
        .eq("id", data.recipientId)
        .maybeSingle(),
      supabaseAdmin.from("profiles").select("id, pseudo, first_name").eq("id", context.userId).maybeSingle(),
    ]);

    if (!recipient?.email) return { sent: false, reason: "no_email" as const };

    const prefs = (recipient.preferences as any)?.notifications?.[PREF_KEY[data.kind]];
    const emailEnabled = typeof prefs?.email === "boolean" ? prefs.email : data.kind !== "visit";
    if (!emailEnabled) return { sent: false, reason: "disabled" as const };

    // Anti-spam : pas deux emails identiques dans la fenêtre définie.
    const minutes = THROTTLE_MINUTES[data.kind];
    if (minutes > 0) {
      const since = new Date(Date.now() - minutes * 60000).toISOString();
      const { data: recent } = await supabaseAdmin
        .from("email_notifications")
        .select("id")
        .eq("user_id", recipient.id)
        .eq("kind", data.kind)
        .eq("status", "sent")
        .gte("created_at", since)
        .limit(1);
      if (recent && recent.length > 0) return { sent: false, reason: "throttled" as const };
    }

    const lovableKey = process.env["LOVABLE_API_KEY"];
    const resendKey = process.env["RESEND_API_KEY"];
    if (!lovableKey || !resendKey) return { sent: false, reason: "not_configured" as const };

    const { subject, html } = buildEmail(
      data.kind,
      recipient.first_name || recipient.pseudo || "",
      actor?.first_name || actor?.pseudo || "Un membre",
      data.preview ?? null,
    );

    let status = "sent";
    let errorText: string | null = null;
    try {
      const response = await fetch(`${GATEWAY_URL}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": resendKey,
        },
        body: JSON.stringify({
          from: `${SITE_NAME} <onboarding@resend.dev>`,
          to: [recipient.email],
          subject,
          html,
        }),
      });
      if (!response.ok) {
        status = "failed";
        errorText = `[${response.status}] ${await response.text()}`;
        console.error("Resend gateway error", errorText);
      }
    } catch (e: any) {
      status = "failed";
      errorText = e?.message ?? "unknown error";
      console.error("Resend gateway exception", errorText);
    }

    await supabaseAdmin.from("email_notifications").insert({
      user_id: recipient.id,
      kind: data.kind,
      actor_id: context.userId,
      email: recipient.email,
      status,
      error: errorText,
    });

    return { sent: status === "sent", reason: status === "sent" ? ("ok" as const) : ("failed" as const) };
  });
