import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { emailVerificationUrl } from "@/lib/email-app-link";

const SITE_URL = "https://nooryaa.lovable.app";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().max(60).optional().default(""),
  lastName: z.string().max(60).optional().default(""),
  phone: z.string().min(8).max(20),
  origin: z.string().url().optional(),
  locale: z.string().optional(),
  presignup: z
    .object({
      gender: z.enum(["homme", "femme"]).optional(),
      pseudo: z.string().max(40).optional(),
      birthdate: z.string().max(10).optional(),
      origins: z.array(z.string().max(80)).max(3).optional(),
      city: z.string().max(120).optional(),
      country: z.string().max(80).optional(),
      latitude: z.number().nullable().optional(),
      longitude: z.number().nullable().optional(),
    })
    .optional(),
});

function friendlySignupError(error: any): string {
  const msg = String(error?.message || error || "");
  if (/already registered|already exists|duplicate|user already|email taken/i.test(msg)) {
    return "Cet email est déjà utilisé.";
  }
  if (/phone|téléphone|profiles_phone_unique/i.test(msg)) {
    return "Un compte existe déjà avec ce numéro de téléphone.";
  }
  if (/password|mot de passe|pwned|weak/i.test(msg)) {
    return "Mot de passe trop faible. Utilisez au moins 6 caractères avec des lettres et chiffres.";
  }
  if (/rate limit|too many/i.test(msg)) {
    return "Trop de tentatives. Réessayez dans quelques minutes.";
  }
  return "Impossible de créer le compte. Vérifiez votre connexion ou désactivez votre VPN/pare-feu.";
}

/**
 * Inscription de secours côté serveur.
 * Utile quand le client est bloqué par un VPN, un pare-feu ou un réseau
 * restreint qui empêche d'atteindre directement l'API Supabase Auth.
 */
export const signUpByServer = createServerFn({ method: "POST" })
  .inputValidator((data) => signUpSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const email = data.email.trim().toLowerCase();
    const { parsePhoneNumberFromString } = await import("libphonenumber-js");
    const parsedPhone = parsePhoneNumberFromString(data.phone.trim(), "FR");
    if (!parsedPhone || !parsedPhone.isValid()) throw new Error("Numéro de téléphone invalide pour le pays choisi.");
    const phone = parsedPhone.number;

    // Vérifications explicites pour donner un message clair avant toute création.
    const { data: existingEmail } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (existingEmail) throw new Error("Cet email est déjà utilisé.");

    const { data: existingPhone } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();
    if (existingPhone) throw new Error("Un compte existe déjà avec ce numéro de téléphone.");

    // Génère le lien de confirmation signup : cela crée l'utilisateur dans auth.users
    // et renvoie le lien qu'il faut cliquer pour valider l'email et ouvrir la session.
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName.trim(),
          last_name: data.lastName.trim(),
          phone,
          locale: (data.locale ?? "fr").slice(0, 2),
        },
        redirectTo: `${data.origin ?? SITE_URL}/onboarding`,
      },
    });

    if (linkError) throw new Error(friendlySignupError(linkError));
    if (!linkData?.properties?.hashed_token) {
      throw new Error("Impossible de générer le lien de confirmation.");
    }

    // Preuve datée de l'acceptation des CGU et de la politique de confidentialité (RGPD).
    const newUserId = (linkData as { user?: { id?: string } })?.user?.id;
    if (newUserId) {
      await supabaseAdmin
        .from("user_consents")
        .insert([
          { user_id: newUserId, kind: "terms", accepted: true, locale: data.locale ?? "fr", source: "signup" },
          { user_id: newUserId, kind: "privacy", accepted: true, locale: data.locale ?? "fr", source: "signup" },
        ])
        .then(() => undefined, () => undefined);
    }

    // Réponses de l'inscription guidée : enregistrées tout de suite dans la fiche,
    // pour qu'elles soient retrouvées même si le lien email s'ouvre ailleurs
    // (application, autre navigateur, autre téléphone).
    if (newUserId && data.presignup) {
      const { presignupProfilePatch } = await import("@/lib/presignup");
      const { isAdult } = await import("@/lib/profile");
      const patch = presignupProfilePatch(data.presignup, null);
      if (patch.birthdate && !isAdult(patch.birthdate)) delete patch.birthdate;
      if (patch.pseudo) {
        const { data: taken } = await supabaseAdmin
          .from("profiles").select("id").eq("pseudo", patch.pseudo).neq("id", newUserId).maybeSingle();
        if (taken) delete patch.pseudo;
      }
      if (Object.keys(patch).length > 0) {
        await supabaseAdmin.from("profiles").update(patch as any).eq("id", newUserId)
          .then(() => undefined, () => undefined);
      }
    }

    // Envoi du mail de confirmation via le template Nooryaa / Resend.
    const { sendEmailConfirmation } = await import("@/lib/notify.functions");
    const sendResult = await sendEmailConfirmation({
      email,
      firstName: data.firstName.trim(),
      confirmationUrl: emailVerificationUrl(linkData.properties.hashed_token, "signup"),
      locale: data.locale,
    }).catch(() => ({ sent: false as const }));

    return { ok: true as const, email, emailSent: sendResult.sent };

  });

const resendSchema = z.object({
  email: z.string().email(),
  origin: z.string().url().optional(),
  locale: z.string().optional(),
});

/** Renvoie l'email de confirmation d'inscription à un compte non encore validé. */
export const resendSignupConfirmation = createServerFn({ method: "POST" })
  .inputValidator((data) => resendSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("first_name, locale")
      .ilike("email", email)
      .maybeSingle();

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      // "magiclink" ne modifie pas le mot de passe choisi et confirme l'email au clic.
      type: "magiclink",
      email,
      options: { redirectTo: `${data.origin ?? SITE_URL}/onboarding` },
    });


    if (linkError || !linkData?.properties?.hashed_token) {
      throw new Error("Impossible de renvoyer l'email de confirmation. Réessayez dans un instant.");
    }

    const { sendEmailConfirmation } = await import("@/lib/notify.functions");
    const sendResult = await sendEmailConfirmation({
      email,
      firstName: profile?.first_name ?? "",
      confirmationUrl: emailVerificationUrl(linkData.properties.hashed_token, "magiclink"),
      locale: data.locale ?? (profile as any)?.locale,
    }).catch(() => ({ sent: false as const }));

    return { ok: true as const, emailSent: sendResult.sent };
  });

