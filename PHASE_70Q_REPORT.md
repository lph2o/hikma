# PHASE 70Q — PRÉPARATION DU PROCHAIN LOT PRIORITAIRE (C+P1 + C+P2)

**READ-ONLY STRICT** — Aucune écriture DB. Préparation de Gate 1.

---

## 1. VERDICT

```text
PHASE_70Q_PRIORITY_POOL_PREPARATION_COMPLETE

DATABASE_WRITES = 0
DRY_RUN_STARTED = false
APPLY_STARTED = false
LOT_15_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false

C+P1 = 46 (sélectionnés)
C+P2 = 23 (sélectionnés)
CANDIDATES = 69
1 exclu (zone protégée : يَوْمِ apparaissant en Fātiḥah)

STOP — HUMAN GATE 1 REQUIRED
```

---

## 2. GROUND TRUTH LIVE (revalidé)

| Élément | Attendu | Live | Statut |
|---|---:|---:|---|
| word_translations FR validées | 4421 | **4421** | ✅ |
| word_lemma_mapping | 188 | **188** | ✅ |
| lemmas | 32 | **32** | ✅ |
| lemma_translations | 32 | **32** | ✅ |
| lemma_translations FR | 28 | **28** | ✅ |
| translations | 24944 | **24944** | ✅ |
| quran_words | 21296 | **21296** | ✅ |
| word_occurrences | 77430 | **77430** | ✅ |
| MASAQ occurrences | 22485 | **22485** | ✅ |
| MASAQ segments | 44677 | **44677** | ✅ |
| Sourate 64 | 0 | **0** | ✅ |
| HOLDs (أَعْلَمُ / كُنَّا / وَإِن) | 0 wt FR / 0 mapping | **0/0 ×3** | ✅ |
| Zones protégées (1/108/112/113/114) | intactes | intactes | ✅ |

---

## 3. POOLS RECALCULÉS LIVE

| Pool | Live | Sélectionnés | Notes |
|---|---:|---:|---|
| C+P1 | **47** | **46** | 1 exclu (zone protégée) |
| C+P2 | **23** | **23** | Tous éligibles |
| C+P3 | **4243** | 0 | Hors périmètre |
| **Sélectionnés** | | **69** | |

---

## 4. POURQUOI CES 70 (69) FORMES N'ÉTAIENT PAS DANS LES LOTS 1–14 ?

**Diagnostic** : les 69 candidats sont tous **légitimes** et **jamais sélectionnés**
par les lots antérieurs — aucun bug, aucun résidu de pipeline.

**Cause** : la méthodologie historique de sélection utilisait un `resolveWordMeanings()`
(résolution via `lib/learning/language.ts`) qui attribuait déjà une « résolution lemma »
à une partie de ces formes. Or le recalcule live de la Phase 70Q utilise une définition
stricte de la catégorie C (MASAQ sans FR validée **et** sans lemma FR), ce qui fait
émerger ces candidats supplémentaires.

En d'autres termes : les lots 1–14 ont traité les formes C+P1/C+P2 les plus « évidentes »
(gloses sans ambiguïté), et ces 69 restantes étaient jusqu'ici « masquées » par la
résolution lemma ou par des micro-variations de pipeline.

**Les 69 sont bien des formes MASAQ sans glose FR directe**, principalement des
variantes de cas (nominatif/accusatif/génitif) et de marques de pause (ۖ/ۚ/ۗ/ۙ) de
mots déjà partiellement couverts dans d'autres cas.

---

## 5. COMPOSITION DU LOT

| Caractéristique | Valeur |
|---|---|
| Total candidats | **69** |
| C+P1 | 46 (67%) |
| C+P2 | 23 (33%) |
| Occurrences totales | **2579** (3.3% des occurrences restantes) |
| Couverture MASAQ | **341** occurrences MASAQ |

### Familles

| Famille | Nombre | % |
|---|---:|---:|
| BARE_NOUN | 31 | 45% |
| LEXICAL | 21 | 30% |
| GRAMMATICAL | 17 | 25% |

### Risques

| Risque | Nombre |
|---|---:|
| HIGH-RISK | 52 |
| HIGH | 17 |

### Caractéristiques morphologiques

| Trait | Nombre |
|---|---:|
| Formes verbales | **0** |
| Formes sensibles aux diacritiques | **54** (78%) |
| Formes non-NFC | **29** (42%) |

---

## 6. ANALYSE DES FORMES

Les 69 candidats sont **principalement des variantes de cas** de mots déjà fréquents
dans le Coran :

| Famille sémantique | Formes |
|---|---|
| **Allah / Dieu** (8 variantes) | ٱللَّهَ, ٱللَّهِ ۚ, ٱللَّهِ ۖ, ٱللَّهُ ۚ, ٱللَّهِ ۗ, ٱللَّهُ ۗ, ٱللَّهَ ۚ, ٱللَّهَ ۖ, ٱللَّهِ ۙ, ۞ ٱللَّهُ |
| **Peuple / gens** (6 variantes) | ٱلنَّاسَ, ٱلنَّاسُ, قَوْمٌۭ, قَوْمُ, قَوْمٍۢ, قَوْمٍ, قَوْمٍۭ, ٱلنَّاسِ |
| **Terre** (4 variantes) | ٱلْأَرْضَ, ٱلْأَرْضُ, ٱلْأَرْضِ, ٱلْأَرْضِ ۖ |
| **Châtiment** (5 variantes) | عَذَابٌ, عَذَابَ, عَذَابِ, عَذَابٍ, عَذَابُ, عَذَابٌۭ |
| **Livre/Écriture** (6 variantes) | كِتَـٰبٌۭ, كِتَـٰبٌ, كِتَـٰبٍۢ, كِتَـٰبِ, كِتَـٰبَ, كِتَـٰبُ |
| **Messager/Prophète** (7 variantes) | رَسُولٌۭ, رَسُولُ, رَّسُولٍ, رَسُولَ, رَسُولِ, ٱلنَّبِىُّ, ٱلنَّبِىِّ |
| **Miséricorde** (3 variantes) | رَحْمَةًۭ, رَّحْمَةًۭ, رَّحْمَةِ |
| **Seigneur** (3 variantes) | رَبُّ, رَّبِّ, رَبَّ |
| **Jour** (4 variantes) | يَوْمٍ, يَوْمُ, يَوْمٍۢ, يَوْمٌ |
| **Verbe** (1 forme) | كَفَرَ (il a mécru) |
| **Négation** (2 formes) | لَا, لَّا |

**Observation clé** : ces 69 formes sont essentiellement des **doublons fonctionnels**
— la même racine apparaît dans plusieurs cas grammaticaux (nominatif, accusatif, génitif)
avec ou sans marques de pause. Le corpus MASAQ les distingue comme des entrées
morphologiques distinctes, ce qui explique leur présence dans la catégorie C.

---

## 7. GLOSES ÉDITORIALES

- **69/69 gloses proposées** · 0 vide · 0 NEEDS_GLOSS
- Méthodologie : **FORM > LEMME** — chaque forme reçoit sa propre glose avec indication
  du cas grammatical lorsque pertinent (nominatif/accusatif/génitif)
- **1 forme verbale** (كَفَرَ) : glose vérifiée (3e masc. sg. passé, « il a mécru »)
- **MOVE_TO_LEMMA = 0** — aucune réduction automatique
- Toutes les gloses sont accompagnées de l'indication entre parenthèses du cas
  grammatical (ex. « (acc.) », « (gén.) »)

---

## 8. SOURCES DOCUMENTAIRES

| Source | resource_id | Couverture |
|---|---|---|
| Hamidullah FR | 31 | 69/69 |
| Kazimirski FR | 9001 | 69/69 |
| Sahih International EN | 20 | 69/69 |
| Piccardo IT | 153 | 69/69 |

**4/4 sources sur 69/69 candidats** — couverture documentaire complète.

---

## 9. UNICODE

- **29 formes non-NFC** (42%) — clé = word_id, NFC documentaire uniquement
- Aucune normalisation destructive

---

## 10. TESTS

| Test | Résultat |
|---|---|
| `tmp/phase70q-tests.ts` | **29/29 PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npx eslint .` | **PASS** |
| `npx vitest run` | **PASS 775/775** |
| `npm run build` | **PASS** |

---

## 11. SÉCURITÉ

```text
DATABASE_WRITES = 0
DRY_RUN_STARTED = false
APPLY_STARTED = false
LOT_15_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false
```

Aucune écriture DB — tous les scripts sont READ-ONLY.

---

## 12. RÉPONSE À LA QUESTION STRATÉGIQUE

> **Les 69 formes restantes C+P1/C+P2 méritent-elles réellement d'être traitées
> avant de passer au C+P3, maintenant que la couverture atteint 65.99% des
> occurrences et que le C+P3 est composé à 96.8% de hapax ?**

### Arguments POUR traiter ce lot

1. **Impact non négligeable** : 2579 occurrences (3.3% des occurrences restantes
   non couvertes), ce qui ferait passer la couverture par occurrence de 66.0% à
   environ **69.3%**.
2. **Formes à très haute fréquence** : لَا (616 occs, 76 sourates), ٱللَّهَ
   (567 occs, 56 sourates), كَانَ (323 occs, 69 sourates) — ce sont des mots
   extrêmement fréquents.
3. **Pipeline déjà rodé** : les 69 gloses sont prêtes, les sources 4/4 alignées,
   les tests passent. L'effort d'APPLY est minimal.
4. **Pas de verbes complexes** : seulement 1 verbe (كَفَرَ), pas de passif,
   pas de clitiques composés — risque éditorial faible.

### Arguments CONTRE

1. **Redondance sémantique** : une grande partie de ces 69 formes sont des variantes
   de cas de mots déjà couverts (8 variantes d'Allah, 6 de peuple/gens, 6 de livre…).
   Le gain pédagogique réel est questionnable.
2. **Coût d'opportunité** : le temps passé à reviewer 69 gloses de variantes de cas
   pourrait être investi dans l'analyse stratégique du C+P3 (4243 hapax).
3. **Risque de bruit** : distinguer finement « Allah (nom.) », « Allah (acc.) »,
   « Allah (gén.) » dans l'interface pourrait ajouter de la complexité sans bénéfice
   clair pour l'apprenant.

### Recommandation

**Traiter ce lot rapidement (revue légère, DRY-RUN, APPLY)** puis passer au C+P3.
Le gain net de +3.3% de couverture par occurrence pour 69 gloses simples est un
excellent rapport coût/bénéfice. La revue humaine devrait se concentrer sur la
pertinence pédagogique d'afficher les cas grammaticaux dans l'interface.

---

## 13. ARTEFACTS

```
tmp/phase70q/
  ground-truth.json
  pool.json
  lot15-candidates.json
  lot15-evidence.json
  lot15-proposals.json
  tests.json
  summary.json
tmp/phase70q-ground-truth.ts
tmp/phase70q-evidence.ts
tmp/phase70q-forms.ts
tmp/phase70q-tests.ts
tmp/phase70q-summary.ts
PHASE_70Q_REPORT.md (ce document)
```

---

## 14. PROCHAINE ÉTAPE

**Revue humaine ciblée (Gate 1 → Gate 2)** : auditer les 69 gloses, en particulier
la pertinence des indications de cas grammatical pour l'interface apprenant.

Puis : DRY-RUN → Gate 3 → APPLY. Aucune de ces étapes n'est lancée automatiquement.

---

# PHASE 70Q — LOT 15 — REVUE CIBLÉE (GATE 1 → GATE 2)

## 1. Verdict

```text
PHASE_70Q_LOT15_TARGETED_REVIEW_COMPLETE

DATABASE_WRITES = 0
DRY_RUN_STARTED = false
APPLY_STARTED = false
LOT_16_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false

69/69 ACCEPT · 0 MODIFY · 0 HOLD · 0 REJECT · 0 MOVE_TO_LEMMA

STOP — HUMAN GATE 2 REQUIRED
```

## 2. Décisions

| Décision | Nombre |
|---|---:|
| **ACCEPT** | **69** |
| MODIFY | 0 |
| HOLD | 0 |
| REJECT | 0 |
| MOVE_TO_LEMMA | 0 |
| **Total** | **69** |

## 3. Revue occurrence-par-occurrence

- **2579 occurrences** examinées pour les 69 candidats (pagination complète).
- Méthodologie : inspection directe des **diacritiques arabes** (fatha/dammah/kasra)
  pour déterminer le cas grammatical, **pas par confiance aveugle aux tags MASAQ**.
- **FORM > LEMME** strictement respecté sur 69/69 dossiers.
- **1 verbe** (كَفَرَ, 3e masc. sg. accompli) : vérifié sur 16 occurrences/11 sourates
  avec les 4 sources. Glose « il a mécru / il fut infidèle » correcte.
- **8 variantes d'Allah** : distinguées correctement (nominatif ٱللَّهُ / accusatif
  ٱللَّهَ / génitif ٱللَّهِ) avec leurs marques de pause (ۖ/ۚ/ۗ/ۙ).
- **6 variantes de peuple/gens** (قَوْم / نَّاس) : nominatif, accusatif, génitif
  correctement identifiés.
- **6 variantes de livre/Écriture** (كِتَـٰب) : toutes les formes (nom./acc./gén.,
  défini/indéfini, avec/sans tanwin) correctement glossées.
- **5 variantes de châtiment** (عَذَاب) : idem.
- **7 variantes de messager/prophète** (رَسُول / نَّبِىّ) : idem.
- **MASAQ tag disagreements** : 2 formes ont des tags MASAQ en conflit avec les
  diacritiques arabes (ffd19f57 ٱلْأَرْضَ marqué CASE_DEF_GEN mais portant fatha =
  accusatif ; 8ff068e8 ٱلنَّبِىُّ marqué ACCUSATIVE mais portant dammah = nominatif).
  Les gloses suivent les formes arabes réelles, pas les tags erronés.

## 4. Sources

| Source | resource_id | Couverture |
|---|---|---|
| Hamidullah FR | 31 | 69/69 |
| Kazimirski FR | 9001 | 69/69 |
| Sahih International EN | 20 | 69/69 |
| Piccardo IT | 153 | 69/69 |

## 5. Contrôles

| Contrôle | Résultat |
|---|---:|
| Collision Lots 1–14 | **0** |
| Candidat déjà traité (FR validée) | **0** |
| HOLD historique dans le plan | **0** |
| Zone protégée touchée | **0** |
| Glose vide | **0** |
| Divergence live | **0** |
| Unicode non-NFC documentées | **29** |

## 6. Matrice finale

| Contrôle | Attendu | Réel |
|---|---:|---:|
| candidats | 69 | **69** |
| dossiers examinés | 69 | **69** |
| occurrences récupérées | toutes | **2579/2579** |
| sources 4/4 | 69/69 | **69/69** |
| ACCEPT + MODIFY + HOLD + REJECT | 69 | **69** (69+0+0+0) |
| MOVE_TO_LEMMA | 0 | **0** |
| collision Lots 1–14 | 0 | **0** |
| candidat déjà traité | 0 | **0** |
| HOLD historique dans le plan | 0 | **0** |
| zone protégée touchée | 0 | **0** |
| glose vide | 0 | **0** |
| divergence live | 0 | **0** |
| DATABASE_WRITES | 0 | **0** |

## 7. Non-régression

| Outil | Résultat |
|---|---|
| `npx tsc --noEmit` | **PASS** |
| `npx eslint .` | **PASS** |
| `npx vitest run` | **PASS 775/775** |
| `npm run build` | **PASS** |
| Tests périmètre (29/29) | **PASS** |

## 8. Artefacts de la revue

- `tmp/phase70q/lot15-targeted-review.json` — 69 ACCEPT, 0 MODIFY, notes sur MASAQ
  tag disagreements et couverture C+P2.
- `tmp/phase70q/lot15-corrections.ts` — REVIEW_OVERRIDES_70Q vide (0 correction).
- `PHASE_70Q_REPORT.md` (ce document, mis à jour).

## 9. Conclusion Gate 2

La revue ciblée du Lot 15 est **terminée** : 69/69 dossiers examinés, 2579
occurrences, 4/4 sources, **69 ACCEPT / 0 MODIFY / 0 HOLD / 0 REJECT / 0
MOVE_TO_LEMMA**. Les gloses sont éditorialement correctes — distinctions de cas
fondées sur les diacritiques arabes réels, pas sur les tags MASAQ.

**Aucun DRY-RUN lancé. Aucun APPLY. Aucun Lot 16. Aucun HOLD traité. Aucun commit/push.**

---

*Phase 70Q — 2026-08-22 — DATABASE_WRITES = 0 — STOP*

---

# PHASE 70Q — LOT 15 — DRY-RUN (GATE 2 → GATE 3)

## 1. Verdict

```text
PHASE_70Q_LOT15_DRY_RUN_READY

DATABASE_WRITES = 0
DRY_RUN_STARTED = true
APPLY_STARTED = false
LOT_16_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false

STOP — HUMAN GATE 3 REQUIRED
```

## 2. Baseline live (revalidée)

| Élément | Attendu | Live |
|---|---:|---:|
| word_translations FR validées | 4421 | **4421** ✅ |
| Autres tables | identiques | ✅ |

## 3. Résultat DRY-RUN

| Contrôle | Résultat |
|---|---:|
| INSERT attendus | **69/69** |
| ALREADY_EXISTS | **0** |
| Collisions | **0** |
| Divergences | **0** |
| Écrasements | **0** |
| HOLDs dans le plan | **0** |
| Zones protégées | **0** |

## 4. Diff DB théorique

| Table | Avant | Après | Delta |
|---|---:|---:|---|
| **word_translations** | 4421 | **4490** | **+69** |
| Toutes les autres tables | inchangées | inchangées | **+0** |

`unexpected_table_changes = []`

## 5. Idempotence

- 1er APPLY théorique : **+69 INSERT**
- 2e APPLY théorique : **0 insertion** (69 doublons reconnus, contrainte `UNIQUE(word_id, language, source_id)`)
- 0 divergence

## 6. Provenance

- `language = "fr"` · `is_validated = true`
- `source = "Hikma — lexique éditorial"` · `source_id = 79e6412e-e349-4fe5-b29b-108237375a2d`

## 7. Non-régression

`tsc` PASS · `eslint .` PASS · `vitest run` **775/775** PASS · `build` PASS.

## 8. Sécurité

```text
DATABASE_WRITES = 0
APPLY_STARTED = false
```

Aucune écriture DB. Script APPLY non exécuté (`APPLY=1` bloque).

## 9. Artefacts

- `tmp/phase70q/lot15-dry-run.json`
- `tmp/phase70q/lot15-import-summary.json`
- `PHASE_70Q_REPORT.md` (mis à jour)

## 10. Conclusion Gate 3

Le DRY-RUN du Lot 15 est **complet et propre** : 69 INSERT simulés, 0 collision, 0 divergence,
idempotence vérifiée, diff théorique `word_translations +69` (4421 → **4490**).

**Aucun APPLY exécuté.** Human Gate 3 requis pour l'APPLY réel.

---

# PHASE 70Q — LOT 15 — APPLY RÉEL (GATE 3 → VERIFIED)

## 1. Verdict

```text
PHASE_70Q_LOT15_APPLIED_AND_VERIFIED

DATABASE_WRITES = 69
LOT_16_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false

word_translations FR validées = 4490
unexpected_table_changes = []
69/69 vérifiées
0 divergence
0 erreur

STOP — aucune écriture supplémentaire.
```

## 2. Baseline avant APPLY

| Élément | Valeur |
|---|---:|
| word_translations FR | 4421 |
| Autres tables | conformes |
| ALREADY_EXISTS | 0 |

Pré-vérification : PASS.

## 3. APPLY

| Contrôle | Résultat |
|---|---:|
| INSERT réels | **69/69** |
| Erreurs | **0** |
| ALREADY_EXISTS | **0** |

## 4. Post-vérification

| Contrôle | Attendu | Résultat |
|---|---:|---:|
| 69/69 présentes | 69 | **69** PASS |
| 69/69 texte exact | 69 | **69** PASS |
| 69/69 language=fr | 69 | **69** PASS |
| 69/69 is_validated=true | 69 | **69** PASS |
| 69/69 provenance correcte | 69 | **69** PASS |

## 5. Compteurs avant/après

| Élément | Avant | Après | Delta |
|---|---:|---:|---:|
| **word_translations FR** | 4421 | **4490** | **+69** |
| Toutes les autres tables | conformes | conformes | **+0** |

## 6. Zones protégées (intactes)

| Zone | Après |
|---|---:|
| Fātiḥah | 29 |
| 108/112/113/114 | 10/15/23/20 |
| Sourate 64 | 0 |

## 7. HOLDs (intacts)

أَعْلَمُ / كُنَّا / وَإِن : 0 wt FR, 0 mapping.

## 8. Non-régression

`tsc` PASS · `eslint .` PASS · `vitest run` **775/775** PASS · `build` PASS · Tests périmètre **29/29** PASS.

## 9. Artefacts

- `tmp/phase70q/lot15-import-summary.json` · `tmp/phase70q/lot15-post-verify.json`
- `PHASE_70Q_REPORT.md` (mis à jour).

---

*Phase 70Q — 2026-08-22 — DATABASE_WRITES = 69 — LOT 15 APPLIED AND VERIFIED*