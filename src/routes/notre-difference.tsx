import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/nooryaa-logo.png.asset.json";

export const Route = createFileRoute("/notre-difference")({
  head: () => ({
    meta: [
      { title: "Notre Différence — Nooryaa, un site pensé pour le mariage" },
      { name: "description", content: "Découvrez pourquoi Nooryaa existe : un site créé par la communauté, pour la communauté, dédié au mariage halal avec profils vérifiés et modération active." },
      { property: "og:title", content: "Notre Différence — Nooryaa" },
      { property: "og:description", content: "Un site sérieux pensé uniquement pour le mariage : intention claire, inscriptions sécurisées, modération assistée par IA." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://nooryaa.lovable.app/notre-difference" }],
  }),
  component: NotreDifferencePage,
});

function NotreDifferencePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border/60">
        <nav className="container mx-auto flex items-center justify-between px-4 md:px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoAsset.url} alt="Logo Nooryaa" className="h-9 w-9 rounded-xl object-cover shadow-sm" />
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="rounded-full px-3 md:px-4">Accueil</Button>
            </Link>
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="sm" className="rounded-full px-3 md:px-5 gold-sheen border-0">S'inscrire</Button>
            </Link>
            <Link to="/auth" search={{ mode: "signin" }}>
              <Button variant="outline" size="sm" className="rounded-full px-3 md:px-5 border-primary/40 text-primary hover:bg-primary/10">Connexion</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-12 md:py-16 max-w-3xl">
        <p className="text-sm uppercase tracking-widest text-[color:var(--gold-deep)] mb-2">Pourquoi le site ?</p>
        <h1 className="font-serif text-3xl md:text-5xl text-primary mb-4">Notre Différence</h1>
        <div className="gold-rule w-24 mb-10" />

        <article className="space-y-10 text-base leading-relaxed text-foreground/90">
          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-primary">Un site créé par la communauté, pour la communauté</h2>
            <p>Le site a été créé par deux amis d’origine algérienne, Brahim et Karim.</p>
            <p>Avec le temps, nous avons constaté un véritable problème : beaucoup de personnes souhaitent se marier, mais peinent à trouver la bonne personne dans la bonne plateforme.</p>
            <p>Il existe déjà plusieurs sites de rencontre destinés aux musulmans. Pourtant, nous avons remarqué qu’une grande partie des utilisateurs recherchent quelque chose de différent : un espace sérieux, pensé réellement pour le mariage, et non pour la simple fréquentation, les relations sans engagement ou les rencontres sans objectif précis.</p>
            <p>C’est de ce constat qu’est née l’idée de Nooryaa : créer un site qui rassemble des personnes ayant une intention sincère de se marier, dans un cadre sérieux, respectueux et en accord avec les valeurs de l’islam.</p>
            <p className="font-semibold text-foreground">On vient avec une intention : rencontrer la bonne personne pour se marier.</p>
            <p className="font-semibold text-foreground">Notre objectif est simple : faciliter les rencontres dans un but précis ; le mariage.</p>
            <p>Ce site est avant tout un projet créé par des membres de la communauté, pour la communauté. Nous souhaitons que chacun puisse savoir réellement qui se trouve derrière ce projet, connaître notre démarche et comprendre les valeurs qui nous animent.</p>
            <p>Nous ne sommes pas simplement derrière un simple site de mise en relation : nous sommes deux personnes de la communauté qui avons constaté un besoin et qui avons créé une solution sérieuse, transparente et dédiée au mariage.</p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-primary">Notre Différence : un site pensé pour le mariage</h2>
            <p>Notre Différence ne se résume pas à une fonctionnalité de plus. Elle commence dès le premier jour, avec une approche claire : ici, on s’inscrit pour une seule raison, le mariage.</p>
            <p>Contrairement aux plateformes de mise en relation classiques, notre site ne cherche pas à favoriser le simple flirt, les fréquentations ou les relations sans lendemain. L’objectif est annoncé dès l’inscription : entrer en contact avec des personnes qui partagent la même intention et avancer dans le but d’aboutir à un mariage.</p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-primary">Une intention claire dès le départ</h2>
            <p>Sur notre plateforme, chacun sait pourquoi il est là.</p>
            <p>Les échanges sont pensés pour permettre aux membres de faire connaissance sérieusement, d’échanger sur leurs valeurs, leurs attentes et leur projet de vie, avec un objectif commun : déterminer si une union est envisageable.</p>
            <p>Nous voulons ainsi éviter les ambiguïtés que l’on peut retrouver sur certaines plateformes où chacun vient avec des intentions différentes.</p>
            <p className="font-semibold text-foreground">Ici, le mariage n’est pas une possibilité parmi d’autres : c’est la finalité du site.</p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-primary">Des inscriptions sécurisées et des profils vérifiés</h2>
            <p>Le sérieux d’une plateforme commence par l’identité de ses membres. C’est pourquoi chaque inscription, homme comme femme, est soumise à un processus de vérification.</p>
            <p>Pour créer un compte, nous utilisons la combinaison d’un email, d’un numéro de téléphone, d’un prénom et d’un nom. Votre login reste votre email.</p>
            <p>Ces éléments sont associés à un seul compte afin de limiter fortement la création de comptes multiples et la limitation de création de faux profils et d’usurpation d’identité.</p>
            <p>Cette démarche a plusieurs objectifs : limiter les faux comptes, décourager les personnes qui souhaitent s’amuser avec la plateforme et renforcer la confiance entre les membres.</p>
            <p>Nous savons qu’une des principales préoccupations sur les sites de mise en relation est de savoir qui se trouve réellement derrière un profil.</p>
            <p>L’objectif est simple : que les membres puissent échanger avec de vraies personnes, dans un environnement aussi fiable que possible.</p>
            <p>Bien entendu, aucune technologie ne peut garantir un risque zéro. C’est pourquoi la vérification des comptes est complétée par une modération active.</p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-primary">Une modération assistée par l’intelligence artificielle</h2>
            <p>Une équipe de modération veille également au respect des règles de la plateforme assistée par une intelligence artificielle, destinée à détecter certains comportements ou contenus qui ne respectent pas les règles du site.</p>
            <p>Les comportements irrespectueux, les insultes, le harcèlement, les tentatives de tromperie ou tout comportement contraire à l’esprit du site peuvent faire l’objet d’une intervention et, selon la situation, de sanctions.</p>
            <p>L’intelligence artificielle nous aide à surveiller la plateforme, mais la dimension humaine reste essentielle.</p>
          </section>

          <section className="space-y-4 border-t border-border/60 pt-8">
            <p className="font-semibold text-foreground">Notre ambition est de vous permettre de faire une rencontre qui ait un véritable sens.</p>
            <p>Ici, on ne vient pas pour collectionner les conversations.</p>
            <p className="font-semibold text-foreground">On vient avec une intention : rencontrer la bonne personne pour se marier.</p>
          </section>
        </article>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Link to="/auth" search={{ mode: "signup" }}>
            <Button size="lg" className="rounded-full px-8">Rejoindre Nooryaa gratuitement</Button>
          </Link>
          <Link to="/">
            <Button variant="outline" size="lg" className="rounded-full px-8">Retour à l’accueil</Button>
          </Link>
        </div>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        © 2026 Nooryaa — Mise en relation dans le dîn, Abonnement gratuit
      </footer>
    </div>
  );
}
