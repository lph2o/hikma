# PHASE 6F-C — Premium pedagogical feedback implementation report

**Statut : `UI_UX_6F_C_PEDAGOGICAL_FEEDBACK_COMPLETE_READY_FOR_APPROVAL`**

## Résumé

Le feedback Hikma dispose maintenant d’une divulgation pédagogique optionnelle,
fermée par défaut, avec séparation claire des réponses, contenu arabe RTL et
microcopy islamique contextuelle. Les réussites ordinaires restent neutres ;
`Mā shā’ Allāh` est réservé aux réussites difficiles ou aux jalons.

## Fichiers créés

- `components/ui/hikma-explanation.tsx`
- `components/learn/exercises/pedagogical-feedback.ts`
- `docs/plans/2026-08-16-phase-6f-c-pedagogical-feedback-design.md`
- `docs/ui-ux-skills/hikma-lesson-experience/pedagogical-feedback.md`
- `PHASE_6F_C_PEDAGOGICAL_FEEDBACK_IMPLEMENTATION_REPORT.md`

## Fichiers mis à jour

- `components/ui/exercise.tsx`
- `components/learn/exercises/options-exercise.tsx`
- `components/learn/lesson-player.tsx`
- `components/learn/review-player.tsx`
- `app/design-system/page.tsx`
- `tests/exercise-state-feedback.test.ts`
- `docs/ui-ux-skills/hikma-lesson-experience/README.md`
- `docs/ui-ux-skills/hikma-lesson-experience/feedback-patterns.md`
- `docs/ui-ux-skills/hikma-lesson-experience/accessibility.md`

## Architecture UI

```text
LessonPlayer / ReviewPlayer
  → FeedbackPanel
      → pedagogical-feedback adapter
          → ExerciseFeedback
              → HikmaExplanation
```

`AnswerResult` reste inchangé. `HikmaExplanation` ne connaît pas le grading et
reçoit uniquement un contrat de présentation avec `verified`, `partial` ou
`unavailable`.

## Fonctionnalités

- `À revoir` → `Ta réponse` → `Réponse attendue` → `Comprendre pourquoi` ;
- disclosure fermée par défaut avec `aria-expanded` et `aria-controls` ;
- explication ouverte dans une région nommée ;
- réponses arabes rendues avec `ArabicText`, RTL et diacritiques conservées ;
- explication phonétique exclusivement dérivée de `phonetics.ts` ;
- relation de famille lexicale affichée uniquement si le lemme est disponible ;
- absence d’analyse morphologique inventée ;
- suppression de la répétition de la réponse attendue ;
- état indisponible documenté dans le laboratoire ;
- design lab couvrant correct, incorrect, explication ouverte/fermée,
  indisponible et langage islamique contextuel.

## Règles de microcopy islamique

- réussite ordinaire : `Très bien` / `Réponse juste` ;
- réussite difficile ou jalon : `Mā shā’ Allāh` ;
- entrée réelle de leçon : `Bismillāh` ;
- fin réelle de leçon : `Al-ḥamdulillāh` ;
- aucune expression religieuse ajoutée mécaniquement après chaque réponse ;
- aucune gamification religieuse, aucun score ou badge spirituel.

## Données disponibles et DATA_GAP

Disponibles : sens, réponse attendue, forme arabe, translittération, phonétique
dérivée et relation de lemme vérifiée.

`DATA_GAP` maintenu : racine, schème, préfixe, suffixe, genre, nombre,
personne, temps, cas, fonction grammaticale, segmentation morphologique et
diagnostic automatique de prononciation. Aucun de ces éléments n’a été inventé
ou ajouté au moteur.

## Tests

Tests ajoutés pour :

- disclosure ouverte avec attributs ARIA ;
- fallback indisponible sans analyse inventée ;
- séparation et anti-duplication existantes ;
- copie ordinaire versus réussite significative ;
- dérivation phonétique vérifiée ;
- détection `ordinary / difficult_success / milestone`.

Résultat : **416 tests passés dans 32 fichiers**.

Validations techniques :

- `npm test` : OK ;
- `npx tsc --noEmit` : OK ;
- `npm run lint` : OK après suppression d’un warning inutilisé ;
- `npm run build` : OK avec Next.js 16.3.0 / Turbopack.

## Validation navigateur

`BROWSER_VALIDATION_COMPLETE` sur `/design-system` :

- 390×844 : section de feedback présente, disclosure ouverte, texte
  pédagogique visible, états islamiques visibles ;
- 1280×720 : section présente, largeur globale sans overflow ;
- `aria-expanded` passe de `false` à `true` ;
- aucune donnée arabe n’est normalisée ou simplifiée.

À 390 px, le navigateur rapporte un dépassement global résiduel d’un pixel
sur la page laboratoire, sans élément visuellement débordant. Ce point est
limité au laboratoire existant et ne touche pas la carte de feedback elle-même.
Les parcours authentifiés, les réponses réelles et la fin de leçon n’ont pas
été simulés sans session dédiée.

## Non-régression

Inchangés : `AnswerResult`, grading, score, générateurs, SRS, mastery,
scheduler, interleaving, curriculum, persistance, Supabase, migrations,
données Quran, backend audio et contrats de complétion.

**UI_UX_6F_C_PEDAGOGICAL_FEEDBACK_COMPLETE_READY_FOR_APPROVAL**
