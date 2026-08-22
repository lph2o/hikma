# PHASE 57 — DÉBLOCAGE ÉDITORIAL D'AL-AʿLĀ (87)

**Statut : WRITE_ALLOWED (périmètre : `word_translations` + curriculum 87) — terminé.**
**Verdict : `PHASE_57_AL_ALA_READY`**

---

## A. Baseline Phase 56 (re-vérifiée read-only avant écriture)

| Élément | Baseline Phase 56 | Re-vérifiée Phase 57 (début) | Conforme |
|---|---:|---:|---|
| `quran_words` | 21 296 | 21 296 | ✅ |
| `translations` | 24 944 | 24 944 | ✅ |
| `word_translations` FR validées | 454 | 454 | ✅ |
| `word_occurrences` | 77 430 | 77 430 | ✅ |
| `lemma_translations` / `word_lemma_mapping` / `sources` / `lemmas` | 32 / 184 / 6 / 32 | identiques | ✅ |
| Catalogue | 22 parcours (1 REFERENCE + 21 READY) | 22 (1 + 21) | ✅ |
| 87 | HORS_CATALOGUE, IN_PREPARATION (36 %) | idem | ✅ |
| 87 — formes | 69 | 69 | ✅ |
| 87 — manquantes | 44 | 44 | ✅ |
| 87 — FR effectives | 25 | 25 | ✅ |
| 87 — sources 4/4 | 44/44 | 44/44 | ✅ |

Revalidation du dossier (script `tmp/phase57-dossier.ts`) : **conforme à la Phase 56**
(`revalidation_matches_phase56: true`) — aucun écart, aucune divergence → pas de STOP.

---

## B. Dossier lexical de 87

Artefact complet : `tmp/phase57-dossier.json` (19 ayahs, 69 formes). Pour chaque forme manquante :

- `word_id`, `arabic`, `meaning_en` (glose externe EN, jamais utilisée comme glose FR)
- `lemma_id_direct` / `lemma_id_mapped`
- `occurrences_in_surah`, `ayahs_in_surah`
- `other_surahs` (partages réels via `word_occurrences`)
- `present_in_catalog` (effet de bord sur les 21 parcours : **0**)
- `existing_word_translations` (avant écriture : **0 conflit**)
- `ayah_translations` : les 4 traductions **des mêmes ayahs** (31 Hamidullah FR, 9001 Kazimirski FR, 20 Sahih EN, 153 Piccardo IT)

---

## C. Les 44 formes manquantes (liste)

| # | Forme | # | Forme | # | Forme | # | Forme |
|---|---|---|---|---|---|---|---|
| 1 | وَيَتَجَنَّبُهَا | 12 | بَلْ | 23 | تُؤْثِرُونَ | 34 | وَأَبْقَىٰٓ |
| 2 | وَٱلَّذِىٓ | 13 | سَيَذَّكَّرُ | 24 | غُثَآءً | 35 | وَمُوسَىٰ |
| 3 | سَبِّحِ | 14 | لِلْيُسْرَىٰ | 25 | ٱلْأَشْقَى | 36 | ٱلْكُبْرَىٰ |
| 4 | وَذَكَرَ | 15 | يَصْلَى | 26 | يَمُوتُ | 37 | فَصَلَّىٰ |
| 5 | فَجَعَلَهُۥ | 16 | ٱسْمَ | 27 | فَسَوَّىٰ | 38 | ٱلذِّكْرَىٰ |
| 6 | سَنُقْرِئُكَ | 17 | إِن | 28 | ٱلْمَرْعَىٰ | 39 | ٱلْأَعْلَى |
| 7 | وَٱلَّذِى | 18 | قَدَّرَ | 29 | أَحْوَىٰ | 40 | تَزَكَّىٰ |
| 8 | صُحُفِ | 19 | أَخْرَجَ | 30 | تَنسَىٰٓ | 41 | ٱلصُّحُفِ |
| 9 | وَٱلْـَٔاخِرَةُ | 20 | إِبْرَٰهِيمَ | 31 | شَآءَ | 42 | يَحْيَىٰ |
| 10 | وَنُيَسِّرُكَ | 21 | فَذَكِّرْ | 32 | نَّفَعَتِ | 43 | ٱلْجَهْرَ |
| 11 | فَذَكِّرْ → 6cecc162 سَيَذَّكَّرُ | 22 | يَخْشَىٰ | 33 | ٱلنَّارَ | 44 | يَخْفَىٰ |

*(Le tableau complet avec word_id est dans `tmp/phase57-proposals.json` — 44 entrées.)*

---

## D. Occurrences et ayahs

- 87 = 19 ayahs (DB) = 19 ayahs (import) — 72 occurrences, 69 formes distinctes.
- Chaque forme est documentée avec ses ayahs réels dans 87 (ex. `وَيَتَجَنَّبُهَا` 87:11, `سَبِّحِ` 87:1, `إِن` 87:9, `بَلْ` 87:16…).

---

## E. Comparaison Hamidullah / Kazimirski (FR)

Les 44 formes ont été comparées **sur les mêmes ayahs**. Exemples de convergence FR :

- `سَبِّحِ` 87:1 — Hamidullah « Glorifie le nom de ton Seigneur », Kazimirski « Loue le nom de ton Seigneur » → noyau **glorifier / louer**.
- `ٱلْأَعْلَى` 87:1 — Hamidullah « le Très Haut », Kazimirski « le Très-Haut » → **le Très-Haut**.
- `قَدَّرَ` 87:3 — Hamidullah « qui a décrété », Kazimirski « Qui a fixé les destinées » → **décréter / fixer**.
- `أَخْرَجَ` 87:4 — Hamidullah « qui a fait pousser le pâturage », Kazimirski « Qui fait germer l'herbe » → **faire pousser / faire germer**.
- `تُؤْثِرُونَ` 87:16 — Hamidullah « vous préférez plutôt la vie présente », Kazimirski « vous préférez la vie de ce monde » → **préférer**.
- `يَمُوتُ` 87:13 — Hamidullah « n'y mourra pas », Kazimirski « il n'y mourra pas » → **mourir** (négation contextuelle documentée).

---

## F. Contrôle Sahih EN / Piccardo IT

Confrontation interlinguistique (jamais un vote, toujours un contrôle) — exemples :

- `فَجَعَلَهُۥ` 87:5 — Sahih « and [then] made it », Piccardo « e ne fa » → noyau **rendre / faire devenir** (converge avec les 2 FR).
- `غُثَآءً أَحْوَىٰ` 87:5 — Sahih « dark stubble », Piccardo « pula secca » → **paille / foin desséché, sombre**.
- `يَخْشَىٰ` 87:10 — Sahih « who fears », Piccardo « chi teme » → **craindre**.
- `سَيَذَّكَّرُ` 87:9 — Sahih « will be reminded », Piccardo « si ricorderà » → **se rappeler / se souvenir**.
- `يَصْلَى ٱلنَّارَ ٱلْكُبْرَىٰ` 87:12 — Sahih « will [enter and] burn in the greatest Fire », Piccardo « brucerà nel Fuoco più grande » → **brûler dans le feu, le plus grand**.

Les 4 références convergent sur 44/44 formes (0 source manquante, 0 ambiguïté bloquante).

---

## G. Noyaux sémantiques

Déterminés forme par forme (`semantic_core` dans `tmp/phase57-proposals.json`), exemples :

| Forme | Noyau sémantique |
|---|---|
| سَبِّحِ | glorifier / louer |
| قَدَّرَ | décréter / déterminer |
| فَسَوَّىٰ | agencer harmonieusement |
| تَزَكَّىٰ | se purifier |
| يَخْشَىٰ | craindre |
| ٱلْجَهْرَ / يَخْفَىٰ | ce qui est déclaré / ce qui est caché |
| ٱلْمَرْعَىٰ | le pâturage |
| غُثَآءً | débris végétaux desséchés |
| أَحْوَىٰ | sombre / noirâtre |
| إِبْرَٰهِيمَ / وَمُوسَىٰ | Abraham / Moïse (noms propres, 87:19) |
| صُحُفِ / ٱلصُّحُفِ | feuillets / Écritures |

---

## H. Les 44 gloses Hikma

Liste complète dans `tmp/phase57-validated.json` (statut VALIDATED). Aperçu :

`سَبِّحِ` → « glorifie / célèbre (la louange de) » · `ٱلْأَعْلَى` → « le Très-Haut / le Plus Élevé » · `ٱلَّذِى` → « Celui qui » · `قَدَّرَ` → « a décrété / a fixé la destinée » · `أَخْرَجَ` → « a fait sortir / a fait pousser » · `سَنُقْرِئُكَ` → « Nous te ferons réciter » · `بَلْ` → « mais / bien plus » · `إِن` → « si » · `تَزَكَّىٰ` → « se purifie » · `يَصْلَى` → « brûlera / subira le feu » · `ٱلْأَشْقَى` → « le plus malheureux / le réprouvé » · `يَمُوتُ` → « mourir / il meurt » · `تَنسَىٰٓ` → « tu oublieras / oublier » · `يَخْفَىٰ` → « ce qui est caché / se cache » · `ٱلْحَيَوٰةَ` → « la vie (ici-bas) » · `وَأَبْقَىٰٓ` → « et plus durable » · `ٱلْكُبْرَىٰ` → « la plus grande / la suprême » · `فَصَلَّىٰ` → « et a prié / a accompli la prière » …

---

## I. Cas grammaticaux

Formes grammaticales traitées **séparément** (fonction arabe, pas traduction d'ayah) :

- `بَلْ` (87:16) — particule de redressement → « mais / bien plus » (les 4 sources « Mais/But/Ma »).
- `إِن` (87:9) — particule conditionnelle → « si » (Sahih « if » ; Piccardo « ché » / Kazimirski paraphrasent, noyau conservé).
- `وَٱلَّذِىٓ` / `وَٱلَّذِى` (87:3-4) — pronom relatif → « et Celui qui ».
- `ٱسْمَ` (87:1) — nom → « le nom » (non réduit à la construction française « Glorifie le nom »).
- `شَآءَ` (87:7) — verbe → « a voulu / veut » (glose lexicale, distincte du contexte « excepté ce qu'Allah veut »).
- `قَدْ` / `مَا` / `إِلَّا` — formes déjà couvertes par le resolver (non réécrites).

Aucune glose grammaticale n'a été fabriquée en découpant une traduction de verset (règle 103:2 / `لَفِى` respectée).

---

## J. Cas polysémiques

- **`يَمُوتُ`** (87:13) et **`تَنسَىٰٓ`** (87:6) : précédés d'une négation en contexte (« ne vivra pas » / « tu n'oublieras pas »). La glose conserve la **valeur lexicale positive** du verbe, la négation restant au niveau du verset. Note de prudence écrite dans `editorial_notes`.
- **`فَسَوَّىٰ`** (87:2) : polysémie « égaliser / agencer / équilibrer » — noyau retenu « a agencé harmonieusement / a équilibré », soutenu par les 4 sources.
- **`أَخْرَجَ`** (87:4) : « faire sortir » (général) → en contexte « faire pousser » (le pâturage). Glose double : « a fait sortir / a fait pousser ».
- Aucun cas non résoluble : **0 REJECTED, 0 NEEDS_REVIEW**.

---

## K. Formes partagées

Sur les 44 formes manquantes : **30 partagées** avec d'autres sourates (dont 5 avec les candidates 82/92/96 — voir R), **14 spécifiques à 87** (dont les serments/verbes propres : `وَيَتَجَنَّبُهَا`, `سَنُقْرِئُكَ`, `وَنُيَسِّرُكَ`, `غُثَآءً`, `أَحْوَىٰ`, `ٱلْمَرْعَىٰ`, `لِلْيُسْرَىٰ`, `ٱلْأَشْقَى`…).

Aucune glose écrite pour un word_id déjà couvert (0 duplicat), aucune glose existante modifiée/écrasée (conformité vérifiée avant insertion), aucun effet de bord sur les 21 parcours du catalogue (`present_in_catalog: false` sur 44/44).

---

## L. Validation éditoriale

- 44/44 propositions **VALIDATED** (toutes HIGH confidence, convergence 4 sources, `tmp/phase57-validated.json`).
- 0 REJECTED, 0 NEEDS_REVIEW.
- Deux notes de prudence (négation contextuelle `يَمُوتُ` / `تَنسَىٰٓ`) — documentées, non bloquantes.
- Aucune glose incertaine écrite avec `is_validated=true`.

---

## M. Écriture `word_translations`

- **44 gloses insérées** (454 → **498**), source « Hikma — lexique éditorial », `is_validated=true`, `validated_at=now()`, `editorial_notes` (phase, ayahs, noyau, prudence éventuelle).
- Schéma existant respecté : `word_id, language='fr', text, source_id, is_validated, validated_at, editorial_notes`.
- **Aucune autre table modifiée** : `word_translations` est la seule table avec delta ≠ 0 (+44).

## N. Vérification resolver

`resolveWordMeanings(87)` via les helpers réels (FORME → LEMME direct → LEMME via mapping → EN) :

- **69/69 FR effectif (100 %)** · 0 fallback EN · 0 non résolu.

## O. Readiness 87

`classifySurahReadiness(87, 100)` → **READY** (vérifié avec le code réel, jamais supposé).

## P. Seed curriculum

`npm run seed:multisurah -- --surahs=87` :
- 1 learning_path `quran-surah-87` · 1 unit · **19 leçons publiées** (1 par verset, ordre vérifié).
- **141 lesson_words**, 69 formes distinctes, 0 doublon, 0 mot étranger, 69/69 formes couvertes et FR.

## Q. Vérification curriculum

`tmp/phase57-verify-result.json` — `curriculum` : `lessons=19, lesson_ayahs=19, order_matches=true, duplicates=0, foreign_words=0, distinct_word_ids=69, lesson_word_coverage={fr:69,en:0,unres:0}`.

## R. Effets de propagation (documentés, non forcés)

Rescan complet post-écriture (résolution réelle sur les 114 sourates) vs baseline Phase 56 :

| Sourate | Manquantes P56 | Manquantes P57 | Delta | Gloses Phase 57 propagées |
|---:|---:|---:|---:|---|
| 82 Al-Infitar | 43 | 41 | **−2** | `بَلْ` (« mais / bien plus »), `شَآءَ` (« a voulu / veut ») |
| 92 Al-Layl | 45 | 43 | **−2** | `ٱلْأَشْقَى` (« le plus malheureux »), `لِلْيُسْرَىٰ` (« vers la facilité ») |
| 86 At-Tariq | 41 | 40 | **−1** | `إِن` (« si ») |
| 96 Al-ʿAlaq | 41 | 40 | **−1** | `إِن` (« si ») |
| 90 Al-Balad | 44 | 44 | 0 | — |
| 98 Al-Bayyinah | 54 | 54 | 0 | — |

Aucune sourate n'est passée READY hors 87 ; **aucun changement d'état dans le catalogue** (22 → 23 parcours, uniquement par l'ajout de 87). Les gains ci-dessus sont l'effet **naturel** de word_ids partagés — aucune écriture ciblée sur une autre sourate.

## S. Vérification DB

Compteurs verrouillés **inchangés** : `quran_words` 21 296, `translations` 24 944, `word_occurrences` 77 430, `lemma_translations` 32, `word_lemma_mapping` 184, `sources` 6, `lemmas` 32. Seul delta : `word_translations` +44 (454 → 498).

## T. Tests

| Validation | Résultat |
|---|---|
| `npx tsc --noEmit` | ✅ 0 erreur |
| `npx eslint .` | ✅ 0 erreur |
| `npx vitest run` | ✅ **743/743** (identique à la baseline) |
| `npm run build` | ✅ compilé, généré |

## U. Idempotence

- Re-exécution de l'écriture : **0 nouvelle ligne, 44 déjà présentes** (`reinserted_idempotence: 0`).
- Re-exécution du seed : 19 leçons stables, 0 doublon ajouté.
- Lecture de contrôle finale : état identique, readiness READY, catalogue identique.

## V. Risques / anomalies

- Aucune anomalie bloquante. Deux notes de prudence documentées (§J) — conformes, non bloquantes.
- Aucune écriture hors périmètre détectée (delta vérifié table par table).

## W. Verdict final

**`PHASE_57_AL_ALA_READY`** — Al-Aʿlā (87) est débloquée :

- 69/69 formes résolues en FR effectif via le resolver réel (0 fallback, 0 non résolu) ;
- `classifySurahReadiness(87, 100)` = READY ;
- curriculum seedé (1 parcours / 1 unité / 19 leçons / 141 lesson_words, 0 doublon, 0 mot étranger) ;
- 44 gloses Hikma validées écrites dans `word_translations` (454 → 498), idempotentes ;
- propagation naturelle mesurée et documentée (82 −2, 92 −2, 86 −1, 96 −1) ;
- tests 743/743, tsc/eslint/build OK, aucune régression ;
- aucune table verrouillée modifiée ; aucun commit ; aucun push.

**STOP.** Aucune Phase 58 lancée automatiquement.

---

## Artefacts

- `PHASE_57_AL_ALA_EDITORIAL_UNLOCK.md` (ce rapport)
- `tmp/phase57-dossier.json` · `tmp/phase57-proposals.json` · `tmp/phase57-validated.json`
- `tmp/phase57-write-result.json` · `tmp/phase57-verify-result.json` · `tmp/phase57-propagation.json`
- Scripts reproductibles : `tmp/phase57-dossier.ts` · `tmp/phase57-proposals.ts` · `tmp/phase57-validate-and-write.ts` · `tmp/phase57-verify.ts`
