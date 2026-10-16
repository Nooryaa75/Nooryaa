import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { nativePlugin } from "@/lib/native-plugin";
import { clearReadNativeBadge } from "@/lib/native-badge";

export function NativeBadgeSync() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const cap = (window as unknown as { Capacitor?: any }).Capacitor;
    if (!cap?.isNativePlatform?.() || (cap.getPlatform?.() ?? cap.platform) !== "ios") return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running = false;
    let queued = false;
    const sync = async () => {
      if (stopped) return;
      if (running) { queued = true; return; }
      running = true;
      try { await clearReadNativeBadge(); } catch { /* Retry on next read or resume. */ }
      finally {
        running = false;
        if (queued && !stopped) { queued = false; schedule(); }
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { void sync(); }, 300);
    };
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      const key = event.query.queryKey[0];
      if (event.type === "updated" && (key === "notifications" || key === "unread-counts")) schedule();
    });
    const onVisible = () => { if (document.visibilityState === "visible") schedule(); };
    document.addEventListener("visibilitychange", onVisible);
    const listener = nativePlugin("App")?.addListener("appStateChange", (state: { isActive: boolean }) => {
      if (state.isActive) schedule();
    });
    schedule();
    return () => {
      stopped = true;
      clearTimeout(timer);
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
      if (listener) void Promise.resolve(listener).then((handle) => handle.remove()).catch(() => {});
    };
  }, [queryClient]);
  return null;
}