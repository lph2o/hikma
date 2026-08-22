# PHASE 20B — CORRECTION P1 : INTÉGRATION DU LEMME DANS BUILDWORDBANK

## STATUT

**STATUS = P1_FIXED** · **DATABASE_WRITES = 0** · **MIGRATIONS = 0**

**Le comportement FORME → LEMME → EN est désormais cohérent entre fiche mot, review et leçon.**

---

## A. Cause racine

`buildWordBank()` (`lib/learning/lesson.ts`) appelait `resolveWordMeanings(word, frenchByWord.get(word.id))` **sans le 3ᵉ paramètre lemme**. Le chemin LEÇON (`app/(app)/learn/[slug]/page.tsx`) résolvait donc FORME uniquement et retombait sur l'anglais pour toute forme sans `word_translation`, alors que la fiche mot et la review utilisaient déjà forme + lemme.

## B. Fichiers modifiés

1. **`lib/learning/lesson.ts`** — `buildWordBank` accepte désormais un 3ᵉ paramètre optionnel `lemmaFrenchByWord` (défaut `new Map()`), transmis à `resolveWordMeanings`.
2. **`app/(app)/learn/[slug]/page.tsx`** — récupère `getValidatedFrenchLemmaMeaningsByWord` en `Promise.all` avec les gloses de forme, puis le transmet à `buildWordBank`.
3. **`tests/lemma-translations.test.ts`** — +6 tests ciblés `buildWordBank`.

## C. Architecture avant

```
learn/[slug] ── getValidatedFrenchMeanings (FORME)
            └─ buildWordBank(words, frenchByWord)
                 └─ resolveWordMeanings(word, forme)     ← PAS de lemme
                      ├─ FORME ? → FR
                      └─ sinon → EN fallback   ← BUG pour يَوْمَ etc.
```

## D. Architecture après

```
learn/[slug] ── Promise.all([
                 getValidatedFrenchMeanings (FORME),
                 getValidatedFrenchLemmaMeaningsByWord (LEMME, batch)
               ])
            └─ buildWordBank(words, frenchByWord, lemmaFrenchByWord)
                 └─ resolveWordMeanings(word, forme, lemme)
                      ├─ FORME ? → FR
                      ├─ sinon LEMME ? → FR
                      └─ sinon → EN fallback
```

**Aucun nouveau resolver, aucune logique dupliquée** : le moteur existant (`resolveWordMeanings` + couche requêtes batch) est réutilisé tel quel.

## E. Tests ciblés (6 nouveaux — tous verts)

| Test | Cas | Résultat |
|---|---|---|
| A | forme sans word_translation + lemme validé (يَوْمَ) | « jour » [fr] ✅ |
| B | 3 formes du même lemme (يَوْمَ/يَوْمُ/يَوْمِ) | « jour » ×3 ✅ |
| C | FORME + LEMME (بِسْمِ) | « au nom de » (forme prioritaire) ✅ |
| D | ni FORME ni LEMME | fallback EN conservé ✅ |
| E | mot grammatical (لَا) | « non / ne…pas » ✅ |
| F | contrat du word bank (wordId, arabic, transliteration, ordre, nb) | conservé ✅ |

## F. Les 7 cas P1 (vérification sur données réelles)

| Forme | Avant (20A) | Après (20B) | Source |
|---|---|---|---|
| يَوْمَ | « (on the) Day » 🇬🇧 | **« jour »** 🇫🇷 | Hikma — lexique éditorial |
| رَسُولُ | « (was) a Messenger » 🇬🇧 | **« messager / envoyé »** 🇫🇷 | Hikma — lexique éditorial |
| قَوْمٌ | « a people » 🇬🇧 | **« peuple / gens »** 🇫🇷 | Hikma — lexique éditorial |
| عَبْدُ | « a slave » 🇬🇧 | **« serviteur (de Dieu) »** 🇫🇷 | Hikma — lexique éditorial |
| فِى | « In » 🇬🇧 | **« dans / en / sur »** 🇫🇷 | Hikma — lexique éditorial |
| لَا | « no » 🇬🇧 | **« non / ne…pas »** 🇫🇷 | Hikma — lexique éditorial |
| كَانَ | « (there) has been » 🇬🇧 | **« être »** 🇫🇷 | Hikma — lexique éditorial |

## G. Test de précédence

بِسْمِ (possède `word_translation` validée « au nom de » + glose de lemme générique) → **« au nom de »** : la FORME reste prioritaire, la glose de lemme ne l'écrase jamais. ✅

## H. Test fallback EN

Mots sans forme ni lemme (ex. مَـٰلِكِ, lemma_id null) → traduction anglaise existante conservée (`isFallback=true`). La correction ne supprime pas le repli anglais. ✅

## I. Test d'une vraie leçon

Leçon « La Basmala » (basmala) chargée avec `getLessonWithWords` :
- **4 mots, ordre préservé** (بِسْمِ → ٱللَّهِ → ٱلرَّحْمَـٰنِ → ٱلرَّحِيمِ) ;
- **4/4 résolus en FR** (les 4 possèdent une glose de forme validée) ;
- aucune entrée disparue, aucune dupliquée, word bank complet ;
- les exercices consomment le même contrat (`WordBankEntry`) — inchangé.

## J. Performance / absence de N+1

`getValidatedFrenchLemmaMeaningsByWord` fait **2 requêtes batch** : `.in(wordIds)` sur `quran_words` puis regroupement des `lemma_id` avant un unique `.in(lemmaIds)` sur `lemma_translations`. **Pour une leçon de N mots : 2 requêtes constantes**, jamais N requêtes. Les gloses de forme utilisent également un `.in()` unique. Vérifié : aucun appel par mot dans le code modifié.

## K. Tests globaux

| Vérification | Résultat |
|---|---|
| `npm test` | **190 / 190** (184 existants + 6 nouveaux) |
| `npx tsc --noEmit` | **0 erreur** |
| `npm run lint` | **0 warning / 0 erreur** |
| `npm run build` | **0 erreur** |
| `npm run verify:persistence` | **13 / 13** |
| `npm run verify:rls` | **27 / 27** |

## L. Non-régression

| Compteur | Attendu | Constaté |
|---|---|---|
| quran_words | 21 296 | **21 296** ✅ |
| word_occurrences | 77 430 | **77 430** ✅ |
| ayahs | 6 236 | **6 236** ✅ |
| translations | 24 944 | **24 944** ✅ |
| word_translations | 8 | **8** ✅ |
| lemmas | 22 | **22** ✅ |
| sources | 4 | **4** ✅ |
| lemma_translations | 18 | **18** ✅ |

**Aucune donnée modifiée** (INSERT=0 · UPDATE=0 · DELETE=0 · MIGRATION=0). Seul le code applicatif a changé.

## Audit des appels (section 15)

Tous les consommateurs de `buildWordBank` : page leçon (mise à jour ✅) + tests (2-args, compatibles via le paramètre optionnel ✅). Aucun autre consommateur ne dépendait d'un comportement forme-only. Aucun correctif hors scope.

## Décision finale

```
STATUS = P1_FIXED
DATABASE_WRITES = 0
MIGRATIONS = 0

Comportement désormais cohérent :
  word_translation (FORME) → lemma_translation (LEMME) → English
  identique entre : fiche mot · review · leçon · tout consommateur de buildWordBank
```

### Livrables
- 📄 `PHASE_20B_BUILD_WORD_BANK_LEMMA_FIX.md`
- 📄 `tmp/phase20b-build-word-bank-fix.json` (`P1_FIXED`)
- ✏️ `lib/learning/lesson.ts` · `app/(app)/learn/[slug]/page.tsx` · `tests/lemma-translations.test.ts`
