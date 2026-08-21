import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero.jpg";
import heroAsset from "@/assets/nooryaa-hero-new.jpg.asset.json";
import logoAsset from "@/assets/nooryaa-logo.jpg.asset.json";
import { Button } from "@/components/ui/button";
import { Shield, UserPlus, Camera, Send, CheckCircle2, Star, Gift, Mail, Clock } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listActiveAds, submitContactMessage } from "@/lib/admin.functions";
import { useEffect, useState } from "react";
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
      <header className="absolute top-0 left-0 right-0 z-10">
        <nav className="container mx-auto flex items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoAsset.url} alt="Logo Nooryaa" className="h-11 w-11 rounded-full object-cover gold-glow" />
            <span className="text-2xl font-serif font-semibold tracking-[0.18em] uppercase gold-text">Nooryaa</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth" search={{ mode: "signin" }} className="text-sm font-medium text-foreground/80 hover:text-foreground">
              Connexion
            </Link>
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button variant="default" size="sm" className="rounded-full px-5 gold-sheen">S'inscrire</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO plein écran façon Mektoube */}
      <section className="relative min-h-[92vh] flex items-end justify-center overflow-hidden">
        <img
          src={heroAsset}
          alt="Couple musulman marchant vers une mosquée au coucher du soleil — Nooryaa, rencontre authentique dans le dîn"
          className="absolute inset-0 h-full w-full object-cover object-top"
          width={1152}
          height={928}
        />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-transparent via-background/80 to-background" aria-hidden="true" />
        <div className="relative container mx-auto px-6 text-center max-w-3xl pb-16">
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="lg" className="rounded-full px-9 shadow-[var(--shadow-soft)] gold-sheen">Je m'inscris</Button>
            </Link>
            <Link to="/auth" search={{ mode: "signin" }}>
              <Button size="lg" variant="outline" className="rounded-full px-9 bg-background/40 backdrop-blur">Je me connecte</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Bandeau confiance */}
      <section className="border-y border-border/60 bg-card/40">
        <div className="container mx-auto grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/60 px-6">
          {[
            { icon: Clock, title: "Validation rapide", desc: "Vos photos validées en quelques minutes." },
            { icon: Gift, title: "100% gratuit", desc: "Aucun abonnement, aucune option payante." },
            { icon: Shield, title: "Modération active", desc: "Une équipe dédiée à la sécurité des échanges." },
          ].map((t) => (
            <div key={t.title} className="flex items-start gap-3 px-2 py-7">
              <t.icon className="h-6 w-6 text-[color:var(--gold)] flex-shrink-0" />
              <div>
                <p className="font-serif text-primary text-lg">{t.title}</p>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* Partenaires / mise en avant */}
      <section className="container mx-auto px-6 pb-4">
        <div className="max-w-2xl mx-auto">
          <HeroVisual />
        </div>
      </section>


      {/* Comment ça marche */}
      <section className="bg-[color:var(--cream)]/40 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-serif text-center text-primary mb-4">Comment ça marche ?</h2>
          <div className="gold-rule mx-auto w-40 mb-6" />
          <p className="text-center text-muted-foreground max-w-xl mx-auto mb-14">Trois étapes simples pour rencontrer une personne sérieuse, dans le respect de vos valeurs.</p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { n: "1", icon: UserPlus, title: "Créez votre profil", desc: "Email + téléphone (unique). Choisissez un pseudo et complétez vos informations." },
              { n: "2", icon: Camera, title: "Ajoutez vos photos", desc: "Jusqu'à 6 photos pour vous présenter authentiquement." },
              { n: "3", icon: Send, title: "Discutez librement", desc: "Coup de cœur, message direct, partage de photos — sans aucune limite payante." },
            ].map((s) => (
              <div key={s.n} className="relative bg-card rounded-2xl p-8 border border-border/60 text-center">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-serif">{s.n}</div>
                <s.icon className="h-8 w-8 text-[color:var(--gold)] mx-auto mb-3 mt-2" />
                <h3 className="font-serif text-primary text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
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

function HeroVisual() {
  const fetchAds = useServerFn(listActiveAds);
  const { data: ads } = useQuery({ queryKey: ["public-ads"], queryFn: () => fetchAds() });
  const slides = (ads && ads.length > 0)
    ? ads.map((a) => ({ id: a.id, image_url: a.image_url, link_url: a.link_url, title: a.title }))
    : [{ id: "hero", image_url: heroImg, link_url: null as string | null, title: "Nooryaa" }];

  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  const current = slides[idx % slides.length];
  const Img = (
    <img
      src={current.image_url}
      alt={current.title ?? "Nooryaa"}
      className="arch gold-frame shadow-[var(--shadow-soft)] w-full h-auto object-cover transition-opacity duration-700"
    />
  );

  return (
    <div className="relative">
      {current.link_url ? (
        <a href={current.link_url} target="_blank" rel="noopener noreferrer sponsored">{Img}</a>
      ) : Img}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIdx(i)}
              aria-label={`Diapositive ${i + 1}`}
              className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-[color:var(--gold)]" : "w-2 bg-white/70"}`}
            />
          ))}
        </div>
      )}
      {ads && ads.length > 0 && (
        <span className="absolute top-3 left-3 text-[10px] font-medium uppercase tracking-wider bg-white/85 text-foreground/70 px-2 py-0.5 rounded-full">Partenaire</span>
      )}
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