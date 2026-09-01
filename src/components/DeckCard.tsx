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
        "flex flex-col min-h-[170px] transition-shadow duration-300 hover:shadow-[var(--shadow-card)]"
      )}
    >
      <Icon className="h-6 w-6 text-[#E83E8C]" />
      <p className="font-bold text-sm text-primary mt-3 leading-snug">{title}</p>
      <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{desc}</p>
      <p className="text-sm mt-3 font-semibold text-[#E83E8C]">
        {profiles.length} profil{profiles.length > 1 ? "s" : ""}
      </p>
      <span className="mt-auto ml-auto inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F3E8FF] text-primary text-xs">
        →
      </span>
    </button>
  );
}
