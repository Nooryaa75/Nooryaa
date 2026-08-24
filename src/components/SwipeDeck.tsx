import { useState, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, X, MapPin, User, ArrowLeft, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { ageFromBirthdate, PRACTICE_LABELS } from "@/lib/profile";

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
  const startX = useRef<number | null>(null);
  const current = profiles[index];

  async function decide(like: boolean) {
    if (!current) return;
    if (like) {
      const { error } = await supabase.from("likes").insert({ from_user: userId, to_user: current.id });
      if (error && !error.message.includes("duplicate")) toast.error(error.message);
      else toast.success(`Vous avez aimé ${current.pseudo}`);
    }
    setDrag(0);
    setIndex((i) => i + 1);
  }

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
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
                  className={`w-full h-full object-cover ${current.primary_photo_blurred ? "blur-md scale-110" : ""}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><User className="h-20 w-20 text-muted-foreground/40" /></div>
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
              {current.bio && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{current.bio}</p>}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-5">
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
            <Button size="lg" className="rounded-full h-14 w-14 p-0" aria-label="J'aime" onClick={() => decide(true)}>
              <Heart className="h-6 w-6" />
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
