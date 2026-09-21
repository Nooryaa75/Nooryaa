# Traduction complète de Nooryaa en anglais et en arabe

## Objectif

Permettre à chaque visiteur et membre d’utiliser tout Nooryaa en français, anglais ou arabe, sans changer les règles métier ni les données des comptes.

## Expérience proposée

- Ajouter un sélecteur de langue accessible sur les pages publiques, l’inscription, l’espace membre et l’administration.
- Conserver le français comme langue initiale, puis mémoriser le choix sur l’appareil.
- Afficher l’arabe en écriture de droite à gauche, y compris la navigation, les formulaires, les dialogues, les listes et les conversations.
- Utiliser un arabe moderne standard, clair et respectueux du contexte matrimonial musulman.
- Traduire les textes saisis par Nooryaa ; conserver tels quels les pseudos, biographies, messages et autres contenus écrits par les membres.

## Contenu couvert

- Pages publiques, connexion, inscription, confirmation d’email et réinitialisation du mot de passe.
- Accueil membre, profils, recherche, filtres, likes, matchs, messages, notifications et blocages.
- Mon compte : profil, abonnement, confidentialité, préférences, règles, CGU et service client.
- Tous les formulaires, menus, boutons, aides, états vides, chargements, confirmations et erreurs.
- Listes de choix : pratique, situation familiale, objectifs, métiers, activités, personnalité, pays, dates et unités.
- Notifications instantanées, rappels, horaires de prière, contrôle selfie et gestion des photos.
- Administration complète, outils, tableaux, filtres, statistiques, export et configurateur d’abonnements.
- Métadonnées de partage et de référencement propres à la langue active.
- Emails envoyés par Nooryaa, dans la langue du destinataire lorsqu’elle est connue.

## Mise en œuvre

1. Créer le socle multilingue interne avec dictionnaires typés `fr`, `en`, `ar`, détection/mémorisation de langue, interpolation et pluriels.
2. Ajouter le sélecteur global et piloter automatiquement `lang`, `dir="rtl"` et les adaptations visuelles nécessaires.
3. Extraire et traduire les textes communs, puis toutes les pages publiques et le parcours d’authentification.
4. Traduire l’espace membre et les composants partagés, sans traduire les contenus personnels des membres.
5. Traduire l’administration et les libellés de configuration, en gardant les valeurs techniques stables dans la base.
6. Adapter les messages serveur, validations, notifications et emails pour recevoir la langue du membre.
7. Localiser dates, heures, nombres, devises et pluriels avec les formats `fr-FR`, `en`, et `ar`.
8. Vérifier les trois langues sur mobile et ordinateur, avec une attention particulière à l’arabe RTL, aux textes longs et aux dialogues.

## Détails techniques

- Aucun texte métier ne dépendra de sa traduction : les valeurs enregistrées restent des identifiants stables, seuls les libellés changent.
- Les traductions seront centralisées et organisées par domaine afin d’éviter les variantes incohérentes.
- La préférence de langue sera disponible avant connexion et associée au profil quand cela est possible, avec repli sur le français.
- Les emails système utiliseront un dictionnaire partagé côté serveur et ne dépendront pas du navigateur.
- Les contenus légaux existants seront traduits fidèlement ; aucune nouvelle clause ne sera inventée.
- Les contrôles incluront la compilation, les erreurs d’exécution, les principaux parcours interactifs et plusieurs largeurs d’écran.

## Critères de validation

- Aucun texte visible fourni par Nooryaa ne reste en français lorsque l’anglais ou l’arabe est choisi.
- Le changement de langue est immédiat et persiste après rechargement et reconnexion.
- L’arabe s’affiche entièrement de droite à gauche sans chevauchement ni inversion incorrecte des icônes directionnelles.
- Les données existantes, abonnements, recherches, conversations et comptes continuent de fonctionner sans migration destructive.
- Les emails et notifications utilisent la langue enregistrée, avec repli fiable en français.