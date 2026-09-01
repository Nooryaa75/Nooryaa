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

export function DeckCard({ meta, profiles, onClick }: Props) {
  const { Icon, title, desc } = meta;

  return (
    <button
      type="button"
      onClick={onClick}
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
        <p className="text-[11px] mt-1 font-semibold text-[#E83E8C]">
          {profiles.length} profil{profiles.length > 1 ? "s" : ""}
        </p>
      </div>
      <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F3E8FF] text-primary text-xs">
        →
      </span>
    </button>
  );
}
