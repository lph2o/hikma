# PHASE 41B — VALIDATION ÉDITORIALE + INTÉGRATION AU CURRICULUM — AL-QADR (97) + AL-MASAD (111)

**Statut : `PHASE_41B_EDITORIAL_AND_CURRICULUM_COMPLETE`**

> Phase de données + curriculum (aucun moteur modifié). 36 gloses FR validées et écrites,
> 2 sourates passées à 100 % FR → `READY`, 2 parcours créés par le mécanisme idempotent existant.

---

## A. Executive Summary

Les 36 formes manquantes d'Al-Qadr (18) et d'Al-Masad (18) ont été traitées individuellement
selon le workflow éditorial d'Al-Fātiḥah (forme arabe → 4 traductions alignées → noyau sémantique
→ glose Hikma → validation). Les 36 gloses ont été **validées** (0 `NEEDS_REVIEW`) et écrites
dans `word_translations` (source « Hikma — lexique éditorial », `is_validated=true`).

Les deux sourates atteignent **100 % FR** et sont désormais **`READY`** dans le catalogue
(vérifié par l'appel réel à `getSurahCatalog`), avec leur parcours généré par
`seed-multisurah-curriculum` (5 leçons/verset chacune). Al-Fātiḥah reste `REFERENCE`, les
15 parcours existants sont intacts.

---

## B. Scope

- 18 gloses Al-Qadr + 18 gloses Al-Masad (36 au total).
- 2 parcours créés (learning_path / unit / lessons / lesson_words).
- **Aucun** moteur pédagogique, SRS, mastery, coverage, Daily Plan, onboarding, resolver,
  `planSurahCurriculum` ou `classifySurahReadiness` modifié.

---

## C. Editorial Workflow Used

```
forme arabe exacte (quran_words.arabic)
 → occurrences réelles (word_occurrences) → ayahs
 → 4 traductions des MÊMES ayahs (translations resource_id 31 / 9001 / 20 / 153)
 → comparaison FR : Hamidullah ↔ Kazimirski (Le Koran 1869)
 → contrôle interlinguistique : Sahih EN + Piccardo IT
 → référence lexicale : Kazimirski — Dictionnaire arabe-français (1860), domaine public
 → noyau sémantique → glose Hikma courte → décision → écriture word_translations
```

Aucune traduction copiée ; aucune glose générée depuis l'anglais/l'italien seul.

---

## D. Al-Qadr — 18 Forms

| Forme | Glose Hikma (validée) | Type | Note sensible |
|---|---|---|---|
| إِنَّآ | certes, nous | clitique (particule + pronom) | glose contextuelle (cf. إِيَّاكَ) |
| أَنزَلْنَـٰهُ | nous l'avons fait descendre | verbe + 2 clitiques | contexte de révélation |
| لَيْلَةِ | nuit | lexical (génitif) | — |
| ٱلْقَدْرِ | le destin / la destinée | lexical | **SENSIBLE** — polysémique (destin/décret/pouvoir/valeur/mesure) |
| لَيْلَةُ | nuit | lexical (nominatif) | — |
| أَلْفِ | mille | lexical | — |
| شَهْرٍۢ | mois | lexical | — |
| تَنَزَّلُ | descendent | lexical (verbe) | — |
| ٱلْمَلَـٰٓئِكَةُ | les anges | lexical | — |
| وَٱلرُّوحُ | et l'Esprit | clitique (و + nom) | — |
| فِيهَا | y / en elle | clitique (فِي + ـهَا) | — |
| بِإِذْنِ | avec la permission | clitique (بِ + إِذْن) | — |
| رَبِّهِم | leur Seigneur | clitique (رَبّ + ـهِم) | — |
| أَمْرٍۢ | ordre / affaire | lexical (léger polysémie) | — |
| سَلَـٰمٌ | paix / salut | lexical | — |
| هِىَ | elle | pronom | — |
| مَطْلَعِ | le lever / l'apparition | lexical | — |
| ٱلْفَجْرِ | l'aube | lexical | — |

---

## E. Al-Qadr — Validation Decisions

- **18 / 18 `VALIDATED`**, `0` `NEEDS_REVIEW`, `0` `REJECT`.
- **Cas sensible `ٱلْقَدْرِ`** : قَدْر est polysémique (destin / décret / pouvoir / valeur /
  mesure). Noyau retenu pour `ليلة القدر` : « le destin / la destinée » (convergence Hamidullah
  « Destin », Sahih « Decree », Piccardo « Destino »). Décision documentée dans `editorial_notes`.
- **`أَنزَلْنَـٰهُ`** : glose apprenable « nous l'avons fait descendre » (أَنْزَلَ + ـنَا + ـهُ),
  pas une analyse grammaticale.
- **`إِنَّآ`** : « certes, nous » (particule d'insistance + pronom), sur le modèle d'Al-Fātiḥah.
- **`فِيهَا`** : « y / en elle » (pas « dans + elle »), plus pédagogique.

---

## F. Al-Qadr — DB Verification

- 27/27 formes résolvent en FR (9 préexistantes + 18 nouvelles).
- 0 forme sans sens, 0 doublon, 0 traduction non souhaitée.

---

## G. Al-Qadr — READY Verification

- `classifySurahReadiness(97, 100 %)` → **`READY`**.
- Catalogue réel (`getSurahCatalog`) : `97 Al-Qadr: state=READY frPct=100% lessons=5 forms=27
  first=surah-97-ayah-1`.

---

## H. Al-Masad — 18 Forms

| Forme | Glose Hikma (validée) | Type | Note sensible |
|---|---|---|---|
| تَبَّتْ | que périssent | lexical (verbe, valeur optative) | — |
| يَدَآ | les deux mains | lexical (**duel**) | — |
| أَبِى | père | lexical (annexion) | — |
| لَهَبٍۢ | Lahab | **nom propre** | **SENSIBLE** — nom propre (Abû Lahab), lié à « flamme » |
| وَتَبَّ | et il a péri | clitique (و + verbe) | — |
| أَغْنَىٰ | a profité / servi | lexical (verbe) | — |
| عَنْهُ | de lui | clitique (عَنْ + ـهُ) | — |
| مَالُهُۥ | sa fortune / son bien | clitique (مَال + ـهُ) | — |
| كَسَبَ | a acquis / gagné | lexical (verbe) | — |
| سَيَصْلَىٰ | il sera brûlé | lexical (verbe, futur) | — |
| نَارًۭا | un feu | lexical | — |
| ذَاتَ | ayant / pourvue de | nom fonctionnel | **SENSIBLE** — fém. de ذُو « possesseur de » |
| وَٱمْرَأَتُهُۥ | et sa femme | clitique (و + nom + ـهُ) | — |
| حَمَّالَةَ | la porteuse | lexical | — |
| ٱلْحَطَبِ | le bois (à brûler) | lexical | — |
| جِيدِهَا | son cou | clitique (جِيد + ـهَا) | — |
| حَبْلٌۭ | une corde | lexical | — |
| مَّسَدٍۢ | fibres (de palmier) | lexical | — |

---

## I. Al-Masad — Validation Decisions

- **18 / 18 `VALIDATED`**, `0` `NEEDS_REVIEW`, `0` `REJECT`.
- **Cas sensible `لَهَبٍۢ`** : nom propre (Abû Lahab). Glose retenue « Lahab » (nom propre),
  note « lié au sens de flamme » — pas un choix arbitraire entre « flamme » et « Lahab ».
- **Cas sensible `ذَاتَ`** : nom fonctionnel (fém. de ذُو « possesseur de ») dans `نَارًا ذَاتَ
  لَهَبٍ`. Glose « ayant / pourvue de » (pas une définition hors contexte).
- **`يَدَآ`** : duel explicite « les deux mains » (pas « les mains »).
- **`تَبَّتْ / وَتَبَّ`** : valeur optative « que périssent » / « et il a péri ».
- **`مَّسَدٍۢ`** : « fibres (de palmier) » (pas « corde de fibres » — préserve le noyau lexical).

---

## J. Al-Masad — DB Verification

- 22/22 formes résolvent en FR (4 préexistantes + 18 nouvelles).
- 0 forme sans sens, 0 doublon.

---

## K. Al-Masad — READY Verification

- `classifySurahReadiness(111, 100 %)` → **`READY`**.
- Catalogue réel : `111 Al-Masad: state=READY frPct=100% lessons=5 forms=22
  first=surah-111-ayah-1`.

---

## L. Source / Licence Traceability

- **Source d'écriture** : `Hikma — lexique éditorial` (`79e6412e-e349-4fe5-b29b-108237375a2d`),
  identique aux 278 gloses FR existantes (aucune nouvelle source créée).
- **Référence lexicale** : Kazimirski — Dictionnaire arabe-français (1860), domaine public
  (`567c8b5d-ff97-432c-9cb1-8fa88e41f0f4`), documentée dans `editorial_notes`.
- **Contrôle** : Hamidullah FR (resource 31), Kazimirski Le Koran (resource 9001),
  Sahih EN (resource 20), Piccardo IT (resource 153).
- Aucun contenu protégé copié (les gloses sont des formulations éditoriales courtes).

---

## M. Idempotency Audit

- Ré-exécution du script d'écriture : `toInsert=0 skipped=36` (aucun doublon).
- Ré-exécution du seed : `✅ quran-surah-97 · 5 leçons`, `✅ quran-surah-111 · 5 leçons`
  (état stable, upsert sur clés naturelles).
- Total `word_translations` FR validées : **278 → 314** (+36).

---

## N. Curriculum Seed

- `npm run seed:multisurah -- --surahs=97,111` (après `--dry-run` : 5 leçons chacune).
- Créé : 2 `learning_paths` (`quran-surah-97`, `quran-surah-111`), 2 `units`, 10 `lessons`
  publiées (1/verset), 43 + 38 `lesson_words` (mots nouveaux cumulés + revue ≤4, `is_new`).

---

## O. Post-Seed Verification

| Élément | 97 | 111 |
|---|---:|---:|
| Parcours | 1 (`quran-surah-97`) | 1 (`quran-surah-111`) |
| Leçons publiées | 5 | 5 |
| Leçons = versets | oui (ayah-1 → ayah-5) | oui |
| `lesson_words` | 43 | 38 |
| Mots distincts | 27 | 22 |
| Doublons (leçon / position) | 0 / 0 | 0 / 0 |
| Catalogue `state` | `READY` (100 %) | `READY` (100 %) |

- **Catalogue total : 17 sourates** (15 existantes + 2 nouvelles).
- **Al-Fātiḥah : `REFERENCE`** (inchangée). Les 14 autres parcours existants intacts.

---

## P. Non-Regression

- Al-Fātiḥah `REFERENCE` ✅ · 15 parcours existants inchangés ✅
- SRS / mastery / coverage / Daily Plan / onboarding / retry / exercices : **aucun fichier
  modifié** (phase 100 % données + seed, `0` fichier moteur touché).

---

## Q. Tests

- `npx tsc --noEmit` ✅
- `npx eslint .` ✅
- `npx vitest run` → **725/725** (54 fichiers) ✅ — aucun test modifié, aucune régression
- `npm run build` ✅

---

## R. Remaining Issues

- Aucune forme sensible restée `NEEDS_REVIEW` (les 3 cas sensibles — `ٱلْقَدْرِ`, `لَهَبٍۢ`,
  `ذَاتَ` — ont été arbitrés et documentés).
- Les 13 clitiques suivent le précédent Al-Fātiḥah ; risque résiduel de figer un sens hors
  contexte, atténué par les `editorial_notes`.

---

## S. Recommendations

- **Phase 42** : débloquer la sourate courte suivante — Al-Qari'ah (101, 21 gloses), puis
  At-Tin (95, 26), Az-Zalzalah (99, 26) — même workflow 41B.
- **Optionnel** : un smoke navigateur authentifié du catalogue (les deux nouvelles sourates
  `READY`) si la validation visuelle est souhaitée (non exécuté ici : vérification faite au
  niveau données + `getSurahCatalog` réel).

---

## T. Final Verdict

| Sourate | Formes | Avant FR | Nouvelles gloses | Après FR | READY | Seed |
|---|---:|---:|---:|---:|---|---|
| 97 Al-Qadr | 27 | 9 | 18 | 27/27 | **READY** | OK |
| 111 Al-Masad | 22 | 4 | 18 | 22/22 | **READY** | OK |

**Décision : `PHASE_41B_EDITORIAL_AND_CURRICULUM_COMPLETE`** — 36 gloses validées et écrites
(idempotent), 2 sourates 100 % FR → `READY`, 2 parcours créés par le mécanisme existant, aucun
moteur modifié, 725 tests + build verts, aucune donnée protégée copiée. Aucun commit/push.
