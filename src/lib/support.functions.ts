import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { supportCategories } from "./support-categories";

export const categories = supportCategories;

export const createSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { category: (typeof categories)[number]; message: string }) =>
    z.object({
      category: z.enum(categories),
      message: z.string().trim().min(10).max(2000),
    }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("support_tickets").insert({
      user_id: context.userId,
      category: data.category,
      message: data.message,
    });
    if (error) throw error;

    // Accusé de réception au membre + alerte email à l'équipe (sans push).
    try {
      const { notifySupportTicket } = await import("./request-alerts.server");
      await notifySupportTicket({ userId: context.userId, category: data.category, message: data.message });
    } catch (e) {
      console.error("Support ticket notifications failed", e);
    }
    return { ok: true };
  });

/** Liste des demandes du membre avec l'historique des échanges (notes internes exclues). */
export const listMyTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: tickets, error } = await context.supabase
      .from("support_tickets")
      .select("id, category, message, status, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    if (!tickets || tickets.length === 0) return { tickets: [] };

    const { data: replies } = await context.supabase
      .from("ticket_replies")
      .select("id, ticket_id, author, content, created_at")
      .in("ticket_id", tickets.map((t) => t.id))
      .eq("internal", false)
      .order("created_at");

    return {
      tickets: tickets.map((t) => ({
        ...t,
        replies: (replies ?? []).filter((r) => r.ticket_id === t.id),
      })),
    };
  });
