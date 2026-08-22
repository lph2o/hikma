# PHASE 17 — EXÉCUTION FINALE DU PIPELINE KAZIMIRSKI 1860

## STATUT

**DECISION: LEGAL_GO (asserté dans le brief) — non documenté par une confirmation juridique professionnelle.**

**RÉSULTAT : IMPORT_BLOCKED** — le pipeline a été audité jusqu'au dry-run, mais **aucune donnée importable n'existe encore**. Aucune écriture n'a été effectuée.

**DATABASE_WRITES: 0** · **IMPORTS: 0** · **MIGRATIONS: 0**

---

## A. Decision

Le brief de Phase 17 déclare `LEGAL_GO`. **Aucun artefact de confirmation juridique professionnelle n'existe dans le dépôt** — la Phase 16R s'est conclue sur `LEGAL_REVIEW_REQUIRED`. Cette contradiction est **signalée sans être tranchée** par l'agent (aucune interprétation juridique, aucun « GO » inventé).

**Point décisif** : même en acceptant `LEGAL_GO` tel quel, l'import est **bloqué pour des raisons de données**, indépendantes du juridique (voir B).

## B. Pipeline

`PREPARED (16Q) → AUDITED (17) → DRY-RUN (17) → NOT EXECUTED`

Le dry-run conclut à **0 ligne importable**. Les raisons, toutes factuelles :

1. **Aucune glose française n'existe** pour les 14 unités : `pedagogical_gloss = null` partout (artefact 16K). La produire est une étape **éditoriale humaine** — l'agent est **interdit** de générer une glose (règle de non-invention, phases 16K→16P).
2. **Aucune vérification visuelle** : `SCAN_VERIFIED = 0/14`. L'agent n'a pas de capacité de vision (établi en 16L) ; `OCR ≠ preuve`. Le brief 17 lui-même interdit `OCR_ONLY / PARTIAL / NOT_LOCATED → VALIDATED`.
3. **Aucune revue linguistique** : aucun `REVIEWER/LINGUISTE QUALIFIÉ` n'a produit de validation. Le propriétaire du projet n'est **pas** le réviseur linguistique.
4. **Aucun mapping `word_id`** : `word_translations` est indexée sur `quran_words.id` (`word_id`), pas sur `lemma`. Aucun mapping des 14 lemmes vers des `word_id` concrets n'a été préparé (le seed existant résout les `word_id` via `lesson_words`, ce qui ne couvre pas les 14 lemmes `proposed`).

→ Le payload d'import (glose française **humainement formulée + revue + vérifiée contre le scan + rattachée à un `word_id`**) **n'existe pas encore**. Importer maintenant exigerait de **fabriquer** des gloses et de **fabriquer** une vérification de scan — deux opérations explicitement interdites.

## C. Source utilisée

Kazimirski, *Dictionnaire arabe-français*, édition originale 1860 (Paris — Maisonneuve / Impr. W. Remquet).

## D. Edition

Originale 1860 (distincte de la réédition BnF 1960).

## E. Scan

University of Toronto / Internet Archive — `dictionnairearab01bibeuoft` (tome 1) · `dictionnairearab02bibeuoft` (tome 2) · OCR bilingue `fra+ara`.

## F. Nombre d'entrées examinées

**14** (les 14 lemmes `proposed`).

## G–N. Répartition (artefact 16K, source documentaire)

| Compteur | Valeur |
|---|---|
| G. OCR_ONLY / identifiées en OCR (bloc FR lisible, non vérifié) | **4** (عَبْد · رَحْمَة · أَرْض · لَا) |
| H. PARTIAL (contexte seulement, vedette à isoler) | **5** (رَسُول · قَوْم · عَذَاب · نَبِيّ · فِي) |
| I. NOT_LOCATED (vedette non isolée / faux positifs) | **5** (يَوْم · نَاس · كِتَاب · كَان · كَفَر) |
| J. SCAN_VERIFIED | **0** |
| K. VALIDATED | **0** |
| L. IMPORTED | **0** |
| M. SKIPPED | **14** |
| N. NEEDS_REVIEW | **14** (scan + revue linguistique) |

## O. Doublons

**0** — aucune insertion tentée (idempotence non sollicitée). Le mécanisme d'idempotence existe néanmoins : contrainte `word_translations_word_lang_source_key UNIQUE (word_id, language, source_id)` + `ON CONFLICT DO NOTHING` du seed existant.

## P. Erreurs

**0** — aucun write tenté ; dry-run triviale (0 ligne).

## Q. Tables modifiées

**Aucune.** `word_translations`, `sources`, `lemmas`, `quran_words` inchangées.

## R. Migrations créées

**0** — le schéma actuel suffit (`sources` + `word_translations.source_id/editorial_notes/is_validated/validated_at` + `lemmas.status`). Aucune migration nécessaire.

## S. Scripts utilisés

- **Relus (non exécutés pour Kazimirski)** : `scripts/seed-word-translations.ts` (mécanisme d'import idempotent existant, résolution `word_id` via `lesson_words`).
- **Créés/supprimés** : aucun script d'import créé (rien à importer).

## T. Tests avant import

`npm test` **172/172** · `tsc --noEmit` **0** · `lint` **0** · `build` **0** · `verify:persistence` **13/13** · `verify:rls` **27/27**.

## U. Tests après import (aucune écriture)

Identiques : `npm test` **172/172** · `tsc` **0** · `lint` **0** · `build` **0** · `verify:persistence` **13/13** · `verify:rls` **27/27**.

## V. Non-régression

| Compteur | Avant | Après |
|---|---|---|
| quran_words | 21 296 | 21 296 |
| word_occurrences | 77 430 | 77 430 |
| ayahs | 6 236 | 6 236 |
| translations | 18 708 | 18 708 |
| word_translations | 8 | 8 |
| lemmas | 22 (8/14/0) | 22 (8/14/0) |
| lemma_id renseigné | 135 | 135 |
| root renseigné | 0 | 0 |
| sources | 2 | 2 |
| dernière migration | 0020 | 0020 |

**8 gloses `is_validated = true` strictement intactes.** Aucune donnée existante supprimée ni modifiée.

## W. Provenance

**Aucune donnée importée → aucune provenance écrite.** Le canal Kazimirski n'est **pas** enregistré dans `sources` (le statut juridique reste `LEGAL_REVIEW_REQUIRED`, faute de confirmation documentée). Modèle de provenance futur conservé : `sources.name/type/url/version/license/retrieved_at/metadata` + `word_translations.source_id/editorial_notes`.

## X. Limites résiduelles

1. **Juridique** : `LEGAL_GO` asserté mais non documenté (16R = `LEGAL_REVIEW_REQUIRED`).
2. **Technique** : 0/14 `SCAN_VERIFIED` (lecture visuelle humaine requise — l'agent n'a pas de vision).
3. **Linguistique** : aucune glose formulée/revue par un humain ; 4 cas spécialistes (عَبْد · كِتَاب · كَان · كَفَر) + 3 grammaticaux (فِي · لَا · كَان) non résolus.
4. **Mapping** : `word_id` des 14 lemmes non résolu.
5. **Documentaire mineur** : localisation de `لَا` divergente entre 16K (`IDENTIFIED_IN_OCR`) et 16Q (`NOT_LOCATED`) — sans impact sur le résultat.

---

## DÉCISION FINALE

**IMPORT_BLOCKED**

L'import Kazimirski 1860 ne peut pas être exécuté : **le payload importable (gloses françaises humainement formulées, revues, vérifiées contre le scan, rattachées à un `word_id`) n'existe pas encore.** L'exécuter exigerait de fabriquer des gloses et une vérification de scan, ce qui est interdit. Aucune écriture, aucune migration, aucune validation n'a eu lieu. La baseline est strictement inchangée.

---

## Livrables

- 📄 `PHASE_17_KAZIMIRSKI_IMPORT_REPORT.md` (ce rapport)
- 📄 `tmp/phase17-kazimirski-import-evidence.json` (marqué « DOCUMENTARY ONLY · NO IMPORT EXECUTED · IMPORT BLOCKED »)

---

**PHASE 17 — IMPORT_BLOCKED** · **DATABASE_WRITES: 0** · **IMPORTS: 0** · **MIGRATIONS: 0** · **ARRÊT OBLIGATOIRE.**
