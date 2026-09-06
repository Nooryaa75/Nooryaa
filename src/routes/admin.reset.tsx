import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth } from "@/lib/admin.functions";
import {
  SECTIONS,
  adminSectionSummary,
  adminListArchives,
  adminGetArchive,
  adminDeleteArchive,
} from "@/lib/admin-reset.functions";
import { AdminSectionTools } from "@/components/AdminSectionTools";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, Printer, Trash2 } from "lucide-react";
import { downloadJson, printRows } from "@/lib/admin-export";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reset")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Gestion des données — Admin Nooryaa" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminDataManagement,
});

function AdminDataManagement() {
  const qc = useQueryClient();
  const summaryFn = useServerFn(adminSectionSummary);
  const archivesFn = useServerFn(adminListArchives);
  const getArchiveFn = useServerFn(adminGetArchive);
  const deleteArchiveFn = useServerFn(adminDeleteArchive);

  const { data: summary } = useQuery({ queryKey: ["admin-section-summary"], queryFn: () => summaryFn() });
  const { data: archives } = useQuery({ queryKey: ["admin-archives"], queryFn: () => archivesFn({ data: {} }) });

  const openArchive = useMutation({
    mutationFn: (args: { id: string; mode: "print" | "download" }) => getArchiveFn({ data: { id: args.id } }).then((a) => ({ a, mode: args.mode })),
    onSuccess: ({ a, mode }) => {
      if (!a) return toast.error("Archive introuvable");
      const rows = (a.payload as Record<string, unknown>[]) ?? [];
      if (mode === "download") downloadJson(`nooryaa-archive-${a.section}-${a.created_at.slice(0, 10)}.json`, rows);
      else if (!printRows(`Archive — ${a.label}`, rows)) toast.error("Autorisez les fenêtres pop-up pour imprimer.");
    },
    onError: (e: any) => toast.error(e?.message ?? "Lecture impossible"),
  });

  const removeArchive = useMutation({
    mutationFn: (id: string) => deleteArchiveFn({ data: { id } }),
    onSuccess: () => { toast.success("Archive supprimée."); qc.invalidateQueries({ queryKey: ["admin-archives"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Suppression impossible"),
  });

  return (
    <div className="min-h-screen mosaic-soft">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-serif gold-text tracking-wide">Gestion des données</h1>
          <p className="text-sm text-muted-foreground">
            Chaque rubrique se gère indépendamment : exporter, imprimer, archiver ou remettre à zéro.
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>L'effacement est irréversible. Pensez à « Archiver + effacer » pour conserver une copie consultable ici. Les comptes administrateurs sont toujours conservés.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {SECTIONS.map((s) => {
            const count = summary?.counts?.[s.key];
            const last = summary?.lastArchive?.[s.key];
            return (
              <section key={s.key} className="bg-card rounded-2xl border border-border/60 p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className={`font-medium ${s.danger ? "text-destructive" : "text-primary"}`}>{s.label}</h2>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-serif text-primary leading-none">{count ?? "—"}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">élément(s)</div>
                  </div>
                </div>
                {last && (
                  <p className="text-[11px] text-muted-foreground">
                    Dernière archive : {new Date(last.created_at).toLocaleString("fr-FR")} ({last.row_count})
                  </p>
                )}
                <AdminSectionTools section={s.key} label={s.label} />
              </section>
            );
          })}
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-serif text-primary">Archives</h2>
          <div className="bg-card rounded-2xl border border-border/60 divide-y divide-border/60 overflow-hidden">
            {(archives ?? []).map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-primary">{a.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.row_count} élément(s) — {new Date(a.created_at).toLocaleString("fr-FR")}
                    {a.created_by ? ` — ${a.created_by}` : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={() => openArchive.mutate({ id: a.id, mode: "download" })}>
                    <Download className="h-4 w-4" /> Télécharger
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={() => openArchive.mutate({ id: a.id, mode: "print" })}>
                    <Printer className="h-4 w-4" /> Imprimer
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full gap-1.5 text-destructive" onClick={() => removeArchive.mutate(a.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {archives && archives.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">Aucune archive pour le moment.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
