import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SITE_URL = "https://nooryaa.lovable.app";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(2).max(60),
  lastName: z.string().min(2).max(60),
  phone: z.string().min(8).max(20),
  origin: z.string().url().optional(),
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
    const phone = data.phone.replace(/[^0-9+]/g, "").trim();

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
        },
        redirectTo: `${data.origin ?? SITE_URL}/onboarding`,
      },
    });

    if (linkError) throw new Error(friendlySignupError(linkError));
    if (!linkData?.properties?.action_link) {
      throw new Error("Impossible de générer le lien de confirmation.");
    }

    // Envoi du mail de confirmation en arrière-plan, via le template Nooryaa / Resend.
    const { sendEmailConfirmation } = await import("@/lib/notify.functions");
    void sendEmailConfirmation({
      email,
      firstName: data.firstName.trim(),
      confirmationUrl: linkData.properties.action_link,
    }).catch(() => {});

    return { ok: true as const, email };
  });
