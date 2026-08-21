import { createFileRoute, Link } from "@tanstack/react-router";
import heroFullAsset from "@/assets/nooryaa-hero-full.jpg.asset.json";
import logoAsset from "@/assets/nooryaa-logo.jpg.asset.json";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Star, Mail } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { submitContactMessage } from "@/lib/admin.functions";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nooryaa — Site de rencontre musulman 100% gratuit pour mariage halal" },
      { name: "description", content: "Nooryaa : site de rencontre musulman 100% gratuit, sans abonnement, pour célibataires musulmans et musulmanes cherchant un mariage halal sérieux. Inscription gratuite, messagerie illimitée, jusqu'à 6 photos, profils vérifiés." },
      { name: "keywords", content: "site de rencontre musulman gratuit, rencontre musulmane, mariage halal, célibataire musulman, célibataire musulmane, rencontre mariage musulman, site mariage islam, rencontre halal, muslima, inchallah, Nooryaa" },
      { property: "og:title", content: "Nooryaa — Rencontres musulmanes 100% gratuites pour mariage halal" },
      { property: "og:description", content: "Inscription, messagerie et photos 100% gratuites. Trouvez votre moitié dans le respect des valeurs de l'islam." },
      { property: "og:url", content: "https://nooryaa.lovable.app/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://nooryaa.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Nooryaa",
          url: "https://nooryaa.lovable.app/",
          inLanguage: "fr",
          description: "Site de rencontre musulman 100% gratuit pour mariage halal sérieux.",
          potentialAction: { "@type": "SearchAction", target: "https://nooryaa.lovable.app/browse?q={search_term_string}", "query-input": "required name=search_term_string" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Nooryaa",
          url: "https://nooryaa.lovable.app/",
          slogan: "Rencontres musulmanes 100% gratuites pour mariage halal",
          areaServed: ["FR", "BE", "CH", "CA", "LU", "MA", "DZ", "TN"],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "Nooryaa est-il vraiment 100% gratuit ?", acceptedAnswer: { "@type": "Answer", text: "Oui. Inscription, recherche, photos et messagerie sont entièrement gratuites sur Nooryaa. Aucun abonnement, aucune option payante." } },
            { "@type": "Question", name: "Nooryaa est-il un site de rencontre halal ?", acceptedAnswer: { "@type": "Answer", text: "Oui. Nooryaa est pensé pour le mariage musulman : profils sérieux, valeurs de l'islam respectées, modération active." } },
            { "@type": "Question", name: "Comment s'inscrire sur Nooryaa ?", acceptedAnswer: { "@type": "Answer", text: "Inscription en moins d'une minute par email ou Google, avec un numéro de téléphone unique. Choisissez un pseudo, ajoutez jusqu'à 6 photos et commencez à discuter." } },
            { "@type": "Question", name: "Qui peut utiliser Nooryaa ?", acceptedAnswer: { "@type": "Answer", text: "Tous les célibataires musulmans et musulmanes majeurs cherchant un mariage halal sérieux, partout en France, en Belgique, en Suisse, au Canada et dans le monde francophone." } },
          ],
        }),
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="absolute top-0 left-0 right-0 z-20">
        <nav className="container mx-auto flex items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoAsset.url} alt="Logo Nooryaa" className="h-11 w-11 rounded-full object-cover gold-glow" />
            <span className="text-2xl font-serif font-semibold tracking-[0.18em] uppercase text-white drop-shadow-md">Nooryaa</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth" search={{ mode: "signin" }} className="text-sm font-medium text-white/90 hover:text-white drop-shadow-md">
              Connexion
            </Link>
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button variant="default" size="sm" className="rounded-full px-5 gold-sheen border-0 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm">S'inscrire</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO — visuel Nooryaa complet, non recadré */}
      <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[color:var(--hero-bg)]">
        <img
          src={heroFullAsset.url}
          alt="Nooryaa — Rencontre authentique dans le dîn. Couple musulman sous une arche dorée, mosquée au coucher du soleil, lanternes et valeurs islamiques."
          className="max-h-screen w-auto object-contain"
          width={1369}
          height={1149}
        />
      </section>


      {/* Engagements */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif text-primary mb-6">Nos engagements</h2>
            <ul className="space-y-4">
              {[
                "Inscription, recherche et messagerie 100% gratuites.",
                "Profils vérifiés par téléphone et email (un seul compte par personne).",
                "Modération active : signalement et blocage en un clic.",
                "Aucune publicité, aucun abonnement caché.",
                "Respect strict de la confidentialité de vos données.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[color:var(--gold)] flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/80">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[color:var(--cream)] rounded-3xl p-8 md:p-10 border border-border/60">
            <div className="flex items-center gap-1 text-[color:var(--gold)] mb-3">
              {[0,1,2,3,4].map((i) => <Star key={i} className="h-5 w-5 fill-current" />)}
            </div>
            <p className="font-serif text-xl text-primary leading-relaxed">
              « Enfin une plateforme musulmane sérieuse, claire et totalement gratuite. J'ai trouvé une personne sincère en quelques semaines. »
            </p>
            <p className="mt-4 text-sm text-muted-foreground">— Amina, 28 ans</p>
          </div>
        </div>
      </section>

      <section className="bg-[color:var(--cream)]/60 py-20">
        <div className="container mx-auto px-6 text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4">
            Prêt(e) à commencer ?
          </h2>
          <p className="text-muted-foreground mb-8">
            Inscription en moins d'une minute, avec votre email ou Google. Un numéro de téléphone et un email sont demandés (chacun utilisable une seule fois) pour garantir des profils uniques.
          </p>
          <Link to="/auth" search={{ mode: "signup" }}>
            <Button size="lg" className="rounded-full px-10 shadow-[var(--shadow-soft)]">
              Rejoindre Nooryaa gratuitement
            </Button>
          </Link>
        </div>
      </section>

      <ContactSection />

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        © 2026 Nooryaa — Rencontres musulmanes sérieuses, 100% gratuites
      </footer>
    </div>
  );
}

function ContactSection() {
  const submit = useServerFn(submitContactMessage);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const mut = useMutation({
    mutationFn: (vars: typeof form) => submit({ data: vars }),
    onSuccess: () => { toast.success("Message envoyé ! Nous reviendrons vers vous rapidement."); setForm({ name: "", email: "", subject: "", message: "" }); },
    onError: (e: any) => toast.error(e?.message ?? "Erreur"),
  });

  return (
    <section id="contact" className="container mx-auto px-6 py-20">
      <div className="grid md:grid-cols-2 gap-10 items-start max-w-5xl mx-auto">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4 flex items-center gap-3"><Mail className="h-7 w-7 text-[color:var(--gold)]" /> Contactez-nous</h2>
          <p className="text-muted-foreground mb-4">Une question, un partenariat, un signalement urgent ? Notre équipe vous répond rapidement.</p>
          <ul className="space-y-2 text-sm text-foreground/80">
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[color:var(--gold)] mt-0.5" /> Réponse sous 24h ouvrées</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[color:var(--gold)] mt-0.5" /> Confidentialité garantie</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[color:var(--gold)] mt-0.5" /> Modération sérieuse</li>
          </ul>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); mut.mutate(form); }}
          className="bg-card rounded-2xl p-6 border border-border/60 shadow-[var(--shadow-card)] space-y-4"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label htmlFor="c-name">Nom</Label><Input id="c-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label htmlFor="c-email">Email</Label><Input id="c-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div><Label htmlFor="c-subject">Sujet</Label><Input id="c-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
          <div><Label htmlFor="c-msg">Message</Label><Textarea id="c-msg" required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
          <Button type="submit" disabled={mut.isPending} className="w-full rounded-full">{mut.isPending ? "Envoi..." : "Envoyer le message"}</Button>
        </form>
      </div>
    </section>
  );
}