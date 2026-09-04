import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const suspendAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ status: "suspended" })
      .eq("id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("delete_own_account", {
      user_id: context.userId,
    });
    if (error) throw error;
    return { ok: true };
  });
