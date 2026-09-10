# Harmoniser les notifications Nooryaa

## Objectif
Appliquer la charte Nooryaa à tous les messages temporaires affichés en haut du site.

## Modifications
- Retirer les styles génériques qui écrasent actuellement les couleurs propres à chaque type de message.
- Utiliser l’indigo, le magenta et la lavande Nooryaa pour les confirmations, informations et avertissements.
- Conserver le rouge uniquement pour les erreurs et alertes importantes.
- Vérifier le rendu en mode clair et sombre, puis contrôler que le site compile correctement.

## Détails techniques
- Centraliser le comportement dans le composant global des notifications et les variables de couleurs globales.
- La modification s’appliquera automatiquement à tous les messages existants, sans changer chaque page séparément.
