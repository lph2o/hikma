# PHASE 24G — APPLICATION DU SCHÉMA LINGUISTIQUE + IMPORT PILOTE MASAQ AL-FĀTIḤAH

**STATUT : IMPORT CONTRÔLÉ TERMINÉ** · Couche linguistique créée et peuplée pour Al-Fātiḥah **UNIQUEMENT**.

---

## DÉCISION FINALE

### `A — IMPORT_SUCCESSFUL_FATIHAH_LINGUISTIC_LAYER`

Migration `0028_linguistic_layer.sql` appliquée · **29/29 occurrences** importées · 0 missing / 0 extra / 0 ambiguous · sourate 1 uniquement · provenance complète · idempotence démontrée · racines = 0 · schèmes = 0 · aucune glose FR modifiée · aucune traduction modifiée · aucun lemme Hikma modifié · curriculum inchangé · runtime inchangé · tests + typecheck + lint + build passants · aucune régression.

---

## 1. RÉPONSES AU RAPPORT (§36 — 25 questions)

| # | Question | Réponse |
|---|---|---|
| 1 | Migration 0028 appliquée ? | **OUI** (seule migration pendante ; 0001–0027 déjà enregistrées) |
| 2 | Tables créées ? | `linguistic_occurrences`, `linguistic_segments`, `linguistic_lemmas`, `linguistic_roots` |
| 3 | Occurrences importées ? | **29** |
| 4 | 29/29 alignées ? | **OUI** |
| 5 | EXACT ? | **13** |
| 6 | EXACT_ORTHOGRAPHIC ? | **14** |
| 7 | Variantes documentées ? | **2** (alif élidé `الرَّحْمَـٰنِ` / `الرَّحْمَنِ`) |
| 8 | MISSING ? | **0** |
| 9 | EXTRA ? | **0** |
| 10 | AMBIGUOUS ? | **0** |
| 11 | Segments ? | **56** (29 occurrences × préfixe/Stem/suffixe) |
| 12 | Couverture POS ? | **29/29** — 22 tags distincts (Morph_Tag) |
| 13 | Couverture morphologique ? | **29/29** (Case_Mood : INVARIABLE/NOMINATIVE/ACCUSATIVE/GENITIVE) |
| 14 | Couverture syntaxique ? | **29/29** (SUBJ/OBJ/PREP/ADJ/APPOS/GEN_CONS…) |
| 15 | Racines ? | **0** (MASAQ n'en fournit pas — normal) |
| 16 | Schèmes ? | **0** — `PATTERN = FUTURE_WORK` |
| 17 | Gloses FR changées ? | **NON** (25 word + 1 lemma = 26/26 inchangées) |
| 18 | Traductions changées ? | **NON** (28 lignes, 4 traducteurs, identiques) |
| 19 | Lemmes Hikma changés ? | **NON** (32 lemmes inchangés) |
| 20 | Al-Fātiḥah strictement inchangée ? | **OUI** (8 leçons · 26 formes · 29 occurrences · 26 audio) |
| 21 | Runtime changé ? | **NON** (couche passive, non consommée) |
| 22 | Import idempotent ? | **OUI** (RUN 2 → INSERTED=0, DUPLICATES=29, ERRORS=0) |
| 23 | Tests passants ? | **OUI** (491 passed / 40 fichiers — +19 nouveaux) |
| 24 | Licence/provenance conservée ? | **OUI** (source `sources`, DOI, CC BY, attribution, checksum) |
| 25 | Couche réversible ? | **OUI** (voir §7) |

---

## 2. ÉTAT INITIAL (snapshot, vérifié avant import)

| Table | Compte (avant) | Compte (après) | Δ |
|---|---|---|---|
| quran_words | 21 296 | 21 296 | 0 |
| word_occurrences | 77 430 | 77 430 | 0 |
| ayahs | 6 236 | 6 236 | 0 |
| translations | 24 944 | 24 944 | 0 |
| lemmas | 32 | 32 | 0 |
| word_translations | 70 | 70 | 0 |
| lemma_translations | 32 | 32 | 0 |
| word_lemma_mapping | 184 | 184 | 0 |

Al-Fātiḥah : **8 leçons · 26 formes · 29 occurrences · 26/26 audio · 25 gloses FR de forme + 1 lemme · 28 traductions (4 traducteurs)** — identiques avant/après.

`FATIHAH_REFERENCE_LOCKED = TRUE` — préservé.

---

## 3. SOURCE MASAQ (provenance)

- `tmp/MASAQ.csv` — SHA-256 `777d0cc8f24f4c17d07ad83a522056fe7ebd5c83dbbae86161f1fdc95aaca900` (vérifié, identique au checksum 24D).
- DOI `10.17632/9yvrzxktmr.2` · version `v2` · licence `CC BY 3.0 (page) / CC BY 4.0 (DataCite)`.
- Attribution : « MASAQ — Majdi Sawalha, University of Jordan (2024), Mendeley Data, DOI 10.17632/9yvrzxktmr.2 ».
- Source enregistrée dans `public.sources` (name=MASAQ, type=linguistic, version=v2) avec doi/attribution/checksum dans `metadata`.

---

## 4. MIGRATION 0028

Appliquée via `npm run db:migrate`. Vérifié post-application : 4 tables, PK/FK/UNIQUE/CHECK, index, RLS `SELECT` public sur chaque table, **aucune policy d'écriture** (insertion réservée au service role).

> **Note (correction syntaxique, hors schéma).** La migration préparée en 24F contenait une apostrophe non échappée dans le commentaire `linguistic_segments` (`d'une` → corrigé en `d''une`), ce qui empêchait l'exécution SQL (erreur 42601). **Aucun élément de schéma modifié** : tables, colonnes, contraintes, index et RLS sont strictement conformes au design 24F. Une seule ligne de commentaire corrigée.

---

## 5. IMPORT

| Métrique | RUN 1 | RUN 2 (idempotence) |
|---|---|---|
| INSERTED | 29 | 0 |
| DUPLICATES | 0 | 29 |
| ERRORS | 0 | 0 |
| SEGMENTS | 56 | 0 |

Post-validation : `linguistic_occurrences = 29` · `linguistic_segments = 56` · `linguistic_lemmas = 0` · `linguistic_roots = 0` · sourate 1 uniquement (min=max=1) · 0 dangling FK (word_occurrence / quran_word / ayah / segment parent).

Idempotence garantie par `UNIQUE(source_id, source_record_id)` — jamais par chaîne arabe.

---

## 6. ALIGNEMENT

Par `(surah, ayah, position)` — jamais par égalité de chaîne seule. Résultat identique au pilote 24F : **29/29 alignées** · 13 EXACT · 14 EXACT_ORTHOGRAPHIC · 2 VARIANT_ORTHOGRAPHY_DOCUMENTED · 0 MISSING / 0 EXTRA / 0 AMBIGUOUS.

Correspondance lemme Hikma ↔ stem MASAQ (documentée, **aucun mapping créé**) : 2 EXACT · 4 PARTIAL · 3 NORMALIZATION_DIFFERENCE · 2 LEXICAL_LEVEL_DIFFERENCE · 18 UNMAPPED.

---

## 7. RÉVERSIBILITÉ

Supprimer **uniquement** les données MASAQ d'Al-Fātiḥah (aucun contact avec le corpus pédagogique) :

```sql
delete from public.linguistic_segments
where linguistic_occurrence_id in (
  select id from public.linguistic_occurrences
  where source_id = (select id from public.sources where name = 'MASAQ' and version = 'v2')
);
delete from public.linguistic_occurrences
where source_id = (select id from public.sources where name = 'MASAQ' and version = 'v2');
delete from public.sources where name = 'MASAQ' and version = 'v2';

-- Réversibilité totale de la couche (DROP des 4 tables) :
drop table if exists public.linguistic_segments;
drop table if exists public.linguistic_roots;
drop table if exists public.linguistic_lemmas;
drop table if exists public.linguistic_occurrences;
```

N'affecte **pas** : `quran_words`, `word_occurrences`, `translations`, `word_translations`, `lemma_translations`, `word_lemma_mapping`, curriculum, progression, SRS, mastery.

---

## 8. RLS

Vérifié : anon **lit** `linguistic_occurrences` (200) mais **ne peut pas insérer** dans `linguistic_occurrences` / `linguistic_segments` (401). Politiques : `SELECT` public uniquement ; écriture réservée au service role.

---

## 9. TESTS & VÉRIFICATIONS

| Check | Résultat |
|---|---|
| `npm test` | **491 passed / 40 files** (472 existants + 19 nouveaux `masaq-import.test.ts`) |
| `npx tsc --noEmit` | **0 erreur** |
| `npm run lint` | **clean** |
| `npm run build` | **PASS** |

Nouveaux tests (`tests/masaq-import.test.ts`, fixtures réelles `tests/fixtures/masaq-fatihah.{csv,json}`) : import 29/29 · sourate 1 uniquement · 13/14/2 · 0/0/0 · segmentation (clitiques ≠ mots lexicaux) · POS 22 tags · morpho/syntaxe · absence racine/schème · provenance (`source_record_id`) · idempotence · isolation de quran_words/gloses/lemmes.

---

## 10. LIVRABLES

- `scripts/import-masaq-fatihah.ts` (DRY-RUN par défaut ; `APPLY=1` pour importer ; checksum + snapshot + scope guard + idempotence + rapports)
- `lib/linguistic/masaq-plan.ts` (fonctions pures de plan d'import)
- `tests/masaq-import.test.ts` + `tests/fixtures/masaq-fatihah.{csv,json}`
- `tmp/phase24g-pre-import-snapshot.json`
- `tmp/phase24g-post-import-validation.json`
- `tmp/phase24g-masaq-import.json`
- `tmp/phase24g-masaq-import-evidence.csv` (traçabilité 29 lignes : Hikma occurrence → linguistic_occurrence → MASAQ → version → DOI → checksum)

---

## 11. ARRÊT OBLIGATOIRE (§39)

La Phase 24G **s'arrête ici**. Ne pas continuer automatiquement vers : import des autres sourates · ajout des racines · ajout des schèmes · HikmaExplanation v2 · changement du runtime · changement des gloses · harmonisation automatique des lemmes. La prochaine phase sera décidée séparément.

**FIN PHASE 24G**
