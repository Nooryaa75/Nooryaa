import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { androidAppVerificationIntent, parseEmailVerification } from "@/lib/email-app-link";
import { appBrowser } from "@/lib/open-in-app";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/verification-email")({
  head: () => ({ meta: [
    { title: "Vérification de votre email — Nooryaa" },
    { name: "description", content: "Confirmez votre adresse email pour terminer votre inscription Nooryaa." },
    { property: "og:title", content: "Vérification de votre email — Nooryaa" },
    { property: "og:description", content: "Activation de votre compte Nooryaa." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
    { name: "referrer", content: "no-referrer" },
  ] }),
  component: EmailVerificationPage,
});

type Stage = "pending" | "choose" | "failed";

function EmailVerificationPage() {
  const { locale } = useI18n();
  const [stage, setStage] = useState<Stage>("pending");
  const [intent, setIntent] = useState<string | null>(null);
  const hashRef = useRef<string | null>(null);
  const started = useRef(false);

  const verifyHere = async () => {
    if (started.current) return;
    started.current = true;
    setStage("pending");
    const credentials = parseEmailVerification(hashRef.current ?? "");
    if (!credentials) { setStage("failed"); return; }
    try {
      const { data, error } = await supabase.auth.verifyOtp(credentials);
      if (error || !data.session) { setStage("failed"); return; }
      // Full page load so the new session is read fresh.
      window.location.replace("/onboarding");
    } catch {
      setStage("failed");
    }
  };

  useEffect(() => {
    if (hashRef.current === null) {
      hashRef.current = window.location.hash;
      window.history.replaceState(window.history.state, "", window.location.pathname);
    }
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } }).Capacitor;
    const browser = appBrowser(navigator.userAgent, Boolean(cap?.isNativePlatform?.()), cap?.getPlatform?.(), navigator.maxTouchPoints);
    const appIntent = browser === "android" ? androidAppVerificationIntent(hashRef.current) : null;
    if (appIntent) {
      // Android browser: let the person continue in the installed app (the
      // token is still unused, so the app can confirm the email itself).
      setIntent(appIntent);
      setStage("choose");
      return;
    }
    void verifyHere();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = locale === "en"
    ? { pending: "Verifying your email…", error: "This link has expired or has already been used.", back: "Sign in", choose: "Continue your sign-up", openApp: "Open in the Nooryaa app", web: "Continue on the website" }
    : locale === "ar"
      ? { pending: "جارٍ التحقق من بريدك الإلكتروني…", error: "انتهت صلاحية هذا الرابط أو تم استخدامه بالفعل.", back: "تسجيل الدخول", choose: "تابع تسجيلك", openApp: "افتح تطبيق Nooryaa", web: "المتابعة على الموقع" }
      : { pending: "Vérification de votre email…", error: "Ce lien a expiré ou a déjà été utilisé.", back: "Se connecter", choose: "Poursuivez votre inscription", openApp: "Ouvrir dans l'application Nooryaa", web: "Continuer sur le site" };

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-5 px-4 text-center" data-no-translate>
      <h1 className="text-2xl font-serif text-primary">Nooryaa</h1>
      {stage === "choose" && intent ? (
        <>
          <p className="text-foreground">{copy.choose}</p>
          <Button asChild size="lg" className="w-full"><a href={intent}>{copy.openApp}</a></Button>
          <Button variant="outline" className="w-full" onClick={() => void verifyHere()}>{copy.web}</Button>
        </>
      ) : (
        <p role="status" className="text-foreground">{stage === "failed" ? copy.error : copy.pending}</p>
      )}
      {stage === "failed" && <Button asChild><Link to="/auth" search={{ mode: "signin" }}>{copy.back}</Link></Button>}
    </section>
  );
}
