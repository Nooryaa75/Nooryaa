import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStoredLocale } from "@/lib/i18n";
import { sendOwnWelcomeEmail } from "@/lib/notify.functions";
import { needsSocialWelcome } from "@/lib/welcome-auth";

export function SocialWelcomeSync() {
  useEffect(() => {
    let cancelled = false;
    const attempted = new Set<string>();
    const send = (user: Parameters<typeof needsSocialWelcome>[0]) => {
      if (cancelled || !user || !needsSocialWelcome(user) || attempted.has(user.id)) return;
      attempted.add(user.id);
      // Defer outside the auth callback: requesting a session inside it can deadlock.
      setTimeout(() => {
        if (cancelled) return;
        void sendOwnWelcomeEmail({ data: { locale: getStoredLocale() } }).then((result) => {
          if (!result.sent && result.reason !== "already_sent") attempted.delete(user.id);
        }).catch(() => { attempted.delete(user.id); });
      }, 0);
    };
    void supabase.auth.getSession().then(({ data }) => send(data.session?.user));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") attempted.clear();
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") send(session?.user);
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);
  return null;
}