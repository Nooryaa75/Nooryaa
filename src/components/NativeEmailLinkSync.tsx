import { useEffect } from "react";
import { nativePlugin } from "@/lib/native-plugin";
import { nativeEmailDestination } from "@/lib/email-app-link";

/** Handle both cold starts and links received while the app is running. */
export function NativeEmailLinkSync() {
  useEffect(() => {
    const app = nativePlugin("App");
    if (!app) return;
    let active = true;
    let listener: { remove: () => Promise<void> } | undefined;
    const open = (event: { url?: string }) => {
      if (!active || !event.url) return;
      const destination = nativeEmailDestination(event.url);
      if (!destination || `${window.location.pathname}${window.location.hash}` === destination) return;
      window.location.assign(destination);
    };
    // The native bridge may return a handle directly or a promise: support both.
    try {
      Promise.resolve(app.addListener("appUrlOpen", open)).then((handle: any) => {
        if (!handle?.remove) return;
        if (!active) void Promise.resolve(handle.remove()).catch(() => {});
        else listener = handle;
      }).catch(() => {});
    } catch { /* ignore */ }
    try {
      Promise.resolve(app.getLaunchUrl?.()).then((event?: { url?: string }) => {
        if (event) open(event);
      }).catch(() => {});
    } catch { /* ignore */ }
    return () => {
      active = false;
      try { void Promise.resolve(listener?.remove()).catch(() => {}); } catch { /* ignore */ }
    };
  }, []);
  return null;
}