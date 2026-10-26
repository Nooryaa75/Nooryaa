import { createFileRoute, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminCheckAuth, adminGetProfile, adminGetProfileSelfies, adminUpdateStatus, adminDeleteProfile } from "@/lib/admin.functions";
import { wantsChildrenLabel } from "@/lib/wants-children";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { ageFromBirthdate, PRACTICE_LABELS, MARITAL_LABELS, GENDER_LABELS } from "@/lib/profile";
import { frenchPlace, PROFILE_STATUS_LABELS, REPORT_STATUS_LABELS, adminProfileStatus } from "@/lib/admin-display";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { ArrowLeft, ShieldOff, ShieldCheck, Trash2, Ban, AlertOctagon, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { frenchError } from "@/lib/errors";

export const Route = createFileRoute("/admin/profiles/$id")({
  ssr: false,
  head: ({ params }) => ({ meta: [{ title: `Profil ${params.id.slice(0, 8)} — Admin Nooryaa` }, { name: "description", content: "Détail et gestion d’un profil membre Nooryaa." }, { property: "og:title", content: `Profil ${params.id.slice(0, 8)} — Admin Nooryaa` }, { property: "og:description", content: "Détail et gestion d’un profil membre Nooryaa." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex,nofollow" }] }),
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
  const getSelfies = useServerFn(adminGetProfileSelfies);
  const setStatus = useServerFn(adminUpdateStatus);
  const del = useServerFn(adminDeleteProfile);

  // Affiche tout de suite la fiche avec la ligne déjà chargée dans la liste,
  // puis complète photos et signalements dès qu'ils arrivent.
  const listRow = () => {
    for (const [, list] of qc.getQueriesData<any>({ queryKey: ["admin-profiles"] })) {
      const row = list?.rows?.find((r: any) => r.id === id);
      if (row) return { profile: row, photos: [], chatWarnings: 0, chatBlocked: 0, reportsAgainst: [], reportsBy: [] };
    }
    return undefined;
  };
  const { data, isPlaceholderData: partial } = useQuery({
    queryKey: ["admin-profile", id],
    queryFn: () => get({ data: { id } }),
    placeholderData: listRow,
    staleTime: 30_000,
  });
  const selfieQuery = useQuery({ queryKey: ["admin-profile-selfies", id], queryFn: () => getSelfies({ data: { id } }), staleTime: 5 * 60 * 1000 });
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const [selfieIndex, setSelfieIndex] = useState<number | null>(null);


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
  const selfies = selfieQuery.data?.verificationSelfies ?? [];

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
              <p className="text-sm text-muted-foreground">Statut : <strong>{PROFILE_STATUS_LABELS[adminProfileStatus(p as any)] ?? p.status}</strong> · Inscrit le {new Date(p.created_at).toLocaleDateString("fr-FR")}</p>
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
            <Field label="Nom" value={p.last_name} />
            <Field label="Prénom" value={p.first_name} />
            <Field label="Email" value={p.email} />
            <Field label="Téléphone" value={p.phone} />
            <Field label="Sexe" value={p.gender ? GENDER_LABELS[p.gender] : null} />
            <Field label="Cherche" value={p.looking_for ? GENDER_LABELS[p.looking_for] : null} />
            <Field label="Date de naissance" value={p.birthdate ? `${p.birthdate} (${ageFromBirthdate(p.birthdate)} ans)` : null} />
            <Field label="Ville" value={frenchPlace(p.city)} />
            <Field label="Pays de résidence" value={frenchPlace(p.country)} />
            <Field label="Pays d'origine" value={frenchPlace(p.country_origin)} />
            <Field label="Profession" value={p.profession} />
            <Field label="Études" value={p.education_level} />
            <Field label="Religion" value={p.religion} />
            <Field label="Pratique" value={p.religious_practice ? PRACTICE_LABELS[p.religious_practice] : null} />
            <Field label="Situation" value={p.marital_status ? MARITAL_LABELS[p.marital_status] : null} />
            <Field label="Objectif" value={p.objective} />
            <Field label="Activités" value={p.activities} />
            <Field label="Personnalité" value={(p as any).personality} />
            <Field label="Taille" value={(p as any).height_cm ? `${(p as any).height_cm} cm` : null} />
            <Field label="Silhouette" value={(p as any).body_type} />
            <Field label="A grandi à" value={frenchPlace((p as any).grew_up)} />
            <Field label="Salat quotidienne" value={yn((p as any).salat_quotidienne)} />
            <Field label="Ramadan" value={yn((p as any).ramadan)} />
            <Field label="Hadj" value={yn((p as any).hadj)} />
            <Field label="Omra" value={yn((p as any).omra)} />
            <Field label="Porte le voile" value={yn((p as any).porte_voile)} />
            <Field label="A des enfants" value={yn((p as any).has_children)} />
            <Field label="Nombre d'enfants" value={(p as any).children_count} />
            <Field label="Veut des enfants" value={wantsChildrenLabel((p as any).wants_children_answer ?? (p as any).wants_children) ?? null} />
            <Field label="Fumeur" value={yn((p as any).smoker)} />
            <Field label="Photo vérifiée" value={(p as any).photo_verified ? "Oui" : `Non (${(p as any).photo_verification_status ?? "—"})`} />
            <Field label="Photo principale floutée" value={yn((p as any).primary_photo_blurred)} />
            <Field label="Profil terminé" value={yn((p as any).onboarded)} />
            <Field label="Langue" value={({ fr: "Français", en: "Anglais", ar: "Arabe" } as any)[(p as any).locale] ?? (p as any).locale} />
            <Field label="Position GPS" value={(p as any).latitude != null ? `${Number((p as any).latitude).toFixed(4)}, ${Number((p as any).longitude).toFixed(4)}` : null} />
            <Field label="Mode d'utilisation" value={platformLabel((p as any).last_platform)} />
            <Field label="Dernière activité" value={new Date(p.last_active).toLocaleString("fr-FR")} />
            <Field label="Mise à jour" value={(p as any).updated_at ? new Date((p as any).updated_at).toLocaleString("fr-FR") : null} />
          </div>
          {p.bio && (
            <div className="bg-secondary/40 rounded-lg p-3">
              <div className="text-xs text-muted-foreground uppercase mb-1">Biographie</div>
              <p className="whitespace-pre-wrap text-sm">{p.bio}</p>
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border/60">
          <h2 className="font-serif text-primary mb-3">Photos ({data.photos.length}/6)</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {data.photos.map((ph: any, i: number) => (
              <button
                key={ph.id}
                type="button"
                onClick={() => setPhotoIndex(i)}
                aria-label={`Agrandir la photo ${i + 1} sur ${data.photos.length}`}
                className="group relative block aspect-square rounded-lg overflow-hidden border border-border/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <img src={ph.url} alt="" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" />
                <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 transition-opacity group-hover:bg-black/25 group-hover:opacity-100">
                  <Maximize2 className="h-4 w-4" />
                </span>
              </button>
            ))}
            {data.photos.length === 0 && <p className="text-sm text-muted-foreground" role="status">{partial ? "Chargement des photos…" : "Aucune photo"}</p>}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border/60">
          <h2 className="font-serif text-primary mb-3">Photo de vérification (selfie)</h2>
          {selfieQuery.isPending ? (
            <p className="text-sm text-muted-foreground" role="status">Chargement des selfies…</p>
          ) : selfieQuery.isError ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">Impossible de charger les selfies.</p>
              <Button variant="outline" size="sm" onClick={() => selfieQuery.refetch()}>Réessayer</Button>
            </div>
          ) : selfies.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {selfies.map((s, i) => (
                <figure key={s.url} className="w-32">
                  <button
                    type="button"
                    onClick={() => setSelfieIndex(i)}
                    aria-label="Agrandir la photo de vérification"
                    className="group relative block w-32 aspect-square rounded-lg overflow-hidden border border-border/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <img src={s.url} alt="" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" />
                    <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 transition-opacity group-hover:bg-black/25 group-hover:opacity-100">
                      <Maximize2 className="h-4 w-4" />
                    </span>
                  </button>
                  <figcaption className="mt-1 text-xs text-muted-foreground">
                    {i === 0 ? "Dernier · " : ""}
                    {s.takenAt ? new Date(s.takenAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" }) : ""}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {p.photo_verification_status && p.photo_verification_status !== "none"
                ? "Ce selfie a été pris avant la mise en place de la conservation des selfies : il n'a pas été gardé. Le prochain selfie de ce membre apparaîtra ici."
                : "Ce membre n'a pas encore fait de selfie de vérification."}
            </p>
          )}
        </div>

        {selfieIndex !== null && selfies.length > 0 && (
          <PhotoLightbox
            photos={selfies.map((s) => ({ url: s.url, caption: `Selfie de vérification — ${p.pseudo}` }))}
            index={selfieIndex}
            onIndexChange={setSelfieIndex}
            onClose={() => setSelfieIndex(null)}
            watermarked={false}
          />
        )}

        {photoIndex !== null && data.photos.length > 0 && (
          <PhotoLightbox
            photos={data.photos.map((ph: any) => ({ url: ph.url, caption: p.pseudo }))}
            index={Math.min(photoIndex, data.photos.length - 1)}
            onIndexChange={setPhotoIndex}
            onClose={() => setPhotoIndex(null)}
            watermarked={false}
          />
        )}


        <div className="grid md:grid-cols-2 gap-4">
          <Block title={`Signalements reçus (${data.reportsAgainst.length})`} accent="text-destructive" icon={AlertOctagon}>
            {partial ? <Empty>Chargement…</Empty> : data.reportsAgainst.length === 0 ? <Empty>Aucun signalement</Empty> : (
              <ul className="space-y-2 text-sm">
                {data.reportsAgainst.map((r: any) => (
                  <li key={r.id} className="border-b border-border/60 pb-2 last:border-0">
                    <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("fr-FR")} · Statut : {REPORT_STATUS_LABELS[r.status] ?? r.status}</div>
                    <div>{r.reason}</div>
                  </li>
                ))}
              </ul>
            )}
          </Block>
          <Block title={`Signalements émis (${data.reportsBy.length})`}>
            {partial ? <Empty>Chargement…</Empty> : data.reportsBy.length === 0 ? <Empty>Aucun</Empty> : (
              <ul className="space-y-2 text-sm">
                {data.reportsBy.map((r: any) => (
                  <li key={r.id} className="border-b border-border/60 pb-2 last:border-0">
                    <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("fr-FR")} · Statut : {REPORT_STATUS_LABELS[r.status] ?? r.status}</div>
                    <div>{r.reason}</div>
                  </li>
                ))}
              </ul>
            )}
          </Block>
          <Block title="Avertissements dans le chat" accent={data.chatWarnings > 0 ? "text-amber-600" : undefined}>
            <p className="text-sm text-muted-foreground">
              {partial ? "Chargement…" : data.chatWarnings === 0
                ? "Aucun avertissement."
                : `${data.chatWarnings} message${data.chatWarnings > 1 ? "s" : ""} ou vocal${data.chatWarnings > 1 ? "aux" : ""} signalé${data.chatWarnings > 1 ? "s" : ""} par la modération.`}
            </p>
          </Block>
          <Block title="Messages bloqués dans le chat" accent={data.chatBlocked > 0 ? "text-destructive" : undefined}>
            <p className="text-sm text-muted-foreground">
              {data.chatBlocked === 0
                ? "Aucun message bloqué."
                : `${data.chatBlocked} message${data.chatBlocked > 1 ? "s" : ""} ou vocal${data.chatBlocked > 1 ? "aux" : ""} bloqué${data.chatBlocked > 1 ? "s" : ""} par la modération.`}
            </p>
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

function yn(v: any) {
  return v === true ? "Oui" : v === false ? "Non" : null;
}

function platformLabel(v: any) {
  if (v === "android") return "Application Android";
  if (v === "ios") return "Application iPhone";
  if (v === "web") return "Site web";
  return "Pas encore connu (le membre ne s'est pas reconnecté)";
}
