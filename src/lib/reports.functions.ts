import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Signalement d'un membre par un autre. Après l'enregistrement, la personne
 * reçoit un accusé de réception par email, l'équipe reçoit une alerte
 * détaillée (avec les échanges récents entre les deux membres) et les
 * administrateurs reçoivent une notification push.
 */
export const submitReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { reportedId: string; reason: string }) =>
    z
      .object({
        reportedId: z.string().uuid(),
        reason: z.string().trim().min(3).max(500),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    if (data.reportedId === context.userId) throw new Error("Vous ne pouvez pas vous signaler vous-même");
    const { error } = await context.supabase.from("reports").insert({
      reporter: context.userId,
      reported: data.reportedId,
      reason: data.reason,
    });
    if (error) throw error;

    // Notifications (accusé, alerte équipe, push admins) : silencieuses en cas
    // d'erreur pour ne jamais bloquer le signalement lui-même.
    try {
      const { notifyReport } = await import("./request-alerts.server");
      await notifyReport({ reporterId: context.userId, reportedId: data.reportedId, reason: data.reason });
    } catch (e) {
      console.error("Report notifications failed", e);
    }
    return { ok: true };
  });
