import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, ChevronLeft } from "lucide-react";
import { fetchPublishedLegalDocument } from "@/lib/legal-documents.functions";
import { DEFAULT_LEGAL_CONTENT, isLegalContent } from "@/lib/legal-documents";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/compte/cgu")({
  head: () => ({ meta: [
    { title: "Conditions Générales d'Utilisation — Nooryaa" },
    { name: "description", content: "Consultez les conditions générales d'utilisation de Nooryaa." },
    { property: "og:title", content: "Conditions Générales d'Utilisation — Nooryaa" },
    { property: "og:description", content: "Les règles d'utilisation du service Nooryaa." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: CguPage,
});

function CguPage() {
  const fetchDocument = useServerFn(fetchPublishedLegalDocument);
  const { locale, formatDate } = useI18n();
  const { data } = useQuery({ queryKey: ["legal-document", "terms"], queryFn: () => fetchDocument({ data: { key: "terms" } }), staleTime: 60000 });
  const content = isLegalContent(data?.content) ? data.content : DEFAULT_LEGAL_CONTENT.terms;
  const document = content[locale];
  return (
    <div className="space-y-4" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="relative flex items-center justify-center">
        <Link to="/compte" aria-label="Retour" className="absolute start-0 text-primary"><ChevronLeft className="h-6 w-6 rtl-flip" /></Link>
        <h1 className="text-lg font-bold text-primary flex items-center gap-2"><FileText className="h-5 w-5" />{document.title}</h1>
      </div>
      <div className="bg-card rounded-2xl p-6 border border-border/60 shadow-[var(--shadow-card)] space-y-5">
        <p className="text-xs text-muted-foreground">{data?.publishedAt ? `Dernière mise à jour : ${formatDate(data.publishedAt, { dateStyle: "long" })}` : "Version intégrée"}</p>
        {document.sections.map((section, index) => <section key={`${section.title}-${index}`} className="space-y-1.5"><h3 className="font-semibold">{section.title}</h3><p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{section.body}</p></section>)}
      </div>
    </div>
  );
}