/**
 * Alertes liées aux demandes des membres : signalements, messages de contact
 * et demandes d'assistance.
 *
 * Pour chaque demande :
 *  - un accusé de réception est envoyé à la personne (dans sa langue) ;
 *  - une alerte détaillée est envoyée à contact@nooryaa.com ;
 *  - pour les signalements uniquement, une notification push est envoyée
 *    aux administrateurs, avec le détail des échanges ayant mené au signalement.
 *
 * Serveur uniquement : ne jamais importer depuis le navigateur.
 */

import { layout } from "./notify.functions";
import { copyFor, normalizeLocale } from "./email-i18n";

const SITE_NAME = "Nooryaa";
const SITE_URL = "https://app.nooryaa.com";
const ADMIN_ALERT_EMAIL = "contact@nooryaa.com";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

export type RequestKind = "report" | "contact" | "support";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendResendEmail(to: string, subject: string, html: string) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) return { sent: false as const, reason: "not_configured" as const };
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
        to: [to],
        subject,
        html,
      }),
    });
    if (!response.ok) {
      console.error(`Resend gateway error [${response.status}]`, await response.text());
      return { sent: false as const, reason: "failed" as const };
    }
    return { sent: true as const };
  } catch (e) {
    console.error("Resend gateway exception", e);
    return { sent: false as const, reason: "failed" as const };
  }
}

/** Accusé de réception envoyé à la personne à l'origine de la demande. */
export async function sendRequestAckEmail(opts: {
  email: string;
  name?: string | null;
  kind: RequestKind;
  locale?: string | null;
}) {
  const locale = normalizeLocale(opts.locale);
  const c = copyFor(locale);
  const name = escapeHtml(opts.name || "");
  const html = layout(
    c.requestAck.title,
    `<p>${c.greeting(name)}</p>${c.requestAck.body(SITE_NAME, c.requestKindLabels[opts.kind])}`,
    c.requestAck.cta(SITE_NAME),
    SITE_URL,
    locale,
  );
  return sendResendEmail(opts.email, c.requestAck.subject(SITE_NAME), html);
}

/** Alerte détaillée envoyée à l'équipe (contact@nooryaa.com), en français. */
export async function sendAdminAlertEmail(opts: {
  title: string;
  lines: string[];
  adminPath: string;
}) {
  const items = opts.lines
    .filter((l) => l.trim().length > 0)
    .map((l) => `<li style="margin-bottom:6px;">${l}</li>`)
    .join("");
  const html = layout(
    opts.title,
    `<ul style="margin:0;padding-left:20px;">${items}</ul>`,
    "Ouvrir l'administration",
    `${SITE_URL}${opts.adminPath}`,
    "fr",
  );
  return sendResendEmail(ADMIN_ALERT_EMAIL, `[${SITE_NAME}] ${opts.title}`, html);
}

/** Notification push mobile envoyée à tous les administrateurs. */
export async function pushAdmins(title: string, body: string | null, path: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
  if (!roles || roles.length === 0) return;
  const { sendPushToUser } = await import("./push.server");
  for (const r of roles) {
    try {
      await sendPushToUser(r.user_id, title, body, path);
    } catch (e) {
      console.error("Push admin failed", e);
    }
  }
}

/**
 * Notifications complètes pour un nouveau signalement :
 * accusé au plaignant, alerte email à l'équipe avec le détail des échanges,
 * et push mobile aux administrateurs.
 */
export async function notifyReport(opts: { reporterId: string; reportedId: string; reason: string }) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [{ data: reporter }, { data: reported }] = await Promise.all([
    supabaseAdmin.from("profiles").select("id, email, pseudo, locale").eq("id", opts.reporterId).maybeSingle(),
    supabaseAdmin.from("profiles").select("id, email, pseudo").eq("id", opts.reportedId).maybeSingle(),
  ]);

  const reporterName = reporter?.pseudo || "Membre";
  const reportedName = reported?.pseudo || "Membre";

  // Détail des échanges ayant mené au signalement : 10 derniers messages
  // entre les deux membres, dans les deux sens.
  const { data: exchanges } = await supabaseAdmin
    .from("messages")
    .select("sender, content, image_path, audio_path, created_at")
    .or(
      `and(sender.eq.${opts.reporterId},receiver.eq.${opts.reportedId}),and(sender.eq.${opts.reportedId},receiver.eq.${opts.reporterId})`,
    )
    .order("created_at", { ascending: false })
    .limit(10);

  const exchangeLines = (exchanges ?? [])
    .slice()
    .reverse()
    .map((m) => {
      const who = m.sender === opts.reporterId ? reporterName : reportedName;
      const what = m.content?.trim()
        ? escapeHtml(m.content.trim().slice(0, 200))
        : m.audio_path
          ? "[Message vocal]"
          : m.image_path
            ? "[Photo]"
            : "[Message]";
      const when = new Date(m.created_at).toLocaleString("fr-FR");
      return `${when} — <strong>${escapeHtml(who)}</strong> : ${what}`;
    });

  const tasks: Promise<unknown>[] = [];

  if (reporter?.email) {
    tasks.push(
      sendRequestAckEmail({ email: reporter.email, name: reporter.pseudo, kind: "report", locale: (reporter as any)?.locale }),
    );
  }

  tasks.push(
    sendAdminAlertEmail({
      title: `Nouveau signalement : ${reporterName} a signalé ${reportedName}`,
      lines: [
        `<strong>Signalé par :</strong> ${escapeHtml(reporterName)} (${escapeHtml(reporter?.email ?? "email inconnu")})`,
        `<strong>Membre signalé :</strong> ${escapeHtml(reportedName)} (${escapeHtml(reported?.email ?? "email inconnu")})`,
        `<strong>Motif :</strong> ${escapeHtml(opts.reason)}`,
        `<strong>Échanges récents entre les deux membres :</strong>${
          exchangeLines.length > 0
            ? `<br/>${exchangeLines.join("<br/>")}`
            : " aucun échange trouvé."
        }`,
      ],
      adminPath: "/admin/reports",
    }),
  );

  tasks.push(pushAdmins("Nouveau signalement", `${reporterName} a signalé ${reportedName}`, "/admin/reports"));

  await Promise.all(tasks);
}

/** Accusé + alerte équipe pour une demande d'assistance (pas de push). */
export async function notifySupportTicket(opts: {
  userId: string;
  category: string;
  message: string;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email, pseudo, locale")
    .eq("id", opts.userId)
    .maybeSingle();

  const tasks: Promise<unknown>[] = [];
  if (profile?.email) {
    tasks.push(
      sendRequestAckEmail({ email: profile.email, name: profile.pseudo, kind: "support", locale: (profile as any)?.locale }),
    );
  }
  tasks.push(
    sendAdminAlertEmail({
      title: `Nouvelle demande d'assistance : ${profile?.pseudo ?? "Membre"}`,
      lines: [
        `<strong>Membre :</strong> ${escapeHtml(profile?.pseudo ?? "Membre")} (${escapeHtml(profile?.email ?? "email inconnu")})`,
        `<strong>Catégorie :</strong> ${escapeHtml(opts.category)}`,
        `<strong>Message :</strong> ${escapeHtml(opts.message.slice(0, 1000))}`,
      ],
      adminPath: "/admin/support",
    }),
  );
  await Promise.all(tasks);
}

/** Accusé + alerte équipe pour un message du formulaire de contact (pas de push). */
export async function notifyContactMessage(opts: {
  name: string;
  email: string;
  subject?: string | null;
  message: string;
}) {
  await Promise.all([
    sendRequestAckEmail({ email: opts.email, name: opts.name, kind: "contact", locale: "fr" }),
    sendAdminAlertEmail({
      title: `Nouveau message de contact : ${opts.name}`,
      lines: [
        `<strong>Nom :</strong> ${escapeHtml(opts.name)}`,
        `<strong>Email :</strong> ${escapeHtml(opts.email)}`,
        opts.subject ? `<strong>Sujet :</strong> ${escapeHtml(opts.subject)}` : "",
        `<strong>Message :</strong> ${escapeHtml(opts.message.slice(0, 1000))}`,
      ],
      adminPath: "/admin/support?tab=contact",
    }),
  ]);
}
