import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

export const Route = createFileRoute("/api/public/legal-documents")({
  server: {
    handlers: {
      GET: async () => {
        const { createPublicDatabaseClient } = await import("@/lib/legal-documents.server");
        const client = createPublicDatabaseClient();
        const { data, error } = await (client.from("legal_documents") as any)
          .select("document_key,published_content,version,published_at,updated_at")
          .order("document_key");
        if (error) return Response.json({ error: "Documents indisponibles" }, { status: 503 });
        return Response.json(
          { documents: data ?? [] },
          { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
        );
      },
    },
  },
});