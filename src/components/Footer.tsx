import { Link } from "@tanstack/react-router";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { StoreBadges } from "@/components/StoreBadges";

export function Footer() {
  const { t, locale } = useI18n();

  return (
    <footer
      data-no-translate
      className="border-t border-border/60 bg-background/95 px-4 py-5 pb-16 backdrop-blur md:pb-5"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3">
        <StoreBadges />
        <div className="w-full max-w-xs">
          <LanguageSwitcher inline />
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
          <Link
            to="/privacy"
            className="text-muted-foreground transition-colors hover:text-primary hover:underline"
          >
            {t("Politique de confidentialité")}
          </Link>
          <Link
            to="/securite-enfants"
            className="text-muted-foreground transition-colors hover:text-primary hover:underline"
          >
            {t("Sécurité des enfants")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
