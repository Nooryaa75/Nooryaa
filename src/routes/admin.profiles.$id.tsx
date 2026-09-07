import { createFileRoute, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminCheckAuth, adminGetProfile, adminUpdateStatus, adminDeleteProfile } from "@/lib/admin.functions";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { ageFromBirthdate, PRACTICE_LABELS, MARITAL_LABELS } from "@/lib/profile";
import { ArrowLeft, ShieldOff, ShieldCheck, Trash2, Ban, AlertOctagon } from "lucide-react";
import { toast } from "sonner";
import { frenchError } from "@/lib/errors";

export const Route = createFileRoute("/admin/profiles/$id")({
  ssr: false,
  head: ({ params }) => ({ meta: [{ title: `Profil ${params.id.slice(0, 8)} — Admin` }, { name: "robots", content: "noindex,nofollow" }] }),
  beforeLoad: async () => {
    const { authed } = await adminCheckAuth();
    if (!authed) throw redirect({ to: "/admin/login" });
  },
  component: AdminProfileDetail,
});

function AdminProfileDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const get = useServerFn(adminGetProfile);
  const setStatus = useServerFn(adminUpdateStatus);
  const del = useServerFn(adminDeleteProfile);

  const { data } = useQuery({ queryKey: ["admin-profile", id], queryFn: () => get({ data: { id } }) });

  const statusMut = useMutation({
    mutationFn: (status: "active" | "suspended" | "banned") => setStatus({ data: { id, status } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-profile", id] }); toast.success("Statut mis à jour"); },
    onError: (e: any) => toast.error(frenchError(e)),
  });

  const deleteMut = useMutation({
    mutationFn: () => del({ data: { id } }),
    onSuccess: () => { toast.success("Profil supprimé"); navigate({ to: "/admin/profiles" }); },
    onError: (e: any) => toast.error(frenchError(e)),
  });

  if (!data?.profile) return (
    <div className="min-h-screen mosaic-soft">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl">Chargement...</main>
    </div>
  );

  const p = data.profile;

  return (
    <div className="min-h-screen mosaic-soft">
      <AdminNav />
      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        <Link to="/admin/profiles" className="text-sm text-muted-foreground flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Retour</Link>

        <div className="bg-card rounded-2xl p-6 border border-border/60 space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-serif text-primary">{p.pseudo}</h1>
              <p className="text-xs text-muted-foreground mt-1">ID : {p.id}</p>
              <p className="text-sm text-muted-foreground">Statut : <strong>{p.status}</strong> · Inscrit le {new Date(p.created_at).toLocaleDateString("fr-FR")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {p.status !== "active" && (
                <Button size="sm" variant="outline" onClick={() => statusMut.mutate("active")} disabled={statusMut.isPending}>
                  <ShieldCheck className="h-4 w-4 mr-1" /> Réactiver
                </Button>
              )}
              {p.status !== "suspended" && (
                <Button size="sm" variant="outline" onClick={() => statusMut.mutate("suspended")} disabled={statusMut.isPending}>
                  <ShieldOff className="h-4 w-4 mr-1" /> Suspendre
                </Button>
              )}
              {p.status !== "banned" && (
                <Button size="sm" variant="destructive" onClick={() => statusMut.mutate("banned")} disabled={statusMut.isPending}>
                  <Ban className="h-4 w-4 mr-1" /> Bannir
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={() => { if (confirm("Supprimer définitivement ce profil et toutes ses données ?")) deleteMut.mutate(); }} disabled={deleteMut.isPending}>
                <Trash2 className="h-4 w-4 mr-1" /> Supprimer
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <Field label="Email" value={p.email} />
            <Field label="Téléphone" value={p.phone} />
            <Field label="Sexe" value={p.gender} />
            <Field label="Cherche" value={p.looking_for} />
            <Field label="Date de naissance" value={p.birthdate ? `${p.birthdate} (${ageFromBirthdate(p.birthdate)} ans)` : null} />
            <Field label="Ville" value={p.city} />
            <Field label="Pays de résidence" value={p.country} />
            <Field label="Pays d'origine" value={p.country_origin} />
            <Field label="Profession" value={p.profession} />
            <Field label="Études" value={p.education_level} />
            <Field label="Religion" value={p.religion} />
            <Field label="Pratique" value={p.religious_practice ? PRACTICE_LABELS[p.religious_practice] : null} />
            <Field label="Situation" value={p.marital_status ? MARITAL_LABELS[p.marital_status] : null} />
            <Field label="Objectif" value={p.objective} />
            <Field label="Activités" value={p.activities} />
            <Field label="Dernière activité" value={new Date(p.last_active).toLocaleString("fr-FR")} />
          </div>
          {p.bio && (
            <div className="bg-secondary/40 rounded-lg p-3">
              <div className="text-xs text-muted-foreground uppercase mb-1">Bio</div>
              <p className="whitespace-pre-wrap text-sm">{p.bio}</p>
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border/60">
          <h2 className="font-serif text-primary mb-3">Photos ({data.photos.length}/6)</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {data.photos.map((ph: any) => (
              <img key={ph.id} src={ph.url} alt="" className="aspect-square object-cover rounded-lg" />
            ))}
            {data.photos.length === 0 && <p className="text-sm text-muted-foreground">Aucune photo</p>}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Block title={`Signalements reçus (${data.reportsAgainst.length})`} accent="text-red-600" icon={AlertOctagon}>
            {data.reportsAgainst.length === 0 ? <Empty>Aucun signalement</Empty> : (
              <ul className="space-y-2 text-sm">
                {data.reportsAgainst.map((r: any) => (
                  <li key={r.id} className="border-b border-border/60 pb-2 last:border-0">
                    <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("fr-FR")} · statut: {r.status}</div>
                    <div>{r.reason}</div>
                  </li>
                ))}
              </ul>
            )}
          </Block>
          <Block title={`Signalements émis (${data.reportsBy.length})`}>
            {data.reportsBy.length === 0 ? <Empty>Aucun</Empty> : (
              <ul className="space-y-2 text-sm">
                {data.reportsBy.map((r: any) => (
                  <li key={r.id} className="border-b border-border/60 pb-2 last:border-0">
                    <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("fr-FR")} · statut: {r.status}</div>
                    <div>{r.reason}</div>
                  </li>
                ))}
              </ul>
            )}
          </Block>
          <Block title={`Coups de cœur reçus (${data.likesReceived.length})`}>
            <p className="text-sm text-muted-foreground">{data.likesReceived.length} personnes ont aimé ce profil.</p>
          </Block>
          <Block title={`Coups de cœur envoyés (${data.likesSent.length})`}>
            <p className="text-sm text-muted-foreground">{data.likesSent.length} profils aimés.</p>
          </Block>
          <Block title={`Messages reçus (50 derniers)`}>
            <ul className="space-y-1 text-xs max-h-64 overflow-y-auto">
              {data.messagesReceived.map((m: any) => (
                <li key={m.id} className="border-b border-border/60 pb-1">
                  <span className="text-muted-foreground">{new Date(m.created_at).toLocaleString("fr-FR")} ← {m.sender.slice(0,8)} :</span> {m.content}
                </li>
              ))}
              {data.messagesReceived.length === 0 && <Empty>Aucun</Empty>}
            </ul>
          </Block>
          <Block title={`Messages envoyés (50 derniers)`}>
            <ul className="space-y-1 text-xs max-h-64 overflow-y-auto">
              {data.messagesSent.map((m: any) => (
                <li key={m.id} className="border-b border-border/60 pb-1">
                  <span className="text-muted-foreground">{new Date(m.created_at).toLocaleString("fr-FR")} → {m.receiver.slice(0,8)} :</span> {m.content}
                </li>
              ))}
              {data.messagesSent.length === 0 && <Empty>Aucun</Empty>}
            </ul>
          </Block>
        </div>
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value ?? <span className="text-muted-foreground italic">—</span>}</div>
    </div>
  );
}

function Block({ title, children, icon: Icon, accent }: { title: string; children: React.ReactNode; icon?: any; accent?: string }) {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border/60">
      <h3 className={`font-medium mb-3 flex items-center gap-2 ${accent ?? ""}`}>{Icon && <Icon className="h-4 w-4" />}{title}</h3>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground italic">{children}</p>;
}