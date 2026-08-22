# PHASE 70M → POST-LOT-12 — AUDIT GLOBAL DE REPRISE DE SESSION

**Mode : STRICTEMENT READ-ONLY.** Aucune écriture DB. Artefact local uniquement (jamais commité).
Toutes les valeurs proviennent de lectures live paginées (`selectAllPages` / `.range()` / `count head:true`).

---

## 1. Ground truth live

| Élément | Attendu | Live | Statut |
|---|---:|---:|---|
| word_translations FR validées | 3517 | **3517** | PASS |
| word_lemma_mapping | 188 | **188** | PASS |
| lemmas | 32 | **32** | PASS |
| lemma_translations | 32 | **32** | PASS |
| lemma_translations FR validées | 28 | **28** | PASS |
| translations | 24944 | **24944** | PASS |
| quran_words | 21296 | **21296** | PASS |
| word_occurrences | 77430 | **77430** | PASS |
| MASAQ linguistic_occurrences | 22485 | **22485** | PASS |
| MASAQ linguistic_segments | 44677 | **44677** | PASS |

> Note : le script `tmp/phase70m-ground-truth.ts` (baseline codée à 2517, antérieure à l'APPLY) signale
> désormais « 2517 vs live 3517 ». Ce n'est **pas** une divergence réelle : sa baseline est périmée.
> Le script `tmp/phase70m-lot12-verify.ts` (attendu post-APPLY) confirme **all_pass = true** à 3517.

## 2. Vérification Lot 12 (live)

- **1000/1000** présentes · **1000/1000** language=fr · **1000/1000** is_validated=true · **1000/1000** provenance « Hikma — lexique éditorial » · **1000/1000** textes conformes.
- **240/240 MODIFY** exacts · **0 ligne supplémentaire** · **0 divergence**.

## 3. Tables protégées

`word_lemma_mapping` 188 · `lemmas` 32 · `lemma_translations` 32 (28 FR) · `translations` 24944 · `quran_words` 21296 · `word_occurrences` 77430 · MASAQ 22485/44677 — **toutes inchangées**.

## 4. HOLDs historiques (par word_id fixe)

| Forme | word_id | wt FR validée | mapping |
|---|---|---|---|
| أَعْلَمُ | 0803c6da-… | 0 | 0 |
| كُنَّا | b6d6520c-… | 0 | 0 |
| وَإِن | 52011330-… | 0 | 0 |

Hors périmètre, non traités.

## 5. Fātiḥah / pilotes / sourate 64

- Sourate 64 (MASAQ) = **0** · Fātiḥah (s1) = **29** · pilotes 108=**10** · 112=**15** · 113=**23** · 114=**20**.
- **0 chevauchement** des 1000 word_id du Lot 12 avec les zones protégées (`protected_surah_hits = []`).

## 6. Historique Lots 1–12

13+3 · 17+1 · 19 · 20 · 20 · 20 · 20 · 100 · 250 · 500 · 1000 · **1000** → cumul **word_translations FR validées = 3517** · mappings = **188**.

## 7. Pools recalculés (live, pagination complète)

Définition : catégorie C (MASAQ sans glose FR) ∩ priorité, sans FR validé, sans mapping safe, hors Lots 1–12 + 3 HOLDs. Priorité Phase 66 : impact = sourates×10 + occurrences (P1 ≥ 60, P2 ≥ 20, P3 < 20).

| Pool | Restant |
|---|---:|
| **C + P1** | **127** |
| **C + P2** | **777** |
| **C + P3** | **4235** |
| C + P1+P2 (cumul) | 904 |

- Exclusions chargées (Lots 1–12 + HOLDs) : **2986** word_id.
- P0 (curriculum sans FR) : **0**. P1 candidats bruts : 187 · P2 : 2907 · P3 : 14403 (hors filtre catégorie C).

## 8. Couverture lexicale

| Métrique | Valeur |
|---|---:|
| formes totales (quran_words) | 21 296 |
| formes avec glose FR validée | **3 517** |
| formes sans glose FR | 17 779 |
| **couverture par forme** | **16,51 %** |
| occurrences totales | 77 430 |
| occurrences couvertes (FR) | **48 194** |
| occurrences non couvertes | 29 236 |
| **couverture par occurrence** | **62,24 %** |
| formes avec MASAQ | 8 819 |
| catégorie A (forme directe) | 3 517 |
| catégorie B (par lemme FR) | 282 |
| catégorie C (MASAQ sans glose) | 5 144 |
| catégorie D (ni MASAQ ni glose) | 12 353 |
| catégorie E (ambiguë) | 0 |

## 9. Contrôle éditorial statistique (aucune modification)

- **Gloses FR validées multiples par forme (doublons)** : **0**.
- **Glose vide** : **0**.
- **Formes non-NFC parmi les 3517** : **983** (variantes Uthmani — clé d'identité = word_id, aucune normalisation destructive).
- Lemmes : 32 (8 validés · 24 proposed · 0 rejected) · 28 avec traduction FR validée · 310 formes couvertes par lemme FR · 188 mappings safe.

`EDITORIAL_REVIEW_CANDIDATES = []` — aucun doublon ni glose vide détecté. Aucune correction proposée/appliquée.

## 10. Git / session

- Branche : **main** · dernier commit : **d09143c chore: ignore local Supabase temp files**.
- Working tree : **non clean** (état préexistant : M lib/learning/queries.ts, M lib/quran/repositories/shared.ts, D public/*.svg, nombreux PHASE_*.md et tmp/ non suivis).
- Artefacts créés cette session (non commités) : `tmp/phase70m/…`, `tmp/phase70m-*.ts`, `PHASE_70M_REPORT.md`, `PHASE_70M_POST_LOT12_RESUME_AUDIT.md`.
- **Aucun commit, aucun push.**

## 11. Non-régression

| Outil | Résultat |
|---|---|
| `tsc --noEmit` | **PASS** |
| `eslint .` | **PASS** |
| `vitest run` | **PASS 775/775** |
| `npm run build` | **PASS** |

## 12. Matrice attendu / réel

| Élément | Attendu | Réel | Statut |
|---|---:|---:|---|
| word_translations FR | 3517 | 3517 | PASS |
| word_lemma_mapping | 188 | 188 | PASS |
| lemmas | 32 | 32 | PASS |
| lemma_translations | 32 | 32 | PASS |
| lemma_translations FR | 28 | 28 | PASS |
| translations | 24944 | 24944 | PASS |
| quran_words | 21296 | 21296 | PASS |
| word_occurrences | 77430 | 77430 | PASS |
| MASAQ occurrences | 22485 | 22485 | PASS |
| MASAQ segments | 44677 | 44677 | PASS |
| sourate 64 | 0 | 0 | PASS |
| HOLDs (wt FR / mapping) | 0/0 ×3 | 0/0 ×3 | PASS |
| Fātiḥah (MASAQ) | 29 | 29 | PASS |
| pilotes 108/112/113/114 | 10/15/23/20 | 10/15/23/20 | PASS |
| couverture par occurrence | — | 62,24 % | INFO |

## 13. Divergences

**Aucune.** Tous les compteurs live = attendu post-Lot-12. (La seule « diff » signalée par le ground-truth périmé 2517 est expliquée en §1, non une divergence.)

## 14. Verdict

```
PHASE_70M_POST_LOT12_RESUME_AUDIT_COMPLETE
DATABASE_WRITES = 0
LOT_13_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false
STOP — HUMAN DECISION REQUIRED
```

**STOP.** Aucun candidat Lot 13 sélectionné, aucun plan d'import généré, aucun HOLD traité, aucune écriture. Prochaine action sur décision humaine explicite uniquement.
