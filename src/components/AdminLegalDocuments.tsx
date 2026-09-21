import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileCheck2, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminListLegalDocuments, adminPublishLegalDocument, adminSaveLegalDraft } from "@/lib/legal-admin.functions";
import type { LegalContent, LegalDocumentKey, LegalLocale } from "@/lib/legal-documents";
import { frenchError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const DOCUMENT_LABELS: Record<LegalDocumentKey, string> = { terms: "CGU", privacy: "Politique de confidentialité" };
const LOCALE_LABELS: Record<LegalLocale, string> = { fr: "Français", en: "English", ar: "العربية" };

export function AdminLegalDocuments() {
  const qc = useQueryClient();
  const list = useServerFn(adminListLegalDocuments);
  const save = useServerFn(adminSaveLegalDraft);
  const publish = useServerFn(adminPublishLegalDocument);
  const { data } = useQuery({ queryKey: ["admin-legal-documents"], queryFn: () => list() });
  const [documentKey, setDocumentKey] = useState<LegalDocumentKey>("terms");
  const [locale, setLocale] = useState<LegalLocale>("fr");
  const [drafts, setDrafts] = useState<Partial<Record<LegalDocumentKey, LegalContent>>>({});
  useEffect(() => {
    if (!data) return;
    setDrafts(Object.fromEntries(data.map((document) => [document.key, structuredClone(document.draft)])));
  }, [data]);
  const selected = data?.find((document) => document.key === documentKey);
  const content = drafts[documentKey];

  const saveMut = useMutation({
    mutationFn: () => {
      if (!content) throw new Error("Document indisponible.");
      return save({ data: { key: documentKey, content } });
    },
    onSuccess: () => { toast.success("Brouillon enregistré"); qc.invalidateQueries({ queryKey: ["admin-legal-documents"] }); },
    onError: (error) => toast.error(frenchError(error, "Enregistrement impossible")),
  });
  const publishMut = useMutation({
    mutationFn: () => {
      if (!content) throw new Error("Document indisponible.");
      return publish({ data: { key: documentKey, content } });
    },
    onSuccess: (result) => {
      toast.success(`Document publié — version ${result.version}`);
      qc.invalidateQueries({ queryKey: ["admin-legal-documents"] });
      qc.invalidateQueries({ queryKey: ["legal-document"] });
    },
    onError: (error) => toast.error(frenchError(error, "Publication impossible")),
  });

  const update = (next: LegalContent) => setDrafts((current) => ({ ...current, [documentKey]: next }));
  if (!content) return <section className="bg-card rounded-2xl p-5 border border-border/60">Chargement des documents…</section>;
  const translation = content[locale];

  return (
    <section className="bg-card rounded-2xl p-5 border border-border/60 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-serif text-primary flex items-center gap-2"><FileCheck2 className="h-5 w-5" /> Documents juridiques</h2>
          <p className="text-sm text-muted-foreground">Les publications sont visibles immédiatement sur le site et dans les apps, sans nouvelle version.</p>
        </div>
        <div className="text-xs text-muted-foreground text-right">
          Version publiée : {selected?.version ?? 0}<br />
          {selected?.publishedAt ? `Publiée le ${new Date(selected.publishedAt).toLocaleString("fr-FR")}` : "Aucune publication"}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(DOCUMENT_LABELS) as LegalDocumentKey[]).map((key) => (
          <Button key={key} size="sm" variant={documentKey === key ? "default" : "outline"} onClick={() => setDocumentKey(key)}>{DOCUMENT_LABELS[key]}</Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 border-b border-border/60 pb-3">
        {(Object.keys(LOCALE_LABELS) as LegalLocale[]).map((code) => (
          <Button key={code} size="sm" variant={locale === code ? "secondary" : "ghost"} onClick={() => setLocale(code)}>{LOCALE_LABELS[code]}</Button>
        ))}
      </div>

      <div className="space-y-4" dir={locale === "ar" ? "rtl" : "ltr"}>
        <div><Label>Titre du document</Label><Input value={translation.title} onChange={(event) => update({ ...content, [locale]: { ...translation, title: event.target.value } })} /></div>
        {translation.sections.map((section, index) => (
          <div key={`${locale}-${index}`} className="border border-border/50 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input aria-label={`Titre de la section ${index + 1}`} value={section.title} onChange={(event) => {
                const sections = [...translation.sections]; sections[index] = { ...section, title: event.target.value };
                update({ ...content, [locale]: { ...translation, sections } });
              }} />
              <Button variant="ghost" size="icon" aria-label={`Supprimer la section ${index + 1}`} onClick={() => update({ ...content, [locale]: { ...translation, sections: translation.sections.filter((_, itemIndex) => itemIndex !== index) } })}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <Textarea rows={4} aria-label={`Texte de la section ${index + 1}`} value={section.body} onChange={(event) => {
              const sections = [...translation.sections]; sections[index] = { ...section, body: event.target.value };
              update({ ...content, [locale]: { ...translation, sections } });
            }} />
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => update({ ...content, [locale]: { ...translation, sections: [...translation.sections, { title: "", body: "" }] } })}><Plus className="h-4 w-4" /> Ajouter une section</Button>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <Button variant="outline" disabled={saveMut.isPending || publishMut.isPending} onClick={() => saveMut.mutate()}>Enregistrer le brouillon</Button>
        <Button disabled={saveMut.isPending || publishMut.isPending} onClick={() => publishMut.mutate()}><Send className="h-4 w-4" /> Publier maintenant</Button>
      </div>
    </section>
  );
}