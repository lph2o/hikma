# PHASE_70G_LOT6_REPORT — LOT 6 — APPLIED_AND_VERIFIED

## Verdict

```
PHASE_70G_LOT6_APPLIED_AND_VERIFIED
```

**STOP — aucune écriture supplémentaire.** Aucun Lot 7, aucun traitement des HOLDs, aucun commit/push.

---

## 1. Protocole exécuté

| Étape | Résultat |
|---|---|
| Sélection (read-only) | 20 candidats (pool 1 017) — déterministe, diversité méthodologique |
| Dossiers d'évidence | MASAQ + 4 traductions alignées + lemmes + contextes (`lot6-evidence.json`) |
| Revue humaine 1 (12 cas ciblés) | 11 ACCEPT · 1 MODIFY (صَـٰلِحًۭا → « bonne / vertueuse ») · 0 HOLD · 0 REJECT |
| Décision humaine | ACCEPT global du périmètre révisé |
| DRY-RUN | 20 INSERT · 0 collision · 0 divergence · 23/23 Unicode · HOLDs absents · `DATABASE_WRITES = 0` |
| **Human gate APPLY** | ✅ Autorisation explicite reçue |
| **APPLY** | `word_translations` **+20** (627 → 647) · `word_lemma_mapping` +0 · post_verified **20/20** · 0 erreur |

## 2. Baseline → Après APPLY

| Table | Avant | Après | Delta |
|---|---:|---:|---:|
| `word_translations` FR validées | **627** | **647** | **+20** |
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

20/20 présentes · `language = fr` · `is_validated = true` · provenance « Hikma — lexique éditorial » · textes exacts conformes au DRY-RUN (0 manquant, 0 mismatch).

| # | Forme | Glose (exacte) |
|---|---|---|
| 1 | تُرْجَعُونَ | vous serez ramenés / vous serez reconduits |
| 2 | يُرِيدُ | Il veut / Il désire |
| 3 | كَذَّبُوا۟ | ils traitèrent de mensonge / ils démentirent |
| 4 | كُنتُم | vous étiez / vous fûtes |
| 5 | خَيْرُ | meilleur / le meilleur |
| 6 | نَذِيرٌۭ | avertisseur / celui qui avertit |
| 7 | أَشَدُّ | plus fort / plus dur |
| 8 | بِـَٔايَـٰتِ | par les versets / par les signes |
| 9 | بِكُلِّ | par chaque / par tout |
| 10 | بَنِىٓ | fils / enfants |
| 11 | ٱلرَّحِيمُ | le Très Miséricordieux |
| 12 | ٱلْـَٔايَـٰتِ | les versets / les signes |
| 13 | صَـٰلِحًۭا | **bonne / vertueuse** (MODIFY — sans « œuvre ») |
| 14 | مُّبِينٍۢ | clair / évident |
| 15 | ٱلْيَوْمَ | ce jour-là / aujourd'hui |
| 16 | ٱلْقَوْمِ | le peuple / les gens |
| 17 | عَلَيْكُمْ | sur vous / à votre charge |
| 18 | وَلَقَدْ | et certes / et vraiment |
| 19 | فِرْعَوْنُ | Pharaon |
| 20 | وَلَوْ | et si / même si |

## 5. Runtime

**20/20 formes résolues en français** (logique FORME → LEMME → fallback EN du runtime Hikma) — 100 %.

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
- Sourates protégées (1, 108, 112, 113, 114) : aucune écriture du Lot 6 sur les tables protégées
- 0 mapping créé sur les 20 formes · aucun lemme créé · aucune `lemma_translation`

## 9. Non-régression

| Vérification | Résultat |
|---|---|
| `tsc --noEmit` | PASS |
| `eslint .` | PASS |
| `vitest run` | **775/775 PASS** |
| `npm run build` | PASS |
| Tests helpers périmètre Lot 6 | 20 PASS / 0 FAIL / 1 INFO |

## 10. État lexical cumulé (Lots 1–6)

- Lot 1 : 13 GLOSE + 3 mappings · Lot 2 : 17 GLOSE + 1 mapping · Lot 3 : 19 GLOSE · Lot 4 : 20 GLOSE · Lot 5 : 20 GLOSE · **Lot 6 : 20 GLOSE**
- `word_translations` FR validées : **647** · formes résolues FR : **929** (909 + 20)
- Mappings safe : 188 · lemmes : 32 · lemma_translations : 32 (28 FR validées)

## 11. Garanties

Écriture strictement limitée à `word_translations` (+20) · aucun mapping, aucun lemme, aucune lemma_translation · aucune table MASAQ/métier touchée · aucun commit/push · **aucun Lot 7 lancé, HOLDs non traités**.

## 12. Artefacts

`tmp/phase70g/lot6-review-decisions.json` · `lot6-import-summary.json` (APPLY) · `lot6-verify.json` · `lot6-safety.json` · scripts `tmp/phase70g-lot6-import.ts` / `tmp/phase70g-lot6-verify.ts` / `tmp/phase70g-lot6-safety.ts` · `PHASE_70G_REPORT.md` · `PHASE_70G_LOT6_REPORT.md`
