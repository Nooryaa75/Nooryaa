import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, User, BadgeCheck, MapPin, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ageFrom(birthdate?: string | null): number | null {
  if (!birthdate) return null;
  const d = new Date(birthdate);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

interface ProfileVignetteProps {
  profile: any;
  userId?: string;
  /** Affiche le bouton cœur liker/unliker (nécessite userId) */
  likeable?: boolean;
  /** Affiche un badge conversation (matchs) */
  chatBadge?: boolean;
  /** Texte d'info supplémentaire sous la ville (ex : "Match le 12/09") */
  extraInfo?: string | null;
}

/**
 * Vignette profil standard du site — même mise en page que « Recommandé pour vous »
 * sur l'accueil : photo 4/5, cœur, pseudo + âge, ville + distance, tags.
 */
export function ProfileVignette({ profile, userId, likeable = false, chatBadge = false, extraInfo }: ProfileVignetteProps) {
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(false);
  const age = ageFrom(profile.birthdate);
  const distance = typeof profile._distance === "number" ? Math.round(profile._distance) : null;

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      if (liked) {
        const { error } = await supabase.from("likes").delete().eq("from_user", userId).eq("to_user", profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("likes").insert({ from_user: userId, to_user: profile.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setLiked(!liked);
      queryClient.invalidateQueries({ queryKey: ["browse", userId] });
      queryClient.invalidateQueries({ queryKey: ["sent-likes-discovery", userId] });
      queryClient.invalidateQueries({ queryKey: ["match-likes", userId] });
      queryClient.invalidateQueries({ queryKey: ["unread-counts", userId] });
      if (!liked) toast.success(`Vous avez liké ${profile.pseudo} 💜`);
    },
    onError: () => toast.error("Une erreur est survenue"),
  });

  const tags: { label: string; tone: "pink" | "lavender" }[] = [];
  if (profile.personality) tags.push({ label: profile.personality, tone: "pink" });
  if (profile.porte_voile === true) tags.push({ label: "Voilée", tone: "lavender" });
  else if (profile.objective) tags.push({ label: profile.objective, tone: "lavender" });

  return (
    <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-[var(--shadow-card)]">
      <div className="relative aspect-[4/5] bg-secondary">
        <Link to="/profile/$pseudo" params={{ pseudo: profile.pseudo }} className="block w-full h-full">
          {profile.primary_photo_url ? (
            <img
              src={profile.primary_photo_url}
              alt={profile.pseudo}
              className={`w-full h-full object-cover ${profile.primary_photo_blurred ? "blur-md scale-110" : ""}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
        </Link>
        {likeable && userId && (
          <button
            type="button"
            aria-label={liked ? "Retirer le like" : "Liker"}
            onClick={() => likeMutation.mutate()}
            className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          >
            <Heart className={`h-5 w-5 transition-colors ${liked ? "text-[#E83E8C] fill-[#E83E8C]" : "text-[#E83E8C]"}`} />
          </button>
        )}
        {chatBadge && (
          <Link
            to="/messages/$pseudo"
            params={{ pseudo: profile.pseudo }}
            aria-label="Discuter"
            className="absolute top-2 right-2 w-9 h-9 rounded-full bg-gradient-to-br from-[#5D2A8C] to-[#E83E8C] shadow-md flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          >
            <MessageCircle className="h-4.5 w-4.5 text-white" />
          </Link>
        )}
      </div>
      <div className="p-3">
        <Link to="/profile/$pseudo" params={{ pseudo: profile.pseudo }} className="flex items-center gap-1.5">
          <span className="font-bold text-sm text-foreground truncate">
            {profile.pseudo}{age ? `, ${age} ans` : ""}
          </span>
          {profile.photo_verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
          {profile.city && <MapPin className="h-3 w-3 shrink-0" />}
          {profile.city ?? ""}{profile.country ? `, ${profile.country}` : ""}{distance != null ? ` • ${distance} km` : ""}
        </p>
        {extraInfo && <p className="text-[11px] text-[#E83E8C] font-medium mt-1 truncate">{extraInfo}</p>}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.slice(0, 2).map((t) => (
              <span
                key={t.label}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                  t.tone === "pink" ? "bg-[#E83E8C]/10 text-[#E83E8C]" : "bg-[#5D2A8C]/10 text-[#5D2A8C]"
                }`}
              >
                {t.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
