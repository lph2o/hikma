# PHASE 70I — LOT 8 — RAPPORT FINAL

**Verdict : `PHASE_70I_LOT8_APPLIED_AND_VERIFIED`**

## 1. Protocole exécuté

| Étape | Résultat |
|---|---|
| Ground truth live | 667 / 188 / 22 485 / 44 677 / 24 944 / 21 296 / 77 430 / 32 / 28 · Lots 1–7 présents · HOLDs absents · sourate 64 = 0 |
| Sélection | 100 candidats (pool 977, déterministe, exclusions 139) · 6 familles · 66 HIGH / 9 MEDIUM / 25 HIGH-RISK |
| Revue ciblée | 37 dossiers analysés occurrence-par-occurrence : **32 ACCEPT · 5 MODIFY · 0 HOLD · 0 REJECT** |
| Gate 1 — périmètre | ACCEPT GLOBAL (100 GLOSE, 5 MODIFY intégrés par word_id) |
| DRY-RUN | **100 INSERT · 0 ALREADY_EXISTS · 0 DIVERGENCE · 0 COLLISION** · 103/103 Unicode (30 non-NFC) · `DATABASE_WRITES = 0` |
| Gate 2 — human gate | ✅ Autorisation APPLY explicite reçue |
| **APPLY** | `word_translations` **+100** (667 → **767**) · `word_lemma_mapping` +0 · post_verified **100/100** · 0 erreur |

## 2. Les 5 MODIFY appliqués (vérifiés en base)

| Forme | Glose finale |
|---|---|
| يَكُونَ | « il soit / il sera » |
| قَبْلِكَ | « avant toi / avant que toi » |
| لِلْكَـٰفِرِينَ | « pour les mécréants / aux mécréants » |
| ءَايَـٰتِنَا | « Nos signes / Nos versets » |
| ءَايَـٰتِهِۦ | « Ses signes / Ses versets » |

## 3. Diff DB

| Table | Avant | Après | Delta |
|---|---:|---:|---:|
| word_translations FR validées | 667 | **767** | **+100** |
| word_lemma_mapping | 188 | 188 | 0 |
| lemma_translations | 32 | 32 | 0 |
| lemmas | 32 | 32 | 0 |
| linguistic_occurrences | 22 485 | 22 485 | 0 |
| linguistic_segments | 44 677 | 44 677 | 0 |
| translations | 24 944 | 24 944 | 0 |
| quran_words | 21 296 | 21 296 | 0 |
| word_occurrences | 77 430 | 77 430 | 0 |

`unexpected_table_changes = []` — seule `word_translations` a changé.

## 4. Vérifications post-APPLY

- **100/100 lignes présentes** · fr · `is_validated=true` · provenance « Hikma — lexique éditorial » · 0 texte divergent · 0 ligne supplémentaire
- **Runtime : 100/100 formes résolues en FR**
- **HOLDs** : أَعْلَمُ · كُنَّا · وَإِن — 0 wt FR validée, 0 mapping (vérifiés par word_id fixe)
- **Idempotence** : rerun = **0 insertion**, 100 doublons reconnus, 0 divergence, 0 collision
- **Intégrité** : sourate 64 = 0 · MASAQ 22 485/44 677 intact · sourates pilotes (1/108/112/113/114) sans chevauchement avec le Lot 8

## 5. Non-régression

`tsc` PASS · `eslint` PASS · `vitest` **775/775** PASS · `build` PASS · tests helpers **11 PASS / 0 FAIL / 1 INFO** (post-APPLY)

## 6. État lexical cumulé (Lots 1–8)

- `word_translations` FR validées : **667 → 767** · formes résolues FR : **949 → 1049**
- Mappings safe inchangés : **188** · lemmes : 32 · lemma_translations : 32 (28 FR validées)
- HOLDs conservés hors plan : أَعْلَمُ, كُنَّا, وَإِن
- Lots cumulés : 13+3 · 17+1 · 19 · 20 · 20 · 20 · 20 · **100**

## 7. Garanties

Écriture strictement limitée à `word_translations` (+100) · aucun mapping, aucun lemme, aucune lemma_translation créée · aucune table MASAQ/métier touchée · aucun commit/push · **aucun Lot 9 lancé, HOLDs non traités, taille du lot non augmentée automatiquement**.

## 8. Artefacts

- `tmp/phase70i/lot8-review-decisions.json` · `lot8-proposals.json` · `lot8-import-summary.json` (APPLY) · `lot8-post-apply.json` · `lot8-idempotence.json` · `lot8-targeted-review.json` · `targeted-data.json`
- scripts : `tmp/phase70i-lot8-import.ts` (verrouillé `APPLY=1`) · `tmp/phase70i-lot8-verify.ts` · `tmp/phase70i-lot8-safety.ts`

**STOP — aucune écriture supplémentaire.**
