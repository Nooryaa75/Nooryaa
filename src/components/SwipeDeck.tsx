import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { notifyLike } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Heart, X, MapPin, User, ArrowLeft, MessageCircle, Undo2, Globe, Briefcase,
  GraduationCap, Ruler, Sparkles, BookOpen, Users, ChevronDown, ChevronUp,
  Shield, Search, BadgeCheck, ShieldAlert, Ban, MoreHorizontal, Flag,
} from "lucide-react";
import { toast } from "sonner";
import { ageFromBirthdate, PRACTICE_LABELS, MARITAL_LABELS } from "@/lib/profile";
import { useMyProfile } from "@/lib/match";
import { useLikeGraph, isBlurred, canMessage, MESSAGE_BLOCKED_HINT } from "@/lib/reveal";
import { useI18n } from "@/lib/i18n";
import { formatDistance, formatHeight } from "@/lib/units";

type Props = {
  title: string;
  profiles: any[];
  userId: string;
  onBack?: () => void;
  /** Enregistre le passage en base (l'Accueil ne re-propose plus le profil). */
  persistPass?: boolean;
  /** Masque l'en-tête « Retour » quand le deck est déjà dans une page dédiée. */
  hideHeader?: boolean;
};

/** Libellé « Actif ... » à partir de la dernière activité. */
function activeLabel(lastActive: string | null | undefined, t: (s: string) => string): string {
  if (!lastActive) return t("Actif récemment");
  const diff = Date.now() - new Date(lastActive).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 15) return t("En ligne");
  if (min < 60) return t("Actif il y a {min} min").replace("{min}", String(min));
  const h = Math.floor(min / 60);
  if (h < 24) return t("Actif il y a {h} h").replace("{h}", String(h));
  const d = Math.floor(h / 24);
  if (d === 1) return t("Actif hier");
  if (d < 30) return t("Actif il y a {d} jours").replace("{d}", String(d));
  return t("Actif il y a longtemps");
}

/** Affiche Oui / Non pour un booléen éventuellement absent. */
function boolLabel(value: boolean | null | undefined, yes = "Oui", no = "Non"): string | null {
  if (value === null || value === undefined) return null;
  return value ? yes : no;
}
/** Fiche plein écran : photo + infos, détails en dessous, décision par boutons. */
export function SwipeDeck({ title, profiles, userId, onBack, persistPass = true, hideHeader = false }: Props) {
  const queryClient = useQueryClient();
  const { t, locale } = useI18n();
  const [localLikedIds, setLocalLikedIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [isDeciding, setIsDeciding] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ about: true });
  const dismissedSet = useMemo(() => new Set(dismissedIds), [dismissedIds]);
  const current = profiles.find((profile) => !dismissedSet.has(profile.id));

  function toggleSection(id: string) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const { data: sentLikes } = useQuery({
    queryKey: ["sent-likes", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("likes").select("to_user").eq("from_user", userId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: photos } = useQuery({
    queryKey: ["deck-photos", current?.id],
    enabled: !!current?.id,
    queryFn: async () =>
      (await supabase.from("photos").select("*").eq("user_id", current.id).order("position")).data ?? [],
  });

  const likedIds = useMemo(
    () => new Set([...(sentLikes ?? []).map((row) => row.to_user), ...localLikedIds]),
    [sentLikes, localLikedIds],
  );
  const currentLiked = current ? likedIds.has(current.id) : false;

  const { data: me } = useMyProfile(userId);
  const { data: graph } = useLikeGraph(userId);
  const currentBlurred = isBlurred(current, me, graph);
  const currentCanMessage = canMessage(me, current, graph);

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["passes", userId] }),
      queryClient.invalidateQueries({ queryKey: ["sent-likes", userId] }),
      queryClient.invalidateQueries({ queryKey: ["sent-likes-discovery", userId] }),
      queryClient.invalidateQueries({ queryKey: ["likes-sent", userId] }),
      queryClient.invalidateQueries({ queryKey: ["unread-counts"] }),
      queryClient.invalidateQueries({ queryKey: ["like-graph", userId] }),
      queryClient.invalidateQueries({ queryKey: ["likes-received", userId] }),
    ]);
  }

  async function decide(like: boolean) {
    if (!current || isDeciding) return;
    const decidedProfile = current;
    setIsDeciding(true);

    const [swipeResult, likeResult] = await Promise.all([
      persistPass
        ? supabase.from("profile_passes").insert({ user_id: userId, target_id: decidedProfile.id })
        : Promise.resolve({ error: null }),
      like && !currentLiked
        ? supabase.from("likes").insert({ from_user: userId, to_user: decidedProfile.id })
        : Promise.resolve({ error: null }),
    ]);

    const swipeError = swipeResult.error;
    const likeError = likeResult.error;
    const swipeSaved = !swipeError || swipeError.message.includes("duplicate");
    const likeSaved = !likeError || likeError.message.includes("duplicate");

    if (!swipeSaved || (like && !likeSaved)) {
      toast.error(swipeError?.message ?? likeError?.message ?? "Impossible d'enregistrer ce choix.");
      setIsDeciding(false);
      return;
    }

    if (like && !currentLiked) {
      await notifyLike(userId, decidedProfile.id);
    }

    if (like) {
      setLocalLikedIds((ids) => (ids.includes(decidedProfile.id) ? ids : [...ids, decidedProfile.id]));
      toast.success(`Vous avez aimé ${decidedProfile.pseudo}`);
    }
    setDismissedIds((ids) => (ids.includes(decidedProfile.id) ? ids : [...ids, decidedProfile.id]));
    setIsDeciding(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    await refresh();
  }

  /** Bloque le profil courant et le retire de la pile. */
  async function blockProfile() {
    if (!current || isDeciding) return;
    const target = current;
    setIsDeciding(true);

    const { error } = await supabase.from("blocks").insert({ blocker: userId, blocked: target.id });
    if (error) {
      toast.error(error.message || "Impossible de bloquer ce profil.");
      setIsDeciding(false);
      return;
    }

    await supabase.from("likes").delete().eq("from_user", userId).eq("to_user", target.id);

    if (likedIds.has(target.id)) {
      setLocalLikedIds((ids) => ids.filter((id) => id !== target.id));
    }
    setDismissedIds((ids) => (ids.includes(target.id) ? ids : [...ids, target.id]));
    toast.success(`${target.pseudo} a été bloqué·e`);
    setIsDeciding(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    await refresh();
  }

  /** Annule la dernière décision : le profil revient dans la pile. */
  async function undo() {
    if (isDeciding || dismissedIds.length === 0) return;
    const lastId = dismissedIds[dismissedIds.length - 1];
    setIsDeciding(true);
    if (persistPass) {
      await supabase.from("profile_passes").delete().eq("user_id", userId).eq("target_id", lastId);
    }
    if (localLikedIds.includes(lastId)) {
      await supabase.from("likes").delete().eq("from_user", userId).eq("to_user", lastId);
      setLocalLikedIds((ids) => ids.filter((id) => id !== lastId));
    }
    setDismissedIds((ids) => ids.slice(0, -1));
    setIsDeciding(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    await refresh();
  }

  const extraPhotos = (photos ?? []).filter((p: any) => p.url && p.url !== current?.primary_photo_url);

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Retour
            </Button>
          )}
          <h2 className="font-serif text-xl text-primary">{title}</h2>
        </div>
      )}

      {!current ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/60">
          <p className="text-muted-foreground">Plus de profils dans cette sélection pour le moment.</p>
          {onBack && <Button className="mt-4" variant="outline" onClick={onBack}>Revenir aux sélections</Button>}
        </div>
      ) : (
        <div className="mx-auto max-w-md">
          {/* Photo principale plein cadre avec les infos en surimpression */}
          <div className="relative rounded-3xl overflow-hidden border border-border/60 shadow-[var(--shadow-card)] bg-secondary">
            <div className="relative h-[68vh] max-h-[640px] min-h-[380px]">
              {current.primary_photo_url ? (
                <img
                  src={current.primary_photo_url}
                  alt={current.pseudo}
                  draggable={false}
                  className={`w-full h-full object-cover object-center ${currentBlurred ? "blur-md scale-110" : ""}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><User className="h-20 w-20 text-muted-foreground/40" /></div>
              )}

              <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                <span data-no-translate className="rounded-full bg-black/45 backdrop-blur px-3 py-1 text-[11px] font-medium text-white">
                  {activeLabel(current.last_active, t)}
                </span>
                {typeof current._matchPercent === "number" && (
                  <span className="flex flex-col items-center">
                    <span className="text-[9px] uppercase tracking-wider text-white/90 font-semibold drop-shadow">Compatibilité</span>
                    <span className="inline-flex items-center justify-center rounded-full bg-[color:var(--gold)] text-primary font-bold text-xs h-10 w-10 shadow-md border-2 border-white/70">
                      {current._matchPercent}%
                    </span>
                  </span>
                )}
              </div>

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 pb-5 pt-16 text-white">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-serif text-2xl truncate">{current.pseudo}</span>
                  <span className="text-xl font-light">{ageFromBirthdate(current.birthdate)}</span>
                  {(current as any).photo_verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--gold)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      <BadgeCheck className="h-3 w-3" /> Vérifié
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
                      <ShieldAlert className="h-3 w-3" /> Non vérifié
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-1 text-xs uppercase tracking-wider text-white/90">
                  <MapPin className="h-3.5 w-3.5" />
                  {typeof current._distance === "number" && <span data-no-translate>{t("À")} {formatDistance(current._distance, locale)},</span>}
                  <span className="truncate">{[current.city, current.country].filter(Boolean).join(", ") || "—"}</span>
                </div>
                <div className="mt-2 space-y-1 text-sm text-white/90">
                  {current.country_origin && (
                    <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-[color:var(--gold)]" /> Origine : {current.country_origin}</div>
                  )}
                  {current.grew_up && (
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[color:var(--gold)]" /> A grandi : {current.grew_up}</div>
                  )}
                  {current.profession && (
                    <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-[color:var(--gold)]" /> {current.profession}</div>
                  )}
                  {current.religious_practice && (
                    <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-[color:var(--gold)]" /> {PRACTICE_LABELS[current.religious_practice]}</div>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-center gap-1 text-[11px] text-white/70">
                  <ChevronDown className="h-4 w-4 animate-bounce" /> Faites défiler pour voir les détails
                </div>
              </div>
            </div>
          </div>

          {/* Actions : retour en arrière, refuser, valider */}
          <div className="flex items-center justify-center gap-5 mt-4">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full h-12 w-12 p-0"
              aria-label="Revenir au profil précédent"
              disabled={isDeciding || dismissedIds.length === 0}
              onClick={undo}
            >
              <Undo2 className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full h-16 w-16 p-0 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              aria-label="Passer"
              disabled={isDeciding}
              onClick={() => decide(false)}
            >
              <X className="h-7 w-7" />
            </Button>
            <Button
              size="lg"
              className="rounded-full h-16 w-16 p-0 bg-[#E83E8C] text-white hover:bg-[#d12f7d]"
              aria-label="Envoyer un coup de cœur"
              disabled={isDeciding}
              onClick={() => decide(true)}
            >
              <Heart className="h-7 w-7 fill-current" />
            </Button>
            {currentCanMessage ? (
              <Link to="/messages/$pseudo" params={{ pseudo: current.pseudo }}>
                <Button size="lg" variant="outline" className="rounded-full h-12 w-12 p-0 border-[color:var(--gold)] text-[color:var(--gold)]" aria-label="Envoyer un message">
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                variant="outline"
                className="rounded-full h-12 w-12 p-0 opacity-50"
                aria-label={MESSAGE_BLOCKED_HINT}
                title={MESSAGE_BLOCKED_HINT}
                onClick={() => toast.info(MESSAGE_BLOCKED_HINT)}
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full h-12 w-12 p-0 border-border text-muted-foreground hover:text-primary hover:border-primary"
                  aria-label="Plus d'actions"
                  disabled={isDeciding}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="min-w-[180px]">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                  onClick={blockProfile}
                  disabled={isDeciding}
                >
                  <Ban className="h-4 w-4 mr-2" /> Bloquer {current.pseudo}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-2 text-center text-xs text-muted-foreground">
            {Math.min(dismissedIds.length + 1, profiles.length)} / {profiles.length}
          </div>

          {/* Détails du profil */}
          <div className="mt-5 space-y-3">
            <AccordionSection
              icon={<BookOpen className="h-5 w-5" />}
              title="À propos"
              open={openSections.about}
              onToggle={() => toggleSection("about")}
            >
              {current.bio ? (
                <p className="text-sm text-muted-foreground break-words [overflow-wrap:anywhere] whitespace-pre-line">{current.bio}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Aucune bio renseignée.</p>
              )}
            </AccordionSection>

            <AccordionSection
              icon={<Shield className="h-5 w-5" />}
              title="Pratique religieuse"
              open={openSections.religious}
              onToggle={() => toggleSection("religious")}
            >
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Info icon={<BookOpen className="h-4 w-4" />} label="Religion" value={current.religion} />
                <Info icon={<BookOpen className="h-4 w-4" />} label="Pratique" value={current.religious_practice ? PRACTICE_LABELS[current.religious_practice] : null} />
                <Info icon={<BookOpen className="h-4 w-4" />} label="Salat quotidienne" value={boolLabel(current.salat_quotidienne)} />
                <Info icon={<BookOpen className="h-4 w-4" />} label="Jeûne du Ramadan" value={boolLabel(current.ramadan)} />
                <Info icon={<BookOpen className="h-4 w-4" />} label="Hadj effectué" value={boolLabel(current.hadj)} />
                <Info icon={<BookOpen className="h-4 w-4" />} label="Omra effectuée" value={boolLabel(current.omra)} />
                {current.gender === "femme" && (
                  <Info icon={<BookOpen className="h-4 w-4" />} label="Porte le voile" value={boolLabel(current.porte_voile)} />
                )}
              </dl>
            </AccordionSection>

            <AccordionSection
              icon={<Sparkles className="h-5 w-5" />}
              title="Mode de vie"
              open={openSections.lifestyle}
              onToggle={() => toggleSection("lifestyle")}
            >
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Info icon={<Sparkles className="h-4 w-4" />} label="Statut" value={current.marital_status ? MARITAL_LABELS[current.marital_status] : null} />
                <Info icon={<Ruler className="h-4 w-4" />} label="Taille" value={formatHeight(current.height_cm, locale)} />
                <Info icon={<Ruler className="h-4 w-4" />} label="Corpulence" value={(current as any).body_type ?? null} />
                <Info icon={<GraduationCap className="h-4 w-4" />} label="Études" value={current.education_level} />
                <Info icon={<Globe className="h-4 w-4" />} label="Origine" value={current.country_origin} />
                <Info icon={<MapPin className="h-4 w-4" />} label="A grandi" value={current.grew_up} />
                <Info icon={<Briefcase className="h-4 w-4" />} label="Profession" value={current.profession} />
                <Info icon={<Sparkles className="h-4 w-4" />} label="Personnalité" value={current.personality} />
                <Info icon={<BookOpen className="h-4 w-4" />} label="Objectif" value={current.objective} />
                <Info icon={<Sparkles className="h-4 w-4" />} label="Activités" value={current.activities} />
                <Info icon={<Sparkles className="h-4 w-4" />} label="Fumeur" value={boolLabel(current.smoker, "Oui", "Non")} />
              </dl>
            </AccordionSection>

            <AccordionSection
              icon={<Users className="h-5 w-5" />}
              title="Famille"
              open={openSections.family}
              onToggle={() => toggleSection("family")}
            >
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Info icon={<Users className="h-4 w-4" />} label="A des enfants" value={boolLabel(current.has_children)} />
                {current.has_children && (
                  <Info icon={<Users className="h-4 w-4" />} label="Nombre d'enfants" value={current.children_count?.toString()} />
                )}
                <Info icon={<Users className="h-4 w-4" />} label="Souhaite des enfants" value={boolLabel(current.wants_children)} />
              </dl>
            </AccordionSection>

            <AccordionSection
              icon={<Search className="h-5 w-5" />}
              title="Ce que je recherche"
              open={openSections.searching}
              onToggle={() => toggleSection("searching")}
            >
              <SearchingFor profile={current} />
            </AccordionSection>

            {extraPhotos.length > 0 && (
              <AccordionSection
                icon={<User className="h-5 w-5" />}
                title="Ses photos"
                open={openSections.photos}
                onToggle={() => toggleSection("photos")}
              >
                <div className="grid grid-cols-3 gap-2">
                  {extraPhotos.map((photo: any) => (
                    <div key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-secondary">
                      <img
                        src={photo.url}
                        alt={current.pseudo}
                        className={`w-full h-full object-cover ${currentBlurred || photo.blurred ? "blur-md scale-110" : ""}`}
                      />
                    </div>
                  ))}
                </div>
              </AccordionSection>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        <span className="text-[color:var(--gold)]">{icon}</span> {label}
      </dt>
      <dd className="text-sm text-foreground break-words [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}

function AccordionSection({
  icon,
  title,
  open,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  open?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="text-[color:var(--gold)]">{icon}</span>
          <span className="font-serif text-primary">{title}</span>
        </div>
        <span className="text-muted-foreground">
          {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </span>
      </button>
      {open && <div className="px-4 pt-4 pb-4 border-t border-border/40">{children}</div>}
    </div>
  );
}

function SearchingFor({ profile }: { profile: any }) {
  const { locale } = useI18n();
  const prefs = profile?.preferences ?? {};
  const hasPrefs = Object.keys(prefs).length > 0;
  if (!hasPrefs) return <p className="text-sm text-muted-foreground italic">Aucun critère de recherche renseigné.</p>;

  const tri = (v: any) => (v === true ? "Oui" : v === false ? "Non" : null);
  const range = (min?: number | null, max?: number | null) => {
    if (min && max) return `Entre ${min} et ${max}`;
    if (min) return `À partir de ${min}`;
    if (max) return `Jusqu'à ${max}`;
    return null;
  };

  return (
    <dl className="grid grid-cols-2 gap-3 text-sm">
      <Info icon={<Sparkles className="h-4 w-4" />} label="Âge recherché" value={range(prefs.age_min, prefs.age_max)} />
      <Info icon={<Ruler className="h-4 w-4" />} label="Taille recherchée" value={range(prefs.height_min, prefs.height_max)} />
      <Info icon={<MapPin className="h-4 w-4" />} label="Distance max" value={formatDistance(prefs.distance_km, locale)} />
      <Info icon={<Globe className="h-4 w-4" />} label="Pays de résidence" value={prefs.country} />
      <Info icon={<Globe className="h-4 w-4" />} label="Pays d'origine" value={prefs.country_origin} />
      <Info icon={<Sparkles className="h-4 w-4" />} label="Situation" value={prefs.marital_status} />
      <Info icon={<BookOpen className="h-4 w-4" />} label="Pratique religieuse" value={prefs.religious_practice} />
      <Info icon={<Sparkles className="h-4 w-4" />} label="Personnalité recherchée" value={prefs.personality} />
      <Info icon={<Sparkles className="h-4 w-4" />} label="Activités" value={prefs.activities} />
      <Info icon={<Users className="h-4 w-4" />} label="A des enfants" value={tri(prefs.has_children)} />
      <Info icon={<Users className="h-4 w-4" />} label="Souhaite des enfants" value={tri(prefs.wants_children)} />
      <Info icon={<Sparkles className="h-4 w-4" />} label="Fumeur" value={tri(prefs.smoker)} />
      <Info icon={<BookOpen className="h-4 w-4" />} label="Salat quotidienne" value={tri(prefs.salat_quotidienne)} />
      <Info icon={<BookOpen className="h-4 w-4" />} label="Ramadan" value={tri(prefs.ramadan)} />
      <Info icon={<BookOpen className="h-4 w-4" />} label="Hadj" value={tri(prefs.hadj)} />
      <Info icon={<BookOpen className="h-4 w-4" />} label="Omra" value={tri(prefs.omra)} />
      {profile.gender !== "femme" && <Info icon={<BookOpen className="h-4 w-4" />} label="Porte le voile" value={tri(prefs.porte_voile)} />}
    </dl>
  );
}
