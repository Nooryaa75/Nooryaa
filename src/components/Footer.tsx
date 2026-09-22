import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t, locale } = useI18n();

  return (
    <footer
      data-no-translate
      className="border-t border-border/60 bg-background/95 px-4 py-5 pb-16 backdrop-blur md:pb-5"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-center py-1 text-center">
        <nav className="text-xs">
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
