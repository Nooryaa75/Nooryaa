import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PhotoLightbox, type LightboxPhoto } from "@/components/PhotoLightbox";
import { adminGetModerationDetail } from "@/lib/admin.functions";
import {
  MODERATION_KIND_LABELS,
  moderationContentTitle,
  moderationKind,
  parseModerationChecks,
} from "@/lib/moderation-display";
import { PROFILE_STATUS_LABELS, frenchPlace } from "@/lib/admin-display";
import { GENDER_LABELS, ageFromBirthdate } from "@/lib/profile";
import { ExternalLink, Loader2, MessageSquare } from "lucide-react";

const fmt = (d: string | null | undefined) => (d ? new Date(d).toLocaleString("fr-FR") : "—");

function VerdictBadge({ verdict }: { verdict: string }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
        verdict === "block"
          ? "bg-destructive/10 text-destructive"
          : "bg-[color-mix(in_oklab,var(--gold)_20%,transparent)] text-[color:var(--gold)]"
      }`}
    >
      {verdict === "block" ? "Bloqué" : "Averti"}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 min-w-0">
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
      {children}
    </section>
  );
}

function MemberCard({ role, p }: { role: string; p: any }) {
  if (!p) {
    return (
      <div className="rounded-lg border border-border/60 p-3 text-sm text-muted-foreground">
        {role} : profil supprimé
      </div>
    );
  }
  const age = p.birthdate ? ageFromBirthdate(p.birthdate) : null;
  return (
    <div className="rounded-lg border border-border/60 p-3 flex gap-3 items-start">
      {p.primary_photo_url ? (
        <img src={p.primary_photo_url} alt={p.pseudo ?? ""} className="h-14 w-14 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="h-14 w-14 rounded-lg bg-secondary shrink-0" />
      )}
      <div className="min-w-0 flex-1 text-sm space-y-0.5">
        <p className="text-xs text-muted-foreground">{role}</p>
        <p className="font-medium truncate">{p.pseudo ?? "—"}</p>
        <p className="text-xs text-muted-foreground truncate">{p.email ?? "—"}</p>
        <p className="text-xs text-muted-foreground">
          {[GENDER_LABELS[p.gender] ?? null, age ? `${age} ans` : null, frenchPlace(p.city), frenchPlace(p.country)]
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>
        <p className="text-xs text-muted-foreground">
          Statut : {p.photo_removed_at ? "Non validé (photo retirée ou refusée)" : PROFILE_STATUS_LABELS[p.status] ?? p.status ?? "—"}
          {" · "}Selfie : {p.photo_verified ? "validé" : "non validé"}
        </p>
        <Link
          to="/admin/profiles/$id"
          params={{ id: p.id }}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Ouvrir la fiche <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

export function ModerationDetailDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const get = useServerFn(adminGetModerationDetail);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-moderation-detail", id],
    queryFn: () => get({ data: { id: id as string } }),
    enabled: !!id,
  });
  const [lightbox, setLightbox] = useState<{ photos: LightboxPhoto[]; index: number } | null>(null);

  const ev: any = data?.event;
  const kind = ev ? moderationKind(ev) : null;
  const checks = ev ? parseModerationChecks(ev.content) : [];
  const isPhoto = kind === "photo" || kind === "selfie" || kind === "identite";

  const open = (photos: LightboxPhoto[], index = 0) => setLightbox({ photos, index });

  return (
    <>
      {/* Pendant l'affichage d'une photo en grand, la fenêtre reste ouverte
          derrière sans bloquer les clics sur la photo. */}
      <Dialog open={!!id} modal={!lightbox} onOpenChange={(o) => !o && !lightbox && onClose()}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden"
          onPointerDownOutside={(e) => lightbox && e.preventDefault()}
          onInteractOutside={(e) => lightbox && e.preventDefault()}
          onEscapeKeyDown={(e) => lightbox && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-primary">Détail de la modération</DialogTitle>
            <DialogDescription>
              {kind ? MODERATION_KIND_LABELS[kind] : "Chargement"}
              {ev ? ` · ${fmt(ev.created_at)}` : ""}
            </DialogDescription>
          </DialogHeader>

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement du détail…
            </div>
          )}
          {error && <p className="text-sm text-destructive">Impossible de charger le détail de cet événement.</p>}

          {data && ev && (
            <div className="space-y-5 min-w-0">
              <Section title="Décision">
                <div className="flex flex-wrap items-center gap-2">
                  <VerdictBadge verdict={ev.verdict} />
                  {(ev.categories ?? []).map((c: string) => (
                    <span key={c} className="text-xs rounded-full bg-secondary px-2 py-0.5">{c}</span>
                  ))}
                </div>
                {ev.reason && <p className="text-sm break-words">Motif : {ev.reason}</p>}
              </Section>

              <Section title="Membres concernés">
                <div className="grid gap-2 sm:grid-cols-2">
                  <MemberCard role={isPhoto ? "Membre" : "Auteur"} p={data.author} />
                  {ev.target_user && <MemberCard role="Destinataire" p={data.target} />}
                </div>
              </Section>

              {kind === "message" && (
                <Section title="Message analysé">
                  <p className="rounded-lg bg-secondary/60 p-3 text-sm whitespace-pre-wrap break-words">{ev.content}</p>
                  <p className="text-xs text-muted-foreground">
                    {ev.verdict === "block"
                      ? "Ce message a été bloqué : le destinataire ne l'a jamais reçu."
                      : "Ce message a été envoyé avec un avertissement."}
                  </p>
                </Section>
              )}

              {kind === "vocal" && (
                <Section title="Message vocal analysé">
                  {data.mediaUrl ? (
                    <audio controls src={data.mediaUrl} className="w-full" />
                  ) : (
                    <p className="text-xs text-muted-foreground">Enregistrement non disponible.</p>
                  )}
                  <p className="text-xs text-muted-foreground">Transcription :</p>
                  <p className="rounded-lg bg-secondary/60 p-3 text-sm whitespace-pre-wrap break-words">{ev.content}</p>
                </Section>
              )}

              {isPhoto && (
                <Section title={moderationContentTitle(ev.content) || "Contrôle"}>
                  {checks.length > 0 && (
                    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm rounded-lg bg-secondary/60 p-3">
                      {checks.map((c) => (
                        <div key={c.label} className="contents">
                          <dt className="text-muted-foreground">{c.label}</dt>
                          <dd className="font-medium">{c.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {data.mediaUrl && (
                      <figure className="space-y-1">
                        <button type="button" onClick={() => open([{ url: data.mediaUrl!, caption: "Photo contrôlée" }])}>
                          <img src={data.mediaUrl} alt="Photo contrôlée" className="h-40 w-32 rounded-lg object-cover border border-border" />
                        </button>
                        <figcaption className="text-xs text-muted-foreground">Photo contrôlée</figcaption>
                      </figure>
                    )}
                    {data.selfie?.url && (
                      <figure className="space-y-1">
                        <button type="button" onClick={() => open([{ url: data.selfie!.url!, caption: "Selfie" }])}>
                          <img src={data.selfie.url} alt="Selfie" className="h-40 w-32 rounded-lg object-cover border border-border" />
                        </button>
                        <figcaption className="text-xs text-muted-foreground">
                          {data.selfie.atEvent ? "Selfie de ce contrôle" : "Dernier selfie"}
                        </figcaption>
                      </figure>
                    )}
                  </div>
                  {!data.mediaUrl && kind !== "selfie" && (
                    <p className="text-xs text-muted-foreground">
                      La photo contrôlée n'a pas été conservée (événement ancien) : voici les photos actuelles du membre.
                    </p>
                  )}
                </Section>
              )}

              {isPhoto && (
                <Section title={`Photos actuelles du membre (${data.photos.length})`}>
                  {data.photos.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucune photo en ce moment.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {data.photos.map((ph, i) => (
                        <button
                          type="button"
                          key={ph.id}
                          onClick={() => open(data.photos.map((x) => ({ url: x.url, caption: data.author?.pseudo ?? "" })), i)}
                        >
                          <img src={ph.url} alt="" className="h-24 w-20 rounded-lg object-cover border border-border" />
                        </button>
                      ))}
                    </div>
                  )}
                </Section>
              )}

              {!isPhoto && ev.target_user && (
                <Section title="Contexte de la discussion">
                  {data.conversation.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Aucun message échangé entre ces deux membres.</p>
                  ) : (
                    <div className="space-y-1.5 rounded-lg bg-secondary/40 p-3 max-h-80 overflow-y-auto">
                      {data.conversation.map((m: any) => {
                        const mine = m.sender === ev.user_id;
                        const sender = mine ? data.author?.pseudo : data.target?.pseudo;
                        const after = new Date(m.created_at).getTime() > new Date(ev.created_at).getTime();
                        return (
                          <div key={m.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
                            <div className={`max-w-[80%] rounded-lg px-3 py-1.5 text-sm ${mine ? "bg-card border border-border" : "bg-primary/10"} ${after ? "opacity-70" : ""}`}>
                              <p className="text-[11px] text-muted-foreground">{sender ?? "—"} · {fmt(m.created_at)}</p>
                              {m.deleted_at && <p className="text-xs italic text-muted-foreground">Message supprimé</p>}
                              {m.content && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
                              {m.image_url && (
                                <button type="button" onClick={() => open([{ url: m.image_url }])}>
                                  <img src={m.image_url} alt="" className="mt-1 h-24 rounded object-cover" />
                                </button>
                              )}
                              {m.audio_url && <audio controls src={m.audio_url} className="mt-1 w-56" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Link
                    to="/admin/conversations/$pair"
                    params={{ pair: `${ev.user_id}__${ev.target_user}` }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <MessageSquare className="h-3 w-3" /> Voir toute la discussion
                  </Link>
                </Section>
              )}

              <Section title={`Autres événements de ce membre (${data.history.length}${data.history.length === 10 ? "+" : ""})`}>
                {data.history.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucun autre événement.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {data.history.map((h: any) => (
                      <li key={h.id} className="flex items-start gap-2 text-xs min-w-0">
                        <VerdictBadge verdict={h.verdict} />
                        <span className="text-muted-foreground shrink-0">{fmt(h.created_at)}</span>
                        <span className="text-muted-foreground shrink-0">{MODERATION_KIND_LABELS[moderationKind(h)]}</span>
                        <span className="min-w-0 flex-1 truncate">{h.reason ?? moderationContentTitle(h.content)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {lightbox && (
        <PhotoLightbox
          photos={lightbox.photos}
          index={lightbox.index}
          onIndexChange={(index) => setLightbox((l) => (l ? { ...l, index } : l))}
          onClose={() => setLightbox(null)}
          watermarked={false}
        />
      )}
    </>
  );
}
