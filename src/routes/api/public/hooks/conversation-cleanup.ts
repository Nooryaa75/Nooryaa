import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { z } from "zod";

export const Route = createFileRoute("/api/public/hooks/conversation-cleanup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const parsed = z.object({ dryRun: z.boolean().optional() }).strict()
          .safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Invalid body", { status: 400 });
        try {
          const { cleanupConversations } = await import("@/lib/conversation-cleanup.server");
          return Response.json({ ok: true, ...await cleanupConversations(parsed.data.dryRun ?? false) });
        } catch {
          console.error("Conversation cleanup failed; pending media retained for retry");
          return Response.json({ ok: false }, { status: 500 });
        }
      },
    },
  },
});