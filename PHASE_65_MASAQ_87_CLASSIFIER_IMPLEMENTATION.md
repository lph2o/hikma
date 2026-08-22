# PHASE 65 — MASAQ 87 CLASSIFIER IMPLEMENTATION

STATUT : **IMPLEMENTATION + VALIDATION + DRY-RUN** — seuls `lib/linguistic/masaq.ts`
et `tests/masaq.test.ts` ont été modifiés. **Aucune écriture DB.** Aucun commit,
aucun push.

---

## A. Baseline

Vérifiée avant toute modification (DB réelle + suite complète) :

| Vérification | Résultat |
|---|---|
| linguistic_occurrences / segments | 539 / 1 051 |
| MASAQ 91 / 87 / 96 | 54 / **0** / 72 |
| word_translations FR validées | 538 |
| Catalogue | 24 parcours (1 REFERENCE + 23 READY + 0 IN_PREPARATION) |
| Readiness 91 / 87 / 96 | READY / READY / READY |
| tsc / eslint / vitest / build | ✅ / ✅ / **748/748** / ✅ |

Conforme à l'état post-Phase 63. Aucune divergence.

## B. Fichiers de production modifiés

1. **`lib/linguistic/masaq.ts`** — `normalizeOrthographic()` : ajout des règles
   A′ et B2 (uniquement, aucune autre règle touchée).
2. **`tests/masaq.test.ts`** — ajout de 5 blocs de tests ciblés Phase 65.

Aucun autre fichier de production modifié. `classifyAlignment`, `alignKey`,
`assertPlanScope`, `buildImportPlan`, `scripts/import-masaq-multi-surah.ts`
inchangés — la correction passe par le normalizer canonique existant.

## C. Règle A′ — petit yeh exposant U+06E6 (contextuelle)

Implémentée dans `normalizeOrthographic()` (avant toute autre règle 06E6) :

```
A′ :
  ه + diacritiques* + U+06E6  →  omission du U+06E6        (suffixe pronominal هِۦ)
  U+06E6 restant              →  U+064A (yā' plein)        (marqueur de voyelle -i)
```

```ts
out = out.replace(/(\u0647[\u064b-\u0652\u0670\u0653\u0654]*)\u06e6/g, "$1");
out = out.replace(/\u06e6/g, "\u064a");
```

- Corrige `رَبِّهِۦ` → `رَبِّهِ` (87:15:3) → **EXACT_ORTHOGRAPHIC** ;
- **préserve** les cas où MASAQ écrit ي plein : `إِۦلَـٰفِهِمْ` → `إِيلَافِهِمْ`
  (106:2:1, unique cas importé) et `ءَاتَىٰنِۦَ` (27:36:8) — vérifié en tests.

## D. Règle B2 — wāw silencieux + dagger-alif

Ajoutée **avant** la règle générique dagger-alif (ordre nécessaire) :

```
B2 :  \u0648\u0670  →  \u0627        (و + dagger-alif → alif plein)
```

```ts
out = out.replace(/\u0648\u0670/g, "\u0627"); // avant \u0670 → \u0627
```

- Corrige `ٱلْحَيَوٰةَ` → `ٱلْحَيَاةَ` (87:16:3) → **EXACT_ORTHOGRAPHIC** ;
- la séquence و+ل+ٰ (`أُولَٰئِكَ`) est hors périmètre : le wāw reste une lettre
  (vérifié en test : `normalizeOrthographic("أُولَٰئِكَ") = "اولايك"`,
  classification EXACT inchangée par rapport à avant).

## E. Tests ajoutés (5 blocs)

| Bloc | Couverture |
|---|---|
| A′ suffixal | 87:15:3, بِهِۦ, لِقَوْمِهِۦ, فِيهِۦ, يُؤَدِّهِۦٓ → alignés ; رَبِّهِۦ ≠ رَبِّهِمْ → AMBIGUOUS |
| A′ préservé | إِۦلَـٰفِهِمْ (106:2:1), ءَاتَىٰنِۦَ (27:36:8), يُحْىِۦ → inchangés |
| B2 | 87:16:3, صَلَوٰة, زَكَوٰة, مَنَوٰة, غَدَوٰة, رِبَوٰا → alignés |
| Hors périmètre | أُولَٰئِكَ → non transformé en و+ا |
| Stabilité | reprise des cas canoniques (Al-Fātiḥah / 43B) — aucune régression |

Résultat : **28/28** dans `tests/masaq.test.ts` ; suite complète **753/753**
(748 baseline + 5).

## F. Corpus complet — comparaison AVANT / APRÈS

Rejoué sur 77 410 paires (occurrences Hikma × CSV MASAQ), règles AVANT (copie
locale Phase 43B) vs APRÈS (module modifié) — `tmp/phase65-corpus-verify.json` :

| Statut | AVANT | APRÈS | Δ |
|---|---:|---:|---:|
| EXACT | 42 462 | 42 462 | 0 |
| EXACT_ORTHOGRAPHIC | 31 134 | 32 188 | **+1 054** |
| VARIANT_ORTHOGRAPHY_DOCUMENTED | 2 454 | 2 519 | **+65** |
| AMBIGUOUS | 1 360 | **241** | **−1 119** |

- **Transitions** : uniquement `AMBIGUOUS → EXACT_ORTHOGRAPHIC` (1 054) et
  `AMBIGUOUS → VARIANT` (65). **0 régression** (aucun EXACT/ORTHO/VARIANT →
  AMBIGUOUS).
- **87** : les 2 seules ambiguïtés de la sourate deviennent alignées —
  87:15:3 et 87:16:3 → EXACT_ORTHOGRAPHIC.
- **Collisions (groupes de normalisation)** : 6 183 → 6 158 (−25), fusion
  bénigne documentée (بِهِۦ / بِهِ, même word_id) — conforme à la prédiction
  de la Phase 64 (6 183 → 6 158). Les seuls groupes fusionnés de 87
  (وَٱلَّذِى/وَٱلَّذِىٓ, إِن/إِنَّ) existent déjà sous les règles AVANT.
- **word_id / clés** : alignement positionnel `(surah, ayah, position)`
  inchangé — aucun rattachement déduit du texte normalisé, aucun changement de
  clé, aucun changement de word_id.

## G. DRY-RUN sourate 87

Via le mécanisme canonique existant, sans APPLY :

```
SURAH=87 npx tsx scripts/import-masaq-multi-surah.ts
✅ checksum MASAQ vérifié (777d0cc8…)
Plan sourate 87 : 72/72 alignées · EXACT=47 ORTHO=21 VARIANT=4
MISSING=0 EXTRA=0 AMBIGUOUS=0 · segments=137
DRY-RUN terminé : aucune écriture DB.
```

- 72/72 occurrences alignées, 0 MISSING, 0 EXTRA, **0 AMBIGUOUS** ;
- 87:15:3 et 87:16:3 alignées (orthographique déterministe) ;
- 137 segments récupérés (baseline source) ;
- aucune occurrence hors sourate 87 ;
- `assertPlanScope` **satisfait** (sinon le script aurait levé une erreur).

**L'import n'a PAS été appliqué** — la Phase 65 s'arrête au dry-run (règle §12).

## H. Comparaison avant / après (résumé)

| Élément | AVANT (Phase 64) | APRÈS (Phase 65) |
|---|---|---|
| 87:15:3 رَبِّهِۦ | AMBIGUOUS | EXACT_ORTHOGRAPHIC |
| 87:16:3 ٱلْحَيَوٰةَ | AMBIGUOUS | EXACT_ORTHOGRAPHIC |
| AMBIGUOUS corpus | 1 360 | 241 |
| Collisions groupes | 6 183 | 6 158 |
| Régression | — | 0 |
| Tests | 748 | 753 |

## I. Non-régression Hikma

| Vérification | Résultat |
|---|---|
| `npx tsc --noEmit` | ✅ 0 erreur |
| `npx eslint .` | ✅ 0 erreur |
| `npx vitest run` | ✅ **753/753** |
| `npm run build` | ✅ Compilé |
| `getWordLinguisticEvidence(91)` | ✅ 48/48 word_ids (54/54 occurrences) |
| `getWordLinguisticEvidence(96)` | ✅ 59/59 |
| `getWordLinguisticEvidence(87)` | ⏸ 0 (non importé — DRY-RUN READY) |

Le runtime MASAQ (`getWordLinguisticEvidence`) est inchangé : il ne dépend que
des données importées, pas du normalizer. 91 et 96 restent pleinement couvertes,
87 reste volontairement sans données jusqu'à la phase d'import.

## J. Compteurs DB (avant = après)

| Compteur | Avant | Après |
|---|---:|---:|
| linguistic_occurrences | 539 | **539** ✅ |
| linguistic_segments | 1 051 | **1 051** ✅ |
| MASAQ 91 / 87 / 96 | 54 / 0 / 72 | 54 / **0** / 72 ✅ |
| word_translations FR | 538 | 538 |
| Parcours / lessons / lesson_words | 24 / 191 / 1 307 | identiques |

**Aucune écriture DB.** Vérifié par `tmp/phase65-final-verify.json`.

## K. Décision finale

Tous les critères de succès sont remplis :
✓ A′ implémentée ✓ B2 implémentée ✓ 87:15:3 alignée ✓ 87:16:3 alignée
✓ 0 régression corpus ✓ 0 collision dangereuse ✓ 0 changement de word_id
✓ 0 écriture DB ✓ 91 inchangée (54) ✓ 96 inchangée (72) ✓ 753/753 tests
✓ tsc/eslint/build verts ✓ DRY-RUN 87 = 72/72, 0 AMBIGUOUS, 0 MISSING, 0 EXTRA
✓ rapport complet.

## Verdict

**`PHASE_65_MASAQ_87_CLASSIFIER_READY_FOR_IMPORT`**

Le classifieur canonique reconnaît désormais les deux variantes orthographiques
documentées (Phase 64) avec une robustesse démontrée sur le corpus complet :
1 119 ambiguïtés résolues, 0 régression, 0 nouvelle collision, aucune donnée
modifiée. Le plan d'import de la sourate 87 est **prêt** (72/72, 0 AMBIGUOUS).

**L'import MASAQ 87 est volontairement NON exécuté** : phase séparée à venir
(import + vérification runtime), conformément à la séparation stricte
« modification du classifieur → validation → import des données → vérification
runtime ».

**STOP.** Aucune Phase 66 lancée automatiquement. Aucun commit. Aucun push.

---

### Artefacts
- `tmp/phase65-corpus-verify.ts` / `.json` — comparaison corpus AVANT/APRÈS
- `tmp/phase65-final-verify.ts` / `.json` — compteurs DB + runtime
