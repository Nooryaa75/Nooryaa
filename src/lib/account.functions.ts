import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendAccountClosureEmail } from "@/lib/notify.functions";

/** Motifs proposés lors d'une suspension ou d'une suppression de compte. */
export const CLOSURE_REASONS = [
  "J'ai trouvé la personne, je me marie in cha Allah",
  "Je n'ai pas trouvé de profil qui me correspond",
  "Trop cher",
  "Pas assez de profils dans ma région",
  "Je souhaite faire une pause",
  "Trop de messages ou de sollicitations",
  "Problème technique ou application difficile à utiliser",
  "Autre",
] as const;

function cleanReason(input: unknown) {
  const reason = typeof input === "string" ? input.trim().slice(0, 200) : "";
  return reason || null;
}

function cleanDetails(input: unknown) {
  const details = typeof input === "string" ? input.trim().slice(0, 1000) : "";
  return details || null;
}

export const suspendAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data?: { reason?: string; details?: string }) => ({
    reason: cleanReason(data?.reason),
    details: cleanDetails(data?.details),
  }))
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("email, first_name, pseudo")
      .eq("id", context.userId)
      .maybeSingle();

    const { error } = await context.supabase
      .from("profiles")
      .update({ status: "suspended" })
      .eq("id", context.userId);
    if (error) throw error;

    if (profile?.email) {
      await sendAccountClosureEmail({
        email: profile.email,
        firstName: profile.first_name || profile.pseudo,
        action: "suspend",
        reason: data.reason,
        details: data.details,
      });
    }
    return { ok: true };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data?: { reason?: string; details?: string }) => ({
    reason: cleanReason(data?.reason),
    details: cleanDetails(data?.details),
  }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, first_name, pseudo")
      .eq("id", context.userId)
      .maybeSingle();

    const { error } = await supabaseAdmin.rpc("delete_own_account", {
      p_user_id: context.userId,
    });
    if (error) throw error;

    if (profile?.email) {
      await sendAccountClosureEmail({
        email: profile.email,
        firstName: profile.first_name || profile.pseudo,
        action: "delete",
        reason: data.reason,
        details: data.details,
      });
    }
    return { ok: true };
  });
