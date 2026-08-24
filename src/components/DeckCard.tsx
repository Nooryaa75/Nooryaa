import { useMemo } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

export type DeckKey = "match" | "proches" | "nouveaux";

export type DeckMeta = {
  key: DeckKey;
  title: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
};

type Props = {
  meta: DeckMeta;
  profiles: any[];
  onClick: () => void;
};

const PREVIEW_COUNT = 4;

export function DeckCard({ meta, profiles, onClick }: Props) {
  const { Icon, title, desc } = meta;
  const preview = useMemo(() => profiles.slice(0, PREVIEW_COUNT), [profiles]);
  const emptySlots = Math.max(0, PREVIEW_COUNT - preview.length);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left w-full bg-card rounded-2xl border border-border/60 shadow-[var(--shadow-card)] p-5 hover:shadow-[var(--shadow-soft)] transition-all duration-300 overflow-hidden relative"
    >
      {/* Fond décoratif subtil */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[color:var(--gold)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Icon className="h-7 w-7 text-[color:var(--gold)] transition-transform duration-300 group-hover:scale-110" />
          <p className="font-serif text-lg text-primary mt-3 truncate">{title}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{desc}</p>
          <p className="text-sm mt-3 font-medium text-[color:var(--gold)]">
            {profiles.length} profil{profiles.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Aperçu photos */}
        <div className="relative w-24 h-24 flex-shrink-0">
          {preview.length === 0 ? (
            <div className="absolute inset-0 rounded-xl bg-secondary flex items-center justify-center border border-border/40">
              <User className="h-8 w-8 text-muted-foreground/40" />
            </div>
          ) : (
            preview.map((p, i) => {
              const rotate = (i - (preview.length - 1) / 2) * 6; // éventail centré
              const translateX = (i - (preview.length - 1) / 2) * 4;
              const translateY = Math.abs(i - (preview.length - 1) / 2) * 2;
              return (
                <div
                  key={p.id ?? i}
                  className={cn(
                    "absolute top-0 left-0 w-16 h-20 rounded-xl border-2 border-background shadow-md transition-all duration-300 ease-out",
                    "group-hover:scale-105"
                  )}
                  style={{
                    transform: `rotate(${rotate}deg) translate(${translateX}px, ${translateY}px)`,
                    zIndex: preview.length - i,
                    marginLeft: `${i * 10}px`,
                  }}
                >
                  {p.primary_photo_url ? (
                    <img
                      src={p.primary_photo_url}
                      alt={p.pseudo}
                      className={cn(
                        "w-full h-full object-cover rounded-xl",
                        p.primary_photo_blurred && "blur-md scale-110"
                      )}
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-secondary flex items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Slots vides */}
          {emptySlots > 0 &&
            Array.from({ length: emptySlots }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="absolute top-0 left-0 w-16 h-20 rounded-xl border-2 border-dashed border-border/40 bg-secondary/50"
                style={{
                  transform: `rotate(${(preview.length + i - (PREVIEW_COUNT - 1) / 2) * 6}deg) translate(${(preview.length + i - (PREVIEW_COUNT - 1) / 2) * 4}px, ${Math.abs(preview.length + i - (PREVIEW_COUNT - 1) / 2) * 2}px)`,
                  zIndex: PREVIEW_COUNT - (preview.length + i),
                  marginLeft: `${(preview.length + i) * 10}px`,
                }}
              />
            ))}
        </div>
      </div>

      {/* Barre de progression / appel à l'action */}
      <div className="relative mt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
          Explorer cette sélection
        </span>
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          →
        </span>
      </div>
    </button>
  );
}
