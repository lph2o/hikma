# PHASE 58 — AUDIT DU BACKLOG ÉDITORIAL POST-57 + SÉLECTION DE LA PROCHAINE SOURATE

**Statut : READ_ONLY — aucune écriture.** **Verdict : `PHASE_58_EDITORIAL_BACKLOG_AUDIT_COMPLETE_NEXT_SURAH_SELECTED`**

---

## A. Baseline réelle vérifiée (read-only)

| Compteur | Attente Phase 58 | Réel DB | Diagnostic |
|---|---:|---:|---|
| `quran_words` | 21 296 | 21 296 | ✅ |
| `translations` | 24 944 | 24 944 | ✅ |
| `word_translations` FR validées | 498 | 498 | ✅ |
| `lemmas` | 32 | 32 | ✅ |
| `word_lemma_mapping` | 184 | 184 | ✅ |
| `sources` | 6 | 6 | ✅ |
| `learning_paths` | 23 | 23 | ✅ |
| `units` | 23 | 23 | ✅ |
| `lessons` | 157 | **172** | ⚠️ attente obsolète — voir note |
| `lesson_words` | 1 074 | **1 176** | ⚠️ attente obsolète — voir note |

**Note sur lessons/lesson_words :** l'attente (157 / 1 074) était antérieure au seed Phase 57. La baseline réelle de Phase 56 était 153 / 1 035 ; le seed de 87 (19 leçons, 141 lesson_words) donne exactement 172 / 1 176. La chaîne est cohérente : `153+19=172` et `1 035+141=1 176`. Aucune anomalie de données — écart d'attente documenté, rien modifié.

**Catalogue :** 23 parcours (1 REFERENCE + 22 READY, 0 IN_PREPARATION), `getSurahCatalog` stable sur 3 exécutions (23 / 22 READY / 1 REFERENCE à chaque fois). **87 = READY** (69 formes, 69 FR, 100 %, 19 leçons). Aucun changement d'état hors 87.

---

## B. Résolver canonique utilisé

Chemin exact du runtime, vérifié forme par forme contre `resolveWordMeanings` (les helpers de production `getValidatedFrenchMeanings` / `getWordLemmaMappingsByWordIds` / `getValidatedFrenchLemmaMeaningsByWord` ont été réutilisés, jamais réimplémentés) :

```
FORME → GLOSE FR FORME → LEMME DIRECT → LEMME VIA word_lemma_mapping → EN FALLBACK → NON RÉSOLU
```

`quran_words.lemma_id` seul n'a jamais été utilisé. **0 incohérence** détectée entre la recomputation et le resolver réel (le script échoue sinon).

---

## C. Scan des 114 sourates

Résultat complet : `tmp/phase58-readiness-matrix.csv` (114 lignes) et `tmp/phase58-editorial-backlog.json` (`coverage`).

- **0 forme non résolue** dans tout le Coran ; 0 sourate hors catalogue cachée à 100 % FR ;
- **22 sourates READY au catalogue** (1 REFERENCE + 21 sourates) — cohérent ;
- Backlog HORS_CATALOGUE (sourates avec formes manquantes > 0) : les anciennes candidates proches **86 (40), 96 (40), 82 (41), 92 (43), 90 (44), 98 (54)** puis des sourates plus lourdes (84 : 58, 88 : 62, …).

## D. Propagations post-Phase 57 (recalculées, non supposées)

La Phase 57 a propagé **44 gloses** via les word_ids partagés. Delta mesuré vs baseline Phase 56 (artefact `tmp/phase56-editorial-backlog.json`) sur **79 sourates** (le delta complet est dans `tmp/phase58-editorial-backlog.json` → `propagation_vs_phase56` ; la Phase 57 n'avait documenté que les 4 candidates dans son rapport §R).

Candidates historiques affectées :

| Sourate | Manquantes avant 57 | Après 57 | Delta |
|---|---:|---:|---:|
| 82 Al-Infitar | 43 | 41 | **−2** (`بَلْ`, `شَآءَ`) |
| 92 Al-Layl | 45 | 43 | **−2** (`ٱلْأَشْقَى`, `لِلْيُسْرَىٰ`) |
| 86 At-Tariq | 41 | 40 | **−1** (`إِن`) |
| 96 Al-ʿAlaq | 41 | 40 | **−1** (`إِن`) |

Autres sourates du Coran ayant gagné (extrait) : Taha −11, An-Nisa −7, Al-An'am −7, An-Nahl −6, Al-Anbya −6, … Al-Baqarah −5. Aucune nouvelle READY hors 87, aucun changement d'état catalogue. **Aucune glose écrite pour provoquer ces propagations.**

## E. Backlog réel (candidates proches du catalogue)

| Sourate | Ayahs | Formes | FR | EN-only | Manq. | % | Spécifiques | Partagées | Gramm. | Répétées |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 86 At-Tariq | 17 | 55 | 15 | 40 | 40 | 27 % | 24 | 16 | 0 | 3 |
| **96 Al-ʿAlaq** | **19** | **59** | **19** | **40** | **40** | **32 %** | **24** | **16** | **4** | **2** |
| 82 Al-Infitar | 19 | 66 | 25 | 41 | 41 | 38 % | 20 | 21 | 1 | 3 |
| 92 Al-Layl | 21 | 62 | 19 | 43 | 43 | 31 % | 18 | 25 | 0 | 2 |
| 90 Al-Balad | 20 | 73 | 29 | 44 | 44 | 40 % | 23 | 21 | 1 | 5 |
| 98 Al-Bayyinah | 8 | 79 | 25 | 54 | 54 | 32 % | 14 | 40 | 2 | 7 |

(Aucune de ces sourates n'est au catalogue — toutes `IN_PREPARATION`, aucune n'est READY.)

## F. Disponibilité des 4 sources (mêmes ayahs)

Pour chaque forme manquante de chaque candidate, les 4 traductions des ayahs réels ont été vérifiées (31 Hamidullah FR, 9001 Kazimirski FR, 20 Sahih EN, 153 Piccardo IT) :

- **100 % des formes manquantes des 6 candidates ont les 4 références** (4/4). 0 forme à 3/4, 2/4, 1/4 ou 0/4.
- Invariant vérifié : aucune forme manquante sans source FR sur ses propres ayahs (sinon le script échoue).

`tmp/phase58-source-availability.json` — tous les compteurs par sourate.

## G. Formes grammaticales

Identifiées séparément (particules / prépositions / conjonctions / pronoms / clitiques) pour chaque candidate. Exemple s96 : `مِنْ`, `أَن`, `إِلَىٰ`, `لَئِن` (4 formes grammaticales — gloses courtes et sûres, cf. expérience Phases 55/57 avec `بَلْ`, `إِن`, `قَدْ`). s92 et s86 : 0 forme grammaticale. Aucune n'a été favorisée artificiellement pour sa simplicité — le classement n'intègre la grammaticalité qu'en information.

## H. Formes partagées et effets de bord

- **0 forme manquante partagée avec le catalogue** (les 6 candidates ont 0 word_id manquant présent dans un parcours READY/REFERENCE) → **aucun risque d'effet de bord** sur les 23 parcours existants.
- Formes partagées entre candidates : s96 en partage 16 avec d'autres sourates (dont `مِنْ`, `أَن`, `كَذَّبَ`, `لَّمْ`, `ٱقْرَأْ` avec d'autres candidates), s92 : 25.
- Matrice complète : `tmp/phase58-shared-word-ids.csv` (word_id → forme → sourates concernées → statut FR → catégorie).

## I. Classement (mêmes pondérations documentées que Phases 54/56)

Deux calculs, mêmes poids (`efficiency 0.3 · arbitrage 0.25 · synergy 0.15 · references 0.15 · simplicity 0.1 · pedagogy 0.05`) :

**1) Matrice principale — candidates proches du catalogue (convention Phases 54/56)** :

| Rang | Sourate | Manq. | Score |
|---:|---:|---:|---:|
| 1 | 92 Al-Layl | 43 | 52,7 |
| 2 | **96 Al-ʿAlaq** | **40** | **52,6** |
| 3 | 82 Al-Infitar | 41 | 50,1 |
| 4 | 86 At-Tariq | 40 | 50,0 |
| 5 | 90 Al-Balad | 44 | 40,3 |
| 6 | 98 Al-Bayyinah | 54 | 37,3 |

**Bruit du modèle :** s92 (52,7) et s96 (52,6) sont **statistiquement indiscernables** (écart 0,1 pt, sous le bruit du modèle ±0,2 pt constaté en Phase 56). Règle Phase 58 §12 appliquée : **priorité historique** — les Phases 54 et 56 classaient toutes deux **96 au-dessus de 92** (54 : 91 > 96 > 92 ; 56 : 87 > 96 > 92), et 96 Al-ʿAlaq porte la première révélation (`ٱقْرَأْ`), la plus forte valeur produit (« j'apprends ce que je récite »). Le score brut du modèle (calculé depuis les données actuelles, aucune estimation) est conservé tel quel ; c'est le critère historique qui départage à égalité.

**2) Diagnostic plein-pool (114 sourates, informationnel)** : l'élargissement du pool favorise les sourates courtes du Coran moyen (s62 Al-Jumu'ah : 95,3 avec **109 gloses** ; s98 : 95,0) — exactement le biais « courte > coût » interdit par la Phase 58 §11. Ce diagnostic est documenté, **non retenu** : le modèle n'a jamais été conçu pour comparer une sourate de 11 versets à Al-Baqarah (le poids « simplicité » est calibré sur des candidates comparables, Phases 54/56).

## J. Candidate recommandée — **96 Al-ʿAlaq**

- 40 gloses à produire (coût minimal du groupe, à égalité avec 86) ;
- 19 ayahs, 59 formes, 19 déjà FR (32 %) ;
- 40/40 formes manquantes avec les 4 références sur leurs ayahs ;
- 24 formes spécifiques + 16 partagées (dont 4 grammaticales) ;
- 0 effet de bord catalogue ; `classifySurahReadiness(96, 32 %)` = **IN_PREPARATION** (non-READY — conforme avant une phase d'écriture) ;
- valeur produit maximale (première révélation : « Lis ! » — sourate la plus récitée de l'islam, cohérente avec l'identité « j'apprends ce que je récite ») ;
- workflow 40C/41B/42B/55/57 applicable à l'identique.

## K. Vérification indépendante de la candidate (recalcul depuis zéro)

`tmp/phase58-verify-candidate.ts` + `tmp/phase58-candidate-verification.json` — requêtes fraîches, aucun chiffre réutilisé :

- 19 ayahs (DB) = 19 (import) · 72 occurrences · **59 formes distinctes**
- **19 FR effectifs · 40 EN-only · 0 non résolu · 40 manquantes · 32 %**
- **40/40 sources 4/4** (0 sans source FR) · 16 partagées · 24 spécifiques
- **IN_PREPARATION** · **absent du catalogue**
- Conforme au résultat principal (0 divergence).

## L. Vérification catalogue

`getSurahCatalog` × 3 : 23 parcours, 22 READY, 1 REFERENCE à chaque exécution ; 87 READY ; `non87_states = []` (aucun changement d'état hors 87). `tmp/phase58-catalog-verification.json`.

## M. Tests de non-régression (vs baseline Phase 57)

| Validation | Résultat |
|---|---|
| `npx tsc --noEmit` | ✅ 0 erreur |
| `npx eslint .` | ✅ 0 erreur |
| `npx vitest run` | ✅ **743/743** (identique) |
| `npm run build` | ✅ compilé, généré |

## N. Risques

- **Bruit du modèle s92/s96** : 0,1 pt d'écart — arbitré par la priorité historique (§12). Documenté, pas masqué.
- S92 reste l'alternative immédiate si 96 venait à bloquer (43 gloses, 0 grammatical, 2 répétées).
- Aucune écriture, aucune source modifiée, aucun commit/push.

## O. Ce qui n'a PAS été fait (conforme aux interdictions)

❌ Aucune glose écrite · ❌ aucun seed · ❌ aucune modification de `word_translations` / `lemma_translations` / resolver / `getSurahCatalog` / curriculum / onboarding / SRS / mastery / Daily Plan / coach / MASAQ / exercices / explications · ❌ `quran_words.lemma_id` seul jamais utilisé · ❌ aucune traduction d'ayah copiée comme glose · ❌ aucune fonctionnalité nouvelle · ❌ aucun commit/push.

## P. Verdict final

**`PHASE_58_EDITORIAL_BACKLOG_AUDIT_COMPLETE_NEXT_SURAH_SELECTED`**

- **Baseline réelle vérifiée** : 498 FR validés, 23 parcours (1 REFERENCE + 22 READY), 87 READY, compteurs cohérents ;
- **Propagations post-57 mesurées** : 82 −2, 92 −2, 86 −1, 96 −1 (candidates) + 75 autres sourates en léger gain ;
- **Backlog réel** : 6 candidates proches du catalogue (86/96/82/92/90/98), toutes 4/4 en sources, 0 effet de bord catalogue ;
- **Candidate sélectionnée : 96 — Al-ʿAlaq** (40 gloses nécessaires, 40/40 sources, IN_PREPARATION avant écriture) ;
- **Classement** : 96 > 92 > 82 > 86 > 90 > 98 (s92 et s96 à égalité statistique — priorité historique 96) ;
- **Tests** : tsc/eslint/vitest 743/743/build ✅ ;
- **DB inchangée** : lecture seule intégrale.

**Recommandation Phase 59** (à ne PAS lancer automatiquement) : déblocage éditorial canonique de 96 avec le workflow Al-Fātiḥah/40C/41B/42B/55/57 — dossier 40 formes → 4 traductions des mêmes ayahs → noyau → gloses validées → `word_translations` → `classifySurahReadiness(96, 100%)` → `seed:multisurah -- --surahs=96`.

**STOP.** Aucune Phase 59 lancée. Aucune écriture effectuée.

---

## Artefacts

- `PHASE_58_EDITORIAL_BACKLOG_AUDIT.md` (ce rapport)
- `tmp/phase58-editorial-backlog.json` · `tmp/phase58-readiness-matrix.csv` · `tmp/phase58-shared-word-ids.csv`
- `tmp/phase58-source-availability.json` · `tmp/phase58-priority-analysis.json` · `tmp/phase58-catalog-verification.json` · `tmp/phase58-candidate-verification.json`
- Scripts reproductibles : `tmp/phase58-audit.ts` · `tmp/phase58-verify-candidate.ts`
