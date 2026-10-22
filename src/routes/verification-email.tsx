import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parseEmailVerification } from "@/lib/email-app-link";
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

function EmailVerificationPage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const [failed, setFailed] = useState(false);
  const operation = useRef<Promise<boolean> | null>(null);
  useEffect(() => {
    let active = true;
    if (!operation.current) {
      const credentials = parseEmailVerification(window.location.hash);
      window.history.replaceState(window.history.state, "", window.location.pathname);
      operation.current = (async () => {
        if (!credentials) return false;
        const { data, error } = await supabase.auth.verifyOtp(credentials);
        return !error && Boolean(data.session);
      })().catch(() => false);
    }
    void operation.current.then(async (ok) => {
      if (!active) return;
      if (!ok) { setFailed(true); return; }
      await navigate({ to: "/onboarding", replace: true });
    });
    return () => { active = false; };
  }, [navigate]);
  const copy = locale === "en"
    ? { pending: "Verifying your email…", error: "This link has expired or has already been used.", back: "Sign in" }
    : locale === "ar"
      ? { pending: "جارٍ التحقق من بريدك الإلكتروني…", error: "انتهت صلاحية هذا الرابط أو تم استخدامه بالفعل.", back: "تسجيل الدخول" }
      : { pending: "Vérification de votre email…", error: "Ce lien a expiré ou a déjà été utilisé.", back: "Se connecter" };
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-5 px-4 text-center" data-no-translate>
      <h1 className="text-2xl font-serif text-primary">Nooryaa</h1>
      <p role="status" className="text-foreground">{failed ? copy.error : copy.pending}</p>
      {failed && <Button asChild><Link to="/auth" search={{ mode: "signin" }}>{copy.back}</Link></Button>}
    </section>
  );
}