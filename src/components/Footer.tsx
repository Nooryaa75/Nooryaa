import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t, locale } = useI18n();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      data-no-translate
      className="border-t border-border/60 bg-background/95 px-4 py-5 pb-16 backdrop-blur md:pb-5"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:gap-4">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Heart className="h-3.5 w-3.5 fill-current text-primary" />
          {t("© 2026 Nooryaa — Mise en relation dans le dîn, Abonnement gratuit").replace("2026", String(currentYear))}
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
          <Link
            to="/privacy"
            className="text-muted-foreground transition-colors hover:text-primary hover:underline"
          >
            {t("Politique de confidentialité")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
