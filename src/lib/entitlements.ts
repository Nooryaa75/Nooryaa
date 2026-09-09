import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Fonctionnalités / accès configurables par formule depuis l'administration. */
export const ACCESS_KEYS = [
  { key: "unlimited_likes", label: "Likes illimités" },
  { key: "advanced_filters", label: "Filtres de recherche avancés" },
  { key: "see_likers", label: "Voir qui m'a liké" },
  { key: "incognito", label: "Mode incognito" },
  { key: "priority", label: "Priorité dans les recherches" },
  { key: "voice_messages", label: "Messages vocaux" },
  { key: "photo_messages", label: "Photos dans la messagerie" },
  { key: "saved_searches", label: "Recherches sauvegardées" },
  { key: "read_receipts", label: "Accusés de lecture" },
  { key: "boost", label: "Boosts de profil" },
] as const;

export type AccessKey = (typeof ACCESS_KEYS)[number]["key"];
export type AccessMap = Partial<Record<AccessKey, boolean>>;

export type PlanAudience = "homme" | "femme" | "tous";

export const AUDIENCE_LABEL: Record<PlanAudience, string> = {
  homme: "Hommes",
  femme: "Femmes",
  tous: "Tous",
};

/** Durées prédéfinies proposées dans le configurateur (0 = sans durée). */
export const DURATION_PRESETS: { days: number; label: string }[] = [
  { days: 0, label: "Sans durée (gratuit)" },
  { days: 1, label: "24 heures" },
  { days: 3, label: "3 jours" },
  { days: 7, label: "1 semaine" },
  { days: 14, label: "2 semaines" },
  { days: 30, label: "1 mois" },
  { days: 90, label: "3 mois" },
  { days: 180, label: "6 mois" },
  { days: 365, label: "1 an" },
];

export function durationLabel(days: number): string {
  const preset = DURATION_PRESETS.find((d) => d.days === days);
  if (preset) return preset.label;
  if (days % 30 === 0) return `${days / 30} mois`;
  if (days % 7 === 0) return `${days / 7} semaines`;
  return `${days} jours`;
}

/** Affiche un quota (−1 = illimité). */
export function quotaLabel(n: number, unit: string): string {
  if (n < 0) return `${unit} illimités`;
  return `${n} ${unit}`;
}

export type PublicPlan = {
  id: string;
  code: string;
  name: string;
  tagline: string | null;
  emoji: string | null;
  audience: PlanAudience;
  duration_days: number;
  price_ttc: number;
  vat_rate: number;
  likes_per_day: number;
  messages_per_day: number;
  rewinds: number;
  super_likes: number;
  boosts: number;
  features: string[];
  highlight: boolean;
  sort_order: number;
  access: AccessMap;
};

export async function fetchActivePlans(): Promise<PublicPlan[]> {
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error) throw error;
  return ((data ?? []) as any[]).map((p) => ({
    ...p,
    price_ttc: Number(p.price_ttc),
    vat_rate: Number(p.vat_rate),
    audience: (p.audience ?? "tous") as PlanAudience,
    messages_per_day: p.messages_per_day ?? -1,
    rewinds: p.rewinds ?? 0,
    features: (p.features ?? []) as string[],
    access: (p.access ?? {}) as AccessMap,
  })) as PublicPlan[];
}

/** Formules visibles pour un genre donné (audience ciblée ou "tous"). */
export function plansForGender(plans: PublicPlan[], gender: string | null | undefined): PublicPlan[] {
  return plans.filter((p) => p.audience === "tous" || !gender || p.audience === gender);
}

export function useActivePlans() {
  return useQuery({ queryKey: ["active-plans"], queryFn: fetchActivePlans, staleTime: 60_000 });
}

/**
 * Droits de l'utilisateur.
 * Règle : si aucune formule n'est active (toutes désactivées en administration),
 * l'intégralité du site est accessible sans restriction.
 */
export function useEntitlements(currentPlanCode?: string | null) {
  const { data: plans, isLoading } = useActivePlans();
  const subscriptionsDisabled = !isLoading && (plans?.length ?? 0) === 0;
  const plan = plans?.find((p) => p.code === currentPlanCode) ?? null;

  const can = (key: AccessKey) => {
    if (isLoading) return false;
    if (subscriptionsDisabled) return true;
    return plan?.access?.[key] === true;
  };

  return { plans: plans ?? [], plan, subscriptionsDisabled, isLoading, can };
}
