
## Plan — Nooryaa v2

### 1. Renommage Nikah → Nooryaa
- `AppHeader`, `index.tsx` (landing), `auth.tsx`, balises `<title>` / meta description / OG.

### 2. Nouveaux champs profil
Migration ajoutant à `profiles` :
- `phone TEXT UNIQUE NOT NULL` (vérifié côté inscription)
- `profession TEXT`
- `country_origin TEXT` (pays d'origine, distinct de `country` actuel = pays de résidence)
- `religion TEXT` (par défaut "Islam", éditable — sunnite/chiite/etc.)
- `activities TEXT` (loisirs / centres d'intérêt)
- `education_level TEXT` (enum: aucun, secondaire, bac, bac+2, bac+3, bac+5, doctorat)
- `objective TEXT` (objectif sur le site : mariage rapide, connaissance, etc.)
- `status TEXT DEFAULT 'active'` (active | suspended | banned) — pour modération
- `email` déjà unique côté `auth.users` — ajout d'un index UNIQUE sur `profiles.email` pour double sécurité

Onboarding et page `/me` mis à jour avec tous ces champs (formulaire complet, validation Zod).

### 3. Inscription
- `auth.tsx` : ajout champ téléphone (format E.164 simple regex `+\d{8,15}`), validation côté client + erreur serveur claire si email/téléphone déjà utilisés.
- Trigger `handle_new_user` mis à jour pour recevoir le téléphone via `raw_user_meta_data`.

### 4. Messagerie directe (plus de prérequis "like mutuel")
- Politique RLS `messages` : autoriser envoi vers tout profil **non bloqué** et **non banni**, peu importe le like.
- Bouton "Ajouter en coup de cœur" + "Envoyer un message" visibles directement sur chaque carte/profil.
- Au clic sur "Message", création automatique du like (coup de cœur) puis redirection vers le thread.

### 5. Blocage
Nouvelle table `blocks (blocker uuid, blocked uuid, created_at)` + RLS (chacun gère ses blocages).
- Filtrage automatique : un profil bloqué n'apparaît plus dans `/browse`, ne peut plus envoyer de message, et le bloqueur disparaît aussi de ses recherches.
- Helper SQL `is_blocked_between(a, b)`.
- Bouton "Bloquer / Débloquer" sur la fiche profil ; page `/me/blocked` listant les blocages.

### 6. Signalement
Déjà en place — j'ajoute une raison structurée (enum: contenu_inapproprie, faux_profil, harcelement, autre) et expose dans l'admin.

### 7. Espace administration `/admin` (mdp partagé = 2325)
- Gate par cookie de session chiffré (`useSession` côté serveur, `SESSION_SECRET` généré). Mot de passe `2325` comparé en `timingSafeEqual` dans un `createServerFn`. Aucun lien public visible — accès direct par URL `/admin`.
- Page `/admin/login` : formulaire simple, redirige vers `/admin` si OK.
- `/admin` (dashboard) : stats (nb profils, profils actifs aujourd'hui, signalements ouverts, blocages).
- `/admin/profiles` : liste paginée + recherche par pseudo/email/téléphone. Filtre statut. Actions : voir fiche complète, suspendre, bannir, réactiver, supprimer (cascade), forcer changement de pseudo.
- `/admin/profiles/$id` : fiche complète (toutes les infos + photos + historique likes + historique messages + signalements reçus + blocages). C'est le « suivi de chaque profil » demandé.
- `/admin/reports` : liste des signalements, statut (ouvert / traité / rejeté), action en un clic (suspendre le profil signalé).
- `/admin/messages` : navigation des conversations entre deux pseudos (pour modération de harcèlement).
- Toutes les opérations passent par `createServerFn` qui vérifient le cookie admin puis utilisent `supabaseAdmin` (service role) — RLS contourné légitimement côté admin.

### 8. Badge « 100% gratuit »
- Bandeau sur landing + header + page d'inscription : « Inscription et messagerie 100 % gratuites ».

### 9. Correctif technique
- Erreur d'hydratation actuelle sur `/` : retirer la div parente directe du `<Suspense>` ou utiliser `<ClientOnly>` autour du bloc problématique. À diagnostiquer rapidement en début d'implémentation.

### 10. Sécurité
- `SESSION_SECRET` généré via `generate_secret` (64 chars).
- Le mot de passe admin `2325` est lu depuis un secret `ADMIN_PASSWORD` (stocké via `set_secret` à la valeur `2325`) plutôt que codé en dur, pour que tu puisses le changer plus tard sans redéploiement.
- Toutes les actions admin loguées dans une table `admin_actions (action, target_user, details, created_at)`.

### Détails techniques
- Stack inchangée : TanStack Start + Lovable Cloud + RLS.
- Migrations en deux temps : (1) ajout colonnes + tables + grants + RLS ; (2) trigger `handle_new_user` mis à jour.
- Pas de changement de design système (palette sauge/crème/or conservée).
- Realtime messagerie conservé.

### Hors scope (à confirmer si tu veux les ajouter ensuite)
- Vérification téléphone par SMS (Twilio) — pour l'instant le téléphone est juste stocké et unique.
- Système de Wali / tuteur.
- Notifications email.
