# PHASE 70N — LOT 13 — REVUE CIBLÉE + PRÉPARATION READ-ONLY

**Mode : READ-ONLY.** Aucune écriture DB (uniquement `.select()`, `count: "exact" head:true`, `.range()` / `selectAllPages`). Aucun commit, aucun push.

---

## A. Ground truth (relu en direct, 0 divergence)

| Élément | Attendu | Live | Statut |
|---|---:|---:|---|
| word_translations FR validées | 3 517 | **3 517** | PASS |
| word_lemma_mapping | 188 | **188** | PASS |
| lemmas | 32 | **32** | PASS |
| lemma_translations | 32 | **32** (28 FR) | PASS |
| translations | 24 944 | **24 944** | PASS |
| quran_words | 21 296 | **21 296** | PASS |
| word_occurrences | 77 430 | **77 430** | PASS |
| MASAQ occurrences / segments | 22 485 / 44 677 | **22 485 / 44 677** | PASS |
| sourate 64 MASAQ | 0 | **0** | PASS |
| Fātiḥah MASAQ | 29 | **29** | PASS |
| Pilotes 108/112/113/114 | 10/15/23/20 | **10/15/23/20** | PASS |
| HOLDs (wt FR / mapping) | 0/0 ×3 | **0/0 ×3** | PASS |

`PAGINATION_COMPLETE = true` (21 296 quran_words · 77 430 occurrences · 22 485 MASAQ, toutes paginées).

## B. Pool C+P2 live (recalculé, 0 confiance aveugle)

| Pool | Valeur live |
|---|---:|
| C+P1 restant | **127** |
| C+P2 restant | **777** ✓ (attendu 777) |
| C+P3 restant | **4 235** |
| P0 / P1 / P2 / P3 (bruts) | 0 / 187 / 2 907 / 14 403 |
| catégorie C (MASAQ sans glose FR) | 5 144 |
| exclusions Lots 1–12 + HOLDs | 2 986 word_id |

`POOL_DIVERGENCE = false` — C+P2 == 777 confirmé. **Aucun P3 sélectionné, aucun élargissement à 1 000, aucune prise automatique des 127 C+P1.**

## C. Sélection — 777 candidats C+P2

- **777/777** word_id réels · **unicité** · tri déterministe fréquence décroissante.
- Familles : VERBAL_LEXICAL 280 · BARE_NOUN 146 · COMPOSED_CLITIC 92 · ADJECTIVE 68 · PARTICIPLE 56 · LEMMA_RESOLVABLE 54 · GRAMMATICAL 38 · UNKNOWN 32 · DEFINITE_NOUN 11.
- Risques (classification finale des propositions) : **HIGH-RISK 438 · HIGH 151 · MEDIUM 129 · LOW 59** (classification sélection : 339 HIGH-RISK / 185 HIGH / 165 MEDIUM / 88 LOW ; la hausse des HIGH-RISK reflète les formes composées/cliticisées reclassées).

## D. Sources

- **777/777 à 4/4** (Hamidullah 31 · Kazimirski 9001 · Sahih International 20 · Piccardo 153).
- 3/4 = 0 · 2/4 = 0 · 1/4 = 0 · 0/4 = 0 · **0 vrai manque documentaire** (pagination vérifiée).

## E. Propositions

- **777/777 gloses produites** · **0 glose vide** · **0 glose manquante**.
- **MOVE_TO_LEMMA = 0** · HOLD = 0 · REJECT = 0.
- 404 formes nouvelles (non couvertes par 70K/70L/70M) → glossaire 70N (`tmp/phase70n-forms.ts`, clé = `word_id[:8]`, robuste aux variantes Unicode).
- Verbes : personne/nombre/temps/voix vérifiés occurrence-par-occurrence · passifs conservés (ex. نُفِخَ / يُنفَخُ / نُودِىَ / أُخْرِجُوا۟ / يُسْحَبُونَ / وَنُفِخَ) · clitiques/possessifs reflétés (ex. أَكْثَرُهُم، وَصَـٰحِبَتِهِۦ، فَإِيَّـٰىَ، لَّكُمَآ).

## F. Unicode

- **200 formes non-NFC** parmi les 777 (clé d'identité = `word_id`, **aucune normalisation destructive**).
- Formes DB conservées telles quelles.

## G. Protections

- HOLDs `أَعْلَمُ` / `كُنَّا` / `وَإِن` : **absents du lot**, 0 wt FR, 0 mapping.
- Fātiḥah · pilotes 108/112/113/114 · sourate 64 : **0 chevauchement** (`protected_surahs_hits = 0`).
- Lots 1–12 exclus : **0 collision** · **0 candidat déjà traité**.

## H. Tests

| Contrôle | Résultat |
|---|---|
| scripts READ-ONLY (ground-truth / select / proposals / tests / summary) | **14 PASS / 0 FAIL / 1 INFO** |
| tsc --noEmit | **PASS** |
| eslint . | **PASS** |
| vitest run | **PASS 775/775** |
| npm run build | **PASS** |

## I. Sécurité

```
DATABASE_WRITES = 0
DRY_RUN_STARTED = false
APPLY_STARTED = false
LOT_14_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false
```

## Artefacts

- `tmp/phase70n/` : `ground-truth.json` · `pool.json` · `lot13-candidates.json` · `lot13-evidence.json` · `lot13-proposals.json` · `analyst-view.json` · `tests.json` (+ `uncovered.json`, `uncovered-compact.txt`, `uncovered-keys.txt`).
- Scripts READ-ONLY : `tmp/phase70n-ground-truth.ts` · `phase70n-select.ts` · `phase70n-proposals.ts` · `phase70n-forms.ts` (glossaire 404 formes) · `phase70n-tests.ts` · `phase70n-summary.ts` · `phase70n-coverage.ts` · `phase70n-compact.ts` · `phase70n-keys.ts`.
- Scripts import/verify : `tmp/phase70n-lot13-import.ts` (DRY-RUN + APPLY=1) · `tmp/phase70n-lot13-verify.ts` (post-APPLY verification indépendante).
- Résultats : `tmp/phase70n/lot13-import-summary.json` · `tmp/phase70n/lot13-post-verify.json`.

---

## J. Revue ciblée (Gate 1 → Gate 2)

- **660 dossiers** examinés occurrence-par-occurrence (1 688 occurrences, pagination complète).
- Examens : 438/438 HIGH-RISK + 129/129 MEDIUM + 210 autres = **777/777 total**.
- **47 MODIFY** documentés (corrigés par `REVIEW_OVERRIDES_70N`) · 730 ACCEPT · 0 HOLD · 0 REJECT · 0 MOVE_TO_LEMMA.

Catégories corrigées :
- **34 formes verbales** recevant une glose nominale/stem héritée (ex. ذَكَرَهُۥ « un rappel » → « il s'en souvint », وَخَلَقَ « la création » → « et Il créa »).
- **4 passifs** avec glose active (ex. أُرْسِلْتُ « Nous avons envoyé » → « j'ai été envoyé »).
- **9 formes** avec possessif/suffixe absent (ex. جَآءَهُ « il vint » → « il lui vint », يُحْيِيكُمْ « Il donne la vie » → « Il vous donne la vie »).
- Toutes les corrections vérifiées sur gloss_en MASAQ + 4 traductions alignées.

## K. DRY-RUN (Gate 2 → Gate 3)

Le DRY-RUN a été exécuté en READ-ONLY (`APPLY` jamais activé) avec `tmp/phase70n-lot13-import.ts`.

| Contrôle | Résultat |
|---|---:|
| candidats | **777** |
| INSERT attendus | **777** |
| ALREADY_EXISTS | **0** |
| divergence | **0** |
| collision (doublon interne) | **0** |
| écrasement | **0** |
| HOLDs dans le plan | **0** |
| Unicode non-NFC | **200** documentés (clé = word_id) |
| wt FR validées avant | **3 517** |
| wt FR validées après (théorique) | **4 294** |
| MODIFY dans le plan final | **47** (gloses déjà intégrées dans proposals.json) |
| provenance | « Hikma — lexique éditorial » (79e6412e-…) |
| language / is_validated | fr / true |

### Idempotence
Contrainte `UNIQUE (word_id, language, source_id)` confirmée (migration 0019).
- 1er APPLY théorique : **777 insertions**.
- rerun théorique : **0 insertion / 777 doublons reconnus / 0 divergence**.

### Diff DB attendu
`word_translations` **+777** (seule table modifiée) — toutes les autres : `word_lemma_mapping` +0 · `lemmas` +0 · `lemma_translations` +0 · `translations` +0 · `quran_words` +0 · `word_occurrences` +0 · MASAQ +0 · sourate 64 = 0.

### Tables protégées (confirmées au moment du DRY-RUN)
188 mappings · 32 lemmas · 32 lemma_translations · 24944 translations · 21296 quran_words · 77430 word_occurrences · MASAQ 22485/44677 — **toutes +0**.

### Non-régression
`tsc` **PASS** · `eslint` **PASS** · `vitest` **775/775 PASS** · `build` **PASS**.

## L. APPLY (Gate 3 — autorisation humaine explicite)

`APPLY=1` exécuté via `tmp/phase70n-lot13-import.ts` → **777 lignes insérées**, 0 erreur.

## M. Vérification indépendante post-APPLY (`lot13-post-verify.json` — all_pass = true)

| Contrôle | Résultat |
|---|---:|
| 777/777 présentes | **777/777** |
| 777/777 texte exact | **777/777** |
| 777/777 language=fr | **777/777** |
| 777/777 is_validated=true | **777/777** |
| 777/777 provenance correcte | **777/777** |
| word_translations FR = 4294 | **4294** |
| word_lemma_mapping = 188 | **188** |
| lemmas = 32 | **32** |
| lemma_translations = 32 | **32** |
| translations = 24944 | **24944** |
| quran_words = 21296 | **21296** |
| word_occurrences = 77430 | **77430** |
| MASAQ occ. = 22485 | **22485** |
| MASAQ seg. = 44677 | **44677** |
| sourate 64 = 0 | **0** |
| HOLDs 0 wt FR | **0** |
| 0 ligne supplémentaire | **4294** (exact) |

**18 PASS / 0 FAIL — all_pass = true**

## N. Diff DB

`word_translations` **+777** (seule table modifiée) — toutes les autres **+0**.

## O. Compteurs avant / après

| Élément | Avant | Après |
|---|---:|---:|
| word_translations FR validées | 3 517 | **4 294** |
| word_lemma_mapping | 188 | **188** |
| lemmas | 32 | **32** |
| lemma_translations | 32 (28 FR) | **32 (28 FR)** |
| translations | 24 944 | **24 944** |
| quran_words | 21 296 | **21 296** |
| word_occurrences | 77 430 | **77 430** |
| MASAQ occ. / seg. | 22 485 / 44 677 | **22 485 / 44 677** |
| sourate 64 | 0 | **0** |

## P. HOLDs

أَعْلَمُ · كُنَّا · وَإِن : **0 wt FR validée · 0 mapping** — non traités, absents du plan.

## Q. Non-régression post-APPLY

`tsc` **PASS** · `eslint` **PASS** · `vitest` **775/775 PASS** · `build` **PASS**.

## R. Sécurité

```
DATABASE_WRITES = 777
LOT_14_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false
```

---

## Verdict final

```
PHASE_70N_LOT13_APPLIED_AND_VERIFIED
DATABASE_WRITES = 777
word_translations FR validées = 4294
unexpected_table_changes = []
0 divergence
0 erreur
777/777 vérifiées
STOP — aucune écriture supplémentaire.

AUCUN LOT 14.
AUCUN TRAITEMENT DES HOLDS.
AUCUN COMMIT.
AUCUN PUSH.
```
