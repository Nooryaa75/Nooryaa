"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function NotreDifferenceSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full px-2 md:px-4 text-xs md:text-sm border-primary/40 text-primary hover:bg-primary/10 backdrop-blur-sm whitespace-nowrap"
        >
          Notre Différence
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[90vw] sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-serif text-2xl text-primary">
            Notre Différence
          </SheetTitle>
          <SheetDescription>Pourquoi le site ?</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 text-sm leading-relaxed text-foreground/90">
          <section className="space-y-4">
            <p className="font-semibold text-base text-foreground">
              Un site créé par la communauté, pour la communauté
            </p>
            <p>
              Le site a été créé par deux amis d’origine algérienne, Brahim et Karim.
            </p>
            <p>
              Avec le temps, nous avons constaté un véritable problème : beaucoup de personnes souhaitent se marier, mais peinent à trouver la bonne personne dans la bonne plateforme.
            </p>
            <p>
              Il existe déjà plusieurs sites de rencontre destinés aux musulmans. Pourtant, nous avons remarqué qu’une grande partie des utilisateurs recherchent quelque chose de différent : un espace sérieux, pensé réellement pour le mariage, et non pour la simple fréquentation, les relations sans engagement ou les rencontres sans objectif précis.
            </p>
            <p>
              C’est de ce constat qu’est née l’idée de Nooryaa : créer un site qui rassemble des personnes ayant une intention sincère de se marier, dans un cadre sérieux, respectueux et en accord avec les valeurs de l’islam.
            </p>
            <p className="font-semibold text-foreground">
              On vient avec une intention : rencontrer la bonne personne pour se marier.
            </p>
            <p className="font-semibold text-foreground">
              Notre objectif est simple : faciliter les rencontres dans un but précis ; le mariage.
            </p>
            <p>
              Ce site est avant tout un projet créé par des membres de la communauté, pour la communauté. Nous souhaitons que chacun puisse savoir réellement qui se trouve derrière ce projet, connaître notre démarche et comprendre les valeurs qui nous animent.
            </p>
            <p>
              Nous ne sommes pas simplement derrière un simple site de mise en relation : nous sommes deux personnes de la communauté qui avons constaté un besoin et qui avons créé une solution sérieuse, transparente et dédiée au mariage.
            </p>
          </section>

          <section className="space-y-4">
            <p className="font-semibold text-base text-foreground">
              Notre Différence : un site pensé pour le mariage
            </p>
            <p>
              Notre Différence ne se résume pas à une fonctionnalité de plus. Elle commence dès le premier jour, avec une approche claire : ici, on s’inscrit pour une seule raison, le mariage.
            </p>
            <p>
              Contrairement aux plateformes de mise en relation classiques, notre site ne cherche pas à favoriser le simple flirt, les fréquentations ou les relations sans lendemain. L’objectif est annoncé dès l’inscription : entrer en contact avec des personnes qui partagent la même intention et avancer dans le but d’aboutir à un mariage.
            </p>
          </section>

          <section className="space-y-4">
            <p className="font-semibold text-base text-foreground">
              Une intention claire dès le départ
            </p>
            <p>
              Sur notre plateforme, chacun sait pourquoi il est là.
            </p>
            <p>
              Les échanges sont pensés pour permettre aux membres de faire connaissance sérieusement, d’échanger sur leurs valeurs, leurs attentes et leur projet de vie, avec un objectif commun : déterminer si une union est envisageable.
            </p>
            <p>
              Nous voulons ainsi éviter les ambiguïtés que l’on peut retrouver sur certaines plateformes où chacun vient avec des intentions différentes.
            </p>
            <p className="font-semibold text-foreground">
              Ici, le mariage n’est pas une possibilité parmi d’autres : c’est la finalité du site.
            </p>
          </section>

          <section className="space-y-4">
            <p className="font-semibold text-base text-foreground">
              Des inscriptions sécurisées et des profils vérifiés
            </p>
            <p>
              Le sérieux d’une plateforme commence par l’identité de ses membres. C’est pourquoi chaque inscription, homme comme femme, est soumise à un processus de vérification.
            </p>
            <p>
              Pour créer un compte, nous utilisons la combinaison d’un email, d’un numéro de téléphone, d’un prénom et d’un nom. Votre login reste votre email.
            </p>
            <p>
              Ces éléments sont associés à un seul compte afin de limiter fortement la création de comptes multiples et la limitation de création de faux profils et d’usurpation d’identité.
            </p>
            <p>
              Cette démarche a plusieurs objectifs : limiter les faux comptes, décourager les personnes qui souhaitent s’amuser avec la plateforme et renforcer la confiance entre les membres.
            </p>
            <p>
              Nous savons qu’une des principales préoccupations sur les sites de mise en relation est de savoir qui se trouve réellement derrière un profil.
            </p>
            <p>
              L’objectif est simple : que les membres puissent échanger avec de vraies personnes, dans un environnement aussi fiable que possible.
            </p>
            <p>
              Bien entendu, aucune technologie ne peut garantir un risque zéro. C’est pourquoi la vérification des comptes est complétée par une modération active.
            </p>
          </section>

          <section className="space-y-4">
            <p className="font-semibold text-base text-foreground">
              Une modération assistée par l’intelligence artificielle
            </p>
            <p>
              Une équipe de modération veille également au respect des règles de la plateforme assistée par une intelligence artificielle, destinée à détecter certains comportements ou contenus qui ne respectent pas les règles du site.
            </p>
            <p>
              Les comportements irrespectueux, les insultes, le harcèlement, les tentatives de tromperie ou tout comportement contraire à l’esprit du site peuvent faire l’objet d’une intervention et, selon la situation, de sanctions.
            </p>
            <p>
              L’intelligence artificielle nous aide à surveiller la plateforme, mais la dimension humaine reste essentielle.
            </p>
          </section>

          <section className="space-y-4 border-t border-border/60 pt-4">
            <p className="font-semibold text-base text-foreground">
              Notre ambition est de vous permettre de faire une rencontre qui ait un véritable sens.
            </p>
            <p>
              Ici, on ne vient pas pour collectionner les conversations.
            </p>
            <p className="font-semibold text-foreground">
              On vient avec une intention : rencontrer la bonne personne pour se marier.
            </p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
