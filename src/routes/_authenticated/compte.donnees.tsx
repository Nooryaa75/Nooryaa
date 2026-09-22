import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Download, Cookie, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { exportMyData, fetchMyConsents, recordConsent } from "@/lib/privacy.functions";
import { getCookieChoice, setCookieChoice, onCookieChoiceChange, type CookieChoice } from "@/lib/cookie-consent";

export const Route = createFileRoute("/_authenticated/compte/donnees")({
  head: () => ({
    meta: [
      { title: "Mes données personnelles — Nooryaa" },
      { name: "description", content: "Téléchargez vos données Nooryaa et gérez vos consentements." },
      { property: "og:title", content: "Mes données personnelles — Nooryaa" },
      { property: "og:description", content: "Téléchargez vos données Nooryaa et gérez vos consentements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DonneesPage,
});

function DonneesPage() {
  const { t, locale, formatDate } = useI18n();
  const runExport = useServerFn(exportMyData);
  const loadConsents = useServerFn(fetchMyConsents);
  const [loading, setLoading] = useState(false);
  const [choice, setChoice] = useState<CookieChoice | null>(null);

  useEffect(() => {
    const sync = () => setChoice(getCookieChoice());
    sync();
    return onCookieChoiceChange(sync);
  }, []);

  const { data: consents, refetch } = useQuery({
    queryKey: ["my-consents"],
    queryFn: () => loadConsents({}),
  });

  async function download() {
    setLoading(true);
    try {
      const payload = await runExport({});
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nooryaa-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("Vos données ont été téléchargées."));
    } catch {
      toast.error(t("Le téléchargement a échoué. Réessayez dans quelques instants."));
    } finally {
      setLoading(false);
    }
  }

  function updateCookies(next: CookieChoice) {
    setCookieChoice(next);
    void recordConsent({ data: { kind: "cookies", accepted: next === "all", locale, source: "compte" } })
      .then(() => refetch())
      .catch(() => {});
    toast.success(t("Votre choix a été enregistré."));
  }

  const consentLabel: Record<string, string> = {
    terms: t("Conditions Générales d'Utilisation"),
    privacy: t("Politique de confidentialité"),
    cookies: t("Cookies et mesure d'audience"),
    marketing: t("Communications commerciales"),
  };

  return (
    <div className="space-y-4" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="relative flex items-center justify-center">
        <Link to="/compte" aria-label={t("Retour")} className="absolute start-0 text-primary">
          <ChevronLeft className="h-6 w-6 rtl-flip" />
        </Link>
        <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
          <ShieldCheck className="h-5 w-5" />
          {t("Mes données personnelles")}
        </h1>
      </div>

      <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="flex items-center gap-2 font-semibold">
          <Download className="h-4 w-4 text-primary" />
          {t("Télécharger mes données")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(
            "Récupérez en un fichier l'ensemble des informations liées à votre compte : profil, photos, likes, messages, abonnements, notifications et consentements.",
          )}
        </p>
        <Button className="rounded-full" onClick={download} disabled={loading}>
          {loading ? t("Préparation en cours...") : t("Télécharger mes données")}
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="flex items-center gap-2 font-semibold">
          <Cookie className="h-4 w-4 text-primary" />
          {t("Cookies et mesure d'audience")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {choice === "all"
            ? t("Vous avez accepté la mesure d'audience anonyme.")
            : choice === "essential"
              ? t("Seuls les cookies nécessaires au service sont utilisés.")
              : t("Vous n'avez pas encore fait de choix.")}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant={choice === "all" ? "default" : "outline"}
            className="rounded-full sm:flex-1"
            onClick={() => updateCookies("all")}
          >
            {t("Tout accepter")}
          </Button>
          <Button
            variant={choice === "essential" ? "default" : "outline"}
            className="rounded-full sm:flex-1"
            onClick={() => updateCookies("essential")}
          >
            {t("Refuser la mesure d'audience")}
          </Button>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-semibold">{t("Historique de mes consentements")}</h2>
        {consents && consents.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {consents.map((row: any, index: number) => (
              <li key={index} className="flex items-center justify-between gap-3 border-b border-border/40 pb-2 last:border-0">
                <span className="min-w-0">
                  <span className="block font-medium">{consentLabel[row.kind] ?? row.kind}</span>
                  <span className="block text-xs text-muted-foreground">
                    {formatDate(row.created_at, { dateStyle: "long", timeStyle: "short" })}
                  </span>
                </span>
                <span className={row.accepted ? "text-primary text-xs font-semibold" : "text-muted-foreground text-xs"}>
                  {row.accepted ? t("Accepté") : t("Refusé")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t("Aucun consentement enregistré pour le moment.")}</p>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="flex items-center gap-2 font-semibold">
          <Trash2 className="h-4 w-4 text-accent" />
          {t("Rectification et suppression")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(
            "Vous pouvez corriger vos informations depuis Mon profil et supprimer définitivement votre compte depuis Mes notifications. Pour toute autre demande (accès, opposition, réclamation), écrivez-nous à contact@nooryaa.com.",
          )}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" className="rounded-full sm:flex-1">
            <Link to="/compte/profil">{t("Mon profil")}</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full sm:flex-1">
            <Link to="/privacy">{t("Politique de confidentialité")}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
