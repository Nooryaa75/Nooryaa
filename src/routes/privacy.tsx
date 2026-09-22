import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, ChevronLeft } from "lucide-react";
import { fetchPublishedLegalDocument } from "@/lib/legal-documents.functions";
import { DEFAULT_LEGAL_CONTENT, isLegalContent } from "@/lib/legal-documents";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — Nooryaa" },
      { name: "description", content: "Consultez la politique de confidentialité de Nooryaa." },
      { property: "og:title", content: "Politique de confidentialité — Nooryaa" },
      { property: "og:description", content: "Protection et utilisation de vos données sur Nooryaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const fetchDocument = useServerFn(fetchPublishedLegalDocument);
  const { locale, formatDate, t } = useI18n();
  const { data } = useQuery({
    queryKey: ["legal-document", "privacy"],
    queryFn: () => fetchDocument({ data: { key: "privacy" } }),
    staleTime: 60000,
  });
  const content = isLegalContent(data?.content) ? data.content : DEFAULT_LEGAL_CONTENT.privacy;
  const document = content[locale];
  return (
    <div className="min-h-screen bg-background px-4 py-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="relative flex items-center justify-center">
          <Link to="/" aria-label={t("Accueil")} className="absolute start-0 text-primary">
            <ChevronLeft className="h-6 w-6 rtl-flip" />
          </Link>
          <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
            <ShieldCheck className="h-5 w-5" />
            {document.title}
          </h1>
        </div>
        <div className="space-y-5 rounded-2xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)]">
          <p className="text-xs text-muted-foreground">
            {data?.publishedAt
              ? `${t("Dernière mise à jour :")} ${formatDate(data.publishedAt, { dateStyle: "long" })}`
              : t("Version intégrée")}
          </p>
          {document.sections.map((section, index) => (
            <section key={`${section.title}-${index}`} className="space-y-1.5">
              <h3 className="font-semibold">{section.title}</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
