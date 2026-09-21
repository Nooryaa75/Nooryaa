import { createServerFn } from "@tanstack/react-start";
import { DEFAULT_LEGAL_CONTENT, type LegalDocumentKey } from "./legal-documents";

export const fetchPublishedLegalDocument = createServerFn({ method: "GET" })
  .inputValidator((data: { key: LegalDocumentKey }) => data)
  .handler(async ({ data }) => {
    const { createPublicDatabaseClient } = await import("./legal-documents.server");
    const client = createPublicDatabaseClient();
    const { data: row } = await (client.from("legal_documents") as any)
      .select("document_key,published_content,version,published_at,updated_at")
      .eq("document_key", data.key)
      .maybeSingle();
    return row
      ? { content: row.published_content, version: row.version, publishedAt: row.published_at }
      : { content: DEFAULT_LEGAL_CONTENT[data.key], version: 0, publishedAt: null };
  });