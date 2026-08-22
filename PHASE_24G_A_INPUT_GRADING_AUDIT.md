# PHASE 24G-A — AUDIT DU SYSTÈME DE RÉPONSE ET DE SAISIE ARABE/FRANÇAISE

STATUS = AUDIT_COMPLETE_READY_FOR_APPROVAL

Phase : 24G-A (Étape A) · Type : **READ_ONLY** (aucune écriture)
Date : 2026-08-16

> **Règle respectée** : aucune donnée lexicale modifiée, aucun code de production modifié, aucun resolver/curriculum/SRS/maîtrise modifié. Cette étape est un **diagnostic** qui s'arrête avant l'implémentation (Étape B).

---

## 1. Objectif et périmètre

Auditer les exercices de **production** (réponse libre) afin que Hikma évalue la **connaissance** de l'utilisateur, et non sa capacité à reproduire une chaîne de caractères exacte. Deux problèmes réels sont confirmés :

1. **Saisie arabe impossible** sans clavier arabe (aucun clavier virtuel Hikma).
2. **Correction française trop stricte** (« maitre / souverain » ≠ « souverain / maître » → INCORRECT).

---

## 2. Cartographie des fichiers responsables

| Responsabilité | Fichier |
|---|---|
| Input de production (FR + AR) | `components/learn/exercises/index.tsx` → `RecallExercise` (un seul `<input>`) |
| Grader | `lib/exercises/grading.ts` (`gradeFrenchInput` / `gradeArabicInput` / `normalizeFrench` / `normalizeArabicPresentation` / `stripTashkeel`) |
| Normaliseur de données existant | `lib/quran/normalize-text.ts` (`normalizeWordText`) |
| Verdict | `lib/exercises/engine.ts` → `validateAnswer` → `recallResult` |
| Collecte session | `lib/learning/session.ts` (`appendAttempt`, `SkillAttempt`) |
| Persistance | `lib/learning/actions.ts` (`submitLessonResults` / `submitSkillAttempts`) |
| Maîtrise | `lib/learning/progress.ts` (`applyAnswer`) + `lib/learning/skill-progress.ts` (`applySkillAttempt`) |
| Mapping compétence | `lib/learning/skills.ts` (`skillForExerciseType`) |
| Feedback UI | `components/ui/exercise.tsx` (`ExerciseFeedback`) |

---

## 3. Comportement actuel du grader

### 3.1 Français (`gradeFrenchInput`)

1. `normalizeFrench` : lowercase → NFD (strip accents) → apostrophes/quotes → suppression ponctuation → espaces → trim.
2. **Inclusion exacte** dans la liste normalisée des réponses acceptées.

`glossVariants(meaning)` produit `[glose complète, ...chaque terme séparé par / · |]` :
- « souverain / maître » → `["souverain / maître", "souverain", "maître"]`.

**Conséquence** : « maitre / souverain » normalise en « maitre / souverain », absent de la liste → **INCORRECT**. L'ordre des synonymes n'est pas reconnu. → `KNOWN_PEDAGOGICAL_ISSUE_001`.

### 3.2 Arabe (`gradeArabicInput`)

1. Présentation normalisée (NFC + tatweel + espaces) égale → **CORRECT**.
2. Sinon `stripTashkeel` égaux → `hasTashkeel(user)` ? **AMBIGUOUS** : **CORRECT** (forme « clavier » non vocalisée).
3. Sinon **INCORRECT**.

**Incohérence majeure** : `stripTashkeel` **supprime** le dagger alef (`0670`) au lieu de le mapper vers alef, et **ne mappe pas** la wasla (`0671`). Or la couche données `normalizeWordText` mappe déjà les deux vers l'alef (`0627`).

**Conséquence** : `مَـٰلِكِ` (dagger alef) → `ملك` vs `مَالِكِ` (alef plein) → `مالك` → **INCORRECT**, alors que c'est le même mot écrit différemment.

---

## 4. Matrice du curriculum (Al-Fatiha, 26 formes)

| Mesure | Valeur |
|---|---|
| Formes distinctes (sourate 1) | **26** |
| `word_translations` FR validées | **25** |
| Forme couverte par lemme (héritée) | **1** (`يَوْمِ` → « jour ») |
| Gloses **multi-synonymes** (« / ») | **10** |
| Formes avec diacritiques (tashkeel) | **26** |
| Formes avec **dagger alef** (`0670`) | **5** (`صِرَٰطَ`, `ٱلْعَـٰلَمِينَ`, `ٱلرَّحْمَـٰنِ`, `ٱلصِّرَٰطَ`, `مَـٰلِكِ`) |
| Formes avec **wasla** (`0671`) | **12** |
| Formes avec **madda** (`0653`) | **1** |

**Exercices de production** (les 2 seuls types à saisie libre) :
- `FORM_TO_MEANING` (français) : **26** formes concernées.
- `MEANING_TO_FORM` (arabe) : **26** formes concernées.

→ **5 formes** ont un dagger alef et **12** une wasla : leur saisie au clavier (sans copier-coller) est aujourd'hui quasi impossible, même avec un clavier arabe standard (qui produit `ا` plein, pas `ـٰ`).

---

## 5. Constats d'audit (6)

| ID | Sévérité | Constat |
|---|---|---|
| F1 | P0 | Ordre des synonymes FR non reconnu (« maitre / souverain » → INCORRECT). |
| F2 | P0 | Dagger alef / wasla non unifiés dans le grader (divergence avec `normalizeWordText`). |
| F3 | P0 | Aucun clavier arabe virtuel + attributs d'input absents (`lang`, `inputMode`, `autoComplete`, `spellCheck`, `autoCorrect`, `autoCapitalize`). |
| F4 | P2 | Champ sans `aria-label` (placeholder seul — non accessible). |
| F5 | OK | Chaîne de verdict cohérente : source unique `validateAnswer`, `correct` alimente progression + maîtrise ; AMBIGUOUS neutre. Aucune divergence UI/DB. |
| F6 | À préserver | Homographes protégés : `عَبَدَ ≠ عَبْد`, `دِين ≠ دَيْن`, `ضَالّ ≠ ظِلّ`. |

**Point clé (§10)** : la pollution de la maîtrise ne vient **pas** d'une divergence UI/DB (F5 OK), mais du grader trop strict (F1/F2) qui marque des réponses correctes comme INCORRECT, puis les persiste comme telles.

---

## 6. Architecture corrective proposée (Étape B)

Chaîne unique (pas de logique parallèle) :

```
userAnswer → normalizeAnswer() → gradeAnswer() → CORRECT|INCORRECT|AMBIGUOUS
            → feedback → skill attempt → mastery
```

`lib/exercises/grading.ts` reste la **seule** source de vérité du verdict.

### 6.1 Normalisation française

- **Conserver** `normalizeFrench` (casse, accents, apostrophes, ponctuation, espaces, Unicode).
- **Ajouter** une comparaison **insensible à l'ordre des synonymes** : représenter les réponses acceptées comme un **ensemble de termes** (split sur `/ · |`) et comparer les ensembles normalisés.
- **Interdit** : accepter un synonyme non validé (ex. « roi » pour « souverain ») — égalité d'ensemble sur les termes exacts, pas de dictionnaire de synonymes.

### 6.2 Normalisation arabe

- **Conserver** la logique AMBIGUOUS (vocalisation différente → homographe).
- **Unifier** la normalisation de présentation avec `normalizeWordText` : wasla (`0671`) → alef, dagger alef (`0670`) → alef, NFC, tatweel retiré. Séparer présentation (ne supprime aucune consonne) et vocalisation (harakat retirée seulement pour la comparaison « clavier »).
- **Madda (`0653`)** : conservée (comme `normalizeWordText`) — décision à documenter et tester.
- **Garder** : `عَبَدَ ≠ عَبْد`, `دِين ≠ دَيْن`, `ضَالّ ≠ ظِلّ`.

### 6.3 Clavier arabe virtuel

- Composant discret, **optionnel**, affiché **uniquement** sur `MEANING_TO_FORM` (`freeTextLang=ar`).
- Insertion à la position du curseur, suppression, espace, retour arrière, diacritiques optionnelles, fermeture **Escape**, focus management.
- Touches ≥48px, `aria-label`, RTL, contraste AA, ne bloque pas le clavier natif.
- Limité aux lettres réellement nécessaires aux 26 formes d'Al-Fatiha (pas de clavier géant).

### 6.4 Attributs d'input

`lang`, `inputMode`, `autoComplete=off`, `spellCheck=false`, `autoCorrect=off`, `autoCapitalize=none`, `aria-label` explicite ; `dir=rtl`/`ltr` conservé.

### 6.5 Feedback

- correct → « ✓ Correct » ; incorrect → « Pas tout à fait. » + bonne réponse ; ambiguous → « Tu étais proche. Vérifie la forme arabe et les voyelles. ».
- Une réponse validée CORRECT ne doit **jamais** afficher une erreur.

---

## 7. Tests obligatoires (Étape B)

**FR** : `« souverain / maître » == « maître / souverain »` → CORRECT ; `«  Souverain / Maître  »` → CORRECT ; `« souverain/maître »` → CORRECT ; `« souverain / maitre »` → CORRECT ; `« roi / maître »` → INCORRECT (jamais par approximation).

**AR** : forme exacte → CORRECT ; équivalent Unicode → CORRECT ; espaces invisibles → CORRECT ; `مَالِكِ` pour `مَـٰلِكِ` → CORRECT/AMBIGUOUS (jamais INCORRECT) ; forme réellement différente → INCORRECT.

**Homographes** : `عَبَدَ ≠ عَبْد`, `دِين ≠ دَيْن`, `ضَالّ ≠ ظِلّ`.

**Clavier** : insertion, suppression, espace, curseur, RTL, desktop, tactile.

---

## 8. Risques (à maîtriser en Étape B)

1. Fuzzy matching FR trop permissif → accepter des réponses incorrectes.
2. Normalisation arabe trop agressive → fusionner des homographes.
3. Double logique de verdict (UI vs DB).
4. Clavier arabe trop grand / lourd.

Chaque règle de tolérance doit être **déterministe, documentée, testée, réversible**.

---

## 9. Vérifications (baseline intacte)

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

## 10. ARRÊT OBLIGATOIRE

**Aucune implémentation (Étape B) n'a été réalisée.** Attente de l'approbation explicite du propriétaire avant :

- clavier arabe virtuel ;
- normalisation FR (ensemble de synonymes) ;
- normalisation arabe (dagger alef / wasla) ;
- grader centralisé ;
- feedback adapté ;
- tests ;
- correction de la persistance du verdict / maîtrise.

---

## Livrables

- `PHASE_24G_A_INPUT_GRADING_AUDIT.md` (ce rapport)
- `tmp/phase24g-input-grading-audit.json`
- `tmp/phase24g-grading-matrix.json`
- `tmp/phase24g-architecture.json`
