import { createFileRoute } from "@tanstack/react-router";
import { layout } from "@/lib/notify.functions";
import { normalizeLocale, type MailLocale } from "@/lib/email-i18n";

/**
 * Relance quotidienne des inscriptions non terminées (onboarded = false) :
 * 5 emails de relance (1 par jour), puis suppression du compte le 6e jour
 * avec un email de confirmation. Appelé une fois par jour par la tâche planifiée.
 */
const SITE_NAME = "Nooryaa";
const SITE_URL = "https://app.nooryaa.com";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const MAX_REMINDERS = 5;
const DAY_MS = 24 * 3600 * 1000;
const MIN_GAP_MS = 20 * 3600 * 1000;

const COPY: Record<MailLocale, {
  rSubject: (left: number) => string;
  rTitle: string;
  rBody: (left: number) => string;
  rCta: string;
  dSubject: string;
  dTitle: string;
  dBody: string;
  dCta: string;
  hello: string;
}> = {
  fr: {
    hello: "Assalamu alaykum,",
    rSubject: (n) => `Terminez votre profil ${SITE_NAME} (suppression dans ${n} jour${n > 1 ? "s" : ""})`,
    rTitle: "Votre profil n'est pas terminé",
    rBody: (n) =>
      `<p>Vous avez commencé votre inscription sur <strong>${SITE_NAME}</strong>, mais votre profil n'est pas encore terminé : il n'est donc pas visible par les autres membres.</p>
       <p>Il ne vous reste que quelques minutes pour le compléter (sexe, ville, photos…).</p>
       <p><strong>Attention :</strong> les profils non terminés sont supprimés au bout de 6 jours. Sans action de votre part, votre compte sera supprimé dans <strong>${n} jour${n > 1 ? "s" : ""}</strong>.</p>`,
    rCta: "Terminer mon profil",
    dSubject: `Votre inscription ${SITE_NAME} a été supprimée`,
    dTitle: "Votre inscription a été supprimée",
    dBody: `<p>Votre profil <strong>${SITE_NAME}</strong> n'ayant pas été terminé dans les 6 jours, votre inscription et les données associées ont été supprimées.</p>
       <p>Vous pouvez créer un nouveau compte à tout moment si vous le souhaitez.</p>`,
    dCta: "Créer un nouveau compte",
  },
  en: {
    hello: "Assalamu alaykum,",
    rSubject: (n) => `Finish your ${SITE_NAME} profile (deleted in ${n} day${n > 1 ? "s" : ""})`,
    rTitle: "Your profile is not finished",
    rBody: (n) =>
      `<p>You started signing up on <strong>${SITE_NAME}</strong>, but your profile is not finished yet, so other members cannot see it.</p>
       <p>It only takes a few minutes to complete (gender, city, photos…).</p>
       <p><strong>Please note:</strong> unfinished profiles are deleted after 6 days. Without action, your account will be deleted in <strong>${n} day${n > 1 ? "s" : ""}</strong>.</p>`,
    rCta: "Finish my profile",
    dSubject: `Your ${SITE_NAME} registration has been deleted`,
    dTitle: "Your registration has been deleted",
    dBody: `<p>Since your <strong>${SITE_NAME}</strong> profile was not finished within 6 days, your registration and its data have been deleted.</p>
       <p>You can create a new account at any time.</p>`,
    dCta: "Create a new account",
  },
  ar: {
    hello: "السلام عليكم،",
    rSubject: (n) => `أكمل ملفك على ${SITE_NAME} (الحذف بعد ${n} يوم)`,
    rTitle: "ملفك الشخصي غير مكتمل",
    rBody: (n) =>
      `<p>لقد بدأت التسجيل في <strong>${SITE_NAME}</strong>، لكن ملفك لم يكتمل بعد، لذلك لا يراه الأعضاء الآخرون.</p>
       <p>إكماله لا يستغرق سوى بضع دقائق (الجنس، المدينة، الصور…).</p>
       <p><strong>تنبيه:</strong> تُحذف الملفات غير المكتملة بعد 6 أيام. إن لم تفعل شيئًا، سيُحذف حسابك بعد <strong>${n} يوم</strong>.</p>`,
    rCta: "إكمال ملفي",
    dSubject: `تم حذف تسجيلك في ${SITE_NAME}`,
    dTitle: "تم حذف تسجيلك",
    dBody: `<p>بما أن ملفك على <strong>${SITE_NAME}</strong> لم يكتمل خلال 6 أيام، فقد تم حذف تسجيلك وبياناته.</p>
       <p>يمكنك إنشاء حساب جديد في أي وقت.</p>`,
    dCta: "إنشاء حساب جديد",
  },
};

async function sendMail(to: string, subject: string, html: string) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) return false;
  try {
    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({ from: `${SITE_NAME} <noreply@info.nooryaa.com>`, to: [to], subject, html }),
    });
    if (!res.ok) console.error("incomplete-profiles mail error", res.status, await res.text());
    return res.ok;
  } catch (e: any) {
    console.error("incomplete-profiles mail exception", e?.message ?? e);
    return false;
  }
}

export const Route = createFileRoute("/api/public/hooks/incomplete-profiles")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const token = request.headers.get("authorization")?.replace("Bearer ", "") ?? "";
        const { data: tok } = await (supabaseAdmin as any)
          .from("internal_cron_tokens")
          .select("token")
          .eq("name", "incomplete-profiles")
          .maybeSingle();
        if (!token || !tok?.token || token !== tok.token) {
          return new Response("Unauthorized", { status: 401 });
        }

        const now = Date.now();
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("id, email, locale, created_at")
          .eq("onboarded", false)
          .lt("created_at", new Date(now - DAY_MS + 3600 * 1000).toISOString())
          .limit(500);

        const { data: staff } = await supabaseAdmin.from("user_roles").select("user_id").in("role", ["admin", "moderator"]);
        const staffIds = new Set((staff ?? []).map((r: any) => r.user_id));

        let reminded = 0;
        let deleted = 0;
        for (const p of profiles ?? []) {
          if (!p.email || staffIds.has(p.id)) continue;
          const { data: sent } = await supabaseAdmin
            .from("email_notifications")
            .select("created_at")
            .eq("user_id", p.id)
            .eq("kind", "incomplete_reminder")
            .eq("status", "sent")
            .order("created_at", { ascending: false });
          const count = sent?.length ?? 0;
          const last = sent?.[0] ? new Date(sent[0].created_at).getTime() : 0;
          if (last && now - last < MIN_GAP_MS) continue;

          const locale = normalizeLocale(p.locale);
          const c = COPY[locale];

          if (count < MAX_REMINDERS) {
            const left = 6 - (count + 1);
            const html = layout(c.rTitle, `<p>${c.hello}</p>${c.rBody(left)}`, c.rCta, `${SITE_URL}/auth?mode=signin`, locale);
            const ok = await sendMail(p.email, c.rSubject(left), html);
            await supabaseAdmin.from("email_notifications").insert({
              user_id: p.id, kind: "incomplete_reminder", email: p.email, status: ok ? "sent" : "failed",
            });
            if (ok) reminded++;
          } else {
            const html = layout(c.dTitle, `<p>${c.hello}</p>${c.dBody}`, c.dCta, `${SITE_URL}/auth`, locale);
            const { error } = await supabaseAdmin.rpc("delete_own_account", { user_id: p.id });
            if (error) {
              console.error("incomplete-profiles delete error", p.id, error.message);
              continue;
            }
            await sendMail(p.email, c.dSubject, html);
            deleted++;
          }
        }

        return Response.json({ ok: true, reminded, deleted });
      },
    },
  },
});
