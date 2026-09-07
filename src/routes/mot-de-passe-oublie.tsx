import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { sendPasswordReset } from "@/lib/notify.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logoAsset from "@/assets/nooryaa-logo.png.asset.json";

export const Route = createFileRoute("/mot-de-passe-oublie")({
  head: () => ({
    meta: [
      { title: "Mot de passe oublié — Nooryaa" },
      { name: "description", content: "Recevez un lien sécurisé par email pour réinitialiser le mot de passe de votre compte Nooryaa." },
      { property: "og:title", content: "Mot de passe oublié — Nooryaa" },
      { property: "og:description", content: "Recevez un lien sécurisé par email pour réinitialiser votre mot de passe Nooryaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const requestReset = useServerFn(sendPasswordReset);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await requestReset({ data: { email, origin: window.location.origin } });
      setSent(true);
    } catch (err: any) {
      toast.error(err?.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--cream)]/40 px-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-[var(--shadow-soft)] p-8 border border-border/60">
        <Link to="/" className="block text-center mb-3">
          <img src={logoAsset.url} alt="Nooryaa" className="mx-auto h-24 w-auto rounded-2xl object-contain" />
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-[color:var(--gold)]/15 flex items-center justify-center text-2xl">✉️</div>
            <h1 className="text-2xl font-serif text-primary mb-2">Vérifiez votre boîte mail</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Si un compte existe avec <span className="font-medium text-foreground">{email}</span>, vous recevrez un lien
              pour choisir un nouveau mot de passe. Ce lien est valable 1 heure. Pensez à regarder dans vos courriers indésirables.
            </p>
            <Button asChild className="w-full rounded-full">
              <Link to="/auth" search={{ mode: "signin" }}>Retour à la connexion</Link>
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-serif text-center text-primary mb-1">Mot de passe oublié</h1>
            <p className="text-center text-sm text-muted-foreground mb-6">
              Indiquez votre email : nous vous envoyons un lien sécurisé pour en choisir un nouveau.
            </p>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading} className="w-full rounded-full">
                {loading ? "Envoi..." : "Recevoir le lien"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-5">
              <Link to="/auth" search={{ mode: "signin" }} className="text-primary underline underline-offset-4">
                Retour à la connexion
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
