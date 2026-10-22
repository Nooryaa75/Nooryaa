import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import logoAsset from "@/assets/nooryaa-logo.png.asset.json";

export const Route = createFileRoute("/bienvenue")({
  head: () => ({ meta: [
    { title: "Bienvenue sur Nooryaa — Inscription ou connexion" },
    { name: "description", content: "Rejoignez Nooryaa ou connectez-vous pour des rencontres sérieuses dans le dîn, en vue d'un mariage halal." },
    { property: "og:title", content: "Bienvenue sur Nooryaa" },
    { property: "og:description", content: "Inscrivez-vous ou connectez-vous à Nooryaa, la mise en relation dans le dîn." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Welcome,
});

function Welcome() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-[color:var(--cream)]/40 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-[var(--shadow-soft)] p-6 md:p-8 border border-border/60 text-center space-y-6">
        <img src={logoAsset.url} alt="Nooryaa" className="mx-auto h-24 w-auto rounded-2xl object-contain" />
        <div className="mx-auto max-w-xs"><LanguageSwitcher inline /></div>
        <h1 className="text-2xl font-serif text-primary">{t("Bienvenue sur Nooryaa")}</h1>
        <div className="space-y-3">
          <Button asChild className="w-full rounded-full" size="lg">
            <Link to="/inscription">{t("Je m'inscris")}</Link>
          </Button>
          <Button asChild variant="outline" className="w-full rounded-full" size="lg">
            <Link to="/auth" search={{ mode: "signin" }}>{t("Je me connecte")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
