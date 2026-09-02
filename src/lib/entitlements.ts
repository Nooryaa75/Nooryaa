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

export type PublicPlan = {
  id: string;
  code: string;
  name: string;
  tagline: string | null;
  duration_days: number;
  price_ttc: number;
  vat_rate: number;
  likes_per_day: number;
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
    features: (p.features ?? []) as string[],
    access: (p.access ?? {}) as AccessMap,
  })) as PublicPlan[];
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
