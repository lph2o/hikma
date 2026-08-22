# Hikma — Phase UI/UX 4 — Learning Path / Parcours

**Statut : `UI_UX_LEARNING_PATH_COMPLETE_READY_FOR_APPROVAL`**  
**Date : 2026-08-16**  
**Périmètre : `/learn` et sa représentation du curriculum**

## 1. Audit initial

`/learn` affichait déjà le curriculum réel, les unités, les leçons, les statuts dérivés et une progression mot-à-mot. La faiblesse était principalement visuelle : succession de cartes homogènes, leçon active peu dominante, verrou peu explicatif et sensation de catalogue plutôt que de chemin.

La route `/learn/[slug]` n’a pas été modifiée : cette page reste réservée à la phase leçon dédiée.

## 2. Cartographie des données

| Information | Source réelle | Query / calcul | Fiabilité | UI Phase 4 |
|---|---|---|---|---|
| Curriculum | `LearningContext.curriculum` | `getCurriculum` | Réel, publié | Titre, unités, empty |
| Unités / leçons | `curriculum.units[].lessons[]` | curriculum ordonné | Réel | Sections et timeline |
| Statut | `lessonStatuses` | `computeLessonStatuses` | Déterministe | `HikmaLessonCard` |
| Mots d’une leçon | `lessonWordMap` | `getLessonWordMap` | Réel | Calcul de progression |
| Progression mot | `progressByWord` | `getUserWordProgress` | Réel | Progression de carte |
| Leçon active | `activeSession` | `getActiveLessonSession` | Réel | Reprise / « Tu es ici » |
| Prochaine leçon | `nextLesson` | premier statut `IN_PROGRESS` ou `AVAILABLE` | Réel | Prochaine étape |
| Progression globale | `lessonsCompleted`, `totalLessons` | contexte | Réel | Hero parcours |
| Révision | `reviewDueCount` | `getReviewDueCount` | Réel | Lien secondaire vers `/review` |
| Prérequis détaillé | Non exposé séparément | `computeLessonStatuses` séquentiel | **DATA_GAP** | Copy générique fidèle : leçon précédente |
| Date de complétion | Non disponible dans le contexte | — | **DATA_GAP** | Non affichée |

Aucune donnée fictive, query, table ou règle de statut n’a été ajoutée.

## 3. Architecture livrée

```text
Nom du parcours + intention
          ↓
Progression globale + prochaine étape
          ↓
Unités comme repères
          ↓
Timeline des leçons
  terminé → actuel → disponible → verrouillé
```

La page conserve les unités réelles et ajoute une continuité visuelle par repères verticaux sur desktop. Sur mobile, les cartes restent une colonne lisible sans forcer une timeline étroite.

## 4. `HikmaLessonCard`

Nouveau composant : `components/learn/hikma-lesson-card.tsx`.

### États supportés

- `AVAILABLE` : icône discrète, copy de préparation, CTA « Commencer ».
- `IN_PROGRESS` : surface featured, repère « Tu es ici », progression réelle, CTA « Reprendre ».
- `COMPLETED` : coche, état secondaire et CTA « Revoir ».
- `MASTERED` : état de maîtrise uniquement si le moteur le fournit réellement.
- `LOCKED` : carte non interactive, cadenas sémantique et explication « Termine la leçon précédente pour continuer ».

Une leçon terminée n’est jamais transformée automatiquement en leçon maîtrisée.

## 5. Décisions UX

- La première visite est dérivée de `wordsSeen === 0`, aucune leçon terminée et aucune session active.
- `activeSession` reste prioritaire sur `nextLesson`.
- La progression du parcours utilise les leçons réellement terminées.
- La progression d’une leçon utilise la moyenne de maîtrise déjà calculée dans `progressByWord` via la primitive de carte.
- La révision est signalée comme une action secondaire et renvoie vers `/review` ; aucun SRS n’est recalculé.
- Le curriculum invalide affiche un avertissement non technique sans mutation.

## 6. Responsive et accessibilité

- 360–430px : une colonne, cartes espacées, contenu court et CTA dans la carte.
- 768px+ : timeline et repères visuels, unités clairement séparées.
- Focus visible sur les cartes disponibles ; cartes verrouillées non focusables.
- `aria-disabled` et iconographie sémantique pour les cartes verrouillées.
- Progressions accompagnées d’un label humain et d’un détail textuel.
- Un H1, des sections nommées et des titres d’unités continus.
- Couleurs warm et variantes de texte AA issues du Design System V2.

## 7. Laboratoire et skill

La page `/design-system` contient une section Learning Path avec les états terminé, actuel et verrouillé.

Le skill dédié est documenté dans :

- `docs/ui-ux-skills/hikma-learning-path/README.md`
- `docs/ui-ux-skills/README.md`

Il précise données autorisées, statuts, responsive, accessibilité, anti-patterns et critères d’acceptation.

## 8. Validation technique

| Vérification | Résultat |
|---|---|
| `npm test` | **397/397 tests passés** |
| `npx tsc --noEmit` | **Réussi** |
| `npm run lint` | **Réussi** |
| `npm run build` | **Réussi** |
| `/learn/[slug]` modifiée | **Non** |
| Backend / Supabase / SRS / mastery / grading | **Non modifiés** |

## 9. Validation navigateur

`BROWSER_VALIDATION_PENDING`

Une validation navigateur réelle aux largeurs 360, 390, 430, 768, 1024, 1280 et 1440px reste à effectuer avant gel visuel définitif.

## 10. Risques et éléments reportés

- Les prérequis détaillés ne sont pas une donnée séparée ; l’interface reste volontairement générique sur le verrou.
- Les dates de complétion ne sont pas affichées car absentes du contexte fiable.
- La page de leçon, découverte et exercices ne sont pas refondus ici.
- Aucun nouveau niveau de curriculum ou système de gamification n’a été ajouté.

**Phase 5 non commencée automatiquement.**

**Statut final : `UI_UX_LEARNING_PATH_COMPLETE_READY_FOR_APPROVAL`**
