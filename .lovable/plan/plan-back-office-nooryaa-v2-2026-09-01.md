# Plan — Back-office Nooryaa v2

## 1. Comptes admin (connexion via l'interface classique)
- Création des deux comptes : `brahim@nooryaa.com` et `karim@nooryaa.com` (mot de passe `Zittoun33!`, email confirmé), avec le rôle `admin` dans la table des rôles.
- À la connexion sur `/auth`, si le compte est admin → redirection automatique vers `/admin` (au lieu de l'accueil membre). Un bouton « Espace membre » permet de basculer.
- La porte actuelle par mot de passe partagé reste en secours, mais l'accès admin est désormais basé sur le rôle du compte connecté (plus sûr, traçable par personne).
- Toutes les actions admin restent journalisées avec l'identité de l'admin.

## 2. Nouvelles données à créer
- **Formules & tarifs** (`plans`) : identifiant, nom, durée, prix TTC, taux de TVA, quotas inclus (likes/jour, super likes, boosts), actif/inactif, ordre. Alimente à la fois la page « Mon abonnement » côté membre et l'onglet Configurateur côté admin (aujourd'hui les prix sont codés en dur dans la page).
- **Abonnements** (`subscriptions`) : membre, formule, date début/fin, statut (actif, annulé, expiré), montant TTC payé, moyen de paiement. Sert au CA.
- **Consommation** (`user_credits` + `credit_events`) : solde et historique de likes, super likes, boosts par membre ; chaque octroi/retrait admin est historisé.
- **Support** : la table des tickets existe ; ajout du statut étendu (nouveau, en cours, traité, fermé), de la priorité, de l'assignation et d'une table de réponses (historique des échanges admin ↔ membre).
- **Présence** : `last_seen` rafraîchi côté app pour compter les connectés en temps réel (fenêtre 5 min).

## 3. Tableau de bord (indicateurs)
- Compteurs : inscrits, actifs, connectés maintenant (temps réel, rafraîchi automatiquement), nouveaux sur la période.
- Sélecteur de période (jour / semaine / mois / plage libre) appliqué à tous les graphiques.
- Courbe d'inscriptions cumulées et par jour, répartition homme/femme, pyramide des âges, top villes/pays, répartition par critères de la fiche profil (statut marital, pratique religieuse, niveau d'études, enfants, fumeur, corpulence, objectif…).
- Engagement : likes, matchs, messages, taux de réponse, profils vérifiés.

## 4. Onglet Finance
- CA TTC (et HT + TVA) par jour / semaine / mois, par formule, par genre.
- Abonnés actifs par formule, ARPU, taux de conversion gratuit → payant, churn, valeur moyenne, prévisionnel des renouvellements.
- Export CSV de la période.

## 5. Onglet Utilisateurs (enrichi)
- Liste filtrable et triable : genre, âge, ville, statut, formule, date d'inscription, dernière connexion, vérifié.
- Actions : suspendre, réactiver, bannir, supprimer, forcer la vérification, voir la fiche 360.
- Fiche membre : profil complet, photos, abonnement en cours, consommation, tickets, signalements, blocages, conversations.

## 6. Onglet Modération temps réel
- Flux des alertes (mots/tonalité, photos, signalements) rafraîchi en continu, avec pastille de notification.
- Action en un clic : avertir, masquer la photo, suspendre, bannir, classer sans suite. Chaque décision historisée.

## 7. Onglet Support / Tickets
- Liste avec statut (non traité / en cours / traité / fermé), priorité, ancienneté, catégorie.
- Fil de discussion : l'admin répond, le membre voit la réponse dans « Service client ». Historique complet conservé.
- Lien direct ticket ↔ fiche membre ↔ signalement associé.

## 8. Onglet Configurateur
- Édition des formules : nom, prix TTC par durée, TVA, quotas inclus, avantages affichés, mise en avant, activation/désactivation.
- Les changements se répercutent immédiatement sur la page « Mon abonnement ».
- Réglages plateforme : quotas du plan gratuit (likes/jour), rayon par défaut, seuils de modération.

## 9. Onglet Consommation
- Par membre : likes utilisés/restants, super likes, boosts, historique daté.
- Boutons pour créditer ou débiter (geste commercial), avec motif obligatoire et trace dans l'historique.

## 10. Analytics plateforme
- Entonnoir inscription → onboarding complété → photo vérifiée → premier like → premier message → abonnement.
- Rétention J1/J7/J30, activité par heure et par jour, ratio hommes/femmes actifs, temps de réponse moyen aux messages.

## Suggestions complémentaires (incluses)
- Score de risque par membre (signalements + modération + comportement) pour prioriser la modération.
- Détection de doublons/faux profils (téléphone, similarité photos, IP d'inscription).
- Envoi d'un message d'annonce à un segment de membres depuis l'admin.
- Journal d'audit consultable de toutes les actions admin.

## Notes techniques
- Toutes les lectures/écritures admin passent par des fonctions serveur protégées par le rôle admin (jamais depuis le navigateur).
- Nouvelles tables avec RLS stricte : lecture membre limitée à ses propres lignes, accès complet réservé au service admin.
- Aucun paiement réel n'est branché : le CA est calculé sur les abonnements enregistrés ; le branchement Stripe pourra être ajouté ensuite.

## Livraison par étapes
1. Comptes admin + redirection + rôles.
2. Migrations (formules, abonnements, crédits, tickets, présence).
3. Tableau de bord + Utilisateurs enrichis.
4. Finance + Analytics.
5. Support + Modération temps réel.
6. Configurateur + Consommation.
