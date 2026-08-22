# PHASE 54 — AUDIT ET SÉLECTION DU PROCHAIN BACKLOG ÉDITORIAL HORS CATALOGUE

**Verdict : `PHASE_54_EDITORIAL_BACKLOG_AUDIT_COMPLETE_NEXT_SURAH_SELECTED`**

**Sourate recommandée : 91 — Ash-Shams (ٱلشَّمْسِ)**

> Phase STRICTEMENT READ-ONLY. Aucune écriture DB (INSERT / UPDATE / DELETE /
> seed), aucune migration, aucun changement de schéma, aucun changement de code
> de production, du resolver, du curriculum, de SRS/mastery/Daily Plan/coach,
> de l'onboarding, de MASAQ, des explications de sens, de
> `word_translations` / `lemma_translations` / `quran_words` /
> `word_lemma_mapping`. Aucun commit, aucun push. Seuls des artefacts d'audit
> `tmp/` et ce rapport ont été produits.

---

## A. Executive Summary

À partir de la baseline canonique de la Phase 53, les 5 sourates hors catalogue
(90, 91, 92, 96, 98) ont été ré-auditées **depuis la DB réelle, avec le chemin
logique exact du resolver** (FORME → LEMME direct → LEMME via
`word_lemma_mapping` → fallback EN) et **vérification croisée forme par forme
contre `resolveWordMeanings`** (tout écart aurait fait échouer le script).

Résultats clés :

- **224 gloses FR manquantes** au total (219 word_ids uniques) — contre 230
  annoncés par la Phase 53 §H : la Phase 53 §H ne comptait que
  `quran_words.lemma_id` (direct), ignorant `word_lemma_mapping` — exactement
  l'erreur historique que cette phase interdit de reproduire (détail §C).
- **0 forme manquante présente dans le catalogue** : débloquer l'une des 5
  sourates ne peut **pas** altérer les 21 parcours READY/REFERENCE existants
  (résolution uniforme par `word_id`, sanity check = 0).
- **100 % des formes manquantes** (224/224) ont les **4 traductions de
  référence** disponibles sur leurs versets (Hamidullah FR, Kazimirski FR,
  Sahih International EN, Piccardo IT) — arbitrage éditorial toujours documenté.
- **5 formes seulement** sont partagées entre ≥ 2 sourates candidates
  (`أَن`, `لَّمْ`, `وَٱلنَّهَارِ`, `كَذَّبَ`, `مِنْ`) : débloquer une sourate
  « débloque » au maximum 1 à 4 formes des autres candidates (jamais une sourate
  entière) ; 120 formes manquantes existent aussi dans d'autres sourates hors
  catalogue (effet futur positif).
- **Classement objectif** (matrice pondérée, §H) : **91 > 96 > 92 > 90 > 98**.
- Stabilité : `tsc`, `eslint`, `vitest` (743/743), `npm run build` — tout
  passe, **aucune régression** vs baseline Phase 53 (§J).

---

## B. Baseline observée (vérifiée en Phase 54)

| Élément | Phase 53 | Phase 54 (re-vérifié) |
|---|---:|---:|
| Parcours au catalogue (`getSurahCatalog`) | 21 | 21 (3/3 exécutions OK) |
| REFERENCE | 1 | 1 |
| READY | 20 | 20 |
| IN_PREPARATION | 0 | 0 |
| `word_translations` FR validées | 415 | 415 |
| `quran_words` | 21 296 | 21 296 |
| `word_occurrences` | 77 430 | 77 430 |
| `ayahs` | 6 236 | 6 236 |
| `translations` | 24 944 | 24 944 |
| `lemma_translations` / `lemmas` | 32 / 32 | 32 / 32 |
| `word_lemma_mapping` | 184 | 184 |
| `sources` | 6 | 6 |
| `learning_paths` / `units` / `lessons` / `lesson_words` | 21 / 21 / 138 / 933 | identiques |
| Parcours existants pour 90/91/92/96/98 | aucun | **aucun** (0 `learning_path`) |

**Aucune divergence avec la Phase 53. La DB est inchangée.**

---

## C. Correction méthodologique vs Phase 53 §H (lecture canonique exigée)

La Phase 54 exige le chemin réel du resolver. Or la boucle « backlog » de la
Phase 53 §H consultait la glose de lemme **uniquement via
`quran_words.lemma_id`** (`ll.get(w.lemma_id)`), sans consulter
`word_lemma_mapping` — la surcouche qui résout pourtant
`رَبِّكَ`/`رَبُّكَ` (93/94/105/110), comme la Phase 53 §E l'avait démontré.

Vérification mathématique (les comptes Phase 53 §H correspondent exactement à
`FORME + LEMME direct`, sans `LEMME via mapping`) :

| Sourate | Phase 53 §H (FR/EN) | Canonique Phase 54 (FR/EN) | Écart | Cause |
|---:|---:|---:|---:|---|
| 90 | 29 / 44 | 29 / 44 | 0 | lMap = 0 |
| 91 | 8 / 40 | **9 / 39** | +1 FR | 1 forme via mapping (`وَٱلنَّهَارِ`) |
| 92 | 15 / 47 | **16 / 46** | +1 FR | 1 forme via mapping |
| 96 | 16 / 43 | **18 / 41** | +2 FR | 2 formes via mapping |
| 98 | 23 / 56 | **25 / 54** | +2 FR | 2 formes via mapping |
| **Total** | 91 / **230** | 97 / **224** | **−6** | mapping ignoré en Phase 53 §H |

Chaque forme a été **vérifiée croisée** contre `resolveWordMeanings` (langue +
fallback attendus) : 0 incohérence. Les chiffres canoniques sont donc
**224 gloses manquantes** (les valeurs Phase 53 §H étaient des points de départ,
à recalculer — conformément à l'énoncé de la Phase 54).

---

## D. Matrice de readiness canonique des 5 sourates (A → N)

`formFR` = glose FR de FORME · `lDir` = FR via lemme direct · `lMap` = FR via
`word_lemma_mapping` · `en` = fallback EN · `unres` = sans aucune donnée.

| A. Ayahs | B. Occ. | C. Formes | D. FR résolues | E. formFR | F. lDir | G. lMap | H. EN | unres | I. Gloses manquantes | J. word_ids concernés | K. partagés (autres sourates) | L. spécifiques | M. Parcours existant | N. Readiness (app) |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
| **90** Al-Balad | 20 | 82 | 73 | 29 | 27 | 2 | 0 | 44 | 0 | **44** | 44 | 21 | 23 | non | IN_PREPARATION (40 %) |
| **91** Ash-Shams | 15 | 54 | 48 | 9 | 7 | 1 | 1 | 39 | 0 | **39** | 39 | 19 | 20 | non | IN_PREPARATION (19 %) |
| **92** Al-Layl | 21 | 71 | 62 | 16 | 14 | 1 | 1 | 46 | 0 | **46** | 46 | 28 | 18 | non | IN_PREPARATION (26 %) |
| **96** Al-ʿAlaq | 19 | 72 | 59 | 18 | 13 | 3 | 2 | 41 | 0 | **41** | 41 | 17 | 24 | non | IN_PREPARATION (31 %) |
| **98** Al-Bayyinah | 8 | 94 | 79 | 25 | 21 | 2 | 2 | 54 | 0 | **54** | 54 | 40 | 14 | non | IN_PREPARATION (32 %) |

- **0 forme non résolue** (aucun `meaning` vide) dans les 5 sourates.
- `classifySurahReadiness(n, pct)` → `IN_PREPARATION` pour les 5 (aucune n'a de
  parcours : hors catalogue, pas un état de préparation seedé).

---

## E. Coût éditorial réel (mesuré, aucun glose inventée)

| Sourate | Gloses manquantes | Spécifiques | Partagées (total) | Partagées entre candidats | Répétées dans la sourate (multi-contexte) | Sources : 4/4 références | Arbitrages potentiels (proxy) |
|---:|---:|---:|---:|---:|---:|---:|---|
| 90 | 44 | 23 | 21 | 2 | 5 | 44/44 | 5 contextes intra-sourate + 21 formes multi-sourates |
| 91 | **39** | 20 | 19 | 1 | **0** | 39/39 | **aucun contexte intra-sourate répété** |
| 92 | 46 | 18 | 28 | 2 | 2 | 46/46 | 2 intra + 28 multi |
| 96 | 41 | 24 | 17 | **4** | 3 | 41/41 | 3 intra + 17 multi (meilleure synergie) |
| 98 | 54 | 14 | 40 | 1 | 7 | 54/54 | 7 intra + 40 multi (le plus lourd) |

- **Références disponibles** : les 4 traductions (Hamidullah FR / Kazimirski FR /
  Sahih EN / Piccardo IT) couvrent 100 % des versets des 5 sourates (80 + 60 +
  84 + 76 + 32 lignes `translations`, 4 par verset) → **aucune forme manquante
  sans référence** (`zero_reference_forms = 0` partout).
- Formes à arbitrage sensible (proxy mesuré : occurrence répétée dans la sourate
  = plusieurs contextes, donc polysémie potentielle à trancher) : s98 (7) >
  s90 (5) > s96 (3) > s92 (2) > s91 (0).

---

## F. Word_ids partagés — effets de bord (tableau complet : 224 lignes dans `tmp/phase54-shared-word-ids.csv`)

Extrait représentatif (colonne « Sourates concernées » = toutes les sourates du
Coran où le même `word_id` apparaît) :

| Sourate | Forme | word_id | Sourates concernées | FR manquante | Partagée | Impact potentiel |
|---:|---|---|---|---|---|---|
| 90 | أُقْسِمُ | `705066cf-…` | 56, 69, 70, 75, 81, 84, 90 | oui | oui | présente hors catalogue (effet futur positif) |
| 90 | حِلٌّۢ | `7507cc02-…` | 90 | oui | non | spécifique — aucune autre sourate affectée |
| 91 | وَٱلنَّهَارِ | `5540f22a-…` | 2, 3, 10, 21, 30, 34, 41, 45, 91, 92 | oui | oui | partagée avec le candidat **92** + hors catalogue |
| 91 | بَنَىٰهَا | `0967123b-…` | 79, 91 | oui | oui | présente hors catalogue (79) |
| 96 | مِنْ | `2a2f5afc-…` | 7, 8, …, 90, 96, 98 | oui | oui | partagée avec les candidats **90** et **98** |
| 98 | خَيْرُ | `5f85b046-…` | 3, 5, 6, 7, 8, 10, 12, 21, 22, 23, 34, 62, 98 | oui | oui | présente hors catalogue |

Tous les word_id complets figurent dans `tmp/phase54-shared-word-ids.csv` / `tmp/phase54-editorial-backlog.json`.

**Réponses aux questions de l'énoncé :**

1. **« Débloquer une sourate risque-t-il de débloquer automatiquement d'autres
   sourates via un même word_id ? »** — Non, à l'échelle d'une sourate entière.
   Seules **5 formes** sont partagées entre ≥ 2 candidates :
   `أَن` (90/96), `لَّمْ` (90/96), `وَٱلنَّهَارِ` (91/92), `كَذَّبَ` (92/96),
   `مِنْ` (96/98). Chaque glose écrite réduit d'exactement **1** le manque d'une
   autre candidate (jamais assez pour la rendre READY : il en faudrait 39+).
2. **Risque sur le catalogue existant : nul.** 0 forme manquante n'apparaît
   dans les 21 sourates du catalogue (`sanity_missing_in_catalog = 0`) : la
   résolution étant uniforme par `word_id`, aucune glose future ne peut modifier
   une sourate READY.
3. **Effet positif futur :** 120 des 219 word_ids uniques existent aussi dans
   d'autres sourates **hors catalogue** (ex. `قَدْ`, `لَهُمْ`, `وَٱلْأَرْضِ`,
   `مِّن`) : les gloses écrites réduiront mécaniquement le futur backlog de ces
   sourates.

---

## G. Vérification catalogue / curriculum (READ-ONLY, §7)

- `getSurahCatalog()` : **3/3 succès** (~1,2–1,8 s) → 21 parcours, 1 REFERENCE,
  20 READY, 0 IN_PREPARATION. Résultats identiques entre exécutions.
- `classifySurahReadiness(1, 100)` → REFERENCE · `(93, 100)` → READY ·
  `(90, 50)` → IN_PREPARATION (comportement attendu, code inchangé).
- **0 `learning_path`** pour 90/91/92/96/98 (aucun curriculum, aucun état
  partiel, aucun doublon) ; 21 parcours ancrés sur 21 sourates distinctes
  (0 doublon de sourate), 21 unités, 138 leçons **toutes publiées** (138/138), 933 lesson_words.
- **Résolution canonique vérifiée** forme par forme contre
  `resolveWordMeanings` : 0 incohérence sur les 5 sourates (le script échoue
  sinon).

---

## H. Matrice de priorité objective (pondérations documentées)

Critères calculés depuis les données (aucune valeur arbitraire sauf les poids
ci-dessous, explicités) :

| Critère | Poids | Définition |
|---|---:|---|
| 1. Coût éditorial (efficiency) | 30 % | 100 × (1 − manquantes / max) |
| 2. Arbitrage (difficulté) | 25 % | 100 × (1 − (sans-source + 0,5×répétées) / max) |
| 3. Synergie (partage entre candidats) | 15 % | 100 × (partagées-candidats / manquantes) |
| 4. Références disponibles | 15 % | 100 × (avec 4/4 références / manquantes) |
| 5. Simplicité (nb d'ayahs) | 10 % | 100 × (1 − ayahs / max) — poids faible, jamais décisif |
| 6. Pédagogie / identité produit | 5 % | 100 pour les 5 (juz ʿamma, sourates récitées, « j'apprends ce que je récite ») — score égal documenté |

| Rang | Sourate | Manquantes | Efficiency | Arbitrage | Synergie | Références | Simplicité | **Total** |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | **91 Ash-Shams** | 39 | 27,8 | **100** | 2,6 | 100 | 28,6 | **56,6** |
| 2 | 96 Al-ʿAlaq | 41 | 24,1 | 57,1 | **9,8** | 100 | 9,5 | 43,9 |
| 3 | 92 Al-Layl | 46 | 14,8 | 71,4 | 4,3 | 100 | 0 | 43,0 |
| 4 | 90 Al-Balad | 44 | 18,5 | 28,6 | 4,5 | 100 | 4,8 | 33,9 |
| 5 | 98 Al-Bayyinah | 54 | 0 | 0 | 1,9 | 100 | 61,9 | 26,5 |

**Robustesse :** 91 mène sur les deux critères les plus pondérés (moins de
gloses à écrire ET zéro arbitrage intra-sourate). 98, pourtant la plus courte
(8 ayahs), est classée dernière — preuve que la **courteur n'a pas été
favorisée artificiellement**. L'ordre 91 > 96 > 92 > 90 > 98 est stable pour
toute pondération raisonnable des critères 1 et 2.

---

## I. Sourate recommandée : 91 — Ash-Shams

**Justification (toutes issues des données réelles) :**

1. **Coût éditorial minimal** : 39 gloses FR manquantes (le plus bas des 5 ;
   219 word_ids uniques au total sur les 5, 91 n'en demande que 39).
2. **Zéro arbitrage intra-sourate** : aucune forme manquante n'est répétée dans
   la sourate (0 occurrence multiple → 0 polysémie de contexte à trancher à
   l'intérieur de la sourate) — l'unique candidat avec ce profil.
3. **20 formes spécifiques + 19 partagées**, dont **une seule** partagée avec un
   autre candidat (`وَٱلنَّهَارِ` 91/92) : débloquer 91 n'altère ni le catalogue
   ni mécaniquement une autre candidate.
4. **Sources complètes** : les 39 formes ont les 4 références sur leurs versets
   (Hamidullah / Kazimirski / Sahih / Piccardo) → arbitrage toujours documenté.
5. **Surface réduite** : 15 ayahs, 54 occurrences, 48 formes distinctes.
6. **Cohérence produit** « j'apprends ce que je récite » : Ash-Shams fait partie
   des sourates courtes du juz ʿamma les plus récitées.
7. **Workflow 40C/41B/42B réutilisable à l'identique** (voir §J).

**Alternative documentée :** 96 Al-ʿAlaq (2ᵉ, 43,9) — 41 gloses, meilleure
synergie (4 formes partagées avec les autres candidates : `أَن`, `لَّمْ`,
`كَذَّبَ`, `مِنْ`) et récit de la première révélation (« Iqra ») à forte valeur
pédagogique ; mais 3 arbitrages intra-sourate et 2 gloses de plus. Si l'équipe
produit privilégie le récit fondateur de la révélation, 96 est la seule
alternative défendable.

---

## J. Workflow futur pour la sourate 91 — DÉCRIT, NON EXÉCUTÉ

Procédure à exécuter en Phase 55 (aucune étape n'a été lancée en Phase 54) :

1. Audit initial (read-only) — réutiliser `tmp/phase54-audit.ts` filtré sur 91.
2. Identification des 39 formes réellement EN-only (`tmp/phase54-shared-word-ids.csv`,
   lignes Sourate=91).
3. Comparaison **Hamidullah FR** par verset (disponible sur les 15 ayahs).
4. Comparaison **Kazimirski FR** (dictionnaire 1860 + traduction 1869).
5. Contrôle **Sahih International EN** (vérification croisée, jamais source FR).
6. Contrôle **Piccardo IT** (même rôle).
7. Arbitrage éditorial Hikma (glose courte, noyau sémantique, variations de
   contexte documentées — workflow Phases 21E/28/40C/41B/42B).
8. Écriture future dans `word_translations` (langue `fr`).
9. `is_validated = true`, `validated_at` renseigné.
10. Source « Hikma — lexique éditorial » (source_id obligatoire, idempotente).
11. Vérification `resolveWordMeanings` (aucun fallback EN résiduel).
12. `classifySurahReadiness(91, 100 %)` → READY.
13. `seed:multisurah -- --surahs=91` (curriculum : parcours, unités, leçons,
    lesson_words).
14. Vérification idempotence (re-exécution sans doublons).
15. Tests complets (tsc / eslint / vitest / build).

**Rien de tout cela n'a été exécuté en Phase 54.**

---

## K. Validations de stabilité (§8) — comparaison baseline Phase 53

| Validation | Phase 53 | Phase 54 | Statut |
|---|---|---|---|
| `npx tsc --noEmit` | 0 erreur | 0 erreur | ✅ |
| `npx eslint .` | 0 erreur | 0 erreur | ✅ |
| `npx vitest run` | 743/743 (56 fichiers) | **743/743 (56 fichiers)** | ✅ identique |
| `npm run build` | ✅ | ✅ (compilé 2,6 s, pages OK) | ✅ |

**Aucune régression introduite par l'audit.**

---

## L. Conformité aux contraintes absolues (§11)

✅ Aucune migration, aucun changement de schéma · ✅ `lib/learning/queries.ts`
non modifié · ✅ resolver non modifié · ✅ curriculum non modifié · ✅ aucune
glose ajoutée · ✅ `seed:multisurah` non lancé · ✅ `word_translations` /
`lemma_translations` / `quran_words` / `word_lemma_mapping` non modifiés ·
✅ onboarding / SRS / mastery / Daily Plan / coach / MASAQ / explications non
modifiés · ✅ aucune fonctionnalité « Quran Progress » · ✅ 93/94/105/110 non
traités comme gaps · ✅ couverture calculée avec le chemin réel (mapping
inclus), jamais `quran_words.lemma_id` seul · ✅ aucune donnée lexicale inventée
· ✅ aucun commit/push · ✅ artefacts d'audit uniquement
(`PHASE_54_EDITORIAL_BACKLOG_AUDIT.md` + 6 fichiers `tmp/phase54-*`).

**Aucune écriture DB n'a été effectuée (lecture seule, compteurs vérifiés
inchangés vs Phase 53).**

---

## M. Artefacts produits

| Artefact | Contenu |
|---|---|
| `PHASE_54_EDITORIAL_BACKLOG_AUDIT.md` | ce rapport |
| `tmp/phase54-editorial-backlog.json` | 224 formes manquantes détaillées (chemin de résolution, word_id, ayahs, sourates partagées, sources) + matrice A–N |
| `tmp/phase54-readiness-matrix.csv` | matrice canonique A–N des 5 sourates |
| `tmp/phase54-shared-word-ids.csv` | tableau complet Sourate / Forme / word_id / Sourates concernées / FR manquante / Partagée / Impact potentiel (224 lignes) |
| `tmp/phase54-source-availability.json` | disponibilité Hamidullah / Kazimirski / Sahih / Piccardo par sourate |
| `tmp/phase54-priority-analysis.json` | pondérations + scores + classement |
| `tmp/phase54-catalog-verification.json` | runs `getSurahCatalog` (3×), parcours/curriculum, sanity |
| `tmp/phase54-audit.ts` | script d'audit reproductible (lecture seule) |

---

## N. Prochaines étapes proposées

1. **Phase 55 (future, non lancée)** : workflow éditorial §J pour la sourate 91
   (39 gloses) + `seed:multisurah -- --surahs=91`.
2. **Ordre de déblocage recommandé** (au rythme éditorial) : 91 → 96 → 92 →
   90 → 98, en capitalisant sur les formes déjà glossées (les 5 formes partagées
   entre candidates réduisent les suivantes).
3. **Bénéfice collatéral** : les 120 formes partagées hors catalogue
   prépareront le terrain des sourates 89, 87, 86, … (effet cumulatif à
   mesurer en fin de chaque phase).

**STOP.** Aucune Phase 55 n'est lancée automatiquement. Aucune sourate n'a été
débloquée en Phase 54.
