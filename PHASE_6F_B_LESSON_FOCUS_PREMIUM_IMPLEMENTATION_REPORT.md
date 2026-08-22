# PHASE 6F-B — Lesson Focus Mode & Premium Learning UX

## Statut

`STATUS: UI_UX_6F_B_LESSON_FOCUS_COMPLETE_READY_FOR_APPROVAL`

## 1. Résumé

L’expérience `/learn/[slug]` dispose maintenant d’un véritable focus mode de leçon : le contenu pédagogique devient la surface principale, la navigation mobile devient secondaire, le contexte coranique reste disponible mais fermé par défaut, et la découverte suit immédiatement la progression `Voir → Écouter → Comprendre → Produire → Feedback → Continuer`.

Le moteur métier reste inchangé. Le résultat est prêt pour approbation, avec validation navigateur partielle sur les états authentifiés, microphone et fin complète de leçon.

## 2. État avant / après

Avant : la fiche de leçon affichait métadonnées, objectif et contexte coranique avant la découverte ; la bottom navigation mobile restait présente ; la prononciation guidée se percevait comme un bloc parallèle ; le feedback incorrect répétait parfois la bonne réponse via l’explication.

Après :

- header de focus compact avec sortie, titre et étape ;
- découverte visible immédiatement ;
- mot arabe dominant, translittération secondaire, audio associé ;
- sens masqué jusqu’à `Voir le sens` ;
- contexte secondaire dans une disclosure fermée par défaut ;
- prononciation structurée `Écouter → Observer → Répéter → Comparer` ;
- navigation mobile globale masquée pendant la leçon, sortie conservée ;
- feedback incorrect séparant visuellement `Ta réponse` et `Réponse attendue` ;
- suppression des explications qui répètent une réponse déjà affichée ;
- reset visuel de la révélation, du contexte et de l’audio au changement de mot.

## 3. Fichiers et composants

### Composants créés

- [`components/learn/hikma-lesson-focus.tsx`](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/components/learn/hikma-lesson-focus.tsx)
  - `HikmaLessonFocusHeader`
  - `HikmaContextDisclosure`

### Composants refactorés

- `components/app/app-header.tsx`
- `components/app/app-nav.tsx`
- `app/(app)/learn/[slug]/page.tsx`
- `components/learn/lesson-player.tsx`
- `components/learn/lesson-discovery.tsx`
- `components/learn/exercises/hikma-exercise-shell.tsx`
- `components/learn/exercises/options-exercise.tsx`
- `components/learn/exercises/pronunciation-exercise.tsx`
- `components/ui/exercise.tsx`
- `app/design-system/page.tsx`
- `tests/exercise-state-feedback.test.ts`

### Documentation et artefacts

- [`PHASE_6F_B_BEFORE_STATE.md`](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/PHASE_6F_B_BEFORE_STATE.md)
- [`PHASE_6F_B_AFTER_STATE.md`](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/PHASE_6F_B_AFTER_STATE.md)
- [`docs/plans/2026-08-16-lesson-focus-mode-design.md`](/Users/alpha/Documents/DEV/NEXT-JS-PROJECTS/hikma/docs/plans/2026-08-16-lesson-focus-mode-design.md)
- `docs/ui-ux-skills/hikma-lesson-experience/` mis à jour avec `focus-mode.md`, architecture, audio, feedback et états.
- `tmp/phase6f-b/` contient les matrices responsive, accessibilité, états, composants, navigateur et non-régression.

## 4. Changements UX/UI

### Lesson Focus Mode

Sur les routes de leçon, le header global est remplacé par le header de focus. Sur desktop, la sidebar reste un repère discret. Sur mobile, la bottom navigation est masquée pendant la session pour supprimer la concurrence visuelle ; le bouton de sortie reste accessible dans le header.

### Contexte coranique

Le texte n’a pas été modifié. Il est présenté dans `HikmaContextDisclosure`, fermé par défaut, avec une carte dédiée au texte arabe et une surface distincte pour la traduction française.

### Découverte

Le mot courant est maintenant la première surface pédagogique : arabe Amiri/RTL, translittération, audio, sens volontairement révélé et action suivante. Le bloc de prononciation guidée du premier mot est intégré comme étape de production ; il n’est plus répété sur les mots suivants.

### Audio et prononciation

`AudioPlayer` reste la seule primitive audio. Le libellé guidé devient `Écouter le modèle`. Les étapes visuelles distinguent écoute, observation, répétition et comparaison. Les règles locales, l’absence de STT, l’absence de score acoustique et la confidentialité sont conservées.

### Feedback

Les deux réponses sont désormais des surfaces sémantiques séparées : erreur douce pour `Ta réponse`, succès doux pour `Réponse attendue`. Le texte, l’icône et les labels doublent toujours la couleur. Les explications générées qui répètent exactement la réponse attendue sont masquées côté UI.

## 5. Responsive

Validation réelle effectuée à `390×844` et `1280×720` :

- aucun overflow horizontal observé ;
- header de focus visible ;
- bottom navigation cachée sur mobile leçon ;
- arabe lisible ;
- CTA et audio atteignables ;
- contexte fermé par défaut ;
- sidebar desktop conservée sans concurrencer la colonne pédagogique.

`375×812` et `768×1024` ont été vérifiés par la structure responsive existante et restent à confirmer lors d’une passe navigateur dédiée.

## 6. Accessibilité

- sortie de leçon nommée par `aria-label` ;
- disclosure native utilisable au clavier ;
- `ArabicText` conserve `lang="ar"` et `dir="rtl"` ;
- feedback annoncé par `role="status"` et `aria-live="polite"` ;
- icônes décoratives masquées ;
- cibles tactiles existantes conservées à environ 44 px minimum ;
- information de statut non dépendante de la couleur seule ;
- motion existante compatible avec reduced motion.

Le comportement clavier avancé des groupes radio, la permission microphone et les annonces de réseau restent à tester sur appareil/session dédiée.

## 7. Design System Lab

`/design-system` contient maintenant des références visuelles pour :

- Lesson Focus Mode ;
- header de focus ;
- discovery stage ;
- contexte replié/déplié ;
- audio associé au mot courant ;
- interleaving visuel existant.

## 8. Tests et validation technique

- `npm test` : **411 tests passés**, 32 fichiers.
- Baseline : 410 tests ; 1 test ajouté pour empêcher la duplication de la réponse attendue.
- `npx tsc --noEmit` : **OK**.
- `npm run lint` : **OK**.
- `npm run build` : **OK**, Next.js 16.3.0 / Turbopack.
- Tous les JSON de `tmp/phase6f-b/` sont valides.

## 9. Non-régression métier

- migrations : **0** ;
- données DB modifiées : **0** ;
- moteur pédagogique modifié : **0** ;
- générateurs modifiés : **0** ;
- grading modifié : **0** ;
- scoring modifié : **0** ;
- SRS modifié : **0** ;
- mastery modifiée : **0** ;
- curriculum modifié : **0** ;
- persistance modifiée : **0** ;
- interleaving 6E-B modifié : **0** ;
- backend audio et `word_audio` modifiés : **0** ;
- upload ou stockage audio ajouté : **0**.

## 10. Validation navigateur

`BROWSER_VALIDATION_PARTIAL`

Observé réellement : première leçon, focus header, navigation mobile secondaire, découverte, révélation volontaire, disclosure du contexte, changement de mot, exercice correct, exercice incorrect, feedback séparé et laboratoire design system à `390×844` / `1280×720`.

Non observé : session authentifiée/reprise, permission microphone refusée, lecture audio terminée, réponse libre longue au clavier mobile, fin complète de leçon et révision authentifiée.

## 11. Limitations connues

- Le padding global de l’app shell reste commun aux routes ; il n’altère pas le focus observé mais pourra être rationalisé dans une phase shell dédiée.
- La validation réelle de microphone dépend des permissions du navigateur et n’a pas été simulée.
- La qualité de translittération et les traductions restent des sujets éditoriaux/data distincts ; aucune donnée n’a été modifiée.
- Le mode focus est volontairement visuel : il ne change pas la navigation métier ni les états pédagogiques.

## 12. Prochaine phase

Aucune phase suivante n’est démarrée automatiquement. La prochaine étape potentielle est une validation authentifiée/mobile dédiée, après approbation de 6F-B.
