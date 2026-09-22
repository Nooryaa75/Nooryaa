import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, User, BadgeCheck, MapPin, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notifyLike } from "@/lib/notify";
import { isOnline } from "@/lib/discovery";
import { useI18n } from "@/lib/i18n";

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
  /** Texte d'info supplémentaire affiché dans la photo (ex : "Match le 12/09") */
  extraInfo?: string | null;
}

/**
 * Vignette profil compacte : photo 2/3 avec toutes les informations
 * en surimpression dans l'image. Taille environ 50 % plus petite que
 * la version précédente.
 */
export function ProfileVignette({ profile, userId, likeable = false, chatBadge = false, extraInfo }: ProfileVignetteProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(false);
  const age = ageFrom(profile.birthdate);
  const distance = typeof profile._distance === "number" ? Math.round(profile._distance) : null;
  const online = isOnline(profile);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      if (liked) {
        const { error } = await supabase.from("likes").delete().eq("from_user", userId).eq("to_user", profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("likes").insert({ from_user: userId, to_user: profile.id });
        if (error) throw error;
        await notifyLike(userId, profile.id);
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

  const tags: { label: string }[] = [];
  if (profile.personality) tags.push({ label: profile.personality });
  if (profile.porte_voile === true) tags.push({ label: "Voilée" });
  else if (profile.objective) tags.push({ label: t(profile.objective) });

  return (
    <div className="group relative w-full rounded-xl overflow-hidden border border-border/40 bg-card shadow-[var(--shadow-card)]">
      <Link to="/profile/$pseudo" params={{ pseudo: profile.pseudo }} className="block w-full h-full">
        <div className="relative aspect-[2/3] w-full bg-secondary overflow-hidden">
          {online && (
            <span
              className="absolute top-1.5 left-1.5 z-10 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white/80"
              title={t("En ligne")}
              aria-label={t("En ligne")}
            />
          )}
          {profile.primary_photo_url ? (
            <img
              src={profile.primary_photo_url}
              alt={profile.pseudo}
              className={`w-full h-full object-cover ${profile.primary_photo_blurred ? "blur-md scale-110" : ""}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="h-8 w-8 text-muted-foreground/40" />
            </div>
          )}

          {/* Voile sombre en bas pour le texte */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-2 pb-2 pt-8">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-white text-xs truncate leading-tight">
                {profile.pseudo}{age ? `, ${age} ans` : ""}
              </span>
              {profile.photo_verified && <BadgeCheck className="h-3 w-3 text-white shrink-0" />}
            </div>
            <p className="text-[10px] text-white/90 truncate flex items-center gap-0.5 mt-0.5">
              {profile.city && <MapPin className="h-2.5 w-2.5 shrink-0" />}
              {profile.city ?? ""}{profile.country ? `, ${profile.country}` : ""}{distance != null ? ` • ${distance} km` : ""}
            </p>
            {extraInfo && (
              <p className="text-[10px] text-white/80 font-medium mt-0.5 truncate">{extraInfo}</p>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {tags.slice(0, 2).map((t) => (
                  <span
                    key={t.label}
                    className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-white/15 text-white backdrop-blur-sm border border-white/10"
                  >
                    {t.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>

      {likeable && userId && (
        <button
          type="button"
          aria-label={liked ? "Retirer le like" : "Liker"}
          onClick={() => likeMutation.mutate()}
          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/95 shadow-sm flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        >
          <Heart className={`h-3.5 w-3.5 transition-colors ${liked ? "text-[#E83E8C] fill-[#E83E8C]" : "text-[#E83E8C]"}`} />
        </button>
      )}

      {chatBadge && (
        <Link
          to="/messages/$pseudo"
          params={{ pseudo: profile.pseudo }}
          aria-label="Discuter"
          className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-gradient-to-br from-[#5D2A8C] to-[#E83E8C] shadow-sm flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-10"
        >
          <MessageCircle className="h-3.5 w-3.5 text-white" />
        </Link>
      )}
    </div>
  );
}
