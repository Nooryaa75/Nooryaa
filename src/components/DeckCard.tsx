import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

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

export function DeckCard({ meta, profiles, onClick }: Props) {
  const { t } = useI18n();
  const { Icon, title, desc } = meta;
  const preview = profiles.filter((p: any) => p.primary_photo_url || p.pseudo);
  const countLabel = profiles.length === 1 ? t("profil") : t("profils");

  return (
    <button
      type="button"
      onClick={onClick}
      data-no-translate
      className={cn(
        "group text-left w-full bg-card rounded-2xl border border-border/60 p-4",
        "flex items-center gap-4 transition-shadow duration-300 hover:shadow-[var(--shadow-card)]"
      )}
    >
      <div className="shrink-0 w-11 h-11 rounded-full bg-[#F3E8FF] flex items-center justify-center">
        <Icon className="h-5 w-5 text-[#E83E8C]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-primary leading-snug">{title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{desc}</p>
        {/* Prévisualisation photo des profils */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex -space-x-2.5">
            {preview.slice(0, 4).map((p: any, i: number) =>
              p.primary_photo_url ? (
                <img
                  key={p.id}
                  src={p.primary_photo_url}
                  alt={p.pseudo}
                  loading="lazy"
                  className={cn(
                    "w-9 h-9 rounded-full object-cover border-2 border-card",
                    p.primary_photo_blurred && "blur-[3px]"
                  )}
                  style={{ zIndex: 4 - i }}
                />
              ) : (
                <span
                  key={p.id}
                  className="w-9 h-9 rounded-full border-2 border-card bg-[#F3E8FF] flex items-center justify-center text-[10px] font-bold text-primary"
                  style={{ zIndex: 4 - i }}
                >
                  {p.pseudo?.slice(0, 2).toUpperCase()}
                </span>
              )
            )}
            {profiles.length > 4 && (
              <span className="w-9 h-9 rounded-full border-2 border-card bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold" style={{ zIndex: 0 }}>
                +{profiles.length - 4}
              </span>
            )}
          </div>
          <p className="text-[11px] font-semibold text-[#E83E8C]">
            {profiles.length} {countLabel}
          </p>
        </div>
      </div>
      <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F3E8FF] text-primary text-xs">
        →
      </span>
    </button>
  );
}
