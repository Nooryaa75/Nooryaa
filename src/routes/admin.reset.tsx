import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth } from "@/lib/admin.functions";
import { adminReset, adminResetCounts, RESET_SCOPES, type ResetScope } from "@/lib/admin-reset.functions";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reset")({
  ssr: false,
  head: () => ({ meta: [{ title: "Réinitialisation — Admin Nooryaa" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminReset,
});

function AdminReset() {
  const qc = useQueryClient();
  const countsFn = useServerFn(adminResetCounts);
  const resetFn = useServerFn(adminReset);
  const [selected, setSelected] = useState<ResetScope[]>([]);
  const [confirm, setConfirm] = useState("");

  const { data: counts } = useQuery({ queryKey: ["admin-reset-counts"], queryFn: () => countsFn() });

  const reset = useMutation({
    mutationFn: () => resetFn({ data: { scopes: selected, confirm } }),
    onSuccess: (res) => {
      toast.success(`Réinitialisation effectuée : ${res.done.join(", ")}${res.deletedUsers ? ` — ${res.deletedUsers} compte(s) supprimé(s)` : ""}.`);
      setSelected([]);
      setConfirm("");
      qc.invalidateQueries();
    },
    onError: (e: any) => toast.error(e?.message ?? "Erreur pendant la réinitialisation"),
  });

  const toggle = (key: ResetScope) =>
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));

  const canRun = selected.length > 0 && confirm.trim().toUpperCase() === "REINITIALISER" && !reset.isPending;

  return (
    <div className="min-h-screen mosaic-soft">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-serif gold-text tracking-wide">Réinitialisation</h1>
          <p className="text-sm text-muted-foreground">Remettre à zéro tout ou partie des données de la plateforme.</p>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>Action irréversible : les données supprimées ne peuvent pas être récupérées. Les comptes administrateurs sont toujours conservés.</p>
        </div>

        <div className="space-y-2">
          {RESET_SCOPES.map((s) => (
            <label
              key={s.key}
              className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-colors ${
                selected.includes(s.key) ? "border-primary/50 bg-secondary/50" : "border-border/60 bg-card hover:border-primary/30"
              }`}
            >
              <Checkbox checked={selected.includes(s.key)} onCheckedChange={() => toggle(s.key)} className="mt-0.5" />
              <span className="flex-1">
                <span className={`font-medium ${s.danger ? "text-destructive" : "text-primary"}`}>{s.label}</span>
                <span className="block text-sm text-muted-foreground">{s.desc}</span>
              </span>
              <span className="text-sm text-muted-foreground shrink-0">{counts?.[s.key] ?? "—"}</span>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => setSelected(RESET_SCOPES.map((s) => s.key))}
          >
            Tout sélectionner
          </Button>
          <Button variant="ghost" className="rounded-full" onClick={() => setSelected([])}>
            Tout décocher
          </Button>
        </div>

        <div className="bg-card rounded-2xl border border-border/60 p-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            Pour confirmer, saisissez <code className="px-1 rounded bg-muted">REINITIALISER</code> ci-dessous.
          </p>
          <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="REINITIALISER" className="max-w-xs" />
          <Button variant="destructive" className="rounded-full gap-2" disabled={!canRun} onClick={() => reset.mutate()}>
            <RotateCcw className="h-4 w-4" />
            {reset.isPending ? "Réinitialisation…" : "Réinitialiser la sélection"}
          </Button>
        </div>
      </main>
    </div>
  );
}
