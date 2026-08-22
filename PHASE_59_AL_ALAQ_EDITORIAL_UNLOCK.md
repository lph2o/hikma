# PHASE 59 — DÉBLOCAGE ÉDITORIAL D'AL-ʿALAQ (96)

**Statut : WRITE_ALLOWED (périmètre : `word_translations` + curriculum 96) — terminé.**
**Verdict : `PHASE_59_AL_ALAQ_READY`**

---

## A. Audit initial read-only (revalidation vs Phase 58)

| Élément | Phase 58 | Revalidé Phase 59 | Conforme |
|---|---:|---:|---|
| Sourate | 96 — Al-ʿAlaq | 96 — Al-ʿAlaq | ✅ |
| Ayahs (DB / import) | 19 / 19 | 19 / 19 | ✅ |
| Occurrences | 72 | 72 | ✅ |
| Formes distinctes | 59 | 59 | ✅ |
| FR effectifs | 19 | 19 (14 forme + 3 lemme direct + 2 via mapping) | ✅ |
| Formes manquantes | 40 | 40 (40 EN-only, 0 non résolu) | ✅ |
| Couverture | 32 % | 32 % | ✅ |
| Readiness | IN_PREPARATION | IN_PREPARATION | ✅ |
| Parcours | absent | absent (`path_exists: false`) | ✅ |
| Catalogue | absent | absent | ✅ |
| Sources 4/4 | 40/40 | 40/40 (0 sans source) | ✅ |

`revalidation_matches_phase58: true` — **aucune divergence, aucune écriture avant validation.**

## B. Les 40 formes manquantes (liste canonique, `tmp/phase59-dossier.json`)

| # | Forme | Ayahs | # | Forme | Ayahs |
|---|---|---|---|---|---|
| 1 | ٱقْرَأْ | 1,3 | 21 | يَنْهَىٰ | 9 |
| 2 | بِٱسْمِ | 1 | 22 | عَبْدًا | 10 |
| 3 | ٱلْأَكْرَمُ | 3 | 23 | صَلَّىٰٓ | 10 |
| 4 | بِٱلْقَلَمِ | 4 | 24 | ٱلْهُدَىٰٓ | 11 |
| 5 | عَلَّمَ | 4,5 | 25 | أَمَرَ | 12 |
| 6 | يَعْلَم | 14 | 26 | بِٱلتَّقْوَىٰٓ | 12 |
| 7 | يَعْلَمْ | 5 | 27 | كَذَّبَ | 13 |
| 8 | مِنْ | 2 | 28 | وَتَوَلَّىٰٓ | 13 |
| 9 | عَلَقٍ | 2 | 29 | يَرَىٰ | 14 |
| 10 | كَلَّآ | 6 | 30 | لَئِن | 15 |
| 11 | لَيَطْغَىٰٓ | 6 | 31 | يَنتَهِ | 15 |
| 12 | أَن | 7 | 32 | لَنَسْفَعًۢا | 15 |
| 13 | رَّءَاهُ | 7 | 33 | بِٱلنَّاصِيَةِ | 15 |
| 14 | ٱسْتَغْنَىٰٓ | 7 | 34 | نَاصِيَةٍۢ | 16 |
| 15 | إِلَىٰ | 8 | 35 | كَـٰذِبَةٍ | 16 |
| 16 | ٱلرُّجْعَىٰٓ | 8 | 36 | خَاطِئَةٍۢ | 16 |
| 17 | لَّمْ | 15 | 37 | فَلْيَدْعُ | 17 |
| 18 | أَرَءَيْتَ (couvert) | — | 38 | نَادِيَهُۥ | 17 |
| 19 | سَنَدْعُ | 18 | 39 | ٱلزَّبَانِيَةَ | 18 |
| 20 | تُطِعْهُ | 19 | 40 | وَٱسْجُدْ / وَٱقْتَرِب | 19 |

*(Le tableau réel avec word_id, occurrences, autres sourates, lemma direct/mapping est dans `tmp/phase59-dossier.json` — 40 entrées.)*

## C. Dossier contextuel (4 traductions des MÊMES ayahs)

Chaque forme dispose de ses occurrences réelles, ses ayahs, et les 4 traductions exactes de ces ayahs (31 Hamidullah FR, 9001 Kazimirski FR, 20 Sahih EN, 153 Piccardo IT) — `ayah_translations` dans le dossier. Aucune traduction isolée du mot n'a remplacé le contexte réel.

## D. Comparaison Hamidullah / Kazimirski (noyau FR)

Exemples de convergence sur les mêmes ayahs :

- `ٱقْرَأْ` 96:1 — Hamidullah « Lis », Kazimirski « Lis » → **lis / récite** (première révélation).
- `ٱلْأَكْرَمُ` 96:3 — H « le Très Noble », K « le plus généreux » → **le Très Généreux / le Plus Noble**.
- `عَلَّمَ` 96:4-5 — H « a enseigné », K « a appris à l'homme » → **a enseigné**.
- `عَلَقٍ` 96:2 — H « d'une adhérence », K « de sang coagulé » → **une adhérence / un caillot** (noyau commun : l'embryon adhérent).
- `كَذَّبَ` 96:13 — H « dément », K « traite la vérité de mensonge » → **il dément / traite de mensonge**.
- `لَيَطْغَىٰٓ` 96:6 — H « devient rebelle », K « devient rebelle » → **devient rebelle / transgresse**.

## E. Contrôle Sahih EN / Piccardo IT

Confrontation interlinguistique (contrôle, jamais vote) :

- `ٱقْرَأْ` — Sahih « Recite », Piccardo « Leggi! » → confirme **lis / récite**.
- `كَـٰذِبَةٍ خَاطِئَةٍ` 96:16 — Sahih « a lying, sinning forelock », Piccardo « ciuffo mendace peccaminoso » → **menteur / pécheur** (converge avec les 2 FR).
- `ٱلزَّبَانِيَةَ` 96:18 — Sahih « angels of Hell », Piccardo « guardiani » → **les gardiens (de l'Enfer)**.
- `وَٱسْجُدْ وَٱقْتَرِب` 96:19 — Sahih « prostrate and draw near », Piccardo « prosternati e avvicinati » → **prosterne-toi / et rapproche-toi**.

Les 4 références convergent sur **40/40** formes (0 source manquante, 0 ambiguïté bloquante).

## F. Cas grammaticaux (traités séparément)

- `مِنْ` (96:2) — préposition → **de / depuis** (4 sources « de / from / da »).
- `إِلَىٰ` (96:8) — préposition → **vers** (4 sources « vers / à / to / verso »).
- `لَّمْ` (96:15) — particule de négation (passé) → **ne … pas (passé)** (valeur grammaticale conservée, pas une définition nominale).
- `أَن` (96:7) — conjonction → **dès que / parce que** (introduit la cause ; Sahih « Because »).
- `لَئِن` (96:15) — particule conditionnelle + serment → **si / certes si** (Kazimirski « s'il ne cesse », Sahih « If he does not desist »).
- `كَلَّآ` (96:6) — particule d'avertissement → **non ! / prenez garde !** (H « Prenez-garde ! », K « Oui. Mais », S « No! », P « Invece no! » — noyau : réfutation + avertissement).

Aucune glose grammaticale fabriquée par découpage d'une traduction de verset (règle « contexte ≠ glose », cf. 103:2).

## G. Cas de polysémie

- `عَلَقٍ` (96:2) : « sang coagulé » (Kazimirski) vs « adhérence » (Hamidullah/Sahih/Piccardo) — glose double **« une adhérence / un caillot »** couvrant le noyau embryologique.
- `كَذَّبَ` (96:13) : « dément » vs « traite de mensonge » — même noyau, formulation double.
- `أَن` (96:7) : « dès qu'il » (H/K/P) vs « Because » (Sahih) — noyau causal/temporel : **dès que / parce que**.
- Aucun cas non résoluble : **0 REJECTED, 0 NEEDS_REVIEW**.

## H. Revue éditoriale → VALIDATION

- 40/40 propositions **VALIDATED** (toutes HIGH confidence, convergence 4 sources sur les mêmes ayahs, gloses courtes, pédagogiques, distinctes des traductions de verset).
- 0 NEEDS_REVIEW, 0 REJECTED.
- 3 notes de prudence grammaticales documentées (valeur fonctionnelle conservée).

## I. Écriture `word_translations` (idempotente)

- **40 gloses insérées** (498 → **538**), source « Hikma — lexique éditorial », `is_validated=true`, `validated_at=now()`, `editorial_notes` (phase, ayahs, noyau, prudence).
- 0 ligne déjà présente, 0 conflit, 0 doublon.
- **Seule table modifiée** : `word_translations` (+40). Toutes les autres vérifiées à delta 0.

## J. Vérification resolver

`resolveWordMeanings(96)` via les helpers réels : **59/59 FR effectif (100 %), 0 fallback EN, 0 non résolu.**

## K. Readiness

`classifySurahReadiness(96, 100)` → **READY** (vérifié avec le code réel, jamais supposé).

## L. Seed curriculum

`npm run seed:multisurah -- --surahs=96` (idempotent, 2 exécutions) :
- 1 learning_path `quran-surah-96` · 1 unit · **19 leçons publiées** (1 par verset, ordre vérifié `order_matches: true`).
- **131 lesson_words**, 59 formes distinctes, 0 doublon, 0 mot étranger, 59/59 formes couvertes et FR.

## M. Catalogue

`getSurahCatalog` : **24 parcours** (1 REFERENCE + **23 READY**, 0 IN_PREPARATION) ; 96 READY (59 formes, 59 FR, 100 %, 19 leçons) ; `stateChangesOutside96: []` — **aucun changement d'état hors 96**.

## N. Propagation naturelle (mesurée, non forcée)

Delta vs Phase 58 (rescan complet, résolution réelle) — **89 sourates bénéficiaires** :

| Sourate | Manquantes P58 | P59 | Delta | Gloses Phase 59 propagées |
|---:|---:|---:|---:|---|
| 90 Al-Balad | 44 | 42 | **−2** | `أَن` (« dès que / parce que »), `لَّمْ` (« ne … pas ») |
| 92 Al-Layl | 43 | 42 | **−1** | `كَذَّبَ` (« il dément / traite de mensonge ») |
| 98 Al-Bayyinah | 54 | 53 | **−1** | `مِنْ` (« de / depuis ») |
| 86 At-Tariq / 82 Al-Infitar | 40 / 41 | 40 / 41 | 0 | — |

Autres sourates du Coran en gain naturel (extrait) : Al-An'am −6, Al-Baqarah −5, An-Nisa −5, An-Najm −5, 'Abasa −5, … **Aucune nouvelle READY hors 96** (les candidates restent IN_PREPARATION — un mot gagné ne suffit pas à passer 100 %). Impact direct Phase 59 = 96 : 40 → 0.

## O. Vérification DB (tables interdites)

Avant / après — deltas vérifiés table par table :

| Table | Delta |
|---|---:|
| `word_translations` | **+40** (autorisée) |
| `quran_words` / `word_occurrences` / `translations` / `lemma_translations` / `word_lemma_mapping` / `sources` / `lemmas` | 0 (verrouillées) |
| `learning_paths` / `units` / `lessons` / `lesson_words` | +1 / +1 / +19 / +131 (curriculum 96, autorisé) |

Aucune modification détectée hors périmètre (SRS, mastery, Daily Plan, coach, onboarding, MASAQ, exercices, explications : non touchés).

## P. Tests de non-régression

| Validation | Résultat |
|---|---|
| `npx tsc --noEmit` | ✅ 0 erreur |
| `npx eslint .` | ✅ 0 erreur |
| `npx vitest run` | ✅ **743/743** (identique) |
| `npm run build` | ✅ compilé, généré |

## Q. Idempotence

- Re-exécution écriture : **0 nouvelle ligne, 40 déjà présentes** (`reinserted_idempotence: 0`).
- Re-exécution seed : 19 leçons stables, 0 doublon.
- Lecture de contrôle : état identique, READY, catalogue 24 stable.

## R. Risques / anomalies

- Aucune anomalie bloquante. Notes grammaticales documentées (§F), polysémie résolue (§G).
- Propagation naturelle documentée et mesurée — aucune écriture hors 96.

## S. Verdict final

**`PHASE_59_AL_ALAQ_READY`** — Al-ʿAlaq (96) est débloquée :

- 40 formes manquantes traitées → 40 gloses Hikma validées écrites dans `word_translations` (498 → 538) ;
- 59/59 formes résolues en FR effectif via le resolver réel (0 fallback, 0 non résolu) ;
- `classifySurahReadiness(96, 100)` = READY ; catalogue : 24 parcours (1 REFERENCE + 23 READY), 96 READY, aucun changement hors 96 ;
- curriculum seedé : 1 parcours / 1 unité / 19 leçons / 131 lesson_words, 0 doublon, 0 mot étranger ;
- propagation naturelle mesurée : 90 −2, 92 −1, 98 −1 (+86 autres sourates en léger gain), aucune READY accidentelle ;
- tests 743/743, tsc/eslint/build OK, aucune régression ;
- aucune table verrouillée modifiée ; aucun commit ; aucun push.

**STOP.** Aucune Phase 60 lancée automatiquement.

---

## Artefacts

- `PHASE_59_AL_ALAQ_EDITORIAL_UNLOCK.md` (ce rapport)
- `tmp/phase59-dossier.json` · `tmp/phase59-proposals.json` · `tmp/phase59-validated.json`
- `tmp/phase59-write-result.json` · `tmp/phase59-verify-result.json` · `tmp/phase59-propagation.json`
- Scripts reproductibles : `tmp/phase59-dossier.ts` · `tmp/phase59-proposals.ts` · `tmp/phase59-validate-and-write.ts` · `tmp/phase59-verify.ts`
