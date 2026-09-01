import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Enregistre le changement d'abonnement du membre (suivi CA côté administration). */
export const recordSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { planCode: string; amountTtc: number; days: number; autoRenew: boolean }) => data)
  .handler(async ({ context, data }) => {
    const now = new Date();
    const ends = data.days > 0 ? new Date(now.getTime() + data.days * 86400000).toISOString() : null;

    await context.supabase
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: now.toISOString() })
      .eq("user_id", context.userId)
      .eq("status", "active");

    const { error } = await context.supabase.from("subscriptions").insert({
      user_id: context.userId,
      plan_code: data.planCode,
      amount_ttc: data.amountTtc,
      vat_rate: 20,
      status: "active",
      auto_renew: data.autoRenew,
      started_at: now.toISOString(),
      ends_at: ends,
    });
    if (error) throw error;
    return { ok: true };
  });

export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("subscriptions")
      .update({ auto_renew: false, cancelled_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .eq("status", "active");
    if (error) throw error;
    return { ok: true };
  });
