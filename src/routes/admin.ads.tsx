import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth, adminListAds, adminUpsertAd, adminDeleteAd } from "@/lib/admin.functions";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, ExternalLink, Megaphone } from "lucide-react";
import { frenchError } from "@/lib/errors";

export const Route = createFileRoute("/admin/ads")({
  ssr: false,
  head: () => ({ meta: [{ title: "Publicités — Admin Nooryaa" }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminAds,
});

type AdRow = { id: string; title: string | null; image_url: string; link_url: string | null; active: boolean; sort_order: number };

function AdminAds() {
  const qc = useQueryClient();
  const list = useServerFn(adminListAds);
  const upsert = useServerFn(adminUpsertAd);
  const del = useServerFn(adminDeleteAd);
  const { data } = useQuery({ queryKey: ["admin-ads"], queryFn: () => list() });

  const [editing, setEditing] = useState<Partial<AdRow> | null>(null);

  const upsertMut = useMutation({
    mutationFn: (vars: any) => upsert({ data: vars }),
    onSuccess: () => { toast.success("Publicité enregistrée"); qc.invalidateQueries({ queryKey: ["admin-ads"] }); setEditing(null); },
    onError: (e: any) => toast.error(frenchError(e)),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Supprimée"); qc.invalidateQueries({ queryKey: ["admin-ads"] }); },
    onError: (e: any) => toast.error(frenchError(e)),
  });

  const toggleActive = (a: AdRow) => upsertMut.mutate({ id: a.id, title: a.title ?? "", image_url: a.image_url, link_url: a.link_url ?? "", active: !a.active, sort_order: a.sort_order });

  return (
    <div className="min-h-screen mosaic-soft">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-serif text-primary flex items-center gap-2"><Megaphone className="h-7 w-7" /> Publicités</h1>
            <p className="text-sm text-muted-foreground">Gérez les bannières du carrousel d'accueil. Activez, désactivez ou modifiez à tout moment.</p>
          </div>
          <Button onClick={() => setEditing({ active: true, sort_order: 0, image_url: "", title: "", link_url: "" })} className="rounded-full"><Plus className="h-4 w-4 mr-1" /> Nouvelle publicité</Button>
        </div>

        {editing && (
          <form
            onSubmit={(e) => { e.preventDefault(); upsertMut.mutate({ id: editing.id, title: editing.title ?? "", image_url: editing.image_url ?? "", link_url: editing.link_url ?? "", active: editing.active ?? true, sort_order: Number(editing.sort_order ?? 0) }); }}
            className="bg-card rounded-2xl p-5 border border-border/60 space-y-4"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Titre (optionnel)</Label>
                <Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Ex : Voyage Hajj 2026 — Partenaire" />
              </div>
              <div>
                <Label>Lien (optionnel)</Label>
                <Input value={editing.link_url ?? ""} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="md:col-span-2">
                <Label>URL de l'image *</Label>
                <Input required value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://.../banniere.jpg" />
                <p className="text-xs text-muted-foreground mt-1">Format recommandé : 1600×500 px (paysage). Hébergez votre image sur un CDN (Imgur, Cloudinary, votre site partenaire...).</p>
              </div>
              <div>
                <Label>Ordre d'affichage</Label>
                <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={editing.active ?? true} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
                <span className="text-sm">Active (visible sur l'accueil)</span>
              </div>
            </div>
            {editing.image_url && (
              <div className="rounded-xl overflow-hidden border border-border/60 bg-secondary/30">
                <img src={editing.image_url} alt="Aperçu" className="w-full max-h-64 object-cover" />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
              <Button type="submit" disabled={upsertMut.isPending}>{upsertMut.isPending ? "Enregistrement..." : "Enregistrer"}</Button>
            </div>
          </form>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {data?.map((a: AdRow) => (
            <div key={a.id} className="bg-card rounded-2xl border border-border/60 overflow-hidden">
              <div className="aspect-[16/6] bg-secondary/30 relative">
                <img src={a.image_url} alt={a.title ?? ""} className="w-full h-full object-cover" />
                <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${a.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{a.active ? "Active" : "Désactivée"}</span>
              </div>
              <div className="p-4 space-y-2">
                <div className="font-medium text-primary">{a.title || <span className="text-muted-foreground italic">(sans titre)</span>}</div>
                {a.link_url && (
                  <a href={a.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-primary truncate max-w-full">
                    <ExternalLink className="h-3 w-3" /> {a.link_url}
                  </a>
                )}
                <div className="text-xs text-muted-foreground">Ordre : {a.sort_order}</div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(a)}>Modifier</Button>
                  <Button size="sm" variant="outline" onClick={() => toggleActive(a)}>{a.active ? "Désactiver" : "Activer"}</Button>
                  <Button size="sm" variant="destructive" onClick={() => { if (confirm("Supprimer cette publicité ?")) delMut.mutate(a.id); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
          {data && data.length === 0 && !editing && (
            <div className="md:col-span-2 text-center py-12 bg-card rounded-2xl border border-dashed border-border/60 text-muted-foreground">
              Aucune publicité pour le moment. Cliquez sur « Nouvelle publicité » pour commencer.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}