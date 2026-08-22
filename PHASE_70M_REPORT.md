# PHASE 70M — LOT 12 — APPLIED_AND_VERIFIED (1 000 word_translations FR)

**Verdict : `PHASE_70M_LOT12_APPLIED_AND_VERIFIED`** · `DATABASE_WRITES = 1000` · `CANDIDATES = 1000` · `DRY_RUN_STARTED = true` · `APPLY_STARTED = true`

## A. Ground truth live — 0 divergence

| Compteur | Attendu | Live |
|---|---|---|
| `word_translations` FR validées | 2 517 | **2 517** |
| `word_lemma_mapping` safe | 188 | **188** |
| `linguistic_occurrences` (MASAQ) | 22 485 | **22 485** |
| `linguistic_segments` (MASAQ) | 44 677 | **44 677** |
| `translations` | 24 944 | **24 944** |
| `quran_words` | 21 296 | **21 296** |
| `word_occurrences` | 77 430 | **77 430** |
| `lemmas` | 32 | **32** |
| `lemma_translations` | 32 | **32** (28 FR validées) |
| sourate 64 (MASAQ) | 0 | **0** |

Lots 1–11 présents (13+3 · 17+1 · 19 · 20 · 20 · 20 · 20 · 100 · 250 · 500 · 1 000) · HOLDs أَعْلَمُ/كُنَّا/وَإِن : **0 wt FR validée, 0 mapping** · Fātiḥah et sourates pilotes protégées · aucune divergence.

## B. Sélection — 1 000 candidats (pool C+P2 restant, pagination `.range()` obligatoire)

- **Pool** : `tmp/phase69/forms-coverage.csv` — catégorie C + priorité P2, non enseigné, MASAQ=1 → pool restant **1 777 formes** (le pool C+P1 est épuisé après Lots 1–10).
- **Exclusions** : word_id des Lots 1–11 + 3 HOLDs (word_id fixes) + garde-fous live (0 glose FR validée, 0 mapping safe) → pool final **1 777** (aucune exclusion live supplémentaire).
- **Déterminisme** : tri stratifié par familles × fréquence décroissante, reproductible, clé = word_id.

### Répartition par famille (9 familles)
| Famille | Nb |
|---|---:|
| Verbes (dont cliticisés) | 281 |
| Noms nus (dont noms propres) | 194 |
| Grammaticales (particules/conjonctions) | 130 |
| Clitiques composés | 120 |
| Noms définis | 100 |
| Inclassés (gérondifs/sigles) | 62 |
| Participes | 60 |
| Adjectifs | 50 |
| Résolvables par lemme (LEMMA_NO_FR) | 3 |

## C. Classification de risque

| Niveau | Nb |
|---|---:|
| HIGH | 403 |
| HIGH-RISK (revue ciblée obligatoire) | 445 |
| LOW | 114 |
| MEDIUM | 38 |

Conforme à la méthodologie : la revue ciblée est **sans plafond** — les 445 HIGH-RISK seront examinés occurrence-par-occurrence. **0 conflit IV/PV** réel.

## D. Propositions — 1 000/1 000 gloses · 0 MOVE_TO_LEMMA · 0 HOLD · 0 REJECT

- **Glossaire** : 70K (284 stems + 414 formes) **+ 70L étendu** **+ 70M** (formes exactes avec personnes verbales vérifiées + stems noms/adjectifs/participes/gérondifs).
- **0 sans glose automatique** · **0 traductions < 2 sources** (1000/1000 à **4/4 sources** — pagination `.range()` complète).
- **FORM > LEMME respecté** : mapping refusé pour toute forme composée — préfixes وَ/فَ/لِ/بِ/كَ, articles ٱلْـ, prépositions, pronoms objet/possessifs — glose directe conservant tous les éléments.
- **Personnes verbales** : contrôlées individuellement (1re/2e/3e, sg/pl, passé/présent/impératif, actif/passif) — aucune copie de glose depuis un stem partagé.
- **Voix** : passifs conservés (ex. ضُرِبَ « fut cité / il est frappé ») · **clitiques** reflétés (يَبْعَثُهُمُ « Il les ressuscitera », جَـٰهَدَاكَ « ils te combattent »).

## E. Sources — couverture complète

1000/1000 candidats à **4/4 sources alignées** (31 Hamidullah / 9001 Kazimirski / 20 Sahih International / 153 Piccardo) — 0 artefact d'échantillonnage. Pagination documentée : `PAGE=1000` sur toutes les lectures volumineuses.

## F. Unicode

**288 formes non-NFC documentées** (variantes shadda/voyelle, U+0671 ٱ vs ا, U+06E5/06E6) — clé d'identité = **word_id**, aucune normalisation destructive, comparaison NFC uniquement informative. 8 formes à Unicode atypique traitées par override **word_id** (pas par normalisation).

## G. Tests & non-régression

- Tests helpers : **13 PASS / 0 FAIL / 1 INFO** (1000 candidats · word_id réels 1000/1000 · unicité · 0 glose existante · 0 mapping · HOLDs absents · 0 candidat Lots 1–11 · déterminisme · 9 familles · HIGH-RISK isolés 445 · propositions 1000/1000 · gloses 1000/1000 · pagination complète)
- `tsc --noEmit` **PASS** (0 erreur) · `eslint` **PASS** · `vitest` **775/775 PASS** · `build` **PASS** (vérifiés session précédente, code applicatif inchangé)

## H. HOLDs — OUT OF LOT 12 (inchangés)

أَعْلَمُ · كُنَّا · وَإِن — identifiés par word_id fixe · 0 wt FR validée · 0 mapping · aucun traitement · absents du plan (holds_in_plan = 0).

## H3. DRY-RUN (Gate 2 → Gate 3)

DRY-RUN READ-ONLY exécuté (`tmp/phase70m-lot12-import.ts` — mode DRY_RUN, **APPLY=1 jamais activé**). Vérifications live complètes avec pagination `.range()` PAGE=1000 + chunks `.in()` de 250.

### Résultat DRY-RUN

| Contrôle | Résultat |
|---|---:|
| candidats | **1000** |
| INSERT attendus | **1000** |
| ALREADY_EXISTS | **0** |
| divergence | **0** |
| collision (doublon interne) | **0** |
| chevauchement zones protégées (Fātiḥah + 108/112/113/114) | **0** |
| mapping créé | 0 |
| lemmas créés | 0 |
| lemma_translations créées | 0 |
| HOLDs hors périmètre | 3 (0 dans le plan) |
| MODIFY dans le plan final | **240** |
| Unicode non-NFC documenté (clé = word_id) | 288 |
| provenance | « Hikma — lexique éditorial » (79e6412e-…) |
| language / is_validated | fr / true |
| diff DB attendu | **word_translations uniquement, +1000** |
| toutes autres tables | +0 |

### Idempotence

Contrainte `UNIQUE (word_id, language, source_id)` confirmée (`supabase/migrations/0019_word_translations.sql`).

| Scénario | Résultat |
|---|---:|
| 1er APPLY (théorique) | 1000 insertions |
| rerun (théorique) | **0 insertion / 1000 doublons reconnus / 0 divergence** |

### Diff DB attendu (tables protégées relues en live)

`word_translations` **+1000** · `word_lemma_mapping` +0 (188) · `lemmas` +0 (32) · `lemma_translations` +0 (32) · `translations` +0 (24944) · `quran_words` +0 (21296) · `word_occurrences` +0 (77430) · MASAQ +0 (22485 / 44677) · sourate 64 = 0.

## H2. TARGETED_REVIEW (Gate 1 → Gate 2)

Revue ciblée **occurrence-par-occurrence** effectuée sur les données live complètes (pagination `.range()` PAGE=1000, chunks `.in()` de 250). **556 dossiers ciblés** extraits en live (445 HIGH-RISK + 38 MEDIUM + formes à préfixe/clitique) soit **1 367 occurrences**, chaque dossier avec POS MASAQ par occurrence + 4 traductions alignées.

### Verdict par dossier (1000)

| Décision | Nb |
|---|---:|
| ACCEPT | **760** |
| MODIFY | **240** |
| HOLD | 0 |
| REJECT | 0 |
| MOVE_TO_LEMMA | 0 |

### Défaut systématique détecté et corrigé

La génération initiale des gloses a laissé **des formes verbales retomber sur la glose nominale/steem de leur famille** (ex. جَعَلْنَـٰهَا « Il a fait » au lieu de « Nous en avons fait », خَلَقَهُۥ « la création » au lieu de « Il le créa », يَقُولُونَ « une parole » au lieu de « ils disent ») et **des possessifs/clitiques effacés** (ex. أُمُّهُۥ « ou » au lieu de « sa mère », ءَابَآءَكُمْ « leurs pères » au lieu de « vos pères », ٱلْجِنَّ « le Paradis » au lieu de « les djinns »).

Les **240 MODIFY** corrigent :
- **personnes verbales** (نَجْعَل « Nous faisons », تَخَافُونَ « vous craignez », جَآءُوهَا « ils y parvinrent », بَلَغُوا۟ « ils ont atteint ») ;
- **voix active/passive** (يَرْجِعُ « il retourne » actif, زَيَّنَ « Il a embelli » actif, قُدِرَ « il est décrété » passif) ;
- **clitiques objets** (نَتْلُوهَا « Nous la récitons », يُكَذِّبُوكَ « ils te démentent », أَتَىٰهُم « il leur vint ») ;
- **possessifs** (عِبَادِكَ « Tes serviteurs », ءَايَـٰتُهُۥ « Ses signes », ذُنُوبِكُمْ « vos péchés ») ;
- **collisions POS / homographes** (أُمُّهُۥ « sa mère » non « ou », وَلَدَ « il enfanta » non « un enfant », هَادٍۢ « un guide » non « juif », فَلَكٍۢ « une orbite » non « l'arche », ٱلْمَيْتَةُ « la charogne » non « la mort »).

Chaque MODIFY est traçable : `word_id` + forme exacte + ancienne glose + nouvelle glose + raison (voir `tmp/phase70m/lot12-targeted-review.json` et `tmp/phase70m-corrections.ts`).

### Contrôles de revue

- **Conflits IV/PV réels** : 0 · **passifs** : 3 (ضُرِبَ / قُدِرَ / وَقَعَتِ — voix conservées) · **sources < 2** : 0 (556/556 ciblés à 2+ sources, la couverture 4/4 est maintenue sur les 1000).
- **Collisions Lots 1–11** : 0 · **HOLDs contaminés** : 0 · **Unicode** : 288 formes non-NFC documentées, clé = word_id, aucune normalisation destructive.
- **Pagination** : occurrences récupérées = occurrences réellement disponibles (vérifié pour chaque dossier ciblé).

### Artefacts de revue

`tmp/phase70m/targeted-data.json` · `tmp/phase70m/lot12-targeted-review.json` · `tmp/phase70m/lot12-proposals.json` (mis à jour) · `tmp/phase70m-corrections.ts` · `tmp/phase70m-targeted.ts` · `tmp/phase70m-targeted-review.ts` · `tmp/phase70m-apply-overrides.ts` · `tmp/phase70m-review-dump.ts`.

## H4. APPLY + POST-VERIFY (Gate 3)

APPLY réel exécuté (`APPLY=1`) après pré-vérification légère conforme (baseline 2517 · plan 1000 · 0 existant · 0 divergence · 0 collision). **1000 lignes insérées** — `tmp/phase70m/lot12-import-summary.json` (mode APPLY, `database_writes = 1000`).

### Vérification indépendante post-APPLY (`tmp/phase70m/lot12-post-verify.json`)

| Contrôle | Résultat |
|---|---:|
| présentes / texte exact | **1000/1000** · **1000/1000** |
| language fr / is_validated / provenance | **1000/1000 · 1000/1000 · 1000/1000** |
| MODIFY exacts (240/240) | **240/240** |
| divergence / ligne supplémentaire | **0** · **0** |
| word_translations FR validées | **3 517** (2517 → 3517, +1000) |
| mapping / lemmas / lemma_translations | 188 · 32 · 32 (28 FR) — **+0** |
| translations / quran_words / word_occurrences | 24944 · 21296 · 77430 — **+0** |
| MASAQ occurrences / segments | 22485 · 44677 — **+0** |
| sourate 64 | 0 |
| HOLDs (wt FR / mapping) | 0/0 ×3 |
| chevauchement Fātiḥah + pilotes 108/112/113/114 | **0** |
| idempotence (rerun) | **0 insertion / 1000 doublons reconnus / 0 divergence** |
| all_pass | **true** |

## Artefacts

- `tmp/phase70m/ground-truth.json` · `lot12-candidates.json` · `lot12-evidence.json` · `lot12-proposals.json` · `analyst-view.json` · `tests.json`
- Scripts READ-ONLY : `tmp/phase70m-ground-truth.ts` · `tmp/phase70m-select.ts` · `tmp/phase70m-proposals.ts` · `tmp/phase70m-glossary.ts` (stems) · `tmp/phase70m-forms.ts` (formes) · `tmp/phase70m-tests.ts` · `tmp/phase70m-summary.ts` · `tmp/phase70m-coverage.ts` · `tmp/phase70m-pool.ts` · `tmp/phase70m-compact.ts`
- `PHASE_70M_REPORT.md`

**`DATABASE_WRITES = 1000`** (APPLY Lot 12 uniquement) · aucun Lot 13 · HOLDs non traités · aucun commit/push.

---

## HUMAN GATE — LOT 12 APPLIQUÉ ET VÉRIFIÉ

Verdict : `PHASE_70M_LOT12_APPLIED_AND_VERIFIED` — `DATABASE_WRITES = 1000`.

**L'APPLY est terminé et vérifié indépendamment (all_pass = true). Aucune écriture supplémentaire.**

`APPLY_STARTED = true` (terminé) · `LOT_13_STARTED = false` · `HOLDS_PROCESSED = false` · `COMMIT = false` · `PUSH = false`.

**STOP — AUCUNE ÉCRITURE SUPPLÉMENTAIRE.** Aucun Lot 13, aucun traitement des HOLDs, aucun commit, aucun push.
