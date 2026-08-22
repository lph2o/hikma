# Hikma — Phase UI/UX 3 — Dashboard Redesign

**Statut : `UI_UX_DASHBOARD_REDESIGN_COMPLETE_READY_FOR_APPROVAL`**  
**Date : 2026-08-16**  
**Périmètre : `/dashboard` uniquement**

## 1. Audit initial

Le dashboard précédent présentait déjà les données utiles, mais dans une séquence trop proche d’un tableau de KPI : reprise, objectif, révision, progression, calendrier, historique puis statistiques étaient six cartes de poids similaire.

Le principal problème était hiérarchique : l’utilisateur devait analyser plusieurs blocs avant de comprendre l’action du jour. La refonte conserve les données et change leur ordre :

1. contexte et salutation ;
2. continuer / commencer ;
3. réviser ;
4. rythme quotidien ;
5. progression du parcours ;
6. résumé et activité ;
7. révisions à venir.

## 2. Données utilisées

| Donnée | Source | Usage UI | Inventée ? |
|---|---|---|---|
| Leçon active | `LearningContext.activeSession` | CTA « Reprendre la leçon » | Non |
| Prochaine leçon | `LearningContext.nextLesson` | CTA « Commencer la leçon » | Non |
| Parcours | `LearningContext.curriculum` | État empty et contexte | Non |
| Leçons terminées / total | `lessonsCompleted`, `totalLessons` | Progression et résumé | Non |
| Mots étudiés | `wordsSeen` | Résumé et état première visite | Non |
| Maîtrise moyenne | `avgMastery` | Résumé secondaire | Non |
| Révisions dues | `reviewDueCount` | CTA et copy de révision | Non |
| Révisions futures | `getUpcomingReviewCounts` | Prochaine échéance et calendrier | Non |
| Rythme du jour | `getDailyGoalProgress` | `GoalRing` et message | Non |
| Activité récente | `getActivityHistory` | Historique 30 jours | Non |

Aucune query, table ou transformation métier nouvelle n’a été ajoutée.

## 3. Architecture visuelle

```text
Contexte / salutation
          ↓
Hero « Continuer » — action primaire unique
          ↓
Réviser                 Ton rythme
          ↓
Ton parcours
          ↓
Résumé personnel        Activité récente
          ↓
Révisions à venir
```

Le Hero utilise une surface `featured` et une ombre chaude `elevated`. Les sections secondaires utilisent des surfaces élevées légères et des bordures hairline. Les statistiques sont regroupées et reléguées après l’action pédagogique.

## 4. États couverts

- **Première visite :** `wordsSeen === 0`, aucune leçon terminée, aucune session active. Copy « Bienvenue dans Hikma » et CTA « Commencer ».
- **Apprenant actif :** `activeSession` est prioritaire sur `nextLesson` et donne « Reprendre la leçon ».
- **Prochaine étape :** `nextLesson` donne le titre et l’unité réels.
- **Révision due :** `reviewDueCount > 0`, nombre réel et CTA « Réviser maintenant ».
- **Jamais étudié :** message spécifique, sans dire « Tout est à jour ».
- **Étudié mais pas dû :** message « Tout est à jour » avec prochaine échéance si disponible.
- **Parcours terminé :** CTA de révision, sans inventer de niveau ou de récompense.
- **Curriculum absent :** empty state pédagogique existant, conservé et recentré.
- **Loading :** nouveau `app/(app)/dashboard/loading.tsx` qui reprend la composition du dashboard.
- **Erreur :** le segment parent garde le mécanisme d’erreur existant ; aucune logique technique n’est exposée dans le dashboard.

## 5. Microcopy

Le ton est calme, direct et non culpabilisant : « Voici le prochain pas le plus utile pour aujourd’hui », « Quelques mots aujourd’hui suffisent pour garder le fil », « Une étape à la fois ». Aucun XP, streak, score, record, badge ou langage infantilisant n’a été ajouté.

## 6. Composants et Design System

- `HikmaProgress` pour la progression humaine du parcours.
- `GoalRing` pour le rythme quotidien réel.
- `UpcomingReviews` et `ActivityHistory` conservés pour les données existantes.
- `Card` avec surfaces `featured`, `elevated` et `subtle` issues des tokens Phase 1.
- `Button` avec un seul CTA primaire dans le Hero.
- `Mascot` non utilisée dans l’état apprenant actif ; réservée à l’état anonyme/empty.
- `ArrowRightIcon`, `BookOpenIcon` et `RefreshCcwIcon` comme renforts sémantiques, pas comme décoration.

## 7. Responsive

- 360–430px : colonne unique, Hero et CTA pleine largeur, sections empilées.
- 768px : les actions secondaires peuvent respirer sans changer leur priorité.
- 1024px+ : grilles secondaires, contenu limité à `max-w-5xl`.
- 1280px et plus : l’espace supplémentaire reste éditorial et ne devient pas une grille de KPI.
- La bottom nav de l’App Shell est respectée via `pb-24`.

## 8. Accessibilité

- Un seul H1 dans le dashboard.
- Sections nommées avec `aria-labelledby` ou `aria-label`.
- `HikmaProgress` fournit un libellé humain et une valeur accessible.
- Les états de révision ne dépendent pas de la couleur seule.
- Les boutons héritent des cibles ≥44px et du focus visible Phase 1.
- Les icônes sont marquées `aria-hidden` lorsqu’elles accompagnent un texte.
- L’ordre DOM suit l’ordre pédagogique et clavier.

## 9. Performance

- Dashboard toujours server-rendered et `dynamic = "force-dynamic"`.
- Les trois lectures utilisateur indépendantes sont regroupées avec `Promise.all`.
- Aucun composant client lourd, aucune image nouvelle, aucune query supplémentaire.
- Le calcul des états utilise directement les données déjà chargées.

## 10. Skill

Le nouveau skill est documenté dans `docs/ui-ux-skills/hikma-dashboard/README.md` et référencé dans `docs/ui-ux-skills/README.md`. Il précise données autorisées, hiérarchie, états, responsive, accessibilité, anti-patterns et critères d’acceptation.

## 11. Validation technique

| Vérification | Résultat |
|---|---|
| `npm test` | **397/397 tests passés** |
| `npx tsc --noEmit` | **Réussi** |
| `npm run lint` | **Réussi** |
| `npm run build` | **Réussi** |
| Backend / Supabase / migrations | **Non modifiés** |
| SRS / mastery / grading / curriculum | **Non modifiés** |

## 12. Validation navigateur

`BROWSER_VALIDATION_PENDING`

Les validations disponibles dans cette session sont la compilation, le typecheck, le lint et les tests automatisés. Une revue navigateur réelle aux largeurs 360, 390, 430, 768, 1024, 1280 et 1440px reste à effectuer avant gel visuel définitif.

## 13. Limites et risques

- Les états runtime réels dépendent des données Supabase et n’ont pas été simulés artificiellement.
- La copy de la prochaine révision utilise la première date réellement retournée par `getUpcomingReviewCounts`.
- Le dashboard ne présente pas encore les compétences détaillées ; cela relève des phases parcours/profil.
- Le mécanisme d’erreur reste celui du segment parent pour ne pas dupliquer la logique applicative.
- Les pages `/learn`, `/review`, `/profile`, `/onboarding` et `/mots/[id]` n’ont pas été refondues.

## 14. Fichiers concernés

- `app/(app)/dashboard/page.tsx`
- `app/(app)/dashboard/loading.tsx`
- `app/design-system/page.tsx` — ajout de la section Dashboard de référence
- `docs/ui-ux-skills/README.md`
- `docs/ui-ux-skills/hikma-dashboard/README.md`

**Phase 4 non commencée automatiquement.**

**Statut final : `UI_UX_DASHBOARD_REDESIGN_COMPLETE_READY_FOR_APPROVAL`**
