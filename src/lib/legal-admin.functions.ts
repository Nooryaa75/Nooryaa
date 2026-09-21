import { createServerFn } from "@tanstack/react-start";
import { DEFAULT_LEGAL_CONTENT, isLegalContent, type LegalContent, type LegalDocumentKey } from "./legal-documents";

export type AdminLegalDocument = {
  key: LegalDocumentKey;
  draft: LegalContent;
  published: LegalContent | null;
  version: number;
  publishedAt: string | null;
  draftUpdatedAt: string | null;
};

export const adminListLegalDocuments = createServerFn({ method: "GET" }).handler(async () => {
  const { requireAdminOrThrow } = await import("./admin-session.server");
  await requireAdminOrThrow();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: published }, { data: drafts }] = await Promise.all([
    (supabaseAdmin.from("legal_documents") as any).select("*"),
    (supabaseAdmin.from("legal_document_drafts") as any).select("*"),
  ]);
  return (["terms", "privacy"] as LegalDocumentKey[]).map((key) => {
    const live = (published ?? []).find((row: any) => row.document_key === key);
    const savedDraft = (drafts ?? []).find((row: any) => row.document_key === key);
    const draft = isLegalContent(savedDraft?.draft_content)
      ? savedDraft.draft_content
      : isLegalContent(live?.published_content) ? live.published_content : DEFAULT_LEGAL_CONTENT[key];
    return {
      key,
      draft,
      published: isLegalContent(live?.published_content) ? live.published_content : null,
      version: Number(live?.version ?? 0),
      publishedAt: live?.published_at ?? null,
      draftUpdatedAt: savedDraft?.updated_at ?? null,
    } satisfies AdminLegalDocument;
  });
});

export const adminSaveLegalDraft = createServerFn({ method: "POST" })
  .inputValidator((data: { key: LegalDocumentKey; content: LegalContent }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    await requireAdminOrThrow();
    if (!["terms", "privacy"].includes(data.key) || !isLegalContent(data.content)) throw new Error("Document invalide.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin.from("legal_document_drafts") as any).upsert({
      document_key: data.key,
      draft_content: data.content,
      updated_at: new Date().toISOString(),
    }, { onConflict: "document_key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminPublishLegalDocument = createServerFn({ method: "POST" })
  .inputValidator((data: { key: LegalDocumentKey; content: LegalContent }) => data)
  .handler(async ({ data }) => {
    const { requireAdminOrThrow } = await import("./admin-session.server");
    const who = await requireAdminOrThrow();
    if (!["terms", "privacy"].includes(data.key) || !isLegalContent(data.content)) throw new Error("Document invalide.");
    for (const locale of ["fr", "en", "ar"] as const) {
      if (!data.content[locale].title.trim() || data.content[locale].sections.some((s) => !s.title.trim() || !s.body.trim())) {
        throw new Error("Tous les titres et paragraphes doivent être renseignés dans les trois langues.");
      }
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: current } = await (supabaseAdmin.from("legal_documents") as any)
      .select("version").eq("document_key", data.key).maybeSingle();
    const version = Number(current?.version ?? 0) + 1;
    const now = new Date().toISOString();
    const { error } = await (supabaseAdmin.from("legal_documents") as any).upsert({
      document_key: data.key,
      published_content: data.content,
      version,
      published_at: now,
      updated_at: now,
    }, { onConflict: "document_key" });
    if (error) throw new Error(error.message);
    await (supabaseAdmin.from("legal_document_drafts") as any).upsert({ document_key: data.key, draft_content: data.content, updated_at: now }, { onConflict: "document_key" });
    await supabaseAdmin.from("admin_actions").insert({
      action: "legal_document_publish",
      details: { document: data.key, version, by: who.email ?? who.via },
    });
    return { ok: true, version, publishedAt: now };
  });