# PHASE 70B — PILOTE ÉDITORIAL : RAPPORT LOT 1 (GLOSES HIKMA)

**STATUT : LOT 1 APPLIQUÉ ET VÉRIFIÉ · DATABASE_WRITES (lot 1) = 2 tables, écriture contrôlée**

---

## 0. RÉSUMÉ

Premier lot du workflow éditorial des gloses Hikma (méthodologie Al-Fātiḥah, Phase 22) :
**16 formes** traitées de bout en bout (sélection → dossier d'évidence → proposition → revue
humaine → DRY-RUN → APPLY → vérifications), avec un human gate explicite avant toute écriture.

- **+13 `word_translations`** FR validées (source `Hikma — lexique éditorial`)
- **+3 `word_lemma_mapping`** `safe` (réutilisation des lemmes كِتَاب et كَان)
- **0** lemme créé · **0** lemma_translation créée/modifiée · **0** traduction d'ayah touchée
- **0** divergence · **0** collision · **0** doublon inattendu · idempotence confirmée
- Aucun commit/push · moteur MASAQ, schéma et tables métier intacts

## 1. MÉTHODOLOGIE (canonique, Phase 22)

```
FORME ARABE → occurrences réelles → ayahs concernés → 4 traductions alignées (31/9001/20/153)
→ comparaison FR (Hamidullah / Kazimirski 1869) → contrôle interlinguistique (Sahih EN / Piccardo IT)
→ noyau sémantique → glose Hikma courte → proposition → REVUE HUMAINE → import contrôlé → runtime audit
```

Aucune glose copiée d'une traduction d'ayah · classification
DIRECT_EQUIVALENT / CONTEXTUAL_EQUIVALENT / GRAMMATICAL_FUNCTION · confiance HIGH/MEDIUM ·
formes « sœurs » jamais fusionnées (ٱلْكِتَـٰبَ/ٱلْكِتَـٰبِ · لَيْسَ/لَّيْسَ · وَبِئْسَ/فَبِئْسَ).

## 2. SÉLECTION (déterministe, données réelles)

- Base : `tmp/phase69/forms-coverage.csv` → **1 115 candidats** (catégorie C : MASAQ dispo sans
  glose FR + P1 impact HIGH + non enseignés), garde-fou live : 0 word_translation FR validée.
- Stratification par famille POS (MASAQ) : **8 nominaux / 5 verbaux / 2 grammaticalx /
  1 non classé** (كُنتُمْ, POS PV+PVSUFF 2MP = verbe, artefact de tri).
- Sélection 16 : `tmp/phase70b/pilot-candidates.json`.

## 3. PROPOSITIONS (GLOSS_PROPOSAL)

`tmp/phase70b/proposals.json` — 13 gloses + 3 MOVE_TO_LEMMA, chacune avec classification,
confiance et justification fondée sur la convergence des 4 traductions réelles.

| # | Forme | Proposition | Classif. | Conf. |
|---|-------|-------------|----------|-------|
| 1 | دُونِ | « en dehors de / autre que » | GRAMMATICAL_FUNCTION | HIGH |
| 2 | ٱلسَّمَآءِ | « le ciel » | DIRECT_EQUIVALENT | HIGH |
| 3 | ٱلْكِتَـٰبَ | MOVE_TO_LEMMA → كِتَاب | DIRECT_EQUIVALENT | HIGH |
| 4 | ٱلْكِتَـٰبِ | MOVE_TO_LEMMA → كِتَاب | DIRECT_EQUIVALENT | HIGH |
| 5 | سَبِيلِ | « sentier / voie » | DIRECT_EQUIVALENT | HIGH |
| 6 | ٱلْمُؤْمِنِينَ | « les croyants » | DIRECT_EQUIVALENT | HIGH |
| 7 | ٱلظَّـٰلِمِينَ | « les injustes / les oppresseurs » | DIRECT_EQUIVALENT | HIGH |
| 8 | مُوسَىٰ | « Moïse » | DIRECT_EQUIVALENT | HIGH |
| 9 | لَيْسَ | « n'être pas » | GRAMMATICAL_FUNCTION | MEDIUM |
| 10 | وَبِئْسَ | « et quel mauvais… ! » | CONTEXTUAL_EQUIVALENT | MEDIUM |
| 11 | عَسَىٰٓ | « il se peut / peut-être » | DIRECT_EQUIVALENT | HIGH |
| 12 | فَبِئْسَ | « et quel mauvais… ! » | CONTEXTUAL_EQUIVALENT | MEDIUM |
| 13 | لَّيْسَ | « n'être pas » | GRAMMATICAL_FUNCTION | MEDIUM |
| 14 | مِّنَ | « de / parmi (préposition) » | GRAMMATICAL_FUNCTION | MEDIUM |
| 15 | بِمَا | « par ce que / ce que » | GRAMMATICAL_FUNCTION | MEDIUM |
| 16 | كُنتُمْ | MOVE_TO_LEMMA → كَان | DIRECT_EQUIVALENT | HIGH |

## 4. REVUE HUMAINE (HUMAN_REVIEW)

- Grille : `PHASE_70B_EDITORIAL_PILOT_REVIEW_GRID.md` · Décisions : `tmp/phase70b/review-decisions.json`
- Résultat : **16/16 ACCEPT** (13 gloses + 3 MOVE_TO_LEMMA) — autorisation humaine explicite reçue.

## 5. DRY-RUN puis APPLY (human gate)

- DRY-RUN : 13 INSERT word_translations + 3 INSERT mappings · 0 divergence · 0 collision ·
  lemmes كِتَاب/كَان résolus avec lemma_translation FR **validée** (« livre / Écriture », « être »).
- **Autorisation explicite reçue** (« OUI — J'AUTORISE L'APPLY RÉEL DU LOT 1 »).
- APPLY : **+13 word_translations** (is_validated=true, validated_at horodaté, editorial_notes
  phase 70B) · **+3 word_lemma_mapping** (confidence safe, mapping_method editorial) · 0 erreur.

## 6. VÉRIFICATIONS POST-APPLY (tmp/phase70b/verify.json)

### Diff DB
| Table | Avant | Après | Δ |
|---|---|---|---|
| word_translations | 538 | **551** | **+13** (551 FR validées, toutes) |
| word_lemma_mapping | 184 | **187** | **+3** (187 safe, toutes) |
| quran_words | 21 296 | 21 296 | 0 |
| word_occurrences | 77 430 | 77 430 | 0 |
| translations | 24 944 | 24 944 | 0 |
| lemmas | 32 | 32 | 0 |
| lemma_translations | 32 | 32 | 0 |
| linguistic_occurrences / segments | 22 485 / 44 677 | 22 485 / 44 677 | 0 |
| word_explanations | 13 | 13 | 0 |
| sources | 6 | 6 | 0 |

### Périmètre exact
- 13/13 gloses retrouvées, toutes `is_validated=true` + `validated_at`, source **unique**
  « Hikma — lexique éditorial ».
- 3/3 mappings retrouvés, `confidence=safe`, cibles exactes : ٱلْكِتَـٰبَ → **كِتَاب** ·
  ٱلْكِتَـٰبِ → **كِتَاب** · كُنتُمْ → **كَان**.
- Aucune écriture hors périmètre (unexpected_collisions = 0).

### Runtime (fonctions réelles, résolution FORME → LEMME → EN)
- **16/16 résolues en FR** · 13 via FORME · 3 via LEMME (livre / Écriture ×2, être) · 0 non résolue.

## 7. IDEMPOTENCE

Rerun contrôlé (APPLY) : **0 insertion** · 13 word_translations ALREADY_EXISTS · 3 mappings
ALREADY_EXISTS · post_verified 13/13 et 3/3 · 0 divergence.

## 8. NON-RÉGRESSION

| Check | Résultat |
|---|---|
| `tsc --noEmit` | PASS |
| `eslint .` | PASS |
| `vitest run` | **775/775 PASS** (baseline identique) |
| `npm run build` | PASS |

## 9. ARTEFACTS

- `PHASE_70B_EDITORIAL_PILOT_REVIEW_GRID.md`
- `tmp/phase70b/pilot-candidates.json` · `evidence.json` · `analyst-view.json` · `proposals.json` ·
  `review-decisions.json` · `import-summary.json` · `verify.json`
- Scripts read-only / contrôlés : `tmp/phase70b-select.ts` · `tmp/phase70b-summary.ts` ·
  `tmp/phase70b-lemmas.ts` · `tmp/phase70b-lemmas2.ts` · `tmp/phase70b-import.ts` (DRY-RUN défaut,
  APPLY=1) · `tmp/phase70b-verify.ts` · `tmp/phase70a-verify.ts`

## 10. GARANTIES

- Human gate explicite avant écriture · aucune création de lemme / lemma_translation ·
  traductions, quran_words, word_occurrences, MASAQ, curriculum, progression intacts ·
  aucun commit/push · Fātiḥah et pilotes 112/113/114/108 intacts.

## 11. ÉTAT LEXICAL APRÈS LOT 1

- word_translations FR validées : **538 → 551** · word_lemma_mapping safe : **184 → 187**
- Formes résolues FR (forme ou lemme) : **816 → 832** (Phase 69 base + 16)
- Formes restantes sans glose FR : **20 480 → 20 464**

## 12. PROCHAINE ÉTAPE (non exécutée)

- **Lot 2** du pilote (nouveaux candidats P1 + catégorie C) : nouveau cycle complet
  (sélection → dossiers → propositions → revue humaine → human gate → APPLY) —
  **aucun lot supplémentaire n'est autorisé sans nouveau gate explicite.**

---

**FIN PHASE 70B LOT 1**
