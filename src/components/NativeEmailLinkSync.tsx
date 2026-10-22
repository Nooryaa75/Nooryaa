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
    void app.addListener("appUrlOpen", open).then((handle: { remove: () => Promise<void> }) => {
      if (!active) void handle.remove();
      else listener = handle;
    }).catch(() => {});
    void app.getLaunchUrl().then((event?: { url?: string }) => {
      if (event) open(event);
    }).catch(() => {});
    return () => {
      active = false;
      void listener?.remove();
    };
  }, []);
  return null;
}