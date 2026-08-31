import { createFileRoute, useNavigate, useRouter, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ageFromBirthdate, PRACTICE_LABELS, MARITAL_LABELS, GENDER_LABELS } from "@/lib/profile";
import {
  Heart, MapPin, MessageCircle, Flag, User, Ban, Briefcase, GraduationCap, Globe, Sparkles,
  BookOpen, Users, Search, Phone, ShieldCheck, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { matchPercent, useMyProfile } from "@/lib/match";
import { useLikeGraph, isRevealed, canMessage, MESSAGE_BLOCKED_HINT } from "@/lib/reveal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/_authenticated/profile/$pseudo")({
  head: ({ params }) => ({ meta: [{ title: `${params.pseudo} — Nooryaa` }] }),
  component: ProfileView,
});

const REPORT_REASONS = ["Contenu inapproprié", "Faux profil", "Harcèlement", "Arnaque", "Autre"];

function ProfileView() {
  const { pseudo } = Route.useParams();
  const ctx = Route.useRouteContext();
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState(REPORT_REASONS[0]);
  const [reportDetail, setReportDetail] = useState("");
  const { data: me } = useMyProfile(ctx.userId);
  const { data: likeGraph } = useLikeGraph(ctx.userId);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", pseudo],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("pseudo", pseudo).maybeSingle();
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: photos } = useQuery({
    queryKey: ["photos", profile?.id],
    enabled: !!profile,
    queryFn: async () => (await supabase.from("photos").select("*").eq("user_id", profile!.id).order("position")).data ?? [],
  });

  const { data: liked } = useQuery({
    queryKey: ["liked", ctx.userId, profile?.id],
    enabled: !!profile,
    queryFn: async () => (await supabase.from("likes").select("id").eq("from_user", ctx.userId).eq("to_user", profile!.id).maybeSingle()).data,
  });

  const { data: blockState } = useQuery({
    queryKey: ["block", ctx.userId, profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const [iBlock, blocksMe] = await Promise.all([
        supabase.from("blocks").select("id").eq("blocker", ctx.userId).eq("blocked", profile!.id).maybeSingle(),
        supabase.from("blocks").select("id").eq("blocker", profile!.id).eq("blocked", ctx.userId).maybeSingle(),
      ]);
      return { iBlocked: !!iBlock.data, blocksMe: !!blocksMe.data };
    },
  });

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      if (liked) await supabase.from("likes").delete().eq("from_user", ctx.userId).eq("to_user", profile.id);
      else await supabase.from("likes").insert({ from_user: ctx.userId, to_user: profile.id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["liked"] });
      qc.invalidateQueries({ queryKey: ["like-graph"] });
      qc.invalidateQueries({ queryKey: ["unread-counts"] });
      toast.success(liked ? "Coup de cœur retiré" : "Coup de cœur ajouté 💚");
    },
  });

  const toggleBlock = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      if (blockState?.iBlocked) {
        await supabase.from("blocks").delete().eq("blocker", ctx.userId).eq("blocked", profile.id);
      } else {
        await supabase.from("blocks").insert({ blocker: ctx.userId, blocked: profile.id });
        await supabase.from("likes").delete().eq("from_user", ctx.userId).eq("to_user", profile.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["block"] });
      qc.invalidateQueries({ queryKey: ["liked"] });
      qc.invalidateQueries({ queryKey: ["browse"] });
      toast.success(blockState?.iBlocked ? "Profil débloqué" : "Profil bloqué");
    },
  });

  async function startConversation() {
    if (!profile) return;
    if (!liked) {
      await supabase.from("likes").insert({ from_user: ctx.userId, to_user: profile.id });
      qc.invalidateQueries({ queryKey: ["liked"] });
    }
    navigate({ to: "/messages/$pseudo", params: { pseudo: profile.pseudo } });
  }

  async function submitReport() {
    if (!profile) return;
    const reason = `[${reportCategory}] ${reportDetail.trim()}`.slice(0, 500);
    const { error } = await supabase.from("reports").insert({ reporter: ctx.userId, reported: profile.id, reason });
    if (error) toast.error(error.message);
    else { toast.success("Signalement envoyé à la modération"); setReportOpen(false); setReportDetail(""); }
  }

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Chargement...</div>;
  if (!profile) return <div className="text-center py-12">Profil introuvable</div>;

  const isMe = profile.id === ctx.userId;
  const blocked = blockState?.iBlocked || blockState?.blocksMe;
  const isLiked = !!liked;
  const photosRevealed = isRevealed(profile, me, likeGraph);
  const messagingAllowed = canMessage(me, profile, likeGraph);

  return (
    <div className="max-w-4xl mx-auto space-y-6 min-w-0 overflow-x-hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.history.back()}
        className="gap-2 text-muted-foreground hover:text-primary -ml-2"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </Button>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-secondary">
            {photos && photos[0] ? (
              <img src={photos[0].url} alt={profile.pseudo} className={`w-full h-full object-cover ${(photos[0] as any).blurred && !photosRevealed ? "blur-md scale-110" : ""}`} />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><User className="h-24 w-24 text-muted-foreground/40" /></div>
            )}
          </div>
          {photos && photos.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {photos.slice(1).map((p) => (
                <div key={p.id} className="aspect-square rounded-lg overflow-hidden bg-secondary">
                  <img src={p.url} alt="" className={`w-full h-full object-cover ${(p as any).blurred && !photosRevealed ? "blur-md scale-110" : ""}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 min-w-0">
          <div className="bg-card rounded-2xl p-6 border border-border/60 shadow-[var(--shadow-card)] space-y-4">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h1 className="text-3xl font-serif text-primary break-words">{profile.pseudo}</h1>
                  {(profile as any).photo_verified ? (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[color:var(--gold)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                      <ShieldCheck className="h-3.5 w-3.5" /> Profil vérifié
                    </span>
                  ) : (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5" /> Profil non vérifié
                    </span>
                  )}
                </div>
                {!isMe && typeof matchPercent(me, profile) === "number" && (
                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-[10px] uppercase tracking-wider text-[color:var(--gold)] font-semibold">Compatibilité</span>
                    <span className="inline-flex items-center justify-center rounded-full bg-[color:var(--gold)] text-primary font-bold text-xs h-12 w-12 shadow-md border-2 border-background">
                      {matchPercent(me, profile)}%
                    </span>
                  </div>
                )}
              </div>
              <p className="text-muted-foreground flex items-center gap-1 mt-1 flex-wrap text-sm">
                <MapPin className="h-4 w-4" />
                {profile.city ? `${profile.city}, ${profile.country}` : profile.country}
                {profile.birthdate && <span className="ml-2">· {ageFromBirthdate(profile.birthdate)} ans</span>}
                {profile.gender && <span className="ml-2">· {GENDER_LABELS[profile.gender]}</span>}
                {(profile as any).height_cm && <span className="ml-2">· {(profile as any).height_cm} cm</span>}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {!isMe && !blocked && (
                <>
                  <Button
                    onClick={() => toggleLike.mutate()}
                    disabled={toggleLike.isPending}
                    className={`rounded-full gap-2 ${isLiked ? "bg-primary text-primary-foreground hover:bg-primary/90 border border-primary" : "text-muted-foreground border-border hover:text-primary hover:border-primary"}`}
                    variant={isLiked ? "default" : "outline"}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                    {isLiked ? "Coup de cœur ✓" : "Coup de cœur"}
                  </Button>
                  {messagingAllowed ? (
                    <Button onClick={startConversation} variant="default" className="rounded-full gap-2">
                      <MessageCircle className="h-4 w-4" /> Envoyer un message
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full gap-2 opacity-60"
                      title={MESSAGE_BLOCKED_HINT}
                      onClick={() => toast.info(MESSAGE_BLOCKED_HINT)}
                    >
                      <MessageCircle className="h-4 w-4" /> Message verrouillé
                    </Button>
                  )}
                  <Button onClick={() => toggleBlock.mutate()} disabled={toggleBlock.isPending} variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                    <Ban className="h-4 w-4" /> Bloquer
                  </Button>
                  <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2 ml-auto text-muted-foreground"><Flag className="h-4 w-4" /> Signaler</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Signaler ce profil</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <Select value={reportCategory} onValueChange={setReportCategory}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {REPORT_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Textarea value={reportDetail} onChange={(e) => setReportDetail(e.target.value)} placeholder="Précisez (facultatif)..." maxLength={400} />
                      </div>
                      <DialogFooter>
                        <Button onClick={submitReport}>Envoyer le signalement</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
              {!isMe && blockState?.iBlocked && (
                <div className="w-full border border-border rounded-lg p-3 text-sm flex items-center justify-between">
                  <span className="text-muted-foreground">Vous avez bloqué ce profil.</span>
                  <Button onClick={() => toggleBlock.mutate()} variant="outline" size="sm">Débloquer</Button>
                </div>
              )}
              {!isMe && blockState?.blocksMe && !blockState?.iBlocked && (
                <p className="text-xs text-muted-foreground italic">Ce profil n'est plus disponible.</p>
              )}
            </div>
          </div>

          <Accordion type="multiple" defaultValue={["bio"]} className="bg-card rounded-2xl border border-border/60 shadow-[var(--shadow-card)] px-6">
            {profile.bio && (
              <AccordionItem value="bio">
                <AccordionTrigger className="text-primary hover:no-underline">
                  <span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-[color:var(--gold)]" /> À propos</span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] pb-2">{profile.bio}</p>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="religion">
              <AccordionTrigger className="text-primary hover:no-underline">
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[color:var(--gold)]" /> Pratique religieuse</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-3 pb-2">
                  <Info label="Religion" value={profile.religion} />
                  <Info label="Pratique" value={profile.religious_practice ? PRACTICE_LABELS[profile.religious_practice] : undefined} />
                  <Info label="Salat quotidienne" value={boolLabel(profile.salat_quotidienne)} />
                  <Info label="Jeûne du Ramadan" value={boolLabel(profile.ramadan)} />
                  <Info label="Hadj effectué" value={boolLabel(profile.hadj)} />
                  <Info label="Omra effectuée" value={boolLabel(profile.omra)} />
                  {profile.gender === "femme" && <Info label="Porte le voile" value={boolLabel(profile.porte_voile)} />}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="lifestyle">
              <AccordionTrigger className="text-primary hover:no-underline">
                <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[color:var(--gold)]" /> Mode de vie</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-3 pb-2">
                  <Info label="Situation" value={profile.marital_status ? MARITAL_LABELS[profile.marital_status] : undefined} />
                  <Info label="Origine" value={profile.country_origin} />
                  <Info label="A grandi" value={(profile as any).grew_up} />
                  <Info label="Profession" value={profile.profession} />
                  <Info label="Études" value={profile.education_level} />
                  <Info label="Personnalité" value={profile.personality} />
                  <Info label="Fumeur" value={boolLabel(profile.smoker, "Oui", "Non")} />
                  <Info label="Taille" value={(profile as any).height_cm ? `${(profile as any).height_cm} cm` : undefined} />
                  <Info label="Corpulence" value={(profile as any).body_type ?? undefined} />
                  {profile.activities && <div className="col-span-2"><Info label="Activités" value={profile.activities} /></div>}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="family">
              <AccordionTrigger className="text-primary hover:no-underline">
                <span className="flex items-center gap-2"><Users className="h-4 w-4 text-[color:var(--gold)]" /> Famille</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-3 pb-2">
                  <Info label="A des enfants" value={boolLabel(profile.has_children)} />
                  {profile.has_children && <Info label="Nombre d'enfants" value={profile.children_count?.toString()} />}
                  <Info label="Souhaite avoir des enfants" value={boolLabel(profile.wants_children)} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="search">
              <AccordionTrigger className="text-primary hover:no-underline">
                <span className="flex items-center gap-2"><Search className="h-4 w-4 text-[color:var(--gold)]" /> Ce que je recherche</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-3 pb-2">
                  <Info label="Objectif" value={profile.objective} />
                  <Info label="Je recherche" value={profile.looking_for ? GENDER_LABELS[profile.looking_for] : undefined} />
                  <PreferenceInfo profile={profile} />
                </div>
              </AccordionContent>
            </AccordionItem>

            {isMe && profile.phone && (
              <AccordionItem value="contact">
                <AccordionTrigger className="text-primary hover:no-underline">
                  <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-[color:var(--gold)]" /> Contact</span>
                </AccordionTrigger>
                <AccordionContent>
                  <Info label="Téléphone" value={profile.phone} />
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="bg-secondary/60 rounded-lg p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-primary font-medium">{value}</div>
    </div>
  );
}

function boolLabel(v: boolean | null | undefined, yes = "Oui", no = "Non"): string | undefined {
  if (v === null || v === undefined) return undefined;
  return v ? yes : no;
}

function PreferenceInfo({ profile }: { profile: any }) {
  const prefs = profile.preferences;
  if (!prefs || typeof prefs !== "object") return null;
  const items: { label: string; value?: string | null }[] = [];
  if (prefs.religious_practice?.length) items.push({ label: "Pratique recherchée", value: prefs.religious_practice.map((x: string) => PRACTICE_LABELS[x] || x).join(", ") });
  if (prefs.marital_status?.length) items.push({ label: "Situation recherchée", value: prefs.marital_status.map((x: string) => MARITAL_LABELS[x] || x).join(", ") });
  if (prefs.personality) items.push({ label: "Personnalité recherchée", value: prefs.personality });
  if (prefs.smoker !== undefined && prefs.smoker !== null) items.push({ label: "Accepte fumeur", value: boolLabel(prefs.smoker) });
  if (prefs.has_children !== undefined && prefs.has_children !== null) items.push({ label: "Accepte enfants", value: boolLabel(prefs.has_children) });
  if (prefs.wants_children !== undefined && prefs.wants_children !== null) items.push({ label: "Souhaite enfants", value: boolLabel(prefs.wants_children) });
  if (prefs.height_min || prefs.height_max) items.push({ label: "Taille recherchée", value: `${prefs.height_min ?? "—"} - ${prefs.height_max ?? "—"} cm` });
  if (prefs.min_age || prefs.max_age) items.push({ label: "Tranche d'âge", value: `${prefs.min_age ?? "—"} - ${prefs.max_age ?? "—"} ans` });
  if (prefs.max_distance) items.push({ label: "Distance max", value: `${prefs.max_distance} km` });
  if (!items.length) return null;
  return (
    <>
      {items.map((it, i) => (
        <Info key={i} label={it.label} value={it.value} />
      ))}
    </>
  );
}