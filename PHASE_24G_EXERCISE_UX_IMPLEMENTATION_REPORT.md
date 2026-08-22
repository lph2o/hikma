# PHASE 24G — EXERCISE UX + LESSONPLAYER EXPERIENCE

STATUS = UX_UI_EXERCISE_COMPLETE

Phase : 24G · Type : UX/UI du LessonPlayer et des exercices · Pédagogie/données inchangées
Date : 2026-08-16

---

## 1. Résumé exécutif

Le LessonPlayer et les exercices ont été affinés **sans changer ce que Hikma enseigne, comment il évalue, ni quelles données il utilise**. Les changements sont purement de présentation :

- le **feedback** utilise désormais la primitive 24C `ExerciseFeedback` (aria-live, couleurs texte AA, copie plus chaleureuse) ;
- corrige un **bug de contraste** (bonne réponse en texte blanc sur fond vert 8 %) ;
- retire un **badge jargon** (« 1 · difficulté ») du header de leçon ;
- supprime le jargon **« moteur »** de la note d'auto-évaluation ;
- harmonise la microcopy (« Vérifier » au lieu de « Valider », feedback sans doublon).

Aucune modification du moteur, du scoring, des générateurs, du séquenceur, de la maîtrise, du SRS, du curriculum, de l'audio, de la session 24E. Aucune migration, aucune écriture DB/Storage.

---

## 2. Audit avant (problèmes trouvés)

| # | Problème | Séverité UX |
|---|---|---|
| 1 | **Contraste** : la bonne réponse d'un QCM utilisait `text-success-foreground` (#ffffff) sur `bg-success/8` → blanc quasi illisible | P1 |
| 2 | **Feedback** : markup ad hoc sans `aria-live`, couleurs texte héritées de `foreground` (pas de distinction AA) | P1 |
| 3 | **Jargon** : badge « 1 · difficulté » (valeur constante, incompréhensible) en compétition avec la progression | P2 |
| 4 | **Jargon** : « … pas notée par le moteur » expose un concept technique | P2 |
| 5 | **Doublon de copie** : feedback incorrect pouvait afficher « La bonne réponse : » deux fois | P3 |
| 6 | **Microcopy** : bouton de rappel « Valider » (moins pédagogique que « Vérifier ») | P3 |

---

## 3. Modifications réalisées

**`components/ui/exercise.tsx`**
- `FEEDBACK_MESSAGES` : `incorrect` → « Pas tout à fait. » ; `ambiguous` → « Tu étais proche. » (suppression du doublon « La bonne réponse : » et de la redondance « vérifie la vocalisation »).

**`components/learn/exercises/options-exercise.tsx`**
- `FeedbackPanel` délègue à la primitive 24C `ExerciseFeedback` (mêmes props publiques `{ result, correctContent }`, donc `lesson-player.tsx` **et** `review-player.tsx` en bénéficient sans changement d'appel).
- `optionVariant` : `text-success-foreground` → `text-success-text` (contraste AA).

**`components/learn/lesson-player.tsx`**
- Header : badge `{difficulty} · difficulté` retiré ; ne restent que « Exercice X sur Y » + barre de progression.
- Note d'auto-évaluation : « À toi de juger — cette étape n'est pas notée. » + mascotte « Bonne réflexion ! ».

**`components/learn/exercises/index.tsx`**
- Bouton de rappel libre : « Valider » → « Vérifier ».

---

## 4. LessonPlayer — structure conservée

La structure 24B est respectée : **HEADER** (quitter + progression) → **CONTENU** (exercice) → **FEEDBACK** → **ACTION** (Continuer). Le CTA principal reste évident, plein largeur sur mobile (`w-full min-h-12 sm:w-auto sm:min-w-48`).

---

## 5. Progression — clarification

Le nombre affiché (`Exercice X sur Y`) est **`exercises.length` = nombre réel d'exercices générés** (mots × types exploitables, typiquement 27–54 pour Al-Fatiha). Il est **techniquement exact**, pas un nombre inventé. Il est présenté en `Caption` discret + barre de pourcentage, sans compte à rebours anxiogène. **Aucun calcul de progression n'a été modifié** (le changement d'unité/formatage relèverait d'une phase dédiée si souhaité).

---

## 6. Exercices

- **QCM** : options `min-h-12` (≥48px), `whitespace-normal`, espacées (`gap-2`), `role=radiogroup/radio` + `aria-checked`, clavier natif. Après sélection : feedback immédiat, bonne réponse mise en évidence en `success-text` (lisible), réponse choisie en `destructive`.
- **Rappel libre** : la réponse attendue n'apparaît **jamais** avant soumission (le champ est seul affiché ; le contenu révélé n'est rendu qu'après `answer != null`). Aucun `PEDAGOGICAL_UX_BUG`.
- **Audio** : l'`AudioPlayer` 24F est intact et secondaire (aucune réécriture).

---

## 7. Feedback

| Issue | Rendu |
|---|---|
| correct | mascotte « Excellent ! » + « Bien joué. » (texte AA vert) |
| incorrect | mascotte « Pas encore, tu vas y arriver » + « Pas tout à fait. » + « La bonne réponse : » + explication |
| ambiguous | mascotte « Presque ! » + « Tu étais proche. » + réponse + explication |

- `role="status"` + `aria-live="polite"` (lecteurs d'écran).
- Icône/texte/couleur combinés (jamais la couleur seule). Contraste AA.

---

## 8. Session persistence (24E) — intacte

`COMMENCER → avancer → quitter → revenir → reprendre` inchangé. Aucune modification de `lesson_sessions` (pas de bug UX découvert). Le dashboard affiche « Reprendre la leçon » quand une session active existe.

---

## 9. Audio (24F) — intact

Aucune réécriture d'`AudioPlayer`. Intégration visuelle dans `AUDIO_TO_WORD` / `WORD_TO_AUDIO` inchangée, secondaire par rapport à la question.

---

## 10. Responsive / RTL / Accessibilité

- **Mobile-first** : aucune largeur fixe problématique, boutons ≥48px, contenu centré, CTA accessible, pas d'overflow horizontal (code).
- **Desktop** : contenu centré avec largeur raisonnable (Card + `max-w-lg` sur l'écran de fin).
- **RTL** : `ArabicText` applique `dir="rtl" lang="ar"` (Amiri) ; l'interface française reste LTR — aucune inversion globale.
- **Accessibilité** : focus visible (ring), clavier, aria-live feedback, contrastes AA sur les couleurs sémantiques, motion `transform/opacity` + `prefers-reduced-motion`.

---

## 11. Tests / build / données

| Vérification | Résultat |
|---|---|
| `npm test` | **293/293** ✅ |
| `npx tsc --noEmit` | 0 erreur ✅ |
| `npm run lint` | clean ✅ |
| `npm run build` | OK ✅ |
| `npm run verify:persistence` | 13/13 ✅ |
| `npm run verify:rls` | 44/44 ✅ |

Données inchangées : quran_words **21 296** · word_occurrences **77 430** · word_audio **21 295** · ayah_audio **0** · lemmas **32** · word_translations FR **25** · word_lemma_mapping **183**. Aucune migration, aucune écriture DB/Storage.

---

## 12. Problèmes non corrigés

### KNOWN_PEDAGOGICAL_ISSUE_001 (HORS PÉRIMÈTRE 24G)

**Description** : le correcteur de rappel libre peut considérer comme incorrecte une réponse sémantiquement correcte mais lexicalement différente.

- Utilisateur : `maitre / souverain`
- Attendu : `souverain / maître`

**Réservé à une phase dédiée** : `SEMANTIC_FREE_RESPONSE_GRADING`. Le futur correcteur devra distinguer : erreur de connaissance, accent manquant, ponctuation, ordre des synonymes, variantes typographiques, réponse partielle, synonymes validés.

**Non corrigé ici** — 24G ne modifie pas le correcteur.

### BROWSER_VALIDATION_PENDING

Aucun navigateur automatisé disponible. Code, tests et structure validés ; le rendu pixel-perfect, le comportement touch/clavier réel et axe-core restent à confirmer (24I/24J).

---

## 13. Recommandations futures

1. **24H (Review UX)** : appliquer les mêmes primitives de feedback à l'écran de révision (déjà bénéficiaire de `FeedbackPanel`, à vérifier visuellement).
2. **24I (Mobile/Responsive)** : validation réelle touch + rendu sur 320/375/390px.
3. **24J (Accessibility)** : passe axe-core complète.
4. **SEMANTIC_FREE_RESPONSE_GRADING** : correcteur sémantique du rappel libre (KNOWN_PEDAGOGICAL_ISSUE_001).

---

## 14. Arrêt

**Arrêt respecté.** 24H / 24I / 24J / 24K / 23G **non démarrées**. Aucun SRS avancé, gamification, 114 sourates, ayah audio, Mujawwad, nouveaux exercices/imports/système lexical.

---

## Livrables

- `PHASE_24G_EXERCISE_UX_IMPLEMENTATION_REPORT.md` (ce rapport)
- `tmp/phase24g-exercise-ux-evidence.json`
- `tmp/phase24g-lessonplayer-flow.json`
- `tmp/phase24g-before-after.json`
