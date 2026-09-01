import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { queryDiscoveryProfiles, type Filters } from "@/lib/discovery";

const inputSchema = z.object({
  searches: z.array(
    z.object({
      id: z.string(),
      filters: z.any(),
      last_notified_at: z.string().nullable().optional(),
    })
  ),
});

export const getSavedSearchCounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ context, data }) => {
    const supabase = context.supabase;
    const userId = context.userId;

    const [
      { data: me },
      { data: iBlock },
      { data: blockedMe },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("blocks").select("blocked").eq("blocker", userId),
      supabase.from("blocks").select("blocker").eq("blocked", userId),
    ]);

    const excluded = new Set<string>([
      ...(iBlock ?? []).map((r: any) => r.blocked),
      ...(blockedMe ?? []).map((r: any) => r.blocker),
    ]);

    const result: Record<string, { total: number; new: number }> = {};

    for (const s of data.searches) {
      const filters = (s.filters ?? {}) as Filters;
      const rows = await queryDiscoveryProfiles({
        me,
        filters,
        excluded,
        supabase,
        limit: 1000,
      });
      const threshold = s.last_notified_at ? new Date(s.last_notified_at).getTime() : 0;
      const total = rows.length;
      const newCount = rows.filter((r: any) => new Date(r.created_at ?? 0).getTime() > threshold).length;
      result[s.id] = { total, new: newCount };
    }

    return result;
  });
