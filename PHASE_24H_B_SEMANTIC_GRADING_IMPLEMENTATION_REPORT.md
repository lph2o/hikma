# PHASE 24H-B — IMPLÉMENTATION DU GRADING SÉMANTIQUE FR/AR + SAISIE ARABE

STATUS = `SEMANTIC_GRADING_IMPLEMENTED`

---

## 1. Résumé exécutif

Le correcteur de réponse libre (`KNOWN_PEDAGOGICAL_ISSUE_001`) est corrigé. Hikma
mesure désormais la **connaissance**, pas la reproduction exacte d'une chaîne :

- **Français** : l'ordre des synonymes est ignoré (« maitre / souverain » est
  reconnu pour « souverain / maître »), les accents et la casse sont gérés,
  sans jamais accepter un synonyme non validé (« roi » reste incorrect).
- **Arabe** : `مَـٰلِكِ` et `مَالِكِ` sont reconnues comme la même forme
  (dagger alef / wasla → alef, aligné sur la couche données), tout en protégeant
  les homographes (`عَبَدَ ≠ عَبْد`, `دِين ≠ دَيْن`, `ضَالّ ≠ ظِلّ`).
- **Saisie arabe** : un clavier arabe virtuel optionnel + attributs d'input
  (`lang`, `dir`, `autoComplete`, `spellCheck`…) rendent la production arabe
  réellement utilisable sans clavier système arabe.

**Aucune donnée lexicale, aucun curriculum, aucun resolver, aucun SRS, aucune
migration, aucune écriture Storage** n'ont été modifiés. Le verdict est produit
par **une seule fonction** (`gradeFreeResponse`) et consommé tel quel par le
feedback, la progression, la maîtrise et la rétention.

---

## 2. Audit avant modification (confirmé)

| Maillon | Avant | Problème |
|---|---|---|
| `gradeFrenchInput` | inclusion **exacte** de chaîne normalisée dans `glossVariants` | ordre des synonymes non reconnu |
| `stripTashkeel` (grader) | **supprimait** le dagger alef (U+0670), ignorait la wasla (U+0671) | incohérent avec `normalizeWordText` |
| `RecallExercise` | `<input>` nu (pas de `lang`/`dir`/`inputMode`/`spellCheck`, pas d'aide) | production arabe quasi impossible sans clavier arabe |
| `hasTashkeel` | regex `/g` via `.test()` (étatique) | résultats non déterministes |

---

## 3. Architecture : source unique de vérité

```
userAnswer
    ↓
gradeFreeResponse({ language, userInput, expectedAnswer, variants? })
    ↓
{ verdict: CORRECT | INCORRECT | AMBIGUOUS, normalizedInput, normalizedExpected, matchedVariant?, reason? }
    ↓
validateAnswer (engine.ts) → recallResult
    ↓
AnswerResult.correct / .status
    ↓
FeedbackPanel (UI) · appendAttempt → submitLessonResults · submitSkillAttempts
    ↓
feedback · progression · maîtrise · rétention
```

Aucune couche ne recalcule si une réponse est correcte : `result.correct`
alimente `appendAttempt(correct)` (progression agrégée) et `SkillAttempt`
(maîtrise par compétence), et `result.status` pilote le feedback. Un correct
reconnu par variante n'écrit **jamais** `correct=false` et n'incrémente **jamais**
`incorrect_count`. AMBIGUOUS reste **neutre** (réponse révélée, non comptée).

---

## 4. Fichiers modifiés

| Fichier | Changement |
|---|---|
| `lib/exercises/grading.ts` | Réécriture : `gradeFreeResponse`, `gradeFrenchResponse`, `gradeArabicResponse`, `normalizeArabicGrading` ; `stripTashkeel` aligné sur `normalizeWordText` ; `normalizeFrench` canonise les séparateurs ; correction du bug `hasTashkeel` |
| `lib/exercises/engine.ts` | `validateAnswer` utilise `gradeFreeResponse` ; `recallResult` consomme `GradeResult` + note douce pour correct par synonyme |
| `lib/exercises/index.ts` | Exports : `normalizeArabicGrading`, `gradeFreeResponse`, types `GradeLanguage`/`GradeResult` |
| `components/learn/exercises/index.tsx` | `RecallExercise` : attributs d'input (`lang`, `dir`, `inputMode`, `autoComplete`, `autoCorrect`, `autoCapitalize`, `spellCheck`) + clavier arabe intégré |
| `components/learn/exercises/options-exercise.tsx` | `FeedbackPanel` transmet `explanation` dans tous les états |
| `components/ui/exercise.tsx` | `ExerciseFeedback` affiche `explanation` aussi en état correct (note « même sens ») |

## 5. Fichiers créés

| Fichier | Rôle |
|---|---|
| `lib/ui/arabic-input.ts` | helpers **purs** (insertion au curseur, suppression) + jeux de caractères du clavier |
| `components/ui/arabic-keyboard.tsx` | clavier arabe virtuel Hikma (optionnel, accessible) |
| `tests/grading-semantic.test.ts` | 26 tests de grading FR/AR + intégration |
| `tests/arabic-input.test.ts` | 9 tests des helpers de curseur + jeux de caractères |

---

## 6. Fonctions créées / modifiées

**Créées** : `gradeFreeResponse`, `gradeFrenchResponse`, `gradeArabicResponse`,
`normalizeArabicGrading`, `frenchUnits`, `sameUnitSet`, `insertTextAtCursor`,
`backspaceAtCursor`, `ARABIC_KEYBOARD_LETTERS`, `ARABIC_KEYBOARD_DIACRITICS`.

**Modifiées** : `normalizeArabicPresentation`, `stripTashkeel`, `hasTashkeel`,
`normalizeFrench`, `gradeArabicInput`, `gradeFrenchInput`, `validateAnswer`,
`recallResult`.

---

## 7. Comportement avant / après

| Cas | Avant | Après |
|---|---|---|
| « maitre / souverain » vs « souverain / maître » | INCORRECT | **CORRECT** |
| « maître / souverain » vs « souverain / maître » | INCORRECT | **CORRECT** |
| « roi » vs « souverain / maître » | INCORRECT | INCORRECT (protégé) |
| `مَالِكِ` vs `مَـٰلِكِ` | INCORRECT | **CORRECT** |
| `مَلِكِ` vs `مَـٰلِكِ` | INCORRECT | INCORRECT (alef = lettre réelle) |
| `عَبْد` vs `عَبَدَ` | AMBIGUOUS | AMBIGUOUS (protégé) |
| `دَيْن` vs `دِين` | AMBIGUOUS | AMBIGUOUS (protégé) |
| `ظِلّ` vs `ضَالّ` | INCORRECT | INCORRECT (protégé) |

---

## 8. Cas CORRECT / INCORRECT / AMBIGUOUS

- **CORRECT** : équivalence exacte, ordre de synonymes, accents/casse/ponctuation,
  virgule comme séparateur, un seul synonyme validé (réponse partielle), forme
  clavier arabe non vocalisée, variante d'alef (dagger/wasla).
- **INCORRECT** : synonyme non validé (`roi`, `religion`, `serviteur`), faux
  positif typographique (`souvenir`), lexème arabe différent (`مَلِكِ`, `ظِلّ`),
  permutation d'une phrase (« adorons nous »).
- **AMBIGUOUS** : même forme non vocalisée avec vocalisation différente
  (`عَبَدَ`/`عَبْد`, `دِين`/`دَيْن`) — jamais transformé en INCORRECT.

Matrice complète : `tmp/phase24h-grading-test-matrix.json`.

---

## 9. Clavier arabe virtuel

- 36 lettres (couche principale) + diacritiques (couche secondaire : fatha,
  damma, kasra, sukun, shadda, tanwin, dagger alef, wasla).
- Insertion à la position du curseur (sélection remplacée), retour arrière,
  espace, toggle lettres↔voyelles, fermeture (bouton ✕/Fermer + Échap).
- Accessible : `role=group` + `aria-label`, `aria-label` par touche,
  `aria-pressed` sur le toggle, boutons ≥ 44 px, focus visible.
- **Optionnel et non bloquant** : le clavier système et le copier/coller restent
  utilisables.

Détail : `tmp/phase24h-arabic-input-validation.json`.

---

## 10. Tests

**293 → 328** (35 nouveaux). Aucun test existant supprimé ou affaibli.

- `tests/grading-semantic.test.ts` (26) : synonymes FR, phrases, faux positifs,
  dagger alef, wasla, madda, homographes, `gradeFreeResponse`, intégration
  `validateAnswer`/`scoreAnswer` (le correct par variante vaut **1**, pas 0).
- `tests/arabic-input.test.ts` (9) : insertion au curseur, suppression,
  sélection, bornes, jeux de caractères.

---

## 11. Non-régression

| Vérification | Résultat |
|---|---|
| `npm test` | **328/328** |
| `npx tsc --noEmit` | **0 erreur** |
| `npm run lint` | **clean** |
| `npm run build` | **OK** |
| `npm run verify:persistence` | **13/13** |
| `npm run verify:rls` | **44/44** |

---

## 12. Données (immutabilité)

`quran_words` 21 296 · `word_occurrences` 77 430 · `word_audio` 21 295 ·
`ayah_audio` 0 · `lemmas` 32 · `word_translations FR` 25 ·
`word_lemma_mapping` 183 — **inchangés**. 0 migration, 0 écriture Storage,
0 nouveau gloss, 0 modification de traduction/mapping/resolver/curriculum.

---

## 13. Limites restantes

1. **`BROWSER_VALIDATION_PENDING`** — pas de navigateur automatisé : le rendu
   tactile/réel du clavier, la vérification axe-core et le rendu pixel sont à
   confirmer dans une phase dédiée (24I/24J).
2. La politique de réponse **partielle** reste celle en vigueur (un seul
   synonyme validé = CORRECT, via `glossVariants`) — décision pédagogique
   existante, non modifiée.
3. Le clavier virtuel est une **aide**, pas un IME complet : il ne gère pas les
   ligatures contextuelles au-delà du rendu natif du navigateur.

---

## 14. Règle d'arrêt

Phase 24H-B terminée. **ARRÊT** : 24I/24J/24K, 23G, SRS avancé, gamification,
114 sourates, nouveaux imports et nouveaux exercices ne sont **pas** démarrés.
Le propriétaire examine ce rapport avant toute phase suivante.
