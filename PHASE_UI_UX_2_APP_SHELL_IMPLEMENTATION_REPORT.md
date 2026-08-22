# Hikma — Phase UI/UX 2 — App Shell & Navigation

**Statut : `UI_UX_APP_SHELL_COMPLETE_READY_FOR_APPROVAL`**  
**Date : 2026-08-16**  
**Périmètre : shell authentifié, navigation, header contextuel et responsive**

## Résumé

L’App Shell authentifié a été refondu sans modifier les pages métier, les redirections métier ou les systèmes pédagogiques. La navigation desktop et mobile partagent désormais une seule source de vérité enrichie ; le shell possède un header contextuel ; le layout respecte la séparation entre landing publique `/` et accueil applicatif `/dashboard`.

## Protections respectées

- `/` reste une route publique.
- `/dashboard` reste l’accueil applicatif.
- La redirection vers `/onboarding` pour un compte sans réglages est inchangée.
- Aucun changement Supabase, migration, RLS, donnée Quran, grading, SRS, mastery, curriculum, générateur, audio ou phonétique.
- Aucun fichier existant n’a été supprimé ou réinitialisé.

## Cartographie des routes

| Route | Type | Auth | Shell | Navigation | Mobile |
|---|---|---|---|---|---|
| `/` | Landing publique | Non | Public, hors shell | CTA landing | Layout public |
| `/login` | Auth | Non / redirection si connecté | Auth layout | Retour landing | Auth layout |
| `/onboarding` | Onboarding | Session possible | Onboarding layout, hors shell | Lien connexion | Onboarding layout |
| `/dashboard` | App | Oui | Sidebar + header | Accueil actif | Bottom nav |
| `/learn` | App | Oui | Sidebar + header | Apprendre actif | Bottom nav |
| `/learn/[slug]` | Leçon | Oui | Sidebar + header « Leçon » + retour | Apprendre actif | Bottom nav + retour header |
| `/learn/units/[slug]` | Unité | Oui | Sidebar + header « Unité » + retour | Apprendre actif | Bottom nav + retour header |
| `/review` | App | Oui | Sidebar + header | Réviser actif | Bottom nav |
| `/profile` | App | Oui | Sidebar + header | Profil actif | Bottom nav |
| `/mots/[id]` | Fiche mot | Oui | Sidebar + header « Mot étudié » + retour | Apprendre actif | Bottom nav + retour header |
| `/admin` | Administration | Oui selon route existante | Sidebar + header générique | Aucune nouvelle entrée | Bottom nav conservée |
| `/design-system` | Laboratoire interne | Route existante | Hors shell métier | Aucune nouvelle entrée | Responsive autonome |
| `/error`, `/not-found` | États système | Selon contexte | Héritent du layout parent | Retour contextuel futur | Héritent du layout parent |

## Architecture livrée

```text
app/(app)/layout.tsx
├── AppNav
│   ├── sidebar desktop
│   └── bottom navigation mobile
├── AppHeader
└── main content
```

### Source unique de navigation

`lib/navigation.ts` porte maintenant, pour chaque destination :

- `href` ;
- label ;
- icône Lucide ;
- groupe (`principal` ou `compte`).

`AppNav` consomme directement cette configuration pour desktop et mobile. Aucun second tableau d’icônes ou de labels n’a été créé.

## Sidebar desktop

Le nouveau rail desktop :

- reste fixe à gauche à partir de `md` ;
- utilise les surfaces `sidebar`, `surface-subtle` et `surface-interactive` ;
- conserve le logo Hikma cliquable et accessible ;
- groupe les quatre routes réelles sans inventer `/settings` ;
- distingue « Apprendre » et « Ton espace » ;
- utilise un repère actif orange discret et une surface chaude ;
- possède focus visible, hover et `aria-current` ;
- conserve une signature basse discrète : « Un moment à la fois. ».

## Navigation mobile

La bottom navigation est pensée séparément du rail desktop :

- quatre destinations réelles : Accueil, Apprendre, Réviser, Profil ;
- hauteur tactile minimum 44px ;
- labels `text-xs` lisibles ;
- safe-area conservée ;
- surface ivoire avec bord hairline et blur léger ;
- état actif exprimé par surface, texte, icône et `aria-current` ;
- largeur limitée à `max-w-xl` pour éviter une barre trop étirée sur desktop étroit.

## Header contextuel

`components/app/app-header.tsx` fournit un header commun, léger et contextuel :

- `/dashboard` → Accueil ;
- `/learn` → Apprendre ;
- `/review` → Réviser ;
- `/profile` → Profil ;
- `/learn/[slug]` → Apprendre / Leçon + retour vers `/learn` ;
- `/learn/units/[slug]` → Apprendre / Unité + retour vers `/learn` ;
- `/mots/[id]` → Apprendre / Mot étudié + retour vers `/learn`.

Les routes dynamiques affichent volontairement un contexte générique au niveau du shell. Le titre métier précis reste dans la page, afin de ne pas modifier son contrat de données.

## Page container et responsive

Le layout conserve les wrappers métier existants et ajoute :

- `max-w-7xl` pour le header ;
- gutters progressifs `px-5`, `sm:px-8`, `md:px-10` ;
- `pb-24` mobile pour la bottom nav ;
- `pb-10` desktop ;
- header sticky compact de 44px minimum ;
- sidebar desktop en `md` et mobile navigation sous `md`.

Les comportements ciblés sont :

| Largeur | Décision |
|---:|---|
| 360–430px | Une colonne, bottom nav, header compact, cibles tactiles ≥44px |
| 768px | Sidebar activée, contenu toujours central et lisible |
| 1024px | Gutter supérieur, rail fixe, pages métier inchangées |
| 1280px | Header limité à `max-w-7xl`, contenu évite l’étirement inutile |
| 1440px+ | Espace latéral utilisé par le shell, pas par des panneaux décoratifs |

## Fichiers modifiés ou créés

- `lib/navigation.ts` — source de vérité enrichie.
- `components/app/app-nav.tsx` — sidebar et bottom nav partagées.
- `components/app/app-header.tsx` — nouveau header contextuel.
- `app/(app)/layout.tsx` — intégration shell/header uniquement.
- `app/globals.css` — surfaces sidebar alignées sur les tokens Phase 1.

## Accessibilité

- `aria-label` sur les zones de navigation ;
- `aria-current="page"` sur l’item actif ;
- focus visible avec token `focus` ;
- icônes décoratives marquées `aria-hidden` ;
- cibles tactiles ≥44px ;
- libellés présents à côté des icônes ;
- navigation logique conservée en LTR ;
- safe-area mobile conservée.

## Motion

- transitions limitées à `background-color`, `color`, `transform` et `opacity` ;
- easing `--ease-hikma` ;
- aucun déplacement de layout par `top`, `left`, `width` ou `height` animé ;
- aucun changement de page métier ou animation décorative ajoutée.

## Validation

| Vérification | Résultat |
|---|---|
| `npm test` | **397/397 tests passés** |
| `npx tsc --noEmit` | **Réussi** |
| `npm run lint` | **Réussi** |
| `npm run build` | **Réussi** |
| Routes générées | **Toutes les routes existantes conservées** |
| Backend / logique pédagogique | **Non modifiés** |

## Risques et limites

- Le header ne connaît pas encore le titre exact des leçons dynamiques ; la page métier reste la source du titre détaillé.
- La navigation mobile reste visible pendant les leçons jusqu’à la future phase de focus LessonPlayer ; cette phase prépare le shell sans refondre la session pédagogique.
- Une validation visuelle navigateur à 360/390/430/768/1024/1280/1440px est recommandée avant gel définitif.
- `/admin` n’a pas reçu de destination dédiée afin de ne pas introduire de route ou de groupe non demandé.

## Reporté à la Phase 3

- refonte du dashboard ;
- carte « quoi faire maintenant » ;
- métriques, objectifs et historique ;
- hiérarchie interne des pages métier ;
- suppression de la répétition de header dans les pages existantes si nécessaire ;
- mode focus mobile complet pour LessonPlayer.

La Phase 3 n’est pas commencée automatiquement.

**Statut final : `UI_UX_APP_SHELL_COMPLETE_READY_FOR_APPROVAL`**
