import { createFileRoute, Link } from "@tanstack/react-router";
import heroFullAsset from "@/assets/nooryaa-hero-full.jpg";
import logoAsset from "@/assets/nooryaa-logo.jpg.asset.json";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Star, Mail, Heart, ShieldCheck, Users, Sparkles } from "lucide-react";
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
      { title: "Nooryaa — Site de rencontre musulman Abonnement gratuit pour mariage halal" },
      { name: "description", content: "Nooryaa : site de rencontre musulman Abonnement gratuit, sans abonnement, pour célibataires musulmans et musulmanes cherchant un mariage halal sérieux. Inscription gratuite, messagerie illimitée, jusqu'à 6 photos, profils vérifiés." },
      { name: "keywords", content: "site de rencontre musulman gratuit, rencontre musulmane, mariage halal, célibataire musulman, célibataire musulmane, rencontre mariage musulman, site mariage islam, rencontre halal, muslima, inchallah, Nooryaa" },
      { property: "og:title", content: "Nooryaa — Rencontres musulmanes Abonnement gratuit pour mariage halal" },
      { property: "og:description", content: "Inscription, messagerie et photos Abonnement gratuit. Trouvez votre moitié dans le respect des valeurs de l'islam." },
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
          description: "Site de rencontre musulman Abonnement gratuit pour mariage halal sérieux.",
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
          slogan: "Rencontres musulmanes Abonnement gratuit pour mariage halal",
          areaServed: ["FR", "BE", "CH", "CA", "LU", "MA", "DZ", "TN"],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "Nooryaa est-il vraiment Abonnement gratuit ?", acceptedAnswer: { "@type": "Answer", text: "Oui. Inscription, recherche, photos et messagerie sont entièrement gratuites sur Nooryaa. Aucun abonnement, aucune option payante." } },
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
        <nav className="container mx-auto flex items-center justify-between px-4 md:px-6 py-4 md:py-5">
          <Link to="/" className="flex items-center gap-2 md:gap-3">
            <img src={logoAsset.url} alt="Logo Nooryaa" className="h-9 w-9 md:h-11 md:w-11 rounded-full object-cover gold-glow" />
            <span className="text-lg md:text-2xl font-serif font-semibold tracking-[0.12em] md:tracking-[0.18em] uppercase text-primary md:text-white drop-shadow-md">Nooryaa</span>
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <Link to="/auth" search={{ mode: "signin" }} className="text-sm font-medium text-primary hover:text-primary/80 md:text-white/90 md:hover:text-white drop-shadow-md">
              Connexion
            </Link>
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button variant="default" size="sm" className="rounded-full px-3 md:px-5 gold-sheen border-0 bg-primary/10 text-primary hover:bg-primary/20 md:bg-white/10 md:text-white md:hover:bg-white/20 backdrop-blur-sm">S'inscrire</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO — hauteur naturelle : image entière, pleine largeur, aucune bande */}
      <section className="relative w-full overflow-hidden bg-background">
        <img
          src={heroFullAsset}
          alt="Nooryaa — Mise en relation dans le dîn. Couple musulman sous une arche dorée, mosquée au coucher du soleil, lanternes et valeurs islamiques."
          className="block h-auto w-full"
          width={1369}
          height={1149}
        />
      </section>

      {/* Sous-titre sous le slogan du hero */}
      <section className="bg-background py-6 md:py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="font-serif text-lg md:text-2xl text-[color:var(--gold-deep)] tracking-wide">
            Pour une relation sincère tournée vers le nikah
          </p>
        </div>
      </section>

      {/* Pourquoi Nooryaa */}
      <section className="relative bg-[color:var(--cream)]/40 py-20 arabesque">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-3xl md:text-4xl font-medium tracking-widest uppercase text-[color:var(--gold-deep)] mb-3">Nos Pilliers</p>
            <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4">Pourquoi Nooryaa ?</h2>
            <div className="gold-rule w-24 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Une plateforme pensée pour les musulmans et musulmanes qui souhaitent avancer dans la moutabala (rencontre respectueuse), avec niyyah claire et adab dans chaque échange.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Heart, title: "Abonnement gratuit", text: "Parce que la sincérité ne devrait jamais être conditionnée par un abonnement." },
              { icon: ShieldCheck, title: "Halal & sérieux", text: "Une démarche centrée sur le nikah, avec des échanges respectueux, une intention claire (niyyah) et un cadre conforme aux valeurs islamiques." },
              { icon: Users, title: "Fonctionnalités", text: "Chaque fonctionnalité est pensée pour préserver la pudeur, la sécurité, et la baraka dans les rencontres." },
              { icon: Sparkles, title: "Bienveillance & adab", text: "Modération active, signalement simple, communauté respectueuse. Chaque membre s’engage à respecter les adab du dîn dans ses échanges." },
            ].map((item) => (
              <div key={item.title} className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border/60 shadow-[var(--shadow-card)] text-center hover:shadow-[var(--glow-gold)] transition-shadow">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[color:var(--gold)]/10 flex items-center justify-center">
                  <item.icon className="h-6 w-6 text-[color:var(--gold-deep)]" />
                </div>
                <h3 className="font-serif text-xl text-primary mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-background py-12 md:py-16">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <p className="font-serif text-xl md:text-2xl text-primary leading-relaxed">
            Nooryaa accompagne ceux qui recherchent une relation sincère, respectueuse, et tournée vers le mariage.
          </p>
        </div>
      </section>

      {/* Engagements */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-serif text-primary mb-8 text-center">Nos engagements</h2>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <ul className="space-y-4">
              {[
                "Inscription, recherche et messagerie abonnement gratuit.",
                "Modération active : signalement et blocage en un clic.",
                "Aucune publicité, aucun abonnement caché.",
                "Respect strict de la confidentialité et de la pudeur.",
                "Un cadre pensé pour des rencontres halal, avec intention de nikah.",
                "Possibilité d’échanges respectueux, avec ou sans implication du mahram, selon les préférences.",
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
              « Enfin une plateforme musulmane sérieuse, claire et totalement gratuite.
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
            Avancez dans la moutabala avec sérénité.
            <br />
            Inscription en moins d’une minute.
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
        © 2026 Nooryaa — Mise en relation dans le dîn, Abonnement gratuit
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
          <p className="text-muted-foreground mb-4">Une question, un partenariat, un signalement urgent ?<br />Notre équipe vous répond rapidement, dans un esprit de bienveillance et de respect.</p>
          <ul className="space-y-2 text-sm text-foreground/80">
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[color:var(--gold)] mt-0.5" /> Réponse sous 24h ouvrées</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[color:var(--gold)] mt-0.5" /> Confidentialité garantie</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[color:var(--gold)] mt-0.5" /> Modération sérieuse</li>
            <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[color:var(--gold)] mt-0.5" /> Respect des valeurs du dîn</li>
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