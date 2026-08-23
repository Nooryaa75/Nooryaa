import { createFileRoute, useNavigate, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ageFromBirthdate, PRACTICE_LABELS, MARITAL_LABELS } from "@/lib/profile";
import { Heart, MapPin, MessageCircle, Flag, User, Ban, Briefcase, GraduationCap, Globe, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/profile/$pseudo")({
  head: ({ params }) => ({ meta: [{ title: `${params.pseudo} — Nooryaa` }] }),
  component: ProfileView,
});

const REPORT_REASONS = ["Contenu inapproprié", "Faux profil", "Harcèlement", "Arnaque", "Autre"];

function ProfileView() {
  const { pseudo } = Route.useParams();
  const ctx = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState(REPORT_REASONS[0]);
  const [reportDetail, setReportDetail] = useState("");

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-secondary">
            {photos && photos[0] ? (
              <img src={photos[0].url} alt={profile.pseudo} className={`w-full h-full object-cover ${(photos[0] as any).blurred ? "blur-md scale-110" : ""}`} />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><User className="h-24 w-24 text-muted-foreground/40" /></div>
            )}
          </div>
          {photos && photos.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {photos.slice(1).map((p) => (
                <div key={p.id} className="aspect-square rounded-lg overflow-hidden bg-secondary">
                  <img src={p.url} alt="" className={`w-full h-full object-cover ${(p as any).blurred ? "blur-md scale-110" : ""}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border/60 shadow-[var(--shadow-card)] space-y-4">
          <div>
            <h1 className="text-3xl font-serif text-primary">{profile.pseudo}</h1>
            <p className="text-muted-foreground flex items-center gap-1 mt-1 flex-wrap text-sm">
              <MapPin className="h-4 w-4" />
              {profile.city ? `${profile.city}, ${profile.country}` : profile.country}
              {profile.birthdate && <span className="ml-2">· {ageFromBirthdate(profile.birthdate)} ans</span>}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {profile.religious_practice && (
              <div className="bg-secondary/60 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Pratique</div>
                <div className="text-primary font-medium">{PRACTICE_LABELS[profile.religious_practice]}</div>
              </div>
            )}
            {profile.marital_status && (
              <div className="bg-secondary/60 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Situation</div>
                <div className="text-primary font-medium">{MARITAL_LABELS[profile.marital_status]}</div>
              </div>
            )}
            {profile.religion && (
              <div className="bg-secondary/60 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Religion</div>
                <div className="text-primary font-medium">{profile.religion}</div>
              </div>
            )}
            {profile.country_origin && (
              <div className="bg-secondary/60 rounded-lg p-3">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" /> Origine</div>
                <div className="text-primary font-medium">{profile.country_origin}</div>
              </div>
            )}
            {profile.profession && (
              <div className="bg-secondary/60 rounded-lg p-3">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Briefcase className="h-3 w-3" /> Profession</div>
                <div className="text-primary font-medium">{profile.profession}</div>
              </div>
            )}
            {profile.education_level && (
              <div className="bg-secondary/60 rounded-lg p-3">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><GraduationCap className="h-3 w-3" /> Études</div>
                <div className="text-primary font-medium">{profile.education_level}</div>
              </div>
            )}
            {profile.objective && (
              <div className="bg-secondary/60 rounded-lg p-3 col-span-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Sparkles className="h-3 w-3" /> Objectif</div>
                <div className="text-primary font-medium">{profile.objective}</div>
              </div>
            )}
            {profile.activities && (
              <div className="bg-secondary/60 rounded-lg p-3 col-span-2">
                <div className="text-xs text-muted-foreground">Activités</div>
                <div className="text-primary font-medium">{profile.activities}</div>
              </div>
            )}
          </div>

          {profile.bio && (
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">À propos</div>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {!isMe && !blocked && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={() => toggleLike.mutate()} disabled={toggleLike.isPending} className="rounded-full gap-2" variant={liked ? "outline" : "default"}>
                <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                {liked ? "Coup de cœur ✓" : "Coup de cœur"}
              </Button>
              <Button onClick={startConversation} variant="default" className="rounded-full gap-2">
                <MessageCircle className="h-4 w-4" /> Envoyer un message
              </Button>
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
            </div>
          )}

          {!isMe && blockState?.iBlocked && (
            <div className="border border-border rounded-lg p-3 text-sm flex items-center justify-between">
              <span className="text-muted-foreground">Vous avez bloqué ce profil.</span>
              <Button onClick={() => toggleBlock.mutate()} variant="outline" size="sm">Débloquer</Button>
            </div>
          )}
          {!isMe && blockState?.blocksMe && !blockState?.iBlocked && (
            <p className="text-xs text-muted-foreground italic">Ce profil n'est plus disponible.</p>
          )}
        </div>
      </div>
    </div>
  );
}