# PHASE 21F — CONTROLLED GLOSS IMPORT

## 1. Décision

**`A — IMPORT_COMPLETED`**

Import contrôlé des 46 gloses approuvées (Phase 21E + 21E-B) : **45
word_translations** (gloses de forme FR validées) + **1 word_lemma_mapping**
(وَٱلنَّاسِ → نَاس, réutilisation de la glose existante).

## 2. Résultat

| Indicateur | Valeur |
|---|---|
| Décisions approuvées en entrée | 46 |
| word_translations insérées | 45 |
| word_lemma_mapping insérés | 1 |
| already_exists | 0 |
| divergences | 0 |
| doublons | 0 |
| bloquées | 0 |
| idempotence (RUN 2) | 0 insertion, 46 déjà présentes |

## 3. Non-régression

| Table | Avant | Après | Statut |
|---|---|---|---|
| quran_words | 21 296 | 21 296 | inchangé |
| word_occurrences | 77 430 | 77 430 | inchangé |
| translations | 24 944 | 24 944 | inchangé |
| lemma_translations FR validées | 28 | 28 | inchangé (الله, فِي, نَاس préservées) |
| word_translations FR validées | 25 | **70** | +45 (Al-Fātiḥah intacte) |
| word_lemma_mapping safe | 183 | **184** | +1 (وَٱلنَّاسِ → نَاس) |

**FATIHAH_REFERENCE_LOCKED = PRESERVED** — les 25 gloses Al-Fātiḥah, ses 26
formes, ses traductions et ses 8 leçons restent inchangées.

## 4. Provenance

Toutes les gloses sont rattachées à la source éditoriale existante
**« Hikma — lexique éditorial »** (source_id réel). Aucune glose n'est
attribuée aux traductions d'ayah (resource_id 31 / 9001 / 20 / 153), aucune
traduction d'ayah n'a été copiée.

## 5. Résolution vérifiée (post-import)

| Forme | Glose résolue | Canal | Source |
|---|---|---|---|
| قُلْ | « dis » | FORME | Hikma — lexique éditorial |
| يَكُن | « être » | FORME | Hikma — lexique éditorial |
| شَرِّ | « le mal » | FORME | Hikma — lexique éditorial |
| وَٱلنَّاسِ | « gens / hommes » | LEMME (mapping نَاس) | Hikma — lexique éditorial |

## 6. Idempotence

RUN 1 : 45 + 1 insérées. RUN 2 : **0 insertion**, 46 déjà présentes, aucune
modification destructive. Le script est idempotent.

## 7. Anomalies (non corrigées, DEFERRED)

1. `meaning_en` de أَحَدٌ = « anyone of you ».
2. `editorial_notes` de فِي / نَاس « NON validée » vs `is_validated = true`.

## 8. Tableau d'import (§29)

| Forme/Lemme | Glose | Target | Action | Source décision | Résultat |
|---|---|---|---|---|---|
| قُلْ | dis | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| هُوَ | il | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| أَحَدٌ | un / unique | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| ٱلصَّمَدُ | l'Éternel / l'Absolu | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| لَمْ | ne ... pas | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| يَلِدْ | engendrer | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| وَلَمْ | et ne ... pas | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| يُولَدْ | être engendré | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| لَّهُۥ | à lui / pour lui | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| كُفُوًا | égal / équivalent | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| أَحَدٌۢ | un / quelqu'un (aucun dans la négation) | word_translations (FORME) | INSERT | 21E (MODIFY) | OK — validée |
| أَعُوذُ | je cherche refuge | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| بِرَبِّ | auprès du Seigneur | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| ٱلْفَلَقِ | l'aube | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| مِن | de / contre | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| شَرِّ | le mal | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| مَا | ce que / ce qui | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| خَلَقَ | créer | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| وَمِن | et de / et contre | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| غَاسِقٍ | l'obscurité / la nuit | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| إِذَا | quand / lorsque | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| وَقَبَ | s'étendre / s'approfondir | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| ٱلنَّفَّـٰثَـٰتِ | celles qui soufflent | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| ٱلْعُقَدِ | les nœuds | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| حَاسِدٍ | l'envieux | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| حَسَدَ | envier | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| مَلِكِ | le roi / le souverain | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| إِلَـٰهِ | le dieu / la divinité | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| ٱلْوَسْوَاسِ | le chuchoteur (celui qui insuffle le mal) | word_translations (FORME) | INSERT | 21E (MODIFY) | OK — validée |
| ٱلْخَنَّاسِ | celui qui se retire | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| ٱلَّذِى | qui / celui qui | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| يُوَسْوِسُ | insuffler / chuchoter (le mal) | word_translations (FORME) | INSERT | 21E (MODIFY) | OK — validée |
| صُدُورِ | les poitrines / les cœurs | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| مِنَ | de / parmi | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| ٱلْجِنَّةِ | les djinns | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| إِنَّآ | certes Nous | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| أَعْطَيْنَـٰكَ | Nous t'avons donné | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| ٱلْكَوْثَرَ | al-Kawthar (l'abondance) | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| فَصَلِّ | prie donc / accomplis la prière | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| لِرَبِّكَ | à ton Seigneur | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| وَٱنْحَرْ | et sacrifie | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| إِنَّ | certes / en vérité | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| شَانِئَكَ | celui qui te hait | word_translations (FORME) | INSERT | 21E (ACCEPT) | OK — validée |
| ٱلْأَبْتَرُ | privé de postérité / sans descendance | word_translations (FORME) | INSERT | 21E (MODIFY) | OK — validée |
| يَكُن | être | word_translations (FORME) | INSERT | 21E-B (MODIFY) | OK — validée |
| وَٱلنَّاسِ → نَاس | gens / hommes | word_lemma_mapping (LEMME) | INSERT | 21E (MOVE_TO_LEMMA) | OK — réutilise la glose نَاس existante |

## 9. Succès de la phase

La disponibilité de gloses lexicales françaises éditorialement approuvées pour
les formes des 4 sourates pilotes est **acquise**. Ceci ne signifie pas que les
sourates sont pédagogiquement terminées : racines, morphologie, explications
enrichies, généralisation à d'autres sourates et onboarding restent des travaux
ultérieurs.

---

**DATABASE_WRITES = CONTROLLED (word_translations + word_lemma_mapping uniquement)**

**FATIHAH_REFERENCE_LOCKED = PRESERVED**

**FIN PHASE 21F**
