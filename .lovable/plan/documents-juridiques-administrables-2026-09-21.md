# Documents juridiques administrables

## Objectif
Permettre aux administrateurs de modifier et publier les CGU et la politique de confidentialité sans nouvelle version du site ni des applications iOS/Android.

## Mise en œuvre
- Créer un stockage centralisé des documents juridiques avec une version publiée et une date de mise à jour, en français, anglais et arabe.
- Ajouter dans le Configurateur administrateur un éditeur pour chaque document et chaque langue, avec aperçu, enregistrement du brouillon et bouton de publication explicite.
- Alimenter les pages CGU et Confidentialité du site depuis la version publiée, avec repli sur les textes actuels en cas d’indisponibilité.
- Exposer une adresse publique sécurisée en lecture seule, versionnée et sans données personnelles, que les applications iOS et Android peuvent consulter à chaque ouverture des documents.
- Journaliser chaque publication dans l’historique des actions administratives.

## Détails techniques
- Les documents seront enregistrés sous forme de sections structurées, afin de préserver la mise en page et le sens droite-à-gauche en arabe.
- L’adresse mobile renverra les deux documents, les trois langues, leur version et leur date de publication.
- Les droits d’écriture resteront exclusivement côté administration ; la lecture publiée sera publique.

## Vérification
- Vérifier l’enregistrement et la publication depuis le compte administrateur.
- Vérifier que les pages membres affichent immédiatement le contenu publié dans les trois langues.
- Vérifier la réponse destinée aux applications et l’absence d’erreurs de compilation.
