# PHASE 16Q — PRÉPARATION CONDITIONNELLE DU PIPELINE LEXICAL KAZIMIRSKI 1860

## STATUT

**READ_ONLY** — préparation, sans exécution.

**DECISION: LEGAL_REVIEW_REQUIRED** · **STATUS: PREPARED_NOT_EXECUTED**

---

## Résumé exécutif

Le pipeline de production des gloses françaises depuis **Kazimirski 1860** (scan University of Toronto / Internet Archive) est **entièrement préparé et audité**, mais **laissé INACTIF** : la condition juridique unique identifiée en Phase 16P (usage commercial d'une transcription + données dérivées) **n'est pas levée** — aucune confirmation professionnelle n'est présente dans le projet. `NOT_IN_COPYRIGHT` reste un **indice**, jamais une licence. Le schéma de provenance existant est **suffisant** (aucune migration requise).

---

## A. Baseline initiale

quran_words **21 296** · word_occurrences **77 430** · ayahs **6 236** · translations **18 708** · word_translations **8** · lemmas **22** (validated **8** / proposed **14** / rejected **0**) · lemma_id **135** · root **0** · sources **2** · migration **0020**.

## B. Baseline finale

**Identique** (section A) — mesurée en fin de phase. 8 gloses validées intactes.

## C. État juridique

**LEGAL_REVIEW_REQUIRED.** `NOT_IN_COPYRIGHT` (métadonnée Internet Archive) n'est **pas** converti en `LICENSE_CONFIRMED`. Aucun `GO` juridique implicite. `source_license_status = LEGAL_REVIEW_REQUIRED`.

## D. État technique du canal Kazimirski

| Élément | Statut |
|---|---|
| Édition | originale 1860 (page de titre OCR confirmée) |
| Distinction vs BnF 1960 | distincte (Univ. Toronto / Robarts) |
| OCR | bilingue `fra+ara`, français lisible |
| Images | téléchargeables (JP2 / IIIF) |
| Mapping feuillet→page | disponible (`_page_numbers.json`) |
| Localisation par racine | réalisée (5 OCR_ONLY · 4 PARTIAL · 5 NOT_LOCATED) |

→ **Canal techniquement PRÊT**, conditionné à la seule confirmation juridique.

## E. État des 14 unités

Toutes **`proposed` / PENDING**, aucune signification créée.

## F. Localisations disponibles

- **OCR_ONLY** (5) : رَسُول (p.861) · قَوْم (p.121) · رَحْمَة (p.838) · أَرْض (p.25) · عَبْد (p.150-151)
- **PARTIAL** (4) : يَوْم (fin t.2) · عَذَاب (p.198/768/1593) · نَبِيّ (p.104) · كِتَاب (p.858-860) · كَفَر (p.914) — **soit 5 PARTIAL** (يَوْم, عَذَاب, نَبِيّ, كِتَاب, كَفَر)
- **NOT_LOCATED** (4) : نَاس · كَان · فِي · لَا

## G. Entrées SCAN_VERIFIED

**0** — la vérification visuelle est réservée à un humain (l'agent n'a pas de vision). `OCR ≠ preuve`.

## H. Entrées OCR_ONLY

**5** : رَسُول · قَوْم · رَحْمَة · أَرْض · عَبْد (blocs français OCRisés lisibles).

## I. Entrées PARTIAL

**5** : يَوْم · عَذَاب · نَبِيّ · كِتَاب · كَفَر (section racine ou contexte trouvés, vedette à épingler).

## J. Entrées NOT_LOCATED

**4** : نَاس · كَان · فِي · لَا (vedette non isolable par sous-chaîne OCR).

## K. Cas SPECIALIST_REVIEW_REQUIRED

- **Polysémiques** : عَبْد · كِتَاب · كَفَر.
- **Grammaticaux** : فِي · لَا · كَان (à traiter comme unités fonctionnelles, pas comme gloses canoniques).

## L. État du pipeline ~250

Protocole documenté (identifier → localiser → vérifier scan → extraire → fiche → proposition → revue → validation → import), **aucune étape d'import/validation exécutée**. Réservé au feu vert juridique.

## M. Audit provenance

Le schéma actuel **suffit** : `sources.name/type/url/version/license/retrieved_at/metadata` + `word_translations.source_id/editorial_notes/is_validated/validated_at`. **Aucune migration nécessaire.** (Remarque : `sources.license` est du texte libre — on y consignera explicitement `LEGAL_REVIEW_REQUIRED` tant que non levé.)

## N. Tests

| Commande | Résultat |
|---|---|
| npm test | 172/172 ✅ |
| npx tsc --noEmit | 0 erreur ✅ |
| npm run lint | 0 erreur ✅ |
| npm run build | 0 erreur ✅ |
| npm run verify:persistence | 13/13 ✅ |
| npm run verify:rls | 27/27 ✅ |

## O. Audit git / fichiers / migrations

- Aucune migration nouvelle (dernière = **0020**).
- Aucun seed, aucun script d'import résiduel.
- Aucun changement de code produit (seuls des rapports documentaires `PHASE_16*.md` et fichiers `tmp/` ont été ajoutés).
- Aucune modification des 8 gloses.

## P. Non-régression

Baseline identique début/fin (section A/B). Compteurs, statuts, sources, migration inchangés.

## Q. Blocage restant

**UNIQUE** : confirmation juridique professionnelle — « l'utilisation commerciale d'une transcription produite à partir du scan Kazimirski 1860 (Univ. Toronto / IA, `NOT_IN_COPYRIGHT`), ainsi que la production de données dérivées, est licite. » Tant que non obtenue : **aucune écriture**.

## R. Recommandation Phase 16R

1. Obtenir (humain/juriste) la **confirmation juridique** du canal — décision projet, pas linguistique.
2. Une fois confirmée : exécuter le pipeline en **écriture contrôlée** dans l'ordre documenté (localisation → scan → transcription → PROPOSED → revue → validation → import).
3. En attendant : maintenir **8 `validated` + 14 `proposed`** strictement inchangés.

---

## Livrables

- 📄 `PHASE_16Q_KAZIMIRSKI_PIPELINE_READINESS_REPORT.md` (ce rapport)
- 📄 `PHASE_16Q_KAZIMIRSKI_14_UNIT_REVIEW_GRID.md`
- 📄 `tmp/phase16q-kazimirski-pipeline.json` (marqué « DOCUMENTARY ONLY · NOT VALIDATED · NOT IMPORTED · NO DATABASE WRITES »)

---

**DECISION: LEGAL_REVIEW_REQUIRED** · **STATUS: PREPARED_NOT_EXECUTED** · **DATABASE_WRITES: 0** · **IMPORTS: 0** · **VALIDATIONS: 0** · **PHASE 16Q — ARRÊT OBLIGATOIRE.**
