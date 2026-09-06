import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminSectionRows,
  adminSectionArchive,
  adminSectionReset,
  type SectionKey,
} from "@/lib/admin-reset.functions";
import { downloadCsv, printRows } from "@/lib/admin-export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Printer, Archive, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type Props = {
  section: SectionKey;
  label: string;
  compact?: boolean;
  onDone?: () => void;
};

export function AdminSectionTools({ section, label, compact, onDone }: Props) {
  const qc = useQueryClient();
  const rowsFn = useServerFn(adminSectionRows);
  const archiveFn = useServerFn(adminSectionArchive);
  const resetFn = useServerFn(adminSectionReset);
  const [confirming, setConfirming] = useState<null | "reset" | "archive_purge">(null);
  const [confirm, setConfirm] = useState("");

  const refresh = () => { qc.invalidateQueries(); onDone?.(); };

  const exportCsv = useMutation({
    mutationFn: () => rowsFn({ data: { section, limit: 5000 } }),
    onSuccess: (res) => {
      if (res.rows.length === 0) return toast.info("Aucune donnée à exporter.");
      downloadCsv(`nooryaa-${section}-${new Date().toISOString().slice(0, 10)}.csv`, res.rows);
      toast.success(`${res.rows.length} ligne(s) exportée(s).`);
    },
    onError: (e: any) => toast.error(e?.message ?? "Export impossible"),
  });

  const print = useMutation({
    mutationFn: () => rowsFn({ data: { section, limit: 1000 } }),
    onSuccess: (res) => {
      if (res.rows.length === 0) return toast.info("Aucune donnée à imprimer.");
      if (!printRows(`Nooryaa — ${label}`, res.rows)) toast.error("Autorisez les fenêtres pop-up pour imprimer.");
    },
    onError: (e: any) => toast.error(e?.message ?? "Impression impossible"),
  });

  const archive = useMutation({
    mutationFn: (purge: boolean) => archiveFn({ data: { section, purge } }),
    onSuccess: (res) => {
      toast.success(`${res.archived} élément(s) archivé(s)${res.purged ? `, ${res.purged} effacé(s)` : ""}.`);
      setConfirming(null); setConfirm("");
      refresh();
    },
    onError: (e: any) => toast.error(e?.message ?? "Archivage impossible"),
  });

  const reset = useMutation({
    mutationFn: () => resetFn({ data: { section, confirm } }),
    onSuccess: (res) => {
      toast.success(`${res.purged} élément(s) effacé(s) dans « ${label} ».`);
      setConfirming(null); setConfirm("");
      refresh();
    },
    onError: (e: any) => toast.error(e?.message ?? "Effacement impossible"),
  });

  const busy = exportCsv.isPending || print.isPending || archive.isPending || reset.isPending;
  const size = compact ? "sm" : "sm";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size={size} className="rounded-full gap-1.5" disabled={busy} onClick={() => exportCsv.mutate()}>
          <Download className="h-4 w-4" /> Exporter
        </Button>
        <Button variant="outline" size={size} className="rounded-full gap-1.5" disabled={busy} onClick={() => print.mutate()}>
          <Printer className="h-4 w-4" /> Imprimer
        </Button>
        <Button variant="outline" size={size} className="rounded-full gap-1.5" disabled={busy} onClick={() => archive.mutate(false)}>
          <Archive className="h-4 w-4" /> Archiver
        </Button>
        <Button variant="outline" size={size} className="rounded-full gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/10"
          disabled={busy} onClick={() => { setConfirming("archive_purge"); setConfirm(""); }}>
          <Archive className="h-4 w-4" /> Archiver + effacer
        </Button>
        <Button variant="outline" size={size} className="rounded-full gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/10"
          disabled={busy} onClick={() => { setConfirming("reset"); setConfirm(""); }}>
          <Trash2 className="h-4 w-4" /> Réinitialiser
        </Button>
      </div>

      {confirming && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-destructive">
              {confirming === "reset"
                ? `Effacer définitivement « ${label} » ? Saisissez EFFACER pour confirmer.`
                : `Archiver puis effacer « ${label} » ? Saisissez EFFACER pour confirmer.`}
            </p>
            <button aria-label="Annuler" onClick={() => { setConfirming(null); setConfirm(""); }} className="text-destructive/70 hover:text-destructive">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="EFFACER" className="max-w-[160px] h-9" />
            <Button
              variant="destructive"
              size="sm"
              className="rounded-full"
              disabled={busy || confirm.trim().toUpperCase() !== "EFFACER"}
              onClick={() => (confirming === "reset" ? reset.mutate() : archive.mutate(true))}
            >
              Confirmer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
