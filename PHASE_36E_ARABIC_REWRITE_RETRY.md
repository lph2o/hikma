# PHASE 36E — ARABIC REWRITE RETRY UX

Statut : `PHASE_36E_ARABIC_REWRITE_RETRY_COMPLETE_WITH_BROWSER_LIMITATION`

---

## A. EXECUTIVE SUMMARY

La Phase 36E ajoute un **retry d'écriture arabe** ciblé à la mini-révision de
fin de session, pour les mots ratés sur la compétence `meaning_to_form`
(production de la forme arabe). La mécanique est **purement locale et non
notée** : elle ne modifie ni `validateAnswer`, ni `user_word_progress`, ni le
SRS, ni la mastery, ni le score, ni les sessions, ni les `skillAttempts`.

L'architecture choisie minimise les changements : le composant `MiniReview`
gère désormais deux types d'étapes (retry arabe + auto-évaluation), sélectionnés
par une fonction pure `selectArabicRewriteRetryWords` (plafonnée à 4, déterministe,
dédupliquée).

Validation : `tsc` PASS, `eslint` PASS, **666/666 tests** PASS (+15),
`npm run build` PASS. `BROWSER_VALIDATION_LIMITED`.

---

## B. PROBLÈME UTILISATEUR

Un utilisateur qui **récite** le Coran et **comprend** progressivement le sens,
mais **écrit mal** l'arabe, échouait sur `MEANING_TO_FORM` (écrire la forme
arabe). La mini-révision 36C ne lui proposait qu'une auto-évaluation
(« Je m'en souviens / Pas encore »), sans le faire **réécrire**. La Phase 36E
comble cette lacune : il réécrit, compare, retient.

---

## C. ARCHITECTURE CHOISIE

Option retenue (minimale) :

```
main → miniReview { ArabicRewriteRetry (meaning_to_form ratés) → SelfAssessment (autres ratés) } → finish
```

- **Aucune nouvelle phase** `LessonPlayer` : le composant `MiniReview` reçoit
  deux listes (`arabicWords`, `reviewWords`) et enchaîne les étapes.
- Le payload de fin (`results`, `skillAttempts`) est **gelé** dans
  `pendingFinish.current` avant la mini-révision ; `finish()` le reçoit
  inchangé. La séquence principale reste la seule source de vérité.

---

## D. SÉLECTION DES MOTS

`selectArabicRewriteRetryWords(attempts, max=4)` (`lib/learning/session.ts`) :

- filtre `skill === "meaning_to_form"` **et** `correct === false` ;
- ordre de première rencontre (déterministe) ;
- dédupliqué par `wordId` ;
- plafonné à **4** ;
- exclut les mots corrects et toute erreur hors `meaning_to_form`.

Les **autres** mots incorrects (sens, reconnaissance, audio, contexte, lemme)
restent gérés par `selectMiniReviewWords`, en **excluant** ceux déjà traités par
le retry arabe (`selfIds = selectMiniReviewWords(...).filter(id => !arabicIds.includes(id))`).
Aucun mot n'est présenté deux fois.

---

## E. UX DU RETRY

- **Interstitiel** : « Renforçons ton arabe ✨ — Tu as hésité sur N mots… »
  (ou « Un dernier renforcement » si auto-évaluation coexiste).
- **Étape arabe** : le **sens** est affiché en indice ; le champ `dir="rtl"`
  attend la forme arabe ; bouton **« Réessayer »** (pas « Valider »/« Soumettre »)
  ; bouton **« Passer »** toujours disponible.
- **Réponse masquée avant tentative** : la forme canonique n'est révélée
  **qu'après** la tentative (pas de réponse anticipée).
- **Feedback non punitif** :
  - exact → « Bien joué ✨ — tu viens de le réécrire de mémoire. » ;
  - différent → « Pas encore — c'est justement ce qu'on veut renforcer. La
    forme correcte est : » + forme canonique ;
  - vide → « Pas de souci — voici la forme à retenir : » + forme canonique.
- **Une seule tentative par mot** : pas de boucle ; « Continuer » passe au mot
  suivant, puis à l'auto-évaluation, puis à la fin.

---

## F. ARABIC RTL

- Champ `lang="ar" dir="rtl"`, `inputMode="text"`, `text-2xl` centré, cible
  tactile confortable (`h-14`), focus visible.
- Clavier arabe Hikma (`ArabicKeyboard`) + insertion/backspace au curseur
  (`lib/ui/arabic-input`).
- La forme canonique est affichée via `ArabicText` (Amiri, RTL) — **jamais
  modifiée**, diacritiques conservées telles quelles.

---

## G. FEEDBACK

- La comparaison locale `isArabicRewriteExact(input, expected)` réutilise
  `normalizeArabicGrading` (présentation + variantes d'alef) **en conservant
  les diacritiques** : seule la forme canonique complète déclenche « Bien joué ».
- Cette fonction est **locale au retry** : jamais utilisée par `validateAnswer`,
  jamais une nouvelle règle globale de grading.
- Aucun libellé « Incorrect / Erreur / 0 point / Raté ».

---

## H. ACCESSIBILITÉ

- `aria-label` explicite du champ (« Écris le mot arabe correspondant à … »).
- Focus visible (`focus:ring-2`), `aria-expanded` sur le clavier arabe.
- Boutons « Réessayer » / « Passer » / « Continuer » en `min-h-12`.
- `role="status" aria-live="polite"` déjà présent sur le feedback audio (le
  feedback de réécriture est statique et lisible).
- `prefers-reduced-motion` inchangé.

---

## I. MOBILE

Ciblé `390×844` / `375×812` (statique, `BROWSER_VALIDATION_LIMITED`) :

- cartes pleine largeur `max-w-lg`, champ `max-w-xs` centré, `h-14`, clavier
  arabe sous le champ ;
- le CTA principal « Réessayer » reste au-dessus du pli (le clavier natif peut
  le masquer — à confirmer en navigateur, risque résiduel connu).

---

## J. RECHERCHE EXTERNE

`WEB_RESEARCH_LIMITED`

L'outil de recherche web reste indisponible (Serper vide sur les phases
précédentes). Aucune source fraîche nouvelle n'a pu être citée pour cette
phase. Principes appliqués (rappel actif avant révélation, réécriture plutôt
que QCM, révélation après tentative, non-pénalisation de l'orthographe) issus de
connaissances UX stables, déjà documentés en Phase 36B/36D.

---

## K. TESTS

- `npx tsc --noEmit` → ✅
- `npx eslint` (fichiers modifiés) → ✅
- `npx vitest run` → **666 / 666 tests** (51 fichiers ; **+15** dans
  `tests/lesson-experience.test.ts`)
- `npm run build` → ✅

Nouveaux tests :
- `selectArabicRewriteRetryWords` : aucun, un, quatre, >4 (plafond), exclusion
  hors `meaning_to_form`, exclusion corrects, déduplication, ordre déterministe ;
- `isArabicRewriteExact` : exact / diacritiques manquantes / vide / lexème
  différent ;
- copy retry arabe : accords singulier/pluriel, intro combinée, feedbacks non
  punitifs.

---

## L. NON-RÉGRESSION

Vérifié statiquement — le retry arabe **ne déclenche pas** :

- `validateAnswer` (seule `isArabicRewriteExact` est appelée, localement) ;
- `user_word_progress` / SRS / mastery / scheduler ;
- le score de leçon ;
- aucune nouvelle `lesson_sessions` ;
- aucun `skillAttempt` supplémentaire (le payload de `finish()` est gelé).

Invariants intacts : onboarding (32), progression par sourate (34), active path
(35), `FATIHAH_REFERENCE_LOCKED`, Al-Māʿūn 107 `IN_PREPARATION`, 114 sourates,
90 leçons, 14 parcours, `word_translations = 263`, MASAQ `97 / 170`. Aucune
migration, aucune table, aucun commit.

---

## M. LIMITES

- `BROWSER_VALIDATION_LIMITED` : aucun navigateur contrôlable — saisie arabe
  réelle, clavier natif vs clavier Hikma, RTL, focus, `prefers-reduced-motion`,
  mobile réel non observés.
- `WEB_RESEARCH_LIMITED` (voir §J).

---

## N. DÉCISION FINALE

`PHASE_36E_ARABIC_REWRITE_RETRY_COMPLETE_WITH_BROWSER_LIMITATION`

Tous les critères d'acceptation **hors validation navigateur** sont satisfaits :
retry arabe déclenché sur erreur `meaning_to_form`, plafonné à 4, sans doublon,
sans nouvelle session, sans grading/SRS/mastery/score, skippable, saisie arabe
confortable, feedback non punitif, forme canonique réelle affichée après
tentative, autres erreurs → auto-évaluation, aucun contexte Quran inventé,
`IN_PREPARATION` protégé.
