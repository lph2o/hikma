# PHASE 17D — CONSTITUTION ET IMPORT CONTRÔLÉ DES 14 GLOSES KAZIMIRSKI

## STATUT

**IMPORT_PARTIAL** — 4 propositions Kazimirski importées au niveau **lemme** (`is_validated = false`) ; 10 entrées **bloquées** (aucun texte source isolé → pas d'import sans invention).

**GLOSES VALIDÉES : 0** · **GLOSES INVENTÉES : 0**

---

## A. Nombre de propositions

**4** sur 14 cibles (les seules dont le bloc français Kazimirski est réellement isolé dans le corpus préparé en Phase 16K).

## B. Nombre importé

**4** — عَبْد · رَحْمَة · لَا · أَرْض.

## C. Nombre bloqué

**5** — يَوْم · نَاس · كِتَاب · كَان · كَفَر (vedette arabe non isolée dans l'OCR → importer une glose reviendrait à inventer une citation).

## D. Nombre nécessitant review

**5** — رَسُول · قَوْم · عَذَاب · نَبِيّ · فِي (contexte français attesté mais entrée non isolée → lecture du scan + formulation humaine requises).

## E. Nombre validé

**0.**

## F. Nombre non validé

**4** (toutes les lignes importées : `is_validated = false`, `validated_at = NULL`).

## G. source_id

`567c8b5d-ff97-432c-9cb1-8fa88e41f0f4` — « Kazimirski — Dictionnaire arabe-français (1860) » (`historical_dictionary`).

## H. lemma_id

| Lemme | lemma_id |
|---|---|
| عَبْد | `77747cb5-2306-43a9-ac13-67d67f3539b9` |
| رَحْمَة | `bfa97e6e-6c3c-4947-9a52-892cb9beb0c6` |
| لَا | `1c991295-1848-41ab-bf00-6d2f29137c79` |
| أَرْض | `2ccaa3d6-a1d6-44ec-8829-728d7be639c7` |

Aucun nouveau lemme créé — les 4 `lemma_id` proviennent du corpus réel.

## I. Provenance

`source_id` → Kazimirski 1860 (édition originale, scan University of Toronto / Internet Archive). Le champ `text` porte **« ce que dit Kazimirski »** (texte source OCR fidèle), **jamais** reformulé en glose pédagogique — cette dernière reste une étape éditoriale séparée (distinction source_text vs pedagogical_gloss consignée dans `editorial_notes`).

## J. Pages (candidates, scan NON vérifié)

| Lemme | Page candidate |
|---|---|
| عَبْد | t.2 p.150-151 (f.160-161) |
| رَحْمَة | t.1 p.838 (f.848) |
| لَا | t.2 section ل (page non épinglée) |
| أَرْض | t.1 p.25 (f.35) |

**Aucune page inventée** — références issues des candidats OCR/racine documentés, marquées `PENDING_HUMAN_VERIFICATION` (scan non lu).

## K. Anomalies

- 10/14 entrées **sans bloc français isolé** dans le corpus préparé → non importées (aucune glose inventée).
- Les 4 textes importés sont **du texte source OCR** (ex. « clave » = bruit OCR de « esclave » dans عَبْد) → marqués `scan NON vérifié` + `HUMAN_REVIEW_REQUIRED`.
- `لَا` : localisation divergente 16K (`IDENTIFIED_IN_OCR`) vs 16Q (`NOT_LOCATED`) — signalée, sans impact (texte source présent, page non épinglée).

## L. Dry-run

`DRY_RUN=1 npm run seed:lemma-translations` → **4 résolues** (lemma_id + source_id OK), **0 erreur**, 0 écriture.

## M. Import

`npm run seed:lemma-translations` → **4 insérée(s), 0 déjà présente(s)**.

## N. Idempotence

2ᵉ exécution → **0 insérée(s), 4 déjà présente(s)** (contrainte `UNIQUE (lemma_id, language, source_id)` + `ON CONFLICT DO NOTHING`).

## O. Tests

`npm test` **184/184** (dont 12 tests lemma_translations) · `tsc` **0** · `lint` **0** · `build` **0** · `verify:persistence` **13/13** · `verify:rls` **27/27**.

**Vérification résolveur** : la requête `lemma_translations?is_validated=eq.true` retourne **0** ligne → les 4 propositions NON validées sont **invisibles** pour `getValidatedFrenchLemmaMeanings` / `resolveWordMeanings`. Les tests unitaires couvrent le cas inverse (une ligne validée devient disponible) **sans toucher aux données réelles**.

## P. Non-régression

| Compteur | Avant | Après |
|---|---|---|
| quran_words | 21 296 | 21 296 |
| word_occurrences | 77 430 | 77 430 |
| ayahs | 6 236 | 6 236 |
| translations | 18 708 | 18 708 |
| word_translations | 8 | 8 (8/8 validées, **intactes**) |
| lemmas | 22 (8/14/0) | 22 (8/14/0) |
| sources | 3 | 3 |
| lemma_translations | 0 | **4** (0 validées) |

---

## Tableau final des 14 entrées

| Arabic | lemma_id | glose | provenance | validated | status |
|---|---|---|---|---|---|
| عَبْد | 77747… | « 1. Esclave… 2. Serviteur de Dieu… » | t.2 p.150-151 | false | IMPORTED_PENDING_VALIDATION |
| رَحْمَة | bfa97e… | « 1. Clémence, miséricorde (de Dieu)… » | t.1 p.838 | false | IMPORTED_PENDING_VALIDATION |
| لَا | 1c9912… | « Non, ne, particule négative… » | t.2 section ل | false | IMPORTED_PENDING_VALIDATION |
| أَرْض | 2ccaa3… | « 1. Terre, globe terrestre… » | t.1 p.25 | false | IMPORTED_PENDING_VALIDATION |
| رَسُول · قَوْم · عَذَاب · نَبِيّ · فِي | — | — | contexte seulement | — | REVIEW_REQUIRED |
| يَوْم · نَاس · كِتَاب · كَان · كَفَر | — | — | vedette non isolée | — | BLOCKED |

---

## Livrables

- 📄 `PHASE_17D_KAZIMIRSKI_GLOSSES_IMPORT_REPORT.md` (ce rapport)
- 📄 `tmp/phase17d-kazimirski-import-evidence.json` (marqué « DOCUMENTARY + IMPORTED + NOT_VALIDATED »)
- 🔧 `scripts/seed-lemma-translations.ts` (PROPOSALS = 4 entrées source-établies)

---

**PHASE 17D — IMPORT_PARTIAL** · **IMPORTÉES : 4 (is_validated=false)** · **BLOQUÉES/REVIEW : 10** · **VALIDÉES : 0** · **ARRÊT OBLIGATOIRE.**
