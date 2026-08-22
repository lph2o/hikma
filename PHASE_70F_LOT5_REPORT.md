# PHASE_70F_LOT5_REPORT — LOT 5 — APPLIED_AND_VERIFIED

## Verdict

```
PHASE_70F_LOT5_APPLIED_AND_VERIFIED
```

**STOP — aucune écriture supplémentaire.** Aucun Lot 6, aucun traitement des HOLDs, aucun commit/push.

---

## 1. Protocole exécuté

| Étape | Résultat |
|---|---|
| Sélection (read-only) | 20 candidats (pool 1 037) — déterministe, diversité méthodologique |
| Dossiers d'évidence | MASAQ + 4 traductions alignées + lemmes + contextes (`lot5-evidence.json`) |
| Revue humaine 1 (10 cas ciblés) | 9 ACCEPT · 1 MODIFY (جَنَّـٰتٍۢ → « des jardins ») · 0 HOLD · 0 REJECT |
| Décision humaine | ACCEPT global du périmètre révisé |
| DRY-RUN | 20 INSERT · 0 collision · 0 divergence · 23/23 Unicode · HOLDs absents · `DATABASE_WRITES = 0` |
| **Human gate APPLY** | ✅ Autorisation explicite reçue |
| **APPLY** | `word_translations` **+20** (607 → 627) · `word_lemma_mapping` +0 · post_verified **20/20** · 0 erreur |

## 2. Baseline → Après APPLY

| Table | Avant | Après | Delta |
|---|---:|---:|---:|
| `word_translations` FR validées | **607** | **627** | **+20** |
| `word_lemma_mapping` | 188 | 188 | 0 |
| `lemma_translations` | 32 | 32 | 0 |
| `lemmas` | 32 | 32 | 0 |
| `linguistic_occurrences` | 22 485 | 22 485 | 0 |
| `linguistic_segments` | 44 677 | 44 677 | 0 |
| `translations` | 24 944 | 24 944 | 0 |
| `quran_words` | 21 296 | 21 296 | 0 |
| `word_occurrences` | 77 430 | 77 430 | 0 |

## 3. Diff DB

`unexpected_table_changes = []` — la seule variation est `word_translations_fr_validated : +20`.

## 4. Vérification des 20 lignes

20/20 présentes · `language = fr` · `is_validated = true` · provenance « Hikma — lexique éditorial » · textes exacts conformes (0 mismatch, 0 manquant).

| # | Forme | Glose (exacte) |
|---|---|---|
| 1 | أُوتُوا۟ | ils reçurent / il leur fut donné |
| 2 | ءَامَنُوٓا۟ | ils ont cru / ils crurent |
| 3 | يُحِبُّ | Il aime |
| 4 | يَهْدِى | Il guide / Il dirige |
| 5 | قَدِيرٌۭ | Puissant / Omnipotent |
| 6 | عَظِيمٌۭ | immense / grand |
| 7 | حَكِيمٌۭ | sage / plein de sagesse |
| 8 | إِلَـٰهَ | dieu / divinité |
| 9 | جَنَّـٰتٍۢ | des jardins (MODIFY — exclusivement) |
| 10 | تَحْتِهَا | sous elle / au-dessous d'elle |
| 11 | ٱلْأَنْهَـٰرُ | les rivières / les fleuves |
| 12 | ٱلْعَلِيمُ | l'Omniscient / Celui qui sait tout |
| 13 | صَـٰدِقِينَ | véridiques / sincères |
| 14 | ٱلْمُحْسِنِينَ | les bienfaisants / les gens de bien |
| 15 | لِلنَّاسِ | aux gens / pour les gens |
| 16 | لِّقَوْمٍۢ | pour un peuple / à un peuple |
| 17 | وَهُمْ | et eux / et ils |
| 18 | وَإِذَا | et lorsque / et quand |
| 19 | مَرْيَمَ | Marie |
| 20 | إِنَّا | certes Nous / Nous |

## 5. Runtime

**20/20 formes résolues en français** (via la logique FORME → LEMME → fallback EN du runtime Hikma) — 100 %.

## 6. Idempotence

Rerun contrôlé : **0 nouvelle insertion** · 20 doublons reconnus (ALREADY_EXISTS) · 0 divergence · 0 collision — `UNIQUE(word_id, language, source_id)`.

## 7. HOLDs historiques — inchangés, absents

| Forme | `word_translations` FR validée | mapping |
|---|---|---|
| أَعْلَمُ | 0 | 0 |
| كُنَّا | 0 | 0 |
| وَإِن | 0 | 0 |

## 8. Intégrité

- Sourate 64 = 0 occurrence MASAQ (MASAQ_BLOCKED)
- MASAQ intact : 22 485 occurrences / 44 677 segments
- Sourates protégées (1, 108, 112, 113, 114) : aucune écriture des lots 70B–F sur les tables protégées
- 0 mapping créé sur les 20 formes · aucun lemme créé · aucune `lemma_translation`

## 9. Non-régression

| Vérification | Résultat |
|---|---|
| `tsc --noEmit` | PASS |
| `eslint .` | PASS |
| `vitest run` | **775/775 PASS** |
| `npm run build` | PASS |
| Tests helpers périmètre Lot 5 | 20 PASS / 0 FAIL / 1 INFO |

## 10. État lexical cumulé (Lots 1–5)

- Lot 1 : 13 GLOSE + 3 mappings · Lot 2 : 17 GLOSE + 1 mapping · Lot 3 : 19 GLOSE · Lot 4 : 20 GLOSE · **Lot 5 : 20 GLOSE**
- `word_translations` FR validées : **627** · formes résolues FR : **909** (869 + 20)
- Mappings safe : 188 · lemmes : 32 · lemma_translations : 32 (28 FR validées)

## 11. Garanties

Écriture strictement limitée à `word_translations` (+20) · aucun mapping, aucun lemme, aucune lemma_translation · aucune table MASAQ/métier touchée · aucun commit/push · **aucun Lot 6 lancé, HOLDs non traités**.

## 12. Artefacts

`tmp/phase70f/lot5-review-decisions.json` · `lot5-import-summary.json` (APPLY) · `lot5-verify.json` · `lot5-safety.json` · scripts `tmp/phase70f-lot5-import.ts` / `tmp/phase70f-lot5-verify.ts` / `tmp/phase70f-lot5-safety.ts` · `PHASE_70F_REPORT.md` · `PHASE_70F_LOT5_REPORT.md`
