# PHASE 66 — AUDIT GLOBAL DU PIPELINE DE CONTENU & PRÉPARATION À L'INDUSTRIALISATION

**Verdict : `PHASE_66_GLOBAL_CONTENT_PIPELINE_AUDIT_COMPLETE`**

Audit **strictement READ-ONLY** — aucune écriture DB, aucun seed, aucun import MASAQ,
aucune glose, aucune explication, aucune modification de production, aucun commit, aucun push.
Toutes les valeurs proviennent de la **DB réelle** et du **resolver canonique réel**
(`resolveWordMeanings` → FORME → LEMME direct → LEMME via `word_lemma_mapping` → fallback EN).

---

## A. Baseline (tmp/phase66-baseline.json)

| Table | Valeur | | Table | Valeur |
|---|---:|---|---|---:|
| quran_words | 21 296 | | linguistic_occurrences | **611** |
| word_occurrences | 77 430 | | linguistic_segments | **1 188** |
| ayahs | 6 236 | | word_explanations | **13** |
| translations | 24 944 | | word_explanation_contexts | **1** |
| lemmas | 32 | | learning_paths | **24** |
| lemma_translations | 32 | | units | 24 |
| word_lemma_mapping | 184 | | lessons | **191** |
| word_translations | 538 | | lesson_words | **1 307** |
| — FR validées | **538** | | review_items / user_word_progress / user_activity_lessons | 23 / 23 / 8 |
| sources | 6 | | | |

Conforme aux valeurs attendues post-Phase 63 (aucune divergence).

## B. Resolver

Chemin 100 % runtime réutilisé (pas de logique parallèle) : `getValidatedFrenchMeanings`
(FORME), `getValidatedFrenchLemmaMeaningsByWord` (LEMME direct puis via mapping),
`resolveWordMeanings`, `classifySurahReadiness`, `getSurahCatalog` (le catalogue est une
conséquence du système, pas une source de vérité indépendante). **0 forme non résolue
dans les 114 sourates** (les 20 480 formes sans FR ont toutes le fallback EN Quran.com ;
`unresolved = 0`).

## C. Couverture lexicale globale (tmp/phase66-global-coverage.json, phase66-surah-matrix.csv)

- **114 sourates** analysées : 6 236 ayahs · 77 430 occurrences · 21 296 word_ids distincts.
- **23 sourates READY** (100 % FR via le resolver) : 87, 91, 93, 94, 95, 96, 97, 99, 100,
  101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114.
- **91 sourates IN_PREPARATION** — couverture réelle maximale d'une sourate hors READY :
  **42 %** (90 Al-Balad) ; les grandes sourates sont à 7–14 % (2 : 7 %, 3 : 9 %, 4 : 8 %…).
- Toutes les sourates READY sont déjà dans le catalogue (23 READY + 1 REFERENCE = 24
  parcours) : **aucune sourate « READY sans parcours »**.

## D. Gloses manquantes — le chiffre stratégique (tmp/phase66-missing-glosses.json, unique-gloss-needs.json)

| Métrique | Valeur |
|---|---:|
| Manquantes **brutes** (somme par sourate) | **41 665** |
| **Nouvelles gloses uniques réellement nécessaires** (dédup word_id, chiffre stratégique) | **20 480** |
| dont **HIGH** (≥ 6 sourates ou très fréquentes) | **1 170** |
| dont MEDIUM | **4 907** |
| dont LOW (queue longue sourate-spécifique) | **14 403** |
| EN-only (fallback Quran.com) | 20 480 |
| Non résolues | **0** |
| Sources 4/4 (Hamidullah 31 · Kazimirski 9001 · Sahih 20 · Piccardo 153) | **20 480 / 20 480** |

Classification des formes (heuristique dédiacritisation documentée, best-effort) :
**LEXICAL 18 309 · GRAMMATICAL 93 · CLITIC_PARTICLE 2 078**. Les HIGH se répartissent
54 grammaticaux / 250 clitiques / 866 lexicaux.

## E. Propagation (tmp/phase66-propagation.json)

- **538 gloses FR validées** existantes → **299 multi-sourates** (55 %).
- Impact max : `مَا` → **90 sourates / 710 occurrences** ; `فِى` → 89 ; `إِنَّ` → 87 ;
  `مِن` → 81 ; `عَلَىٰ` → 75.
- **Aucune propagation artificielle** : mesurée uniquement, par word_id partagé, via le resolver réel.

## F. Matrice de readiness 114 sourates (tmp/phase66-surah-matrix.csv)

23 READY · 91 IN_PREPARATION · 1 REFERENCE (sourate 1, état REFERENCE — attendu).
Aucune anomalie : aucune sourate du catalogue hors READY/REFERENCE.

## G. Couverture MASAQ (tmp/phase66-masaq-coverage.json)

| Statut | Sourates |
|---|---:|
| **MASAQ_COMPLETE** (importées, couverture runtime réelle) | **20** (dont 91 : 54/116, 87 : 72/137, 96 : 72/139) |
| **MASAQ_IMPORT_READY** (plan 0 AMBIGUOUS/0 MISSING/0 EXTRA, prêt à importer) | **54** |
| **MASAQ_BLOCKED** (classifieur refuse) | **40** |

Total DB : 611 occurrences / 1 188 segments (inchangé). Le plan de chaque sourate est
calculé avec le pipeline canonique `buildImportPlan` + `assertPlanScope` (version actuelle
des classifieurs — règles A′/B2 de la Phase 65 incluses).

## H. Importabilité MASAQ (tmp/phase66-masaq-importability.json)

- **54 sourates immédiatement importables** : 8 (1 233 occ / 2 505 seg), 9 (2 498/5 131),
  13, 22, 28, 29, 31, 32, 34, 36, 39, 45, 46, 47, 49, 50, 51, 52, 53, 54, 55, 56, 58,
  61, 62, 63, 65, 66, 67, 68, 69, 70, 71, 73, 74, 76, 77, 78, 79, 80, 82, 83, 84, 85,
  86, 88, 89, 90, 92, 95, 98, 99, 100, 107.
- **40 bloquées** : toutes avec des cas `AMBIGUOUS` (241 au total) ; 12 avec des
  `MISSING`, 1 avec `EXTRA` (2:17:14…). Liste : 2, 3, 4, 5, 6, 7, 10, 11, 12, 14, 15,
  16, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 30, 33, 35, 37, 38, 40, 41, 42, 43, 44,
  48, 57, 59, 60, 64, 72, 75, 81.
- Principe conservé : `AVAILABLE ≠ INFERABLE` — aucune transformation automatique des
  ambiguïtés restantes (précédent des Phases 64/65 pour la réduction documentée).

## I. Couverture explications (tmp/phase66-explanations.json)

- **13 explications actives FR** (`is_validated=true`, langue fr) · **1** avec contexte.
- Répartition par sourate : seules 1–5 en possèdent (2–4 chacune) ; **0 pour 91/87/96**
  et pour toutes les autres sourates. L'héritage par word_id partagé est distingué :
  aucune explication n'est spécifiquement rédigée pour les sourates récentes.

## J. Priorités explications (tmp/phase66-editorial-priority.json)

Couche d'enrichissement distincte du lexique : la priorité est donnée aux formes
lexicales importantes, polysémiques et récurrentes (les HIGH les plus partagées sont
d'abord des mots-outils — traitement grammatical dédié, pas d'explication systématique).
Classement HIGH / MEDIUM / LOW / NO_EXPLANATION_NEEDED produit par sourate et par forme.

## K. Coût éditorial global

| | |
|---|---:|
| Formes manquantes brutes | 41 665 |
| Word_ids manquants uniques | 20 480 |
| **Nouvelles gloses réellement nécessaires** | **20 480** |
| HIGH | 1 170 |
| MEDIUM | 4 907 |
| LOW | 14 403 |

## L. Impact des word_ids partagés (tmp/phase66-propagation.json)

Le ratio **impact/coût** est maximal pour les mots-outils partagés : une glose `مِّنَ`
(63 sourates, 281 occurrences) ou `بِمَا` (61 sourates) vaut des dizaines de gloses
spécifiques. Les 10 meilleures interventions (par impact) sont toutes des formes
fonctionnelles — **le lot HIGH partagé est le levier éditorial n° 1**.

## M. Classement des sourates & simulation de déblocage (tmp/phase66-batch-plan.json)

Simulation READ-ONLY « si on valide un lot, combien de sourates passent READY ? » :

| Lot (gloses) | Sourates READY |
|---|---:|
| Actuel | 23 |
| + HIGH (1 170) | 23 (aucune nouvelle — relève le plancher de toutes) |
| + HIGH + MEDIUM (6 077) | 23 |
| + TOUTES (20 480) | **113** (toutes sauf 1 = REFERENCE) |

**Conclusion stratégique** : la readiness d'une sourate est dominée par ses mots
spécifiques — il n'existe **pas de raccourci par les formes partagées** pour les sourates
non READY (aucune sourate n'est entre 43 % et 100 %). Le workflow éditorial sourate-par-sourate
(Al-Fātiḥah) reste nécessaire ; le lot HIGH partagé en réduit le coût unitaire et doit être
traité en premier.

## N. Recommandations de lots (tmp/phase66-batch-plan.json)

| Lot | Contenu | Taille | Immédiatement industrialisable ? |
|---|---|---|---|
| **E — MASAQ** | Import des 54 sourates importables via le mécanisme existant (`SURAH=… APPLY=1`) | 54 sourates | ✅ OUI — 0 jugement éditorial, idempotent |
| **A — HIGH partagé** | 1 170 gloses (mots-outils + formes fréquentes) | 1 170 | 🖋 workflow Al-Fātiḥah (dossier 4 traductions) |
| **B — HIGH spécifique** | 0 (aucune forme HIGH n'est spécifique) | 0 | — |
| **C — MEDIUM** | 4 907 gloses | 4 907 | 🖋 |
| **D — LOW** | 14 403 gloses (queue longue) | 14 403 | 🖋 |
| **F — MASAQ bloqué** | 40 sourates, 241 AMBIGUOUS | 241 cas | 🔬 phases classifieur (précédent 64/65) |
| **G — Explications** | 13 existantes ; à rédiger par priorité | — | 🖋 |

## O. Readiness curriculum (tmp/phase66-curriculum-readiness.json)

- 24 parcours · 1 REFERENCE + 23 READY · 191 leçons · 1 307 lesson_words.
- **0 sourate READY sans parcours** (aucun seed supplémentaire possible avant nouvelles gloses).
- Le seed batch reste idempotent et sera exécuté quand de nouvelles sourates passeront READY.

## P. Risques

1. **Volume éditorial** : 20 480 gloses = effort humain majeur ; le lot HIGH partagé
   (1 170) est le seul levier de propagation large et doit précéder les lots suivants.
2. **MASAQ** : 241 ambiguïtés résiduelles bloquent 40 sourates — réduction par phases
   classifieur documentées (jamais `INFERABLE` automatique).
3. **Explications** : couche quasi vide (13) — chantier éditorial distinct, ne bloque
   aucune readiness (la glose FR reste le critère principal).
4. **Performances d'audit** : les requêtes paginées avec jointures 3 niveaux (~6 min) ont
   été remplacées par des jointures en mémoire (~1 min) — à retenir pour le pipeline.

## Q. Workflow industriel recommandé

1. **Pipeline d'audit unique** (déjà écrit : `tmp/phase66-audit.ts`, reproductible et
   idempotent, md5 stable sur exécutions successives) → à promouvoir en `scripts/content-audit.ts`.
2. **Couche MASAQ en masse** : loop `SURAH=… APPLY=1` sur les 54 sourates importables,
   vérification runtime `getWordLinguisticEvidence` + audit de propagation après chaque lot.
3. **Couche lexicale par lots** : lot A (HIGH partagé) via le dossier éditorial généré
   automatiquement (4 traductions des mêmes ayahs → noyau sémantique → glose Hikma),
   puis déblocage sourate-par-sourate des candidates restantes (90, 84, 82, 98, 85, 92…).
4. **Vérification standardisée** : `tmp/phase66-verification.ts` (compteurs strictement
   identiques avant/après) + tsc/eslint/vitest/build après chaque écriture.
5. **Réduction des ambiguïtés MASAQ** par phases classifieur dédiées (précédent 64→65).

## R. Conclusions — réponses aux 13 questions

1. **Gloses uniques nécessaires** : **20 480** (41 665 brutes).
2. **HIGH / MEDIUM / LOW** : **1 170 / 4 907 / 14 403**.
3. **Sourates READY par propagation seule** : **0 nouvelle** (23 déjà READY, toutes au catalogue).
4. **Sourates nécessitant de nouvelles gloses** : **91** (toutes les non-READY).
5. **Sourates MASAQ-complete** : **20**.
6. **Sourates immédiatement importables MASAQ** : **54**.
7. **Sourates bloquées par le classifieur** : **40** (241 AMBIGUOUS).
8. **Sourates avec explications** : 5 (1–5) ; **0 pour 91/87/96**.
9. **Sourates nécessitant des explications prioritaires** : toutes les sourates
   débloquées/à débloquer (couche séparée, priorité aux formes HIGH partagées).
10. **Top 20 interventions impact/coût** : 20 480 classées par impact (cf.
    `phase66-editorial-priority.json` ; le top 10 est dominé par les mots-outils —
    `مِّنَ` 63 sourates, `بِمَا` 61, `وَهُوَ` 53…).
11. **Meilleurs lots** : E (MASAQ, 54 sourates, immédiat) → A (HIGH partagé, 1 170) →
    déblocage sourate-par-sourate → C → D.
12. **Sourates déblocables par un seul batch** : **0** par le lot HIGH seul (le plancher
    monte mais aucune sourate n'atteint 100 %) ; le déblocage reste par-sourate (chaque
    sourate = ~40–60 gloses spécifiques en plus des partagées).
13. **Architecture pipeline** : audit idempotent réutilisable (ce script) + import MASAQ
    par lot + dossier éditorial généré automatiquement + vérification DB/tests standardisée
    — le traitement par lots remplace la répétition manuelle par phase.

## Non-régression

| Validation | Résultat |
|---|---|
| `tsc --noEmit` | ✅ 0 erreur |
| `eslint .` | ✅ 0 erreur |
| `vitest run` | ✅ **753/753** |
| `npm run build` | ✅ OK |
| Compteurs DB avant/après | ✅ **strictement identiques** (7 exécutions, md5 stable) |
| Idempotence (2 exécutions consécutives) | ✅ **identique** (md5 `7f93ea7c…`) |
| Readiness / catalogue / MASAQ / SRS | ✅ inchangés |

## Artefacts

`tmp/phase66-{baseline, global-audit, global-coverage, surah-matrix.csv, missing-glosses,
unique-gloss-needs, propagation, masaq-coverage, masaq-importability, explanations,
editorial-priority, batch-plan, curriculum-readiness, audit.ts, verification.ts}`.

**STOP.** Aucune écriture, aucun seed, aucun import, aucune Phase 67 lancée automatiquement.
Aucun commit, aucun push.
