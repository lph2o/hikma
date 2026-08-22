# PHASE 6F-D — Premium lesson polish & visual hierarchy

**Status: `UI_UX_6F_D_PREMIUM_LESSON_POLISH_COMPLETE_READY_FOR_APPROVAL`**  
**Next phase: `NOT_STARTED`**

## A. Avant

L’état initial est documenté dans
[PHASE_6F_D_BEFORE_STATE.md](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/PHASE_6F_D_BEFORE_STATE.md).
La fondation était solide, mais le mot courant et la prononciation guidée
étaient rendus comme deux blocs successifs, le premier mot pouvait présenter
deux accès audio au même modèle, et le contexte coranique pouvait mieux
séparer arabe, traduction et référence.

## B. Après

- le mot courant est devenu la scène visuelle principale de la découverte ;
- la prononciation guidée est intégrée dans cette scène au lieu d’être une
  carte concurrente ;
- le premier mot n’affiche plus deux lecteurs pour le même audio ;
- les mots suivants conservent leur lecteur compact `Écouter le mot` ;
- les étapes de prononciation sont plus lisibles : `Écoute`, `Observe`,
  `Répète`, `Compare` ;
- l’indisponibilité audio est exprimée calmement et permet de continuer ;
- le contexte ouvert distingue `Verset étudié`, texte arabe, traduction
  française et référence ;
- le laboratoire contient une section `Premium Lesson Experience` avec mot
  courant, audio, étapes guidées, arabe vocalisé, traduction et référence ;
- les espaces utilisent les tokens et des séparations plus respirantes sans
  modifier la logique de session.

## C. Composants modifiés

- `components/learn/lesson-discovery.tsx`
- `components/learn/hikma-lesson-focus.tsx`
- `components/learn/exercises/pronunciation-exercise.tsx`
- `components/ui/audio-player.tsx`
- `app/design-system/page.tsx`

## D. Composants créés

Aucune nouvelle primitive n’a été créée. Les composants existants ont été
composés : `ArabicText`, `AudioPlayer`, `HikmaReveal`,
`HikmaContextDisclosure`, `PronunciationGuided`, `Card` et les primitives de
typographie.

## E. Design System

La section `Premium Lesson Experience` couvre :

- current word ;
- arabe vocalisé avec `ٱلرَّحْمَـٰنِ` ;
- translittération secondaire ;
- sens discret ;
- audio compact ;
- progression de prononciation ;
- carte arabe du verset ;
- carte traduction ;
- référence secondaire.

Les couleurs, borders, radius, surfaces et animations existants sont
conservés. Aucune décoration religieuse, gamification ou couleur arbitraire
n’a été ajoutée.

## F. Skill et documentation

Mises à jour :

- `docs/ui-ux-skills/hikma-lesson-experience/focus-mode.md`
- `docs/ui-ux-skills/hikma-lesson-experience/audio-patterns.md`
- `docs/ui-ux-skills/hikma-lesson-experience/README.md`

La documentation précise la composition du mot courant, la non-duplication de
l’audio, la hiérarchie arabe/translittération/sens et la séparation du contexte.

## G. Responsive

Validation réelle :

- `390×844` : largeur `390`, scroll width `390`, aucun overflow horizontal ;
- `1280×720` : largeur `1280`, scroll width `1280` ;
- mot courant, prononciation guidée et contexte restent dans la colonne de
  lecture ;
- référence et traduction ne prennent pas le même poids visuel que l’arabe.

## H. Accessibilité

- boutons audio conservés avec leurs `aria-label` pédagogiques ;
- sortie de leçon conservée ;
- contexte natif utilisable au clavier via `summary` ;
- états audio annoncés par texte et `role="status"` existant ;
- aucune information ne dépend uniquement de la couleur ;
- cibles tactiles existantes conservées à au moins 44 px ;
- reduced motion existant conservé.

## I. RTL / arabe

- aucun texte Quran n’a été modifié ou normalisé ;
- `ArabicText` reste utilisé pour les mots et versets ;
- diacritiques observées dans le laboratoire et la leçon réelle ;
- `بِسْمِ`, `مَـٰلِكِ` et `ٱلرَّحْمَـٰنِ` restent intacts ;
- arabe, translittération et français restent isolés selon leur direction.

## J. Audio / microphone

`AudioPlayer` reste l’unique lecteur et son contrat d’états ne change pas.
L’audio du premier mot est porté par la prononciation guidée lorsqu’elle est
présente, afin d’éviter une duplication. Les états micro, permission refusée,
aucun signal et enregistrement local restent ceux de `PronunciationGuided`.

Validation réelle du microphone : non effectuée dans cette passe, faute de
permission dédiée. Aucun STT, score acoustique ou verdict automatique n’a été
ajouté.

## K. Tests

Tests ajoutés dans `tests/lesson-polish.test.ts` pour :

- composition du mot courant et de la prononciation guidée ;
- absence de double audio ;
- séparation verset/traduction/référence ;
- préservation de l’arabe vocalisé.

Résultat final : **418 tests passés dans 33 fichiers**.

Commandes validées :

- `npm test` : OK ;
- `npx tsc --noEmit` : OK ;
- `npm run lint` : OK ;
- `npm run build` : OK avec Next.js 16.3.0 / Turbopack.

## L. Validation navigateur

`BROWSER_VALIDATION_PARTIAL`

Observé réellement :

- `/learn/basmala` à `390×844` ;
- `/learn/basmala` à `1280×720` ;
- mot courant et prononciation guidée intégrés ;
- un seul `Écouter le modèle` pour le premier mot ;
- contexte ouvert avec `Verset étudié`, traduction française et références
  réelles ;
- `/design-system` avec `Premium Lesson Experience` et arabe vocalisé ;
- aucun overflow horizontal sur les surfaces observées.

Non observé :

- permission microphone acceptée ou refusée ;
- lecture audio terminée avec un fichier audio réel ;
- réponse authentifiée correcte/incorrecte dans une leçon complète ;
- fin réelle de leçon et navigation de reprise.

## M. Non-régression

Confirmé inchangé :

```text
backend = inchangé
DB = inchangée
migrations = 0
grading = inchangé
scoring = inchangé
SRS = inchangé
mastery = inchangée
scheduler = inchangé
interleaving = inchangé
curriculum = inchangé
générateurs = inchangés
persistance = inchangée
Supabase = inchangé
audio backend = inchangé
données Quran = inchangées
```

## N. Problèmes résiduels

- La validation microphone/audio réel nécessite une session et des permissions
  dédiées.
- La page laboratoire reste longue par nature ; sa longueur n’est pas
  représentative de la surface de leçon.
- Les scénarios authentifiés et la fin complète de leçon restent à confirmer
  dans une passe navigateur dédiée.

## O. Décision finale

Aucune phase ultérieure n’a été démarrée. La Phase 6F-D est prête pour
approbation.

`UI_UX_6F_D_PREMIUM_LESSON_POLISH_COMPLETE_READY_FOR_APPROVAL`

`NEXT_PHASE: NOT_STARTED`
