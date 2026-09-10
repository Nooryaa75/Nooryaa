import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SITE_NAME = "Nooryaa";
const SITE_URL = "https://nooryaa.lovable.app";
const LOGO_URL = `${SITE_URL}/__l5e/assets-v1/8bac8c57-59cb-45bd-a929-b1bb843cf2e2/nooryaa-logo.png`;
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

export function layout(title: string, body: string, ctaLabel: string, ctaUrl: string) {
  return `<!doctype html>
<html lang="fr"><head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <style>
    :root { color-scheme: light only; supported-color-schemes: light only; }
    /* Neutralise l'inversion automatique du mode sombre (Gmail, Outlook, iOS) */
    u + .body .glist { color: inherit !important; }
    [data-ogsc] .nry-card { background:#ffffff !important; }
    [data-ogsc] .nry-title { color:#2b1f57 !important; }
    [data-ogsc] .nry-text { color:#4a4468 !important; }
    [data-ogsc] .nry-foot { background:#faf9ff !important; color:#8a83a6 !important; }
    [data-ogsc] .nry-cta { background:#c2185b !important; color:#ffffff !important; }
    @media (prefers-color-scheme: dark) {
      .nry-card { background:#ffffff !important; }
      .nry-title { color:#2b1f57 !important; }
      .nry-text { color:#4a4468 !important; }
      .nry-foot { background:#faf9ff !important; color:#8a83a6 !important; }
      .nry-cta { background:#c2185b !important; color:#ffffff !important; }
    }
  </style>
</head>
<body class="body" style="margin:0;padding:0;background:#f6f5fb;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5fb;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" class="nry-card" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e3f2;">
        <tr><td align="center" style="background:#3b2a7a;padding:24px;"><img src="${LOGO_URL}" alt="${SITE_NAME}" width="96" height="96" style="display:block;margin:0 auto;border-radius:20px;" /></td></tr>
        <tr><td style="padding:24px;">
          <h1 class="nry-title" style="margin:0 0 12px;font-size:18px;color:#2b1f57;">${title}</h1>
          <div class="nry-text" style="font-size:15px;line-height:1.6;color:#4a4468;">${body}</div>

          <div style="margin-top:24px;">
            <a class="nry-cta" href="${ctaUrl}" style="display:inline-block;background:#c2185b;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:15px;font-weight:bold;">${ctaLabel}</a>
          </div>
        </td></tr>
        <tr><td class="nry-foot" style="padding:16px 24px;background:#faf9ff;font-size:12px;color:#8a83a6;">

          Vous recevez cet email car vos préférences de notification l'autorisent.
          Vous pouvez les modifier à tout moment dans <a href="${SITE_URL}/compte/notifications" style="color:#3b2a7a;">Mon compte → Mes notifications</a>.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function actorAvatar(avatarUrl?: string | null, actorName?: string, blurred?: boolean) {
  // Si le membre a flouté sa photo, on ne l'inclut pas du tout dans l'email
  // (le filtre CSS n'est pas supporté par tous les clients mail, ex. Outlook).
  if (!avatarUrl || blurred) return "";
  return `<div style="text-align:center;margin:0 0 16px;"><img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(actorName || "Membre")}" width="72" height="72" style="display:block;margin:0 auto;border-radius:50%;object-fit:cover;border:3px solid #e6e3f2;" /></div>`;
}

function buildEmail(kind: NotifyKind, recipientName: string, actorName: string, preview?: string | null, actorAvatarUrl?: string | null, actorBlurred?: boolean) {
  const who = escapeHtml(actorName || "Un membre");
  const hi = `Assalamu alaykum ${escapeHtml(recipientName || "")},`.trim();
  const avatar = actorAvatar(actorAvatarUrl, actorName, actorBlurred);

  switch (kind) {
    case "like":
      return {
        subject: `${who} vous a liké sur ${SITE_NAME} 💜`,
        html: layout(
          "Vous avez un nouveau coup de cœur",
          `${avatar}<p>${hi}</p><p><strong>${who}</strong> vient de vous liker sur ${SITE_NAME}. Découvrez son profil et, si le cœur y est, likez à votre tour pour ouvrir la conversation.</p>`,
          "Voir qui m'a liké",
          `${SITE_URL}/likes`,
        ),
      };
    case "match":
      return {
        subject: `C'est un match avec ${who} ! 🎉`,
        html: layout(
          "Vous avez un nouveau match",
          `${avatar}<p>${hi}</p><p>Vous et <strong>${who}</strong> vous êtes likés mutuellement. Vous pouvez désormais échanger dans le respect de la charte ${SITE_NAME}.</p>`,
          "Démarrer la conversation",
          `${SITE_URL}/matchs`,
        ),
      };
    case "message":
      return {
        subject: `Nouveau message de ${who}`,
        html: layout(
          "Vous avez reçu un message",
          `${avatar}<p>${hi}</p><p><strong>${who}</strong> vous a envoyé un message sur ${SITE_NAME}.</p>${
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
          `${avatar}<p>${hi}</p><p><strong>${who}</strong> a récemment visité votre profil sur ${SITE_NAME}.</p>`,
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
      supabaseAdmin.from("profiles").select("id, pseudo, first_name, primary_photo_blurred").eq("id", context.userId).maybeSingle(),
    ]);

    const { data: actorPhoto } = await supabaseAdmin
      .from("photos")
      .select("url")
      .eq("user_id", context.userId)
      .order("position")
      .limit(1)
      .maybeSingle();

    if (!recipient?.email) return { sent: false, reason: "no_email" as const };

    const prefs = (recipient.preferences as any)?.notifications?.[PREF_KEY[data.kind]];
    const actorName = actor?.first_name || actor?.pseudo || "Un membre";

    // Notification in-app (centre de notifications) — respecte la préférence "push in-app".
    const inAppEnabled = typeof prefs?.in_app === "boolean" ? prefs.in_app : true;
    if (inAppEnabled) {
      const titles: Record<NotifyKind, string> = {
        like: `${actorName} vous a liké`,
        match: `C'est un match avec ${actorName} !`,
        message: `Nouveau message de ${actorName}`,
        visit: `${actorName} a consulté votre profil`,
      };
      const links: Record<NotifyKind, string> = {
        like: "/likes",
        match: "/matchs",
        message: "/messages",
        visit: "/compte/profil",
      };
      // Anti-doublon : une seule notification in-app par expéditeur et par type
      // dans la fenêtre anti-spam (sinon le centre de notifications se remplit
      // de dizaines d'entrées identiques).
      const inAppMinutes = THROTTLE_MINUTES[data.kind];
      let duplicate = false;
      if (inAppMinutes > 0) {
        const sinceInApp = new Date(Date.now() - inAppMinutes * 60000).toISOString();
        const { data: recentInApp } = await supabaseAdmin
          .from("notifications")
          .select("id")
          .eq("user_id", recipient.id)
          .eq("actor_id", context.userId)
          .eq("kind", data.kind)
          .gte("created_at", sinceInApp)
          .limit(1);
        duplicate = !!(recentInApp && recentInApp.length > 0);
      }
      if (!duplicate) {
        await supabaseAdmin.from("notifications").insert({
          user_id: recipient.id,
          actor_id: context.userId,
          kind: data.kind,
          title: titles[data.kind],
          body: data.kind === "message" && data.preview ? `« ${data.preview.slice(0, 140)} »` : null,
          link: links[data.kind],
        });
      }
    }


    // Emails désactivés par défaut à l'inscription : l'utilisateur les active
    // lui-même dans Mon compte → Mes notifications.
    const emailEnabled = prefs?.email === true;
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
      actorName,
      data.preview ?? null,
      actorPhoto?.url ?? null,
      (actor as any)?.primary_photo_blurred === true,
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
          from: `${SITE_NAME} <noreply@info.nooryaa.com>`,
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

/**
 * Email de bienvenue envoyé à la création du compte.
 * Fonction publique mais protégée : l'email n'est envoyé que si le profil
 * existe (compte réellement créé) et qu'aucun email de bienvenue n'a déjà
 * été envoyé à cette adresse.
 */
export const sendWelcomeEmail = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string }) => {
    const email = String(data?.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email invalide");
    return { email };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, pseudo, first_name")
      .ilike("email", data.email)
      .maybeSingle();
    if (!profile?.email) return { sent: false, reason: "no_account" as const };

    const { data: already } = await supabaseAdmin
      .from("email_notifications")
      .select("id")
      .eq("user_id", profile.id)
      .eq("kind", "welcome")
      .eq("status", "sent")
      .limit(1);
    if (already && already.length > 0) return { sent: false, reason: "already_sent" as const };

    const lovableKey = process.env["LOVABLE_API_KEY"];
    const resendKey = process.env["RESEND_API_KEY"];
    if (!lovableKey || !resendKey) return { sent: false, reason: "not_configured" as const };

    const name = escapeHtml(profile.first_name || profile.pseudo || "");
    const html = layout(
      "Bienvenue sur " + SITE_NAME,
      `<p>Assalamu alaykum ${name},</p>
       <p>Bienvenue sur <strong>${SITE_NAME}</strong>, la plateforme de rencontre pensée pour les musulmans qui souhaitent construire une relation sérieuse, dans le respect et la bienveillance.</p>
       <p>Pour bien démarrer :</p>
       <ul style="margin:0;padding-left:20px;">
         <li>Complétez votre fiche profil (photos, pratique, projets…) ;</li>
         <li>Réalisez votre selfie de vérification pour obtenir le badge ;</li>
         <li>Découvrez les profils recommandés près de chez vous.</li>
       </ul>
       <p style="margin-top:12px;">Qu'Allah facilite vos démarches et vous accorde un compagnon ou une compagne qui vous apaise le cœur.</p>`,
      "Compléter mon profil",
      `${SITE_URL}/onboarding`,
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
          from: `${SITE_NAME} <noreply@info.nooryaa.com>`,
          to: [profile.email],
          subject: `Bienvenue sur ${SITE_NAME} 🌙`,
          html,
        }),
      });
      if (!response.ok) {
        status = "failed";
        errorText = `[${response.status}] ${await response.text()}`;
        console.error("Resend gateway error (welcome)", errorText);
      }
    } catch (e: any) {
      status = "failed";
      errorText = e?.message ?? "unknown error";
      console.error("Resend gateway exception (welcome)", errorText);
    }

    await supabaseAdmin.from("email_notifications").insert({
      user_id: profile.id,
      kind: "welcome",
      actor_id: null,
      email: profile.email,
      status,
      error: errorText,
    });

    return { sent: status === "sent" };
  });

/**
 * Envoi manuel du lien de confirmation d'email (signup fallback serveur).
 * Fonction utilitaire appelée depuis d'autres server functions.
 */
export async function sendEmailConfirmation(opts: {
  email: string;
  firstName?: string;
  confirmationUrl: string;
}) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) return { sent: false, reason: "not_configured" as const };

  const name = escapeHtml(opts.firstName || "");
  const html = layout(
    "Confirmez votre adresse email",
    `<p>Assalamu alaykum ${name},</p>
     <p>Merci de rejoindre <strong>${SITE_NAME}</strong>. Pour activer votre compte et accéder à la plateforme, cliquez sur le bouton ci-dessous :</p>`,
    "Confirmer mon email",
    opts.confirmationUrl,
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
        from: `${SITE_NAME} <noreply@info.nooryaa.com>`,
        to: [opts.email],
        subject: `Confirmez votre inscription sur ${SITE_NAME}`,
        html,
      }),
    });
    if (!response.ok) {
      status = "failed";
      errorText = `[${response.status}] ${await response.text()}`;
      console.error("Resend gateway error (confirmation)", errorText);
    }
  } catch (e: any) {
    status = "failed";
    errorText = e?.message ?? "unknown error";
    console.error("Resend gateway exception (confirmation)", errorText);
  }

  return { sent: status === "sent", reason: status === "sent" ? ("ok" as const) : ("failed" as const), errorText };
}

/**
 * Confirmation de suspension ou de suppression du compte.
 * Fonction utilitaire serveur appelée depuis account.functions.ts.
 */
export async function sendAccountClosureEmail(opts: {
  email: string;
  firstName?: string | null;
  action: "suspend" | "delete";
  reason?: string | null;
  details?: string | null;
}) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) return { sent: false, reason: "not_configured" as const };

  const name = escapeHtml(opts.firstName || "");
  const reasonBlock = opts.reason
    ? `<p style="margin-top:12px;">Motif indiqué : <strong>${escapeHtml(opts.reason)}</strong>${
        opts.details ? `<br /><em>« ${escapeHtml(opts.details)} »</em>` : ""
      }</p>`
    : "";

  const isSuspend = opts.action === "suspend";
  const title = isSuspend ? "Votre compte est suspendu" : "Votre compte a été supprimé";
  const body = isSuspend
    ? `<p>Assalamu alaykum ${name},</p>
       <p>Nous confirmons la <strong>suspension</strong> de votre compte ${SITE_NAME}.</p>
       <p>Concrètement :</p>
       <ul style="margin:0;padding-left:20px;">
         <li>Votre profil n'est plus visible par les autres membres ;</li>
         <li>Vos conversations, photos et coups de cœur sont conservés ;</li>
         <li>Vous ne recevez plus aucune notification ;</li>
         <li>Vous pouvez réactiver votre compte à tout moment en contactant notre service client.</li>
       </ul>
       ${reasonBlock}
       <p style="margin-top:12px;">Qu'Allah facilite vos démarches. Vous serez toujours le bienvenu parmi nous.</p>`
    : `<p>Assalamu alaykum ${name},</p>
       <p>Nous confirmons la <strong>suppression définitive</strong> de votre compte ${SITE_NAME}.</p>
       <p>Concrètement :</p>
       <ul style="margin:0;padding-left:20px;">
         <li>Votre profil, vos photos, vos messages, vos coups de cœur et vos recherches ont été effacés ;</li>
         <li>Votre abonnement éventuel n'est plus renouvelé ;</li>
         <li>Cette action est irréversible : ces données ne peuvent pas être restaurées ;</li>
         <li>Vous pouvez créer un nouveau compte plus tard si vous le souhaitez.</li>
       </ul>
       ${reasonBlock}
       <p style="margin-top:12px;">Merci pour la confiance que vous nous avez accordée. Qu'Allah vous accorde ce qu'il y a de meilleur.</p>`;

  const html = layout(
    title,
    body,
    isSuspend ? "Contacter le service client" : `Revenir sur ${SITE_NAME}`,
    isSuspend ? `${SITE_URL}/compte/service-client` : SITE_URL,
  );

  try {
    const response = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({
        from: `${SITE_NAME} <noreply@info.nooryaa.com>`,
        to: [opts.email],
        subject: isSuspend
          ? `Confirmation : votre compte ${SITE_NAME} est suspendu`
          : `Confirmation : votre compte ${SITE_NAME} a été supprimé`,
        html,
      }),
    });
    if (!response.ok) {
      console.error("Resend gateway error (closure)", `[${response.status}] ${await response.text()}`);
      return { sent: false, reason: "failed" as const };
    }
  } catch (e: any) {
    console.error("Resend gateway exception (closure)", e?.message ?? e);
    return { sent: false, reason: "failed" as const };
  }

  return { sent: true, reason: "ok" as const };
}


/**
 * Mot de passe oublié : génère un lien de réinitialisation sécurisé
 * et l'envoie avec le template email Nooryaa (Resend).
 * Réponse volontairement neutre : on n'indique jamais si l'email existe.
 */
export const sendPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; origin?: string }) => {
    const email = String(data?.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email invalide");
    const origin = typeof data?.origin === "string" && /^https?:\/\//.test(data.origin) ? data.origin : undefined;
    return { email, origin };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const base = data.origin ?? SITE_URL;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, pseudo, first_name")
      .ilike("email", data.email)
      .maybeSingle();
    if (!profile?.email) return { sent: true };

    const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: profile.email,
      options: { redirectTo: `${base}/reinitialiser-mot-de-passe` },
    });
    if (linkError || !link?.properties?.action_link) {
      console.error("generateLink recovery error", linkError?.message);
      return { sent: true };
    }

    const lovableKey = process.env["LOVABLE_API_KEY"];
    const resendKey = process.env["RESEND_API_KEY"];
    if (!lovableKey || !resendKey) return { sent: true };

    const name = escapeHtml(profile.first_name || profile.pseudo || "");
    const html = layout(
      "Réinitialisation de votre mot de passe",
      `<p>Assalamu alaykum ${name},</p>
       <p>Vous avez demandé à réinitialiser le mot de passe de votre compte <strong>${SITE_NAME}</strong>.</p>
       <p>Ce lien est valable <strong>1 heure</strong> et ne peut être utilisé qu'une seule fois.</p>
       <p style="color:#8a83a6;font-size:13px;">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email : votre mot de passe reste inchangé.</p>`,
      "Choisir un nouveau mot de passe",
      link.properties.action_link,
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
          from: `${SITE_NAME} <noreply@info.nooryaa.com>`,
          to: [profile.email],
          subject: `Réinitialisez votre mot de passe ${SITE_NAME}`,
          html,
        }),
      });
      if (!response.ok) {
        status = "failed";
        errorText = `[${response.status}] ${await response.text()}`;
        console.error("Resend gateway error (reset)", errorText);
      }
    } catch (e: any) {
      status = "failed";
      errorText = e?.message ?? "unknown error";
      console.error("Resend gateway exception (reset)", errorText);
    }

    await supabaseAdmin.from("email_notifications").insert({
      user_id: profile.id,
      kind: "password_reset",
      actor_id: null,
      email: profile.email,
      status,
      error: errorText,
    });

    return { sent: true };
  });
