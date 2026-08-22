# PHASE 49 — AL-ʿĀDIYĀT (100) — DÉBLOCAGE ÉDITORIAL CIBLÉ

**Statut final : `PHASE_49_AL_ADIYAT_READY`**

> Phase de données lexicales + seed curriculum uniquement (workflow 40C/41B/42B/47/48).
> Aucun moteur, resolver, SRS, mastery, Daily Plan, coach, exercice, onboarding,
> explication de sens, MASAQ, schéma ni migration modifié. Aucun commit, aucun push.

---

## 1. Audit initial (READ-ONLY, données réelles)

| Élément | Valeur |
|---|---:|
| Ayahs | 11 |
| Occurrences | 40 |
| Formes distinctes | 35 |
| Gloses FR forme existantes | 8 |
| Résolutions par lemme FR | 0 |
| **Gloses manquantes** | **27** |
| Curriculum (path/unit/lessons/lesson_words) | 0 / 0 / 0 / 0 |

⚠️ Le coût réel est **27** gloses, pas les 28 estimés en Phase 48 : une forme
supplémentaire (`فِى`) disposait déjà d'une glose FR validée. Confirmé en DB, non supposé.

## 2. Formes analysées

35 formes distinctes ; 8 déjà prêtes (`إِنَّ`, `ٱلْإِنسَـٰنَ`, `عَلَىٰ`, `مَا`, `إِذَا`,
`فِى`, `ذَٰلِكَ`, `يَوْمَئِذٍۢ`), 27 manquantes, 0 résolue par lemme.

## 3. Gloses ajoutées (27)

| Forme | Glose Hikma | Type | Note sensible |
|---|---|---|---|
| وَٱلْعَـٰدِيَـٰتِ | et les coursiers | clitique (وَ + ٱلْعَادِيَات) | serment |
| ضَبْحًۭا | qui halètent | lexical | — |
| فَٱلْمُورِيَـٰتِ | et celles qui font jaillir | clitique (فَ + ٱلْمُورِيَات) | — |
| قَدْحًۭا | des étincelles | lexical | — |
| فَٱلْمُغِيرَٰتِ | et celles qui attaquent | clitique (فَ + ٱلْمُغِيرَات) | — |
| صُبْحًۭا | au matin | lexical | — |
| فَأَثَرْنَ | et font voler | clitique (فَ + أَثَرْنَ) | — |
| بِهِۦ | avec lui | clitique (بِ + ـه) | 2 occurrences |
| نَقْعًۭا | la poussière | lexical | — |
| فَوَسَطْنَ | et pénètrent au centre | clitique (فَ + وَسَطْنَ) | — |
| جَمْعًا | la troupe | lexical | — |
| لِرَبِّهِۦ | envers son Seigneur | clitique (لِ + رَبّ + ـه) | — |
| لَكَنُودٌۭ | ingrat | clitique (لَ + كَنُود) | — |
| وَإِنَّهُۥ | et certes, il | clitique (وَ + إِنَّ + ـه) | 2 occurrences |
| لَشَهِيدٌۭ | témoin | clitique (لَ + شَهِيد) | — |
| لِحُبِّ | par amour de | clitique (لِ + حُبّ) | — |
| ٱلْخَيْرِ | des richesses / du bien | lexical | **SENSIBLE** — ici « les richesses » |
| لَشَدِيدٌ | ardent | clitique (لَ + شَدِيد) | — |
| ۞ أَفَلَا | ne ... donc pas | particule (أَ + فَ + لَا) | **SENSIBLE** — interrog. négative |
| يَعْلَمُ | sait | verbe | — |
| بُعْثِرَ | sera bouleversé | verbe (passif) | — |
| ٱلْقُبُورِ | les tombes | lexical (pluriel) | — |
| وَحُصِّلَ | et sera dévoilé | clitique (وَ + حُصِّلَ) | — |
| ٱلصُّدُورِ | les poitrines | lexical (pluriel) | — |
| رَبَّهُم | leur Seigneur | clitique (رَبّ + ـهُم) | — |
| بِهِمْ | d'eux | clitique (بِ + ـهُم) | — |
| لَّخَبِيرٌۢ | parfaitement informé | clitique (لَ + خَبِير) | **SENSIBLE** — épithète divine |

## 4. Cas sensibles et arbitrages

- **27/27 `VALIDATED`**, **0 `NEEDS_REVIEW`**, **0 `REJECT`**.
- `ٱلْخَيْرِ` : « des richesses / du bien » (contexte `لِحُبِّ ٱلْخَيْرِ` « amour des
  richesses ») — Hamidullah « des richesses », Kazimirski « des biens de ce monde ».
- `۞ أَفَلَا` : particule d'interrogation négative « ne ... donc pas » ; la forme stockée
  contient le symbole ۞ (donnée préservée telle quelle, glose appliquée au mot réel).
- `لَّخَبِيرٌۢ` : « parfaitement informé » (Hamidullah « Parfaitement Connaisseur »,
  Kazimirski « instruit »).
- `بِهِۦ` : « avec lui » (pronom), contexte `فَأَثَرْنَ بِهِ` / `فَوَسَطْنَ بِهِ`.

## 5. Résultat `resolveWordMeanings`

Exercice du résolveur réel (code non modifié) : **35/35 lang=`fr`**, 0 fallback EN.

## 6. Résultat `classifySurahReadiness`

`classifySurahReadiness(100, 100 %)` → **`READY`**.

## 7. Seed curriculum

- `seed:multisurah -- --surahs=100` (après `--dry-run` : 11 leçons).
- Créé : **1 learning_path** `quran-surah-100`, **1 unit**, **11 leçons publiées**
  (`surah-100-ayah-1` … `-11`), **73 lesson_words**.
- 0 doublon de position, 0 mot étranger (35/35), 0 leçon hors verset.

## 8. Compteurs DB avant/après

| Compteur | Avant | Après | Delta |
|---|---:|---:|---:|
| word_translations FR validées | 387 | 414 | **+27** |
| learning_paths | 20 | 21 | +1 |
| units | 20 | 21 | +1 |
| lessons | 127 | 138 | +11 |
| lesson_words | 860 | 933 | +73 |

## 9. Tables verrouillées inchangées

`word_explanations=13` · `word_explanation_contexts=1` · `linguistic_occurrences=413` ·
`linguistic_segments=796` · `lemma_translations=32` · `lemmas=32` · `word_lemma_mapping=184` ·
`sources=6` · `quran_words=21296` · `word_occurrences=77430` · `ayahs=6236` ·
`translations=24944`.

## 10. Tests

- `npx tsc --noEmit` ✅ (0 erreur)
- `npx eslint .` ✅ (0 erreur)
- `npx vitest run` → **733/733** (55 fichiers) ✅
- `npm run build` ✅

## 11. Idempotence

- Ré-exécution de l'écriture : `0 insérée(s), 27 déjà présente(s)`.
- Seed idempotent par construction (upsert sur clés naturelles).

## 12. Fichiers créés

- `PHASE_49_AL_ADIYAT_EDITORIAL_UNLOCK.md`
- `tmp/phase49-audit.cjs` / `tmp/phase49-audit.json`
- `tmp/phase49-write.cjs` · `tmp/phase49-verify.cjs` · `tmp/phase49-verify-resolver.ts`

## 13. Fichiers de production modifiés

**Aucun.** Phase 100 % données + seed.

## 14. Confirmation moteurs non touchés

Resolver · SRS · mastery · Daily Plan · coach (45C DEFERRED) · onboarding V2 · explications
44B · MASAQ (passif) · exercices · grading · schéma · migrations — **aucun modifié**.
Aucune autre sourate modifiée. Aucun commit, aucun push.

---

## Verdict final

**`PHASE_49_AL_ADIYAT_READY`**

27/27 gloses validées et écrites (idempotent), 35/35 FR (100 %), `READY` confirmé par
`resolveWordMeanings` + `classifySurahReadiness`, seed 100 OK (11 leçons, 73 lesson_words),
catalogue 20 → 21, tables verrouillées inchangées, tsc/eslint/vitest 733/build verts,
aucun moteur modifié. **STOP** — aucune Phase 50 lancée automatiquement.
