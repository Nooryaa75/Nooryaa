import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, X, MapPin, User, ArrowLeft, MessageCircle, Hand, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ageFromBirthdate, PRACTICE_LABELS } from "@/lib/profile";
import { useMyProfile } from "@/lib/match";
import { useLikeGraph, isBlurred, canMessage, MESSAGE_BLOCKED_HINT } from "@/lib/reveal";

type Props = {
  title: string;
  profiles: any[];
  userId: string;
  onBack: () => void;
};

/** Pile de profils façon Tinder : glisser à droite pour aimer, à gauche pour passer. */
export function SwipeDeck({ title, profiles, userId, onBack }: Props) {
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const [localLikedIds, setLocalLikedIds] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(true);
  const startX = useRef<number | null>(null);
  const current = profiles[index];

  useEffect(() => {
    if (!showHint) return;
    const t = setTimeout(() => setShowHint(false), 4500);
    return () => clearTimeout(t);
  }, [showHint]);

  const { data: sentLikes } = useQuery({
    queryKey: ["sent-likes", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("likes").select("to_user").eq("from_user", userId);
      if (error) throw error;
      return data ?? [];
    },
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


  async function decide(like: boolean) {
    if (!current) return;
    if (like) {
      setLocalLikedIds((ids) => ids.includes(current.id) ? ids : [...ids, current.id]);
      const { error } = currentLiked
        ? { error: null }
        : await supabase.from("likes").insert({ from_user: userId, to_user: current.id });
      if (error && !error.message.includes("duplicate")) toast.error(error.message);
      else toast.success(`Vous avez aimé ${current.pseudo}`);
    }
    setDrag(0);
    setIndex((i) => i + 1);
  }

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    setShowHint(false);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (startX.current == null) return;
    setDrag(e.clientX - startX.current);
  }
  function onPointerUp() {
    if (startX.current == null) return;
    const d = drag;
    startX.current = null;
    if (Math.abs(d) > 110) decide(d > 0);
    else setDrag(0);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Retour
        </Button>
        <h2 className="font-serif text-xl text-primary">{title}</h2>
      </div>

      {!current ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/60">
          <p className="text-muted-foreground">Plus de profils dans cette sélection pour le moment.</p>
          <Button className="mt-4" variant="outline" onClick={onBack}>Revenir aux sélections</Button>
        </div>
      ) : (
        <div className="mx-auto max-w-sm select-none">
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{ transform: `translateX(${drag}px) rotate(${drag / 25}deg)`, transition: startX.current == null ? "transform .2s" : "none" }}
            className="relative bg-card rounded-3xl overflow-hidden border border-border/60 shadow-[var(--shadow-card)] touch-none cursor-grab active:cursor-grabbing"
          >
            <div className="aspect-[3/4] bg-secondary relative">
              {current.primary_photo_url ? (
                <img
                  src={current.primary_photo_url}
                  alt={current.pseudo}
                  draggable={false}
                  className={`w-full h-full object-cover ${currentBlurred ? "blur-md scale-110" : ""}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><User className="h-20 w-20 text-muted-foreground/40" /></div>
              )}
              {typeof current._matchPercent === "number" && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-wider text-primary-foreground/90 font-semibold drop-shadow-sm">Compatibilité</span>
                  <span className="inline-flex items-center justify-center rounded-full bg-[color:var(--gold)] text-primary font-bold text-xs h-10 w-10 shadow-md border-2 border-background">
                    {current._matchPercent}%
                  </span>
                </div>
              )}
              {drag > 40 && (
                <span className="absolute top-5 left-5 rounded-lg border-2 border-emerald-400 px-3 py-1 font-bold text-emerald-400 rotate-[-12deg]">OUI</span>
              )}
              {drag < -40 && (
                <span className="absolute top-5 right-5 rounded-lg border-2 border-destructive px-3 py-1 font-bold text-destructive rotate-[12deg]">NON</span>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-baseline justify-between">
                <span className="font-serif text-lg text-primary truncate">{current.pseudo}</span>
                <span className="text-sm text-muted-foreground">{ageFromBirthdate(current.birthdate)} ans</span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {current.city || current.country || "—"}
                {typeof current._distance === "number" && <span>· {Math.round(current._distance)} km</span>}
              </div>
              {current.religious_practice && (
                <div className="mt-2 text-[10px] uppercase tracking-wider text-[color:var(--gold)]">
                  {PRACTICE_LABELS[current.religious_practice]}
                </div>
              )}
              {current.bio && <p className="mt-2 text-sm text-muted-foreground line-clamp-3 break-words [overflow-wrap:anywhere]">{current.bio}</p>}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
            <Button size="lg" variant="outline" className="rounded-full h-14 w-14 p-0" aria-label="Passer" onClick={() => decide(false)}>
              <X className="h-6 w-6" />
            </Button>
            <Link
              to="/profile/$pseudo"
              params={{ pseudo: current.pseudo }}
              className="text-sm underline text-muted-foreground"
            >
              Voir la fiche
            </Link>
            {currentCanMessage ? (
              <Link to="/messages/$pseudo" params={{ pseudo: current.pseudo }}>
                <Button size="lg" variant="outline" className="rounded-full h-14 w-14 p-0 border-[color:var(--gold)] text-[color:var(--gold)] hover:bg-[color:var(--gold)] hover:text-primary-foreground" aria-label="Envoyer un message">
                  <MessageCircle className="h-6 w-6" />
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                variant="outline"
                className="rounded-full h-14 w-14 p-0 opacity-50"
                aria-label={MESSAGE_BLOCKED_HINT}
                title={MESSAGE_BLOCKED_HINT}
                onClick={() => toast.info(MESSAGE_BLOCKED_HINT)}
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
            )}
            <Button
              size="lg"
              variant={currentLiked ? "default" : "outline"}
              className={`rounded-full h-14 w-14 p-0 transition-colors ${currentLiked ? "bg-primary text-primary-foreground hover:bg-primary/90 border border-primary" : "bg-background/90 text-muted-foreground border-border hover:text-primary hover:border-primary"}`}
              aria-label={currentLiked ? "Déjà aimé" : "J'aime"}
              onClick={() => decide(true)}
            >
              <Heart className={`h-6 w-6 ${currentLiked ? "fill-current" : ""}`} />
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            {index + 1} / {profiles.length} · glissez la carte à droite pour aimer
          </p>
        </div>
      )}
    </div>
  );
}
