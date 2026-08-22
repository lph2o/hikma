# PHASE 70J — LOT 9 — RAPPORT FINAL

**Verdict : `PHASE_70J_LOT9_APPLIED_AND_VERIFIED`**

## 1. Protocole exécuté

| Étape | Résultat |
|---|---|
| Ground truth live | 767 / 188 / 22 485 / 44 677 / 24 944 / 21 296 / 77 430 / 32 / 28 · Lots 1–8 présents · HOLDs absents · sourate 64 = 0 |
| Sélection | 250 candidats (pool 877, déterministe, exclusions 236) · 6 familles · 162 HIGH / 33 MEDIUM / 55 HIGH-RISK |
| Revue ciblée | 95 dossiers analysés occurrence-par-occurrence : **82 ACCEPT · 13 MODIFY · 0 HOLD · 0 REJECT** · 33/33 formes < 2 sources = artefacts (4/4 sources réelles) |
| Gate 1 — périmètre | ACCEPT GLOBAL (250 GLOSE, 13 MODIFY intégrés par word_id) |
| DRY-RUN | **250 INSERT · 0 ALREADY_EXISTS · 0 DIVERGENCE · 0 COLLISION** · 253/253 Unicode (67 non-NFC) · `DATABASE_WRITES = 0` |
| Gate 3 — human gate | ✅ Autorisation APPLY explicite reçue |
| **APPLY** | `word_translations` **+250** (767 → **1017**) · `word_lemma_mapping` +0 · post_verified **250/250** · 0 erreur |

## 2. Les 13 MODIFY appliqués (vérifiés en base)

| Forme | Glose finale |
|---|---|
| كُنتُ | « j'étais / je fus » |
| تَكُن | « que tu sois / tu sois » |
| تَكُونَ | « que tu sois / tu sois » |
| يَكُونُوا۟ | « ils seront / qu'ils soient » |
| تَكُونُ | « tu es / tu seras » |
| أَكُونَ | « que je sois / je sois » |
| نَشَآءُ | « Nous voulions / Nous voulons » |
| ٱلْجِنِّ | « les djinns / les génies » |
| بِذَاتِ | « le contenu de / ce que recèlent » |
| يَتَّقُونَ | « ils craignent / ils se préservent » |
| يُبْصِرُونَ | « ils voient / ils distinguent » |
| تَكْفُرُونَ | « vous mécroyez / vous êtes mécréants » |
| يَشْكُرُونَ | « ils remercient / ils sont reconnaissants » |

## 3. Diff DB

| Table | Avant | Après | Delta |
|---|---:|---:|---:|
| word_translations FR validées | 767 | **1017** | **+250** |
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

- **250/250 lignes présentes** · fr · `is_validated=true` · provenance « Hikma — lexique éditorial » · 0 texte divergent · 0 ligne supplémentaire
- **Runtime : 250/250 formes résolues en FR**
- **HOLDs** : أَعْلَمُ · كُنَّا · وَإِن — 0 wt FR validée, 0 mapping (vérifiés par word_id fixe)
- **Idempotence** : rerun = **0 insertion**, 250 doublons reconnus, 0 divergence, 0 collision
- **Intégrité** : sourate 64 = 0 · MASAQ 22 485/44 677 intact · sourates pilotes (1/108/112/113/114) sans chevauchement avec le Lot 9

## 5. Non-régression

`tsc` PASS · `eslint` PASS · `vitest` **775/775** PASS · `build` PASS · tests helpers **12 PASS / 0 FAIL / 1 INFO** (post-APPLY)

## 6. État lexical cumulé (Lots 1–9)

- `word_translations` FR validées : **767 → 1017** · formes résolues FR : **1049 → 1299**
- Mappings safe inchangés : **188** · lemmes : 32 · lemma_translations : 32 (28 FR validées)
- HOLDs conservés hors plan : أَعْلَمُ, كُنَّا, وَإِن
- Lots cumulés : 13+3 · 17+1 · 19 · 20 · 20 · 20 · 20 · 100 · **250**

## 7. Garanties

Écriture strictement limitée à `word_translations` (+250) · aucun mapping, aucun lemme, aucune lemma_translation créée · aucune table MASAQ/métier touchée · aucun commit/push · **aucun Lot 10 lancé, HOLDs non traités, taille du prochain lot non augmentée automatiquement**.

## 8. Artefacts

- `tmp/phase70j/lot9-review-decisions.json` · `lot9-proposals.json` · `lot9-import-summary.json` (APPLY) · `lot9-post-apply.json` · `lot9-idempotence.json` · `lot9-targeted-review.json` · `targeted-data.json`
- scripts : `tmp/phase70j-lot9-import.ts` (verrouillé `APPLY=1`) · `tmp/phase70j-lot9-verify.ts` · `tmp/phase70j-lot9-safety.ts`

**STOP — aucune écriture supplémentaire.**
