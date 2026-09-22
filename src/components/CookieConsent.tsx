import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { getCookieChoice, setCookieChoice, onCookieChoiceChange, type CookieChoice } from "@/lib/cookie-consent";
import { recordConsent } from "@/lib/privacy.functions";

/** Bandeau de consentement cookies affiché tant qu'aucun choix n'a été fait. */
export function CookieConsent() {
  const { t, locale } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => setVisible(getCookieChoice() === null);
    sync();
    return onCookieChoiceChange(sync);
  }, []);

  if (!visible) return null;

  const choose = (choice: CookieChoice) => {
    setCookieChoice(choice);
    setVisible(false);
    // Conserve une preuve datée du choix pour les membres connectés.
    void recordConsent({
      data: { kind: "cookies", accepted: choice === "all", locale, source: "banner" },
    }).catch(() => {});
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[80] px-3 pb-3"
      dir={locale === "ar" ? "rtl" : "ltr"}
      role="dialog"
      aria-label={t("Gestion des cookies")}
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-soft)]">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-2 text-primary">
            <Cookie className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-primary">{t("Gestion des cookies")}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t(
                "Nooryaa utilise les cookies nécessaires au fonctionnement du service et, avec votre accord, une mesure d'audience anonyme pour améliorer l'application. Vous pouvez changer d'avis à tout moment dans Mon compte.",
              )}{" "}
              <Link to="/privacy" className="text-primary underline underline-offset-4">
                {t("Politique de confidentialité")}
              </Link>
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button className="rounded-full sm:flex-1" onClick={() => choose("all")}>
                {t("Tout accepter")}
              </Button>
              <Button variant="outline" className="rounded-full sm:flex-1" onClick={() => choose("essential")}>
                {t("Continuer sans accepter")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
