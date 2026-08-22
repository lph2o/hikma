# PHASE 53 — AUDIT CANONIQUE DU CATALOGUE HIKMA (POST-CHUNKING)

**Verdict : `PHASE_53_CANONICAL_CATALOG_BASELINE_ESTABLISHED`**

> Phase STRICTEMENT READ-ONLY. Aucune écriture DB (INSERT/UPDATE/DELETE/seed),
> aucune migration, aucune modification runtime/UI/onboarding/resolver/curriculum/
> SRS/mastery/MASAQ/explications. Aucun commit, aucun push. Seuls des artefacts
> d'audit `tmp/` et ce rapport ont été produits.

---

## A. Executive Summary

Après la correction Phase 52 (chunking des `.in()`), le catalogue est **stable et
cohérent** :

- **21 parcours** : **1 REFERENCE** (Al-Fātiḥah) + **20 READY** + **0 IN_PREPARATION**.
- **0 divergence** entre la résolution manuelle (recalculée) et `getSurahCatalog`
  (code réel) : 0 mismatch sur état/forms/frCount/lessons.
- **0 forme en fallback EN** et **0 forme non résolue** dans les 21 sourates du
  catalogue : la couverture lexicale FR effective est de **100 %** partout.
- `getSurahCatalog()` : **3/3 succès** (~1,3 s, résultats identiques) → chunking
  Phase 52 stable.

La source de vérité est le comportement réel du resolver
(`FORME → LEMME direct → LEMME via mapping → EN fallback`), pas les anciens rapports.

---

## B. Baseline

| Élément | Nombre |
|---|---:|
| Parcours (`learning_paths` ancrés sur sourate) | 21 |
| **REFERENCE** | 1 (Al-Fātiḥah) |
| **READY** | 20 |
| **IN_PREPARATION** | 0 |
| Divergences catalogue ↔ recomputation | 0 |
| Formes distinctes (toutes sourates du catalogue) | 411 |

---

## C. Matrice canonique des 21 sourates

`fr` = glose FR directe (`word_translations`) · `ldir` = FR via `quran_words.lemma_id`
direct · `lmap` = FR via `word_lemma_mapping` · `en` = fallback EN · `unres` = sans
aucune donnée. Toutes les valeurs proviennent de la DB actuelle, via le chemin réel.

| Surah | Nom | Ayahs | Formes | FR | ldir | lmap | EN | unres | Readiness | Leçons | LW |
|------:|-----|------:|-------:|---:|-----:|-----:|---:|------:|-----------|---:|---:|
| 1 | Al-Fātiḥah | 7 | 26 | 25 | 1 | 0 | 0 | 0 | **REFERENCE** | 8 | 56 |
| 93 | Aḍ-Ḍuḥā | 11 | 36 | 34 | 0 | 2 | 0 | 0 | **READY** | 11 | 73 |
| 94 | Ash-Sharḥ | 8 | 24 | 23 | 0 | 1 | 0 | 0 | **READY** | 8 | 52 |
| 95 | At-Tīn | 8 | 34 | 34 | 0 | 0 | 0 | 0 | **READY** | 8 | 60 |
| 97 | Al-Qadr | 5 | 27 | 27 | 0 | 0 | 0 | 0 | **READY** | 5 | 43 |
| 99 | Az-Zalzalah | 8 | 30 | 28 | 2 | 0 | 0 | 0 | **READY** | 8 | 58 |
| 100 | Al-ʿĀdiyāt | 11 | 35 | 35 | 0 | 0 | 0 | 0 | **READY** | 11 | 73 |
| 101 | Al-Qāriʿah | 11 | 29 | 28 | 1 | 0 | 0 | 0 | **READY** | 11 | 64 |
| 102 | At-Takāthur | 8 | 20 | 20 | 0 | 0 | 0 | 0 | **READY** | 8 | 46 |
| 103 | Al-ʿAṣr | 3 | 13 | 13 | 0 | 0 | 0 | 0 | **READY** | 3 | 18 |
| 104 | Al-Humazah | 9 | 32 | 32 | 0 | 0 | 0 | 0 | **READY** | 9 | 64 |
| 105 | Al-Fīl | 5 | 22 | 21 | 0 | 1 | 0 | 0 | **READY** | 5 | 38 |
| 106 | Quraysh | 4 | 17 | 16 | 1 | 0 | 0 | 0 | **READY** | 4 | 27 |
| 107 | Al-Māʿūn | 7 | 23 | 23 | 0 | 0 | 0 | 0 | **READY** | 7 | 47 |
| 108 | Al-Kawthar | 3 | 10 | 10 | 0 | 0 | 0 | 0 | **READY** | 3 | 17 |
| 109 | Al-Kāfirūn | 6 | 19 | 19 | 0 | 0 | 0 | 0 | **READY** | 6 | 38 |
| 110 | An-Naṣr | 3 | 18 | 15 | 2 | 1 | 0 | 0 | **READY** | 3 | 26 |
| 111 | Al-Masad | 5 | 22 | 22 | 0 | 0 | 0 | 0 | **READY** | 5 | 38 |
| 112 | Al-Ikhlāṣ | 4 | 13 | 13 | 0 | 0 | 0 | 0 | **READY** | 4 | 25 |
| 113 | Al-Falaq | 5 | 17 | 17 | 0 | 0 | 0 | 0 | **READY** | 5 | 33 |
| 114 | An-Nās | 6 | 17 | 17 | 0 | 0 | 0 | 0 | **READY** | 6 | 37 |

**Toutes les sourates : 100 % FR effectif, 0 EN, 0 non résolue.**

---

## D. Resolver audit — chemin exact

Le resolver réel (`resolveWordMeanings`, `lib/learning/language.ts`) applique la
précédence documentée :

```
FORME (word_translations FR validée)
  → sinon LEMME (getValidatedFrenchLemmaMeaningsByWord : quran_words.lemma_id DIRECT
     prioritaire, puis word_lemma_mapping confidence=safe)
  → sinon fallback EN (quran_words.meaning)
  → sinon null
```

Vérifications ciblées (code réel, aucune modification) :

| Cas | Forme | Résultat |
|---|---|---|
| FR direct | إِنَّ | `lang=fr`, fallback=false, « certes / en vérité » |
| LEMME direct | ٱلْأَرْضُ | `lang=fr`, fallback=false, « terre » |
| LEMME via mapping | رَبِّكَ | `lang=fr`, fallback=false, « Seigneur / maître » |
| EN-only (hors catalogue) | بَنَىٰهَا (91) | `lang=en`, fallback=true, « He constructed it » |
| Sans aucune donnée | — | 0 cas dans le catalogue (bucket `unres=0`) |

---

## E. 93 / 94 / 105 / 110 — explication du statut réel

Les formes anciennement signalées « manquantes » sont en réalité résolues par le
**chemin LEMME via `word_lemma_mapping`**, que les audits 48/50 ne comptaient pas
(ils ne lisaient que `quran_words.lemma_id` direct).

| Sourate | Forme | word_id | Chemin | lemme | Traduction FR |
|---|---|---|---|---|---|
| 93 | رَبِّكَ | `c90fbdb2…` | word_lemma_mapping (safe) | `01021c14…` | « Seigneur / maître » |
| 93 | رَبُّكَ | `69821ea7…` | word_lemma_mapping (safe) | `01021c14…` | « Seigneur / maître » |
| 94 | رَبِّكَ | `c90fbdb2…` | word_lemma_mapping (safe) | `01021c14…` | « Seigneur / maître » |
| 105 | رَبُّكَ | `69821ea7…` | word_lemma_mapping (safe) | `01021c14…` | « Seigneur / maître » |
| 110 | رَبِّكَ | `c90fbdb2…` | word_lemma_mapping (safe) | `01021c14…` | « Seigneur / maître » |

- `رَبِّكَ` et `رَبُّكَ` ont `quran_words.lemma_id = NULL` (d'où le « faux gap » des
  anciens audits), mais un mapping `word_lemma_mapping` (confidence `safe`) vers le
  lemme `رَبّ` dont la glose FR validée est « Seigneur / maître ».
- Ces formes sont **partagées** : `رَبِّكَ` (93/94/110), `رَبُّكَ` (93/105).
- Résultat : `classifySurahReadiness(n, 100 %)` → `READY` pour chacune.

**Ce sont des FAUX GAPS** (catégorie B), pas des gaps éditoriaux. Aucun nouveau gap,
aucune écriture à prévoir pour ces 4 sourates.

---

## F. Validation post-Phases 47–50 (95 / 99 / 100 / 107)

| Sourate | Formes | FR direct | FR lemme | Résultat | Conformité |
|---:|---:|---:|---:|---|---|
| 95 At-Tīn | 34 | 34 | 0 | READY, 8 leçons, 60 LW | conforme Phase 47 |
| 99 Az-Zalzalah | 30 | 28 | 2 (lemme direct) | READY, 8 leçons, 58 LW | conforme Phase 48 |
| 100 Al-ʿĀdiyāt | 35 | 35 | 0 | READY, 11 leçons, 73 LW | conforme Phase 49 |
| 107 Al-Māʿūn | 23 | 23 | 0 | READY, 7 leçons, 47 LW | conforme Phase 50 |

107 : la glose `ٱلْمَاعُونَ` → « le moindre secours / l'ustensile » (ajoutée Phase 50)
est présente et résout la forme ; aucun fallback inattendu ; aucune modification depuis
Phase 50 (compteur `word_translations` FR = 415 inchangé).

---

## G. Catalogue ↔ curriculum

Pour les 21 sourates, vérifié :

- **1 parcours** par sourate, **1 unité**, **leçons = versets** (une par verset),
  toutes publiées.
- **0 mot étranger** à la sourate (lesson_words ⊆ formes de la sourate, 21/21).
- **0 doublon** de position (21/21).
- Aucun READY sans parcours, aucun parcours pour une sourate non READY.

**Aucune divergence.**

---

## H. Vrais gaps éditoriaux

### Dans le catalogue (21 sourates)

**Aucun** : 0 EN-only, 0 forme non résolue. Le backlog éditorial *interne au
catalogue* est **vide**.

### Hors catalogue (sourates courtes non seedées)

Réévaluées avec le même chemin (mapping inclus) — ce sont les seuls vrais candidats
éditoriaux restants :

| Sourate | Formes | FR | EN-only |
|---:|---:|---:|---:|
| 90 Al-Balad | 73 | 29 | 44 |
| 91 Ash-Shams | 48 | 8 | 40 |
| 92 Al-Layl | 62 | 15 | 47 |
| 96 Al-ʿAlaq | 59 | 16 | 43 |
| 98 Al-Bayyinah | 79 | 23 | 56 |

> Ces 5 sourates sont **HORS_CATALOGUE** (aucun `learning_path`) : ce ne sont PAS des
> `IN_PREPARATION` (qui exige un parcours seedé). Elles constituent le futur backlog
> éditorial, à décider séparément (aucune Phase 54 automatique).

---

## I. Fallback EN

- **Dans le catalogue (21 sourates) : 0 forme.**
- Hors catalogue : les formes EN-only listées en §H (44/40/47/43/56 par sourate).
- Exemple concret : `بَنَىٰهَا` (91) → fallback EN « He constructed it ».

---

## J. Shared word IDs (impact multi-sourates)

**42 formes** sont partagées entre ≥ 2 sourates du catalogue. Une future modification
éditoriale sur l'une de ces formes affecterait plusieurs sourates. Principales :

| Forme | Sourates | Occurrences |
|---|---|---:|
| فِى | 97,100,101,104,105,110,111,113,114 | 9 |
| مَا | 93,97,99,100,101,104,109,113 | 8 |
| إِذَا | 93,99,100,110,113 | 5 |
| ٱلَّذِينَ | 1,95,103,107 | 4 |
| إِنَّ | 94,100,103,108 | 4 |
| مِّن | 97,105,106,111 | 4 |
| قُلْ | 109,112,113,114 | 4 |
| ٱللَّهِ | 1,104,110 | 3 |
| أَلَمْ | 93,94,105 | 3 |
| رَبِّكَ | 93,94,110 | 3 |
| ٱلْإِنسَـٰنَ | 95,100,103 | 3 |
| … (31 autres à 2 sourates, dont رَبُّكَ 93/105) | | |

---

## K. Stabilité Phase 52 (3 exécutions consécutives)

| Run | Résultat | Durée | Parcours | READY | REFERENCE | IN_PREPARATION |
|---:|---|---:|---:|---:|---:|---:|
| 1 | ✅ succès | 1 312 ms | 21 | 20 | 1 | 0 |
| 2 | ✅ succès | 1 271 ms | 21 | 20 | 1 | 0 |
| 3 | ✅ succès | 1 252 ms | 21 | 20 | 1 | 0 |

**3/3 succès, résultats identiques** → le chunking Phase 52 est stable.

---

## L. Tests

- `npx tsc --noEmit` ✅ (0 erreur)
- `npx eslint .` ✅ (0 erreur)
- `npx vitest run` → **743/743** (56 fichiers) — identique à la baseline Phase 52,
  aucun test modifié
- `npm run build` ✅ (Next.js 16.3.0, routes complètes)

---

## M. DB (compteurs, lecture seule)

| Table | Valeur | vs Phase 52 |
|---|---:|---|
| word_translations (FR validées) | 415 | identique |
| quran_words | 21 296 | identique |
| word_occurrences | 77 430 | identique |
| ayahs | 6 236 | identique |
| translations | 24 944 | identique |
| lemma_translations | 32 | identique |
| lemmas | 32 | identique |
| word_lemma_mapping | 184 | identique |
| sources | 6 | identique |
| linguistic_occurrences | 413 | identique |
| linguistic_segments | 796 | identique |
| linguistic_lemmas | 0 | identique |
| linguistic_roots | 0 | identique |
| word_explanations | 13 | identique |
| word_explanation_contexts | 1 | identique |
| learning_paths | 21 | identique |
| units | 21 | identique |
| lessons | 138 | identique |
| lesson_words | 933 | identique |

**Aucune divergence** (tous attendus).

---

## N. Non-régression

Confirmé explicitement : onboarding V2 inchangé (`CURRENT_ONBOARDING_VERSION = 2`,
`isOnboardingComplete`, migrations 0029/0030, sélection de sourate, accès catalogue) ·
curriculum inchangé · resolver inchangé · SRS inchangé · mastery inchangé · Daily Plan
inchangé · coach inchangé · explications inchangées · MASAQ inchangé · audio inchangé ·
traductions d'ayah inchangées · **DB inchangée**.

---

## Verdict

**`PHASE_53_CANONICAL_CATALOG_BASELINE_ESTABLISHED`**

Le catalogue est stable (3/3), la baseline est cohérente (0 mismatch, 0 divergence
catalogue↔curriculum, 0 divergence DB) : **21 parcours = 1 REFERENCE + 20 READY,
100 % FR effectif, 0 EN fallback**. Les seuls vrais gaps éditoriaux restants sont les
5 sourates **HORS_CATALOGUE** (90/91/92/96/98), clairement identifiés et sans aucune
action dans cette phase.

**STOP.** Aucune phase éditoriale, aucun seed, aucune correction, aucune migration,
aucune fonctionnalité lancée automatiquement.
