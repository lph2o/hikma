# PHASE 24H-A — AUDIT DU GRADING SÉMANTIQUE DE RÉPONSE LIBRE + SAISIE ARABE

STATUS = AUDIT_COMPLETE_READY_FOR_APPROVAL

Phase : 24H-A (Étape A) · Type : **READ_ONLY** (aucune écriture)
Date : 2026-08-16

> **Règle respectée** : aucune donnée coranique, aucun resolver, aucun curriculum, aucun SRS, aucun audio, aucune structure pédagogique modifiés. Aucune implémentation (Étape B) effectuée.

---

## 1. Problème corrigé par cette phase (diagnostic)

`KNOWN_PEDAGOGICAL_ISSUE_001` : l'utilisateur qui répond **« maitre / souverain »** à la question attendue **« souverain / maître »** est marqué **INCORRECT**, alors que sa connaissance est correcte. Il est pénalisé pour l'**ordre des synonymes** et l'**accent circonflexe** — pas pour une erreur de connaissance.

---

## 2. Cartographie réelle de la chaîne (question → maîtrise)

| Étape | Fichier |
|---|---|
| Question | `lib/exercises/generators/recall.ts` (`FORM_TO_MEANING` / `MEANING_TO_FORM`) |
| Input | `components/learn/exercises/index.tsx` → `RecallExercise` (un `<input>`) |
| Normaliseur | `lib/exercises/grading.ts` (`normalizeFrench` / `normalizeArabicPresentation` / `stripTashkeel`) |
| Grader | `lib/exercises/grading.ts` (`gradeFrenchInput` / `gradeArabicInput`) |
| Verdict | `lib/exercises/engine.ts` → `validateAnswer` → `recallResult` |
| Feedback | `components/ui/exercise.tsx` → `ExerciseFeedback` (via `FeedbackPanel`) |
| Skill attempt | `components/learn/lesson-player.tsx` → `continueNext` (`result.correct`) |
| Maîtrise | `lib/learning/actions.ts` → `submitSkillAttempts` (`user_word_skill_progress`) + `submitLessonResults` (`user_word_progress` + `review_items`) |

---

## 3. Comment le grader compare aujourd'hui

### 3.1 Français — **trop strict**
`gradeFrenchInput` : `normalizeFrench` (lowercase, NFD/strip accents, apostrophes, ponctuation, espaces) puis **inclusion exacte** dans la liste acceptée. La glose « souverain / maître » est comparée comme **chaîne ordonnée unique** → « maitre / souverain » n'est pas reconnu.

### 3.2 Arabe — **incohérence de normalisation**
`stripTashkeel` **supprime** le dagger alef (`0670`) et ne **mappe pas** la wasla (`0671`), alors que la couche données `normalizeWordText` mappe les deux vers l'alef (`0627`). Résultat : `مَـٰلِكِ` vs `مَالِكِ` → **INCORRECT** (même mot, écriture différente).

---

## 4. Structure de toutes les gloses FR (53 = 25 word + 28 lemma)

| Structure | Compte | Politique de grading recommandée |
|---|---|---|
| **single** (mot unique) | 16 | égalité exacte normalisée |
| **phrase** (multi-mots) | 16 | égalité exacte normalisée (pas d'ordre de synonymes) |
| **synonym_list** (« chemin / voie ») | 13 | égalité d'**ensemble** de termes normalisés (ordre insensible) |
| **synonym_list_of_phrases** (« Toi seul / c'est Toi que ») | 8 | égalité d'**ensemble** de phrases normalisées |

→ **21 gloses sur 53** utilisent des synonymes : la reconnaissance de l'ordre est nécessaire à ~40 % des gloses. Exemples : `souverain / maître`, `chemin / voie`, `rétribution / religion`, `Toi seul / c'est Toi que`, `et non / ni`, `ceux qui / ceux que`.

Détail complet : `tmp/phase24h-gloss-structure-analysis.json`.

---

## 5. Exercices de production (curriculum)

- **Production française** (`FORM_TO_MEANING`) : **26** formes Al-Fatiha.
- **Production arabe** (`MEANING_TO_FORM`) : **26** formes.
- **Synonymes concernés** : **10** gloses word-level multi-synonymes.
- **Formes arabes à diacritiques** : **26/26** ; **dagger alef** : 5 ; **wasla** : 12 ; **madda** : 1.

---

## 6. Différences arabes à tolérer (politique proposée)

| Classe | Exemple | Verdict |
|---|---|---|
| A. Unicode sans différence linguistique | wasla `0671`, dagger alef `0670`, tatweel, NFC, espaces invisibles | **toléré** (mapper → alef / retirer) |
| B. Diacritiques | harakat — forme « clavier » non vocalisée | **CORRECT** ; vocalisation différente fournie → **AMBIGUOUS** |
| C. Tatweel | `ـ` | retiré (décoratif) |
| D. Caractère réellement différent | consonne / hamza | **jamais fusionné** |
| E. Mot réellement différent | `مَلِكِ` pour `مَـٰلِكِ` | **INCORRECT** |

---

## 7. Risques de faux positifs (à proscrire)

- `souvenir` pour `souverain` (fuzzy matching global).
- `roi` pour `souverain` (synonyme non validé).
- `serviteur` / `religion` pour `souverain / maître`.

**Règle** : seuls les synonymes **explicitement présents** dans la glose validée sont acceptés. Pas de dictionnaire de synonymes implicite.

---

## 8. Architecture recommandée — verdict unique

```
userAnswer → normalizeAnswer() → gradeFreeResponse() → CORRECT | INCORRECT | AMBIGUOUS
          → feedback → skill attempt → mastery → retention
```

- `lib/exercises/grading.ts` reste la **seule** source de vérité.
- `gradeFreeResponse()` centralise FR + AR.
- **PARTIAL** : aujourd'hui une partie d'une liste de synonymes (« souverain » seul) est déjà **CORRECT** (via `glossVariants`). Un état `PARTIAL` explicite n'est requis que si l'on veut distinguer « réponse partielle » — **décision pédagogique à trancher en Étape B**, non imposée ici.

---

## 9. Protection de la maîtrise / SRS

- Un verdict **CORRECT** (après normalisation) ne doit **jamais** écrire `correct=false`, ni incrémenter `incorrect_count`, ni déclencher une pénalité SRS.
- **AMBIGUOUS** reste **neutre** (ni correct, ni incorrect) — politique à confirmer.
- La chaîne actuelle est **cohérente** (source unique `validateAnswer`) ; seule la justesse du grader doit être corrigée (aucune divergence UI/DB détectée).

---

## 10. Clavier arabe virtuel (conception, non implémenté)

- **Optionnel**, affiché **uniquement** sur `MEANING_TO_FORM`.
- Insertion au curseur, suppression, espace, retour arrière, diacritiques optionnelles, fermeture **Escape**.
- Touches ≥48px, `aria-label`, RTL, contraste AA, focus management, ne bloque pas le clavier natif.
- Limité aux lettres nécessaires aux 26 formes d'Al-Fatiha.

---

## 11. Tests obligatoires (Étape B)

Matrice complète : `tmp/phase24h-grading-matrix.json`.

- **FR** : ordre, casse, accents, espaces, `/`, espaces multiples → CORRECT ; `roi`, `religion`, `serviteur`, `souvenir` → INCORRECT.
- **AR** : forme exacte → CORRECT ; Unicode équivalent → CORRECT ; vocalisation différente → AMBIGUOUS ; mot différent → INCORRECT.
- **Homographes** : `عَبَدَ ≠ عَبْد`, `دِين ≠ دَيْن`, `ضَالّ ≠ ظِلّ`.
- **Clavier** : insertion, suppression, espace, curseur, RTL, desktop, tactile.

---

## 12. Vérifications (baseline intacte)

| Vérification | Résultat |
|---|---|
| `npm test` | 293/293 ✅ |
| `npx tsc --noEmit` | 0 erreur ✅ |
| `npm run lint` | clean ✅ |
| `npm run build` | OK ✅ |
| `npm run verify:persistence` | 13/13 ✅ |
| `npm run verify:rls` | 44/44 ✅ |

Données inchangées : quran_words **21 296** · word_occurrences **77 430** · word_audio **21 295** · ayah_audio **0** · lemmas **32** · word_translations FR **25** · word_lemma_mapping **183**.

---

## 13. ARRÊT OBLIGATOIRE

**Aucune implémentation (Étape B) réalisée.** En attente de l'approbation explicite du propriétaire pour :

1. normalisation française + ordre des synonymes + tolérance orthographique définie ;
2. normalisation arabe (dagger alef / wasla) ;
3. `gradeFreeResponse()` centralisé ;
4. clavier arabe virtuel ;
5. feedback adapté ;
6. tests ;
7. persistance cohérente du verdict + maîtrise.

---

## Livrables

- `PHASE_24H_A_SEMANTIC_GRADING_AUDIT.md` (ce rapport)
- `tmp/phase24h-grading-audit.json`
- `tmp/phase24h-grading-matrix.json`
- `tmp/phase24h-arabic-input-audit.json`
- `tmp/phase24h-gloss-structure-analysis.json`
