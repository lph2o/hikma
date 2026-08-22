# PHASE 19C — IMPORT DES 14 PROPOSITIONS DE GLOSES PÉDAGOGIQUES

## STATUT

**STATUS = IMPORTED_PENDING_VALIDATION** · **DECISION = GO**

**DATABASE_WRITES = 14** · **IMPORTS = 14** · **VALIDATIONS = 0** · **MIGRATIONS = 0**

**lemma_translations : 4 → 18** · **14 nouvelles lignes `is_validated = false`** · **4 lignes historiques strictement inchangées**

---

## A. Baseline (capturée avant toute écriture)

| Compteur | Valeur |
|---|---|
| quran_words | 21 296 |
| word_occurrences | 77 430 |
| ayahs | 6 236 |
| translations | 24 944 |
| word_translations | 8 |
| lemmas | 22 |
| sources | 4 |
| lemma_translations | **4** |

## B. Décision de provenance — source_id (section 3)

**source_id = `79e6412e-e349-4fe5-b29b-108237375a2d`** — **« Hikma — lexique éditorial »** (`type = editorial`, « Données originales Hikma — production interne »).

Justification :
- **source existante** — aucune source inventée ;
- représente exactement la couche **éditoriale Hikma** (même source que les 8 `word_translations`) ;
- ne présente **PAS** les gloses comme des citations du Dictionnaire Kazimirski 1860 ;
- la contrainte `UNIQUE (lemma_id, language, source_id)` (migration 0021) sépare les 4 lignes 1860 (source `567c8b5d-…`) des 14 nouvelles (source éditoriale) — **aucune collision**.

## C. Dry-run (obligatoire — aucune écriture)

```
14 candidates
14 lemma_id valides
14 language = fr
14 gloses non vides
0 conflit inattendu
0 doublon
→ PASS
```

### Correspondances lemma → lemma_id → proposed_gloss

| Lemme | lemma_id | Glose proposée | Confiance |
|-------|----------|----------------|-----------|
| يَوْم | aadb9c24-063c-4f8d-8c40-e527dd866a28 | « jour » | HIGH |
| رَسُول | 6449da99-8a5b-4bcc-99ed-14b5169629a8 | « messager / envoyé » | HIGH |
| رَحْمَة | bfa97e6e-6c3c-4947-9a52-892cb9beb0c6 | « miséricorde » | HIGH |
| أَرْض | 2ccaa3d6-a1d6-44ec-8829-728d7be639c7 | « terre » | HIGH |
| كِتَاب | 7a4f0fe4-15dd-434c-aa01-7538484c5232 | « livre / Écriture » | HIGH |
| قَوْم | f706fd3c-df4e-4ecb-ba60-f34e2c15b1dc | « peuple / gens » | **MEDIUM** |
| نَاس | d8d52703-f5f8-47a9-b6f0-33cfcc8d55f8 | « gens / hommes » | HIGH |
| عَذَاب | 04ef3735-1eb7-4506-a87e-febed2c1968e | « châtiment » | HIGH |
| نَبِيّ | aa87a728-43f3-4f2b-bc4f-8fdd62f41258 | « prophète » | HIGH |
| عَبْد | 77747cb5-2306-43a9-ac13-67d67f3539b9 | « serviteur (de Dieu) » | HIGH |
| لَا | 1c991295-1848-41ab-bf00-6d2f29137c79 | « non / ne…pas » | HIGH |
| كَان | 903ca0ff-d797-4b39-ad90-dfd49ef09437 | « être » | HIGH |
| كَفَر | 20ad9d00-8c8a-45ea-9dfb-e6859a221c59 | « être incrédule / ne pas croire » | HIGH |
| فِي | e34c8427-5e9a-4505-bb7a-fe4fa2f92bc3 | « dans / en / sur » | HIGH |

## D. Import

- **14 lignes insérées** (source éditoriale, language `fr`, `text` = `proposed_gloss`, `editorial_notes` préservées depuis le payload 19B).
- **4 lignes historiques inchangées** (عَبْد · رَحْمَة · لَا · أَرْض — aucune UPDATE/DELETE).
- Aucune autre donnée modifiée : translations, sources, word_translations, etc. intacts.

## E. is_validated

| Vérification | Résultat |
|---|---|
| Nouvelles lignes `is_validated = false` | **14 / 14** ✅ |
| Nouvelles lignes `is_validated = true` | **0** ✅ |
| Total `is_validated = true` dans la table | **0** |
| Total `is_validated = false` dans la table | **18** (4 historiques + 14 nouvelles) |

Même **HIGH** reste `is_validated = false` — **aucune validation automatique**.

## F. Vérification des 4 anciennes lignes

Les 4 lignes Kazimirski 1860 (source `567c8b5d-…`) restent : 4 lignes, `is_validated = false`, texte et `editorial_notes` inchangés. **Non touchées.**

## G. Resolver (moteur pédagogique)

Vérifié dans `lib/learning/queries.ts` :
- `getValidatedFrenchLemmaMeanings` → `.eq("is_validated", true)` ✅
- `getValidatedFrenchLemmaMeaningsByWord` → `.eq("is_validated", true)` ✅

**Les 14 propositions ne sont PAS exposées au moteur pédagogique.** Comportement attendu respecté : stockées → non validées → non exposées. **Resolver non modifié.**

## H. Idempotence (second run obligatoire)

| Métrique | Résultat |
|---|---|
| inserted | **0** |
| existing | **14** |
| errors | **0** |
| lemma_translations total | **18** (et non 32) |

Contrainte `UNIQUE (lemma_id, language, source_id)` vérifiée — aucune duplication possible.

## I. Tests

| Vérification | Résultat |
|---|---|
| `npm test` | **184 / 184** ✅ |
| `npx tsc --noEmit` | **0 erreur** ✅ |
| `npm run lint` | **0 warning / 0 erreur** ✅ |
| `npm run build` | **0 erreur** ✅ |
| `npm run verify:persistence` | **13 / 13** ✅ |
| `npm run verify:rls` | **27 / 27** ✅ |

## J. Non-régression

| Compteur | Attendu | Constaté |
|---|---|---|
| quran_words | 21 296 | **21 296** ✅ |
| word_occurrences | 77 430 | **77 430** ✅ |
| ayahs | 6 236 | **6 236** ✅ |
| translations | 24 944 | **24 944** ✅ |
| word_translations | 8 | **8** ✅ |
| lemmas | 22 | **22** ✅ |
| sources | 4 | **4** ✅ |
| lemma_translations | **4 → 18** | **18** ✅ |

Seul `lemma_translations` a évolué (4 → 18), conformément à l'objectif. `word_translations` (8) et les 4 anciennes `lemma_translations` strictement intactes.

## K. Décision finale

```
STATUS = IMPORTED_PENDING_VALIDATION
DATABASE_WRITES = 14
IMPORTS = 14
VALIDATIONS = 0
MIGRATIONS = 0
lemma_translations = 18
14 nouvelles propositions : is_validated = false
```

---

## ARRÊT OBLIGATOIRE

**NE PAS valider les 14 propositions.** La validation éditoriale (`is_validated = true`) est une phase ultérieure distincte, sur décision du propriétaire, après revue humaine.

### Livrables
- 📄 `PHASE_19C_PEDAGOGICAL_GLOSS_IMPORT_REPORT.md`
- 📄 `tmp/phase19c-pedagogical-gloss-import-evidence.json` (`IMPORTED_PENDING_VALIDATION`)
- 🔧 `tmp/phase19c-import.ts` (réexécutable, idempotent)
