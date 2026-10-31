# Roadmap

- [ ] Contrôler les inscriptions user_ff2c0d62d4 et Fatima83 : choix explicite de résidence et lieu où la personne a grandi, réponses enregistrées entre les pages et accès réservé aux fiches réellement complètes.

- [x] Accélérer l’ouverture des profils administrateur : lectures inutilisées supprimées, compteurs exacts et selfies chargés séparément ; vraie fiche ouverte avec session admin (1,2 s contre 1,73 s avant), partie selfies chargée, aucune alerte et compilation OK. Publication non demandée.

- [x] Trouvaille du suivi du projet « chaque changement de page vide l'écran » mise en mode ouvert puis corrigée : l'écran « Chargement » ne s'affiche plus que tant que le membre n'a pas été vérifié une fois, les contrôles suivants se font en arrière-plan (deck, chat et position de défilement conservés) ; 3 tests réussis, compilation et types vérifiés, navigation contrôlée sans erreur console. Reste à publier le site ; le parcours entre deux pages membres n'a pas pu être parcouru ici (connexion membre refusée).


- [x] Menu « ⋮ » d'une conversation : un appui simple ouvre les trois choix sans lancer le signalement (le menu s'ouvre à la fin de l'appui et tout choix dans la foulée de l'ouverture est ignoré) ; appui long, clavier et souris vérifiés, choix d'une option toujours possible. Reste à publier le site.


- [x] Regrouper « Assistance » et « Contact » de l’administration en une seule page à deux onglets ; une seule entrée dans le menu, compteur cumulé, et l’ancienne adresse « /admin/contact » redirige vers l’onglet contact. Vérifié à l’écran (onglets, redirection, absence du bouton Contact). Reste à publier le site.

- [x] Corriger les instructions Swift collées dans la protection iOS : erreur exacte reproduite par un test avant correction, séparation des instructions vérifiée après correction ; 7 tests réussis, iOS 1.0.2 (21) conservé dans les deux workflows. Archive complète à valider dans Codemagic (Xcode indisponible ici).
- [x] Corriger l’échec iOS « Configure screen security » : sous-classe intégrée dans AppDelegate.swift et reliée au storyboard ; 6 tests réussis et double exécution vérifiée sur le modèle officiel Capacitor 6. iOS 1.0.2 (21) conservé dans les deux workflows.
- [ ] Relancer « Nooryaa iPhone (App Store) » dans Codemagic pour valider l’archive complète — lancement Codemagic et environnement Apple indisponibles ici.

- [x] Préparer Android 1.0.17 (20) dans les deux workflows Codemagic ; liens, permissions et protections conservés. iOS 1.0.1 passe au build 20 pour garder les versions synchronisées.
- [ ] Lancer et publier Android 1.0.17 (20) dans Codemagic / Google Play — accès de lancement Codemagic nécessaire.

- [x] Langue par défaut issue du navigateur/téléphone, anglais si non prise en charge ; choix explicite prioritaire. Même résolution pour inscription email et emails ; mot de passe oublié transmet la langue actuelle. Six tests réussis et affichage FR/AR/EN/japonais→EN vérifié ; demande de réinitialisation vérifiée sans envoi réel.

- [x] « Voulez-vous des enfants ? » propose désormais Oui / Non / Je ne sais pas dans la fiche d’inscription et dans Ma fiche : réponse conservée même pour les anciennes fiches, reprise telle quelle sur les profils, dans l’administration et les statistiques ; « Je ne sais pas » compte comme répondu mais ne filtre jamais une recherche ni une compatibilité ; 6 tests réussis, écrans vérifiés en français, compilation OK.
- [x] « Où as-tu grandi ? » ajouté sur la page « Vos origines » de l’inscription guidée (facultatif) : la réponse est enregistrée avec les origines et reprise dans la fiche sans jamais écraser une valeur déjà saisie ; 4 tests réussis, page vérifiée à l’écran et réponse retrouvée dans la fiche d’un compte de test, compilation OK.

- [x] Préparer les liens de vérification HTTPS Android : association avec l’empreinte SHA-256 Google Play fournie, vérification de la connexion dans l’application à l’ouverture, maintien du navigateur sans application ; Codemagic Android 1.0.16 (19).
- [ ] Publier le site puis construire et publier Android 1.0.16 (19) dans Codemagic / Google Play, demander un nouvel email et vérifier l’ouverture sur téléphone — publication, build et appareil nécessaires ; les anciens emails gardent leur ancien lien.

- [x] Préparer la protection des photos sur iPhone et le site : filigrane NOORYAA sur les photos des membres (deck, vignettes, profil, chat, affichage en grand — jamais dans l'administration), masquage des photos pendant l'enregistrement d'écran sur iPhone via le nouveau script Codemagic, version iPhone 1.0.1 (18) ; 4 tests du script réussis, compilation OK.
- [ ] Publier le site, lancer Codemagic « Nooryaa iPhone (App Store) » en 1.0.1 (18), puis vérifier le filigrane et le masquage sur un vrai iPhone — publication et appareil nécessaires ; la photo partagée dans le chat reste ouvrable dans un onglet via son lien.

- [x] Préparer la protection des captures Android : FLAG_SECURE dès la création de l’activité dans les deux workflows, version 1.0.15 (18) ; 4 tests réussis et script exécuté deux fois sur activité générée simulée.
- [ ] Lancer Codemagic « Nooryaa Android (Play Store) », publier 1.0.15 (18) puis vérifier captures et enregistrement sur téléphone — build natif et appareil indisponibles ici. Les anciennes versions et le navigateur ne bénéficient pas de cette protection.

- [x] Préparer le retour navigateur vers l'application iPhone : bouton iOS, lien déclaré dans les deux workflows Codemagic, version 1.0.1 (17) ; 6 tests réussis, script idempotent et conservation des autres liens vérifiés, compilation OK.
- [ ] Publier le site, lancer Codemagic « Nooryaa iPhone (App Store) » puis vérifier le bouton sur un vrai iPhone — actions utilisateur et appareil nécessaires ; le bouton ouvre l'app sans transférer la connexion du navigateur.

- [x] Contrôle d'âge des photos : l'écart moyen (jusqu'à 10 ans) passe désormais sans message ni signalement admin, seul un écart de plus de 10 ans (ou une personne paraissant mineure) est refusé ; 4 tests réussis, compilation OK. Publication du site reste à faire.


- [x] Calendrier Nooryaa à l’inscription : choix mois/année et sélection du 18 avril 1993 vérifiés sur écran mobile en mode sombre, session connectée avec fiche incomplète simulée ; aucune erreur. Publication et essai sur vrai téléphone restent à faire.
- [x] Selfie de prilege1@gmail.com examiné : naissance déclarée le 10/10/2008, fiche terminée et selfie validé ; le contrôle compare selfie/photos mais ne reçoit pas la date de naissance, donc ne vérifie pas l’âge déclaré. Aucun changement de compte ou de règle effectué.

- [x] Inscription Android : encart masqué en natif, menus retirés pendant la fiche, accès directs renvoyés vers l’inscription ; 2 tests réussis et essai connecté avec fiche incomplète simulée. Saisie fonctionnelle dans le navigateur et avec pont natif simulé après fermeture des fenêtres ; aucune erreur.
- [ ] Vérifier le blocage de saisie signalé sur le vrai Android après publication : non reproduit ici, téléphone indisponible.

- [x] Corriger le changement de langue sur les textes déjà affichés : passages EN → FR → AR → EN → FR vérifiés sur la connexion, valeurs dynamiques et attributs conservés ; compilation OK, publication non demandée.

- [x] Ajouter l'email de bienvenue pour les comptes Google et Apple : destinataire issu de la session, historique d'envoi et clé anti-doublon ; 5 tests réussis, déclenchements Google/Apple vérifiés avec session connectée et envoi intercepté, compilation OK. La réception réelle et les connexions natives restent à vérifier après publication ; les comptes existants sans bienvenue seront pris en charge à leur prochaine connexion.

- [x] Préparer la remise à zéro de la pastille iPhone lorsque notifications et messages sont tous lus ; tests de logique réussis, compilation OK, aucun nouveau module natif ni rebuild nécessaire.
- [ ] Publier la correction de pastille et vérifier sur un vrai iPhone — publication non demandée, appareil non disponible ici.
- [x] Lire le retour Apple 2.1 et expliquer les six éléments exigés ainsi que la vidéo obligatoire.
- [ ] Compléter la réponse Apple avec la vidéo sur iPhone, les accès de test et les renseignements confirmés par le propriétaire — éléments à fournir par l’utilisateur.

- [x] Discussions admin : inclure les profils aimés sans premier message, supprimer les plafonds de lecture/liste, ajouter les pages et les aperçus vocaux ; tests réussis sur 2 501 messages et 221 discussions, compilation OK.

- [x] Profils admin : nom/prénom ajoutés, villes du catalogue affichées en français et langue française imposée dans l’administration sans changer celle des membres ; contrôles de langue et de villes réussis.

- [x] Traduire l’onglet « Mes recherches » de /recherche (titres, listes, menus, aria-labels)
- [x] Traduire les toasts de la page recherche (enregistrement, application, erreurs) EN/AR
- [x] Ajouter les clés manquantes au catalogue + corriger « Recherche enregistrée » (EN)
- [x] Vérifier typecheck/build (OK)
- [x] Android : version 1.0.8 publiée sur Google Play, confirmée par l'utilisateur.
- [x] Notifications Android : réception confirmée par l'utilisateur après installation de la version 1.0.8.
- [x] Android : connexion Google réussie après création du client « Nooryaa Play » avec la clé de signature Google Play (confirmé par l'utilisateur le 15/10).
- [ ] iPhone : compte Apple en attente de validation (demandé le 27/09) — relancer l'assistance Apple si rien n'est validé
- [x] iPhone : préparation de la version (icône 1024, entitlements push, numéros de version, workflows Codemagic vérification + App Store)
- [ ] iPhone : à faire après validation du compte — clé API App Store Connect dans Codemagic, puis première archive et téléversement


- [x] Relances email profils incomplets (5 jours) + suppression jour 6
- [x] Admin profils : afficher toutes les infos de la fiche

- [x] Inscription limitée aux champs obligatoires ; informations facultatives conservées dans Mon profil ; image et rappel spam ajoutés ; floutage et selfie confidentiel mis en avant en FR/EN/AR ; écrans vérifiés avec session authentifiée en lecture seule (rôle simulé), sans créer ni modifier de compte ; publication non demandée.
- [x] Recréé le compte de test Apple (apple-review@nooryaa.com / NooryaaReview2026) : email confirmé, fiche complète (Adam Nooryaa, pseudo nooryaa_review, 33 ans, Le Raincy, objectif mariage), connexion vérifiée à l'écran → accueil atteint, 41 profils visibles, aucune erreur. Reste sans photo de profil (un vrai cliché est nécessaire pour passer les contrôles).
- [x] Admin profils : clic sur la photo du membre → affichage en grand (compteur 1/3 → 2/3 → 3/3, flèches et clavier, taille réelle, Échap et Fermer) ; les textes qui changent (compteur, intitulés de boutons) ne sont plus figés par la couche de traduction ; FR/EN/AR contrôlés à l'écran.

- [x] Lien de vérification email : bouton « Ouvrir l'application » (Android) sur la page d'arrivée + scheme nooryaa:// déclaré dans l'appli via configure-android-deeplinks.mjs ; version Android passée à 1.0.14 (17) ; script testé, site sans erreur. Rebuild Codemagic à lancer par l'utilisateur.
- [x] Indicateur de complétion du profil : cercle « Profil complété à X % » dans Mon compte avec accroche, informations manquantes et bouton « Compléter » ; la pastille rose sur l’onglet « Compte » a été retirée à la demande de Karim ; bloc traduit FR/EN/AR et vérifié à l’écran dans les trois langues, compilation OK.
- [x] Démarrage Android toujours sur l'accueil (« Je m'inscris / Je me connecte ») : configure-android-cold-start.mjs ignore la dernière page sauvegardée au lancement à froid ; version Android 1.0.18 (21) dans les deux workflows, 16 tests OK. Rebuild Codemagic à lancer par l'utilisateur.
- [x] Préparer iOS 1.0.2 (21) : version mise à jour dans les deux workflows iPhone (vérification + App Store). Lancer « Nooryaa iPhone (App Store) » dans Codemagic quand le compte Apple le permet.
- [x] Admin profils : coche verte en début de ligne pour les profils vérifiés (photo vérifiée) ; lignes non vérifiées laissées vides ; couleur ajoutée aux thèmes clair et sombre, rendu contrôlé, compilation OK.
