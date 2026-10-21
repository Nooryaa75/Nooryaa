# Roadmap

- [ ] Corriger l’inscription Android : masquer l’ouverture de l’application en natif, vérifier les champs et empêcher les menus/liens de contourner la fiche obligatoire.

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
