# PHASE 56 — AUDIT DU BACKLOG ÉDITORIAL POST-55 ET SÉLECTION DE LA PROCHAINE SOURATE

**Verdict : `PHASE_56_EDITORIAL_BACKLOG_AUDIT_COMPLETE_NEXT_SURAH_SELECTED`**

**Sourate recommandée : 87 — Al-Aʿlā (ٱلْأَعْلَى)**

> Phase STRICTEMENT READ-ONLY. Aucune écriture DB (INSERT / UPDATE / DELETE /
> UPSERT / seed / migration), aucun changement runtime / resolver / SRS /
> mastery / Daily Plan / coach / onboarding / MASAQ / exercices / explications /
> curriculum de production. Aucun commit, aucun push. Seuls le rapport et des
> artefacts d'audit ont été produits.

---

## A. Baseline Phase 55 (vérifiée en lecture seule)

| Élément | Phase 55 | Phase 56 (re-vérifié) |
|---|---:|---:|
| word_translations FR validées | 454 | **454** ✅ |
| quran_words / word_occurrences / ayahs | 21 296 / 77 430 / 6 236 | identiques ✅ |
| translations / lemma_translations / word_lemma_mapping / sources | 24 944 / 32 / 184 / 6 | identiques ✅ |
| learning_paths / units / lessons / lesson_words | 22 / 22 / 153 / 1 035 | identiques ✅ |
| Catalogue | 22 parcours | 22 parcours (3/3 exécutions) ✅ |
| REFERENCE / READY / IN_PREPARATION | 1 / 21 / 0 | 1 / 21 / 0 ✅ |
| Ash-Shams (91) | READY, 48 formes, 100 % FR | READY, 48 formes, 100 % FR ✅ |

**Aucune divergence. La DB est dans l'état exact de la fin de Phase 55.**

## B. Catalogue canonique actuel

22 parcours = 1 REFERENCE (Al-Fātiḥah) + 21 READY (93, 94, 95, 97, 99–114, **91**)
+ 0 IN_PREPARATION. `getSurahCatalog()` : **3/3 succès** (~1,0–1,6 s), résultats
identiques.

## C. Sourates HORS_CATALOGUE — backlog réel (scan complet des 114 sourates)

Le scan complet (resolver réel, une passe) révèle le vrai backlog. **0 sourate
hors catalogue n'est à 100 % FR** (aucune candidate cachée) et **0 forme non
résolue** dans tout le Coran. Les sourates hors catalogue à plus petit backlog :

| Sourate | Manquantes | | Sourate | Manquantes |
|---:|---:|---:|---:|---:|
| 86 At-Tariq | 41 | | 92 Al-Layl | 45 |
| **96 Al-ʿAlaq** | 41 | | 98 Al-Bayyinah | 54 |
| 82 Al-Infitar | 43 | | 84 Al-Inshiqaq | 58 |
| **87 Al-Aʿlā** | 44 | | 88 Al-Ghashiyah | 63 |
| 90 Al-Balad | 44 | | 85 Al-Buruj | 69 |

> **Constats clés (données réelles > liste historique) :**
> 1. Les anciennes candidates 90/92/96/98 restent dans le haut du backlog.
> 2. **86/82/87 apparaissent désormais avec des backlogs égaux ou inférieurs**
>    (41/43/44) à 90/92/98 : l'audit ne doit PAS se limiter à la liste
>    historique (exigence §4 de la Phase 56).
> 3. **Effet Phase 55 mesuré** : la glose `وَٱلنَّهَارِ` (91:3) a propagé sur 92
>    via le word_id partagé → s92 est passée de 46 (Phase 54) à **45** manquantes.
> 4. 90 (44) et 96 (41) sont inchangées (aucune de leurs formes n'a été touchée
>    par les 39 gloses de 91).

## D. Matrice complète de couverture — les 7 candidates réelles

Chemin 100 % runtime (FORME → LEMME direct → LEMME via mapping → EN → NON
RÉSOLU), vérifié forme par forme contre `resolveWordMeanings`. `unres = 0`
partout.

| Sourate | Ayahs | Formes | FR | EN | Manquantes | % FR | Spécifiques | Partagées | dont candidats | Répétées (sourate) | Gramm. | Sources 4/4 | Readiness |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **86** At-Tariq | 17 | 55 | 14 | 41 | 41 | 25 % | 24 | 17 | 2 | 3 | 1 | 41/41 | IN_PREPARATION |
| **96** Al-ʿAlaq | 19 | 59 | 18 | 41 | 41 | 31 % | 24 | 17 | 5 | 3 | 5 | 41/41 | IN_PREPARATION |
| **82** Al-Infitar | 19 | 66 | 23 | 43 | 43 | 35 % | 20 | 23 | 3 | 3 | 2 | 43/43 | IN_PREPARATION |
| **87** Al-Aʿlā | 19 | 69 | 25 | 44 | 44 | 36 % | 14 | 30 | 5 | **1** | 2 | 44/44 | IN_PREPARATION |
| **90** Al-Balad | 20 | 73 | 29 | 44 | 44 | 40 % | 23 | 21 | 2 | 5 | 1 | 44/44 | IN_PREPARATION |
| **92** Al-Layl | 21 | 62 | 17 | 45 | 45 | 27 % | 18 | 27 | 4 | 2 | 0 | 45/45 | IN_PREPARATION |
| **98** Al-Bayyinah | 8 | 79 | 25 | 54 | 54 | 32 % | 14 | 40 | 2 | 7 | 2 | 54/54 | IN_PREPARATION |

## E. Analyse forme → lemme → mapping → EN

- **0 forme non résolue** dans les 7 candidates (comme partout).
- Les formes résolues FR le sont par glose FORME (majorité), lemme direct
  (ex. 96 : 3) et lemme via `word_lemma_mapping` (ex. 96 : 2) — le mapping est
  **toujours** inclus dans la résolution (jamais `quran_words.lemma_id` seul).
- Les formes manquantes sont toutes EN-only (`meaning` Quran.com, fallback).

## F. Analyse des occurrences et ayahs

Chaque forme manquante a été rattachée à ses occurrences réelles et à ses ayahs
(cf. `tmp/phase56-editorial-backlog.json` — champ détaillé par forme) ; pour
chaque candidate, le détail des ayahs est dans les artefacts.

## G. Disponibilité des 4 traductions (MÊMES ayahs)

| Sourate | Formes manquantes | 4/4 (Hamidullah·Kazimirski·Sahih·Piccardo) | Source manquante | Contexte insuffisant |
|---:|---:|---:|---:|---|
| 86 | 41 | **41/41** | 0 | 0 |
| 96 | 41 | **41/41** | 0 | 0 |
| 82 | 43 | **43/43** | 0 | 0 |
| 87 | 44 | **44/44** | 0 | 0 |
| 90 | 44 | **44/44** | 0 | 0 |
| 92 | 45 | **45/45** | 0 | 0 |
| 98 | 54 | **54/54** | 0 | 0 |

**Classe A (4/4) : 100 % des formes manquantes des 7 candidates.** Le dossier
documentaire est solide pour toutes (aucun cas classe B/C).

## H. Analyse grammaticale (formes à traiter avec prudence, jamais mécaniquement)

| Sourate | Formes grammaticales | Détail (heuristique : particules / prépositions / conjonctions / pronoms) |
|---:|---:|---|
| 86 | 1 | إِذَا |
| 96 | 5 | أَن · إِلَىٰ · مِنْ · لَّمْ · إِن |
| 82 | 2 | (particules, détail dans l'artefact) |
| 87 | 2 | إِن · بَلْ |
| 90 | 1 | (particule) |
| 92 | 0 | — |
| 98 | 2 | (particules) |

Ces formes sont **signalées** (§7) mais constituent des gloses simples (l'exemple
Phase 55 `قَدْ → « certes / vraiment »`, `إِذِ → « quand / lorsque »` le prouve) :
elles ne pénalisent pas la complexité dans le classement (cf. §L).

## I. Analyse des word_ids partagés

- **0 forme manquante des 7 candidates n'existe dans le catalogue** (les 22
  sourates READY/REFERENCE) — aucune glose future ne peut altérer un parcours
  existant (résolution uniforme par word_id, sanity = 0).
- 120+ formes manquantes sont partagées avec d'autres sourates **hors
  catalogue** : chaque glose écrite réduira mécaniquement le futur backlog de
  ces sourates (bénéfice documenté, jamais présenté comme modification
  volontaire).
- Les formes partagées **entre candidates** (synergie immédiate) : 96 (5),
  87 (5), 92 (4), 82 (3), 86 (2), 90 (2), 98 (2).

## J. Effets de bord potentiels

**Nul pour le catalogue existant.** Matrice complète par forme dans
`tmp/phase56-shared-word-ids.csv` (word_id → forme → sourates concernées → FR
manquante → partagée → catégorie). Aucune forme ne touche une sourate READY ;
les effets sont uniquement des réductions de backlog d'autres sourates hors
catalogue (positif).

## K. Coût éditorial réel

| Sourate | Gloses à produire | Spécifiques | Partagées | Répétées (arbitrage intra-sourate) | Coût relatif |
|---:|---:|---:|---:|---:|---|
| 86 | 41 | 24 | 17 | 3 | moyen |
| 96 | 41 | 24 | 17 | 3 | moyen (5 grammaticales = rapides) |
| 82 | 43 | 20 | 23 | 3 | moyen |
| **87** | 44 | 14 | 30 | **1** | **le plus léger en arbitrage** |
| 90 | 44 | 23 | 21 | 5 | moyen+ |
| 92 | 45 | 18 | 27 | 2 | moyen |
| 98 | 54 | 14 | 40 | 7 | le plus lourd |

Coût total du backlog complet restant (7 candidates) : **312 gloses** (dont les
5 formes partagées entre candidates réduisent le total à 307 word_ids uniques).

## L. Classement des candidates (matrice pondérée — mêmes poids documentés que Phase 54)

| Critère | Poids | Définition |
|---|---:|---|
| Coût éditorial (manquantes) | 30 % | 100 × (1 − manquantes / max) |
| Arbitrage (répétées dans la sourate) | 25 % | 100 × (1 − répétées / max) |
| Synergie (partage entre candidates) | 15 % | 100 × (partagées-candidats / manquantes) |
| Références 4/4 | 15 % | 100 × (4/4 / manquantes) |
| Simplicité (ayahs) | 10 % | 100 × (1 − ayahs / max) — jamais décisif |
| Pédagogie / identité produit | 5 % | 100 pour les 7 (juz ʿamma, sourates récitées) |

| Rang | Sourate | Manq. | Eff. | Arb. | Syn. | Réf. | Simp. | **Total** |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | **87 Al-Aʿlā** | 44 | 18,5 | **85,7** | 11,4 | 100 | 9,5 | **49,6** |
| 2 | 96 Al-ʿAlaq | 41 | **24,1** | 57,1 | **12,2** | 100 | 9,5 | 44,3 |
| 3 | 92 Al-Layl | 45 | 16,7 | 71,4 | 8,9 | 100 | 0 | 44,2 |
| 4 | 86 At-Tariq | 41 | **24,1** | 57,1 | 4,9 | 100 | 19,0 | 44,1 |
| 5 | 82 Al-Infitar | 43 | 20,4 | 57,1 | 7,0 | 100 | 9,5 | 42,4 |
| 6 | 90 Al-Balad | 44 | 18,5 | 28,6 | 4,5 | 100 | 4,8 | 33,9 |
| 7 | 98 Al-Bayyinah | 54 | 0 | 0 | 3,7 | 100 | 61,9 | 26,7 |

**Robustesse** : le peloton 96/92/86 (44,1–44,3) est **dans le bruit du modèle**
(±0,2 pt) ; 87 se détache clairement (+5,3 pts) grâce à un arbitrage quasi nul
(1 seule forme répétée dans la sourate → très peu de décisions de polysémie).
98, pourtant la plus courte (8 ayahs), est dernière : la courteur n'est pas
favorisée.

## M. Candidate recommandée — 87 Al-Aʿlā

## N. Justification détaillée

1. **Meilleur profil d'arbitrage** : 1 seule forme manquante répétée dans la
   sourate (vs 2–7 ailleurs) → quasi aucun arbitrage de polysémie intra-sourate.
2. **Coût contenu** : 44 gloses (14 spécifiques + 30 partagées), 69 formes,
   19 ayahs.
3. **Sources intégrales** : 44/44 formes avec les 4 traductions sur leurs ayahs.
4. **Synergie maximale partagée** : 5 formes aussi présentes chez d'autres
   candidates (et 30 formes partagées au total → fort effet de propagation
   positif sur le reste du backlog).
5. **0 effet de bord** : aucune forme dans le catalogue.
6. **Valeur produit** : Al-Aʿlā (« Glorifie le nom de ton Seigneur, le Très
   Haut ») est l'une des sourates les plus récitées (prières quotidiennes,
   witr, Jumuʿa) — cohérence parfaite avec « j'apprends ce que je récite ».
7. **Workflow identique** 40C/41B/42B/55 réutilisable sans modification.

**Alternative documentée** : 96 Al-ʿAlaq (2ᵉ, 44,3) — 41 gloses (le plus bas,
à égalité avec 86), meilleure synergie intra-candidates (5), récit de la
première révélation (« Iqra ») et 2ᵉ du classement Phase 54 (roadmap). Le
peloton 96/92/86 étant dans le bruit du modèle, un choix produit « récit de la
révélation » y justifierait 96 ; sur les seules données, 87 est devant.

## O. Vérification indépendante de la candidate n°1 (recalcul complet depuis zéro)

Rejoué avec des requêtes fraîches (`tmp/phase56-verify-candidate.ts`,
artefact `tmp/phase56-candidate-87-verification.json`) :

- Ayahs : 19 (DB = importés) · Occurrences : 72 · Formes : **69**
- FR effectif : 25 · EN : 44 · Non résolues : 0 · Manquantes : **44**
- % FR : 36 % · `classifySurahReadiness(87, 36)` → **IN_PREPARATION** (NON READY
  — conforme : l'état doit rester non débloqué avant la phase d'écriture)
- Catalogue : **absent** (0 learning_path)
- Partagées : 30 (dont 5 avec les autres candidates) · Sources 4/4 : **44/44**
- Formes grammaticales : 2 (إِن, بَلْ) · Formes spécifiques : 14

## P. Vérification catalogue (stabilité)

- `getSurahCatalog()` 3/3 ✅ (22 parcours, 1 REFERENCE + 21 READY, 0
  IN_PREPARATION, identique entre exécutions).
- **Aucune donnée ni readiness n'a changé pendant l'audit** (compteurs
  identiques avant/après, cf. §A).

## Q. Tests (non-régression)

| Validation | Résultat |
|---|---|
| `npx tsc --noEmit` | ✅ 0 erreur |
| `npx eslint .` | ✅ 0 erreur |
| `npx vitest run` | ✅ **743/743** (56 fichiers) — identique baseline |
| `npm run build` | ✅ (compilé 3,0 s, TypeScript OK) |

## R. Risques

1. **Sensibilité du classement** : 96/92/86 sont dans le bruit du modèle —
   toute pondération raisonnable garde 87 devant, mais le choix 96/92/86 devra
   être arbitré par des critères produit/roadmap le moment venu.
2. **Nouveaux entrants (86/82/87)** hors roadmap historique : choix assumé par
   l'audit (la DB fait autorité, §4 de l'énoncé) ; à valider en comité éditorial
   si la roadmap doit rester prioritaire.
3. **Aucun risque documentaire** (4/4 partout) ni de cas classe B/C.
4. **Effet de propagation** des formes partagées : bénéfice, mais à re-mesurer
   en fin de chaque phase (les compteurs des autres sourates bougent).

## S. Ce qui NE DOIT PAS être fait (prochaines étapes)

❌ Écrire dans `word_translations` avant validation éditoriale complète ·
❌ seed avant 100 % FR vérifié · ❌ copier une traduction d'ayah comme glose ·
❌ mesurer la couverture via `quran_words.lemma_id` seul · ❌ modifier le
resolver / catalogue / SRS / mastery / Daily Plan / coach / onboarding / MASAQ ·
❌ créer un second moteur · ❌ inventer un gap · ❌ considérer une proposition
comme validée · ❌ lancer automatiquement la phase suivante.

## T. Recommandation Phase 57 (future, NON exécutée)

1. Audit initial read-only de 87 (réutiliser `tmp/phase56-candidate-87-verification.json`).
2. Dossier éditorial : 44 formes, 4 traductions des MÊMES ayahs (4/4 disponibles).
3. Gloses Hikma (noyau sémantique, prudence sur إِن / بَلْ et les formes à
   suffixe/préfixe) → propositions PROPOSED.
4. Validation explicite (VALIDATED / REJECTED / NEEDS_REVIEW).
5. Écriture `word_translations` (source « Hikma — lexique éditorial »,
   `is_validated=true`), idempotente.
6. `resolveWordMeanings(87)` → 100 % FR ; `classifySurahReadiness(87, 100)` → READY.
7. `seed:multisurah -- --surahs=87` (19 leçons) + vérifications (0 doublon, 0 mot étranger).
8. Tests complets (tsc / eslint / vitest / build) + compteurs avant/après.
9. Ordre de déblocage proposé ensuite : 87 → (96/92/86 selon arbitrage produit)
   → 82 → 90 → 98.

## U. Verdict final

**`PHASE_56_EDITORIAL_BACKLOG_AUDIT_COMPLETE_NEXT_SURAH_SELECTED`**

Baseline Phase 55 confirmée (454 FR, 22 parcours, 91 READY, aucune régression) ;
backlog réel recalculé sur les 114 sourates via le resolver canonique ; 7
candidates comparées sur données réelles (aucune hypothèse historique) ; **87
Al-Aʿlā sélectionnée** (44 gloses, arbitrage minimal, sources 4/4, 0 effet de
bord) ; 96 Al-ʿAlaq en alternative documentée.

**Aucune écriture effectuée. Catalogue stable (3/3). Tests verts (743/743).**
**STOP.** Aucune Phase 57 lancée automatiquement.
