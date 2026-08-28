import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const categories = [
  "Partenariat",
  "Inscription",
  "Connexion / Email",
  "Signalement",
  "Suppression de compte",
  "Abonnement",
  "Autres",
] as const;

export const createSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({
    category: z.enum(categories),
    message: z.string().trim().min(10).max(2000),
  }))
  .handler(async ({ context, data }) => {
    const { error } = await (context.supabase.from("support_tickets" as any) as any).insert({
      user_id: context.userId,
      category: data.category,
      message: data.message,
    } as any);
    if (error) throw error;
    return { ok: true };
  });
