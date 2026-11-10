import { useEffect, useState } from "react";
import { useSubscriptionsEnabled } from "@/lib/entitlements";
import { detectNativePlatform, showPaidPlans, type NativePlatform } from "@/lib/paid-plans";

/** Les offres payantes peuvent-elles être montrées à ce membre ? (false tant que ce n'est pas confirmé) */
export function usePaidPlansVisible(): boolean {
  const { data: enabled } = useSubscriptionsEnabled();
  const [platform, setPlatform] = useState<NativePlatform | undefined>(undefined);
  useEffect(() => setPlatform(detectNativePlatform()), []);
  if (platform === undefined) return false;
  return showPaidPlans(enabled === true, platform);
}
