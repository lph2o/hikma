# PHASE 70Q — POST-LOT-15 — AUDIT GLOBAL DE REPRISE

**READ-ONLY STRICT** — Aucune écriture DB. Photographie après 15 lots (Lots 1–15).

Données brutes : `tmp/phase70q/post-lot15-audit.json`

---

## 1. VERDICT

```text
PHASE_70Q_POST_LOT15_RESUME_AUDIT_COMPLETE

DATABASE_WRITES = 0
LOT_16_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false

STOP — HUMAN DECISION REQUIRED
```

---

## 2. MATRICE FINALE

| Élément | Attendu | Live | Statut |
|---|---:|---:|---|
| word_translations FR validées | 4490 | **4490** | ✅ |
| word_lemma_mapping | 188 | **188** | ✅ |
| lemmas | 32 | **32** | ✅ |
| lemma_translations | 32 | **32** | ✅ |
| lemma_translations FR | 28 | **28** | ✅ |
| translations | 24944 | **24944** | ✅ |
| quran_words | 21296 | **21296** | ✅ |
| word_occurrences | 77430 | **77430** | ✅ |
| MASAQ occurrences | 22485 | **22485** | ✅ |
| MASAQ segments | 44677 | **44677** | ✅ |
| Sourate 64 MASAQ | 0 | **0** | ✅ |
| HOLDs (أَعْلَمُ/كُنَّا/وَإِن) | 0 wt FR / 0 mapping | **0/0 ×3** | ✅ |
| Lot 15 (69/69) | 69/69 | **69/69** | ✅ |
| Zones protégées (1/108/112/113/114) | intactes | intactes | ✅ |
| Collisions Lots 1–15 | 0 | **0** | ✅ |
| Divergences | 0 | **0** | ✅ |

---

## 3. EVOLUTION DES COMPTEURS (Lots 1–15)

| Lot | Insertions | Cumul |
|---|---:|---:|
| Lots 1–13 | 3756 | 3756 |
| Lot 14 | 127 | 3883 |
| Lot 15 | 69 | 3952 |

Différence live (4490 − 3952 = **538**) : contributions lemma FR + imports antérieurs
non séquencés en lots (Phase 22+).

---

## 4. COUVERTURE LEXICALE

| Métrique | Avant Lot 14 | Après Lot 15 | Évolution |
|---|---|---:|---:|
| **Par forme** | 20.16% | **21.08%** | +0.92pp |
| **Par occurrence** | 65.99% | **69.32%** | +3.33pp |

### Couverture par fréquence

| Fréquence | Formes couvertes | Occs couvertes |
|---|---|---:|
| 1 occurrence | 232 / 14 118 (1.6%) | 232 / 14 118 (1.6%) |
| 2–5 occurrences | 2 706 / 5 424 (49.9%) | 7 948 / 14 801 (53.7%) |
| 6–10 occurrences | 712 / 866 (82.2%) | 5 395 / 6 480 (83.3%) |
| 11–20 occurrences | 417 / 446 (93.5%) | 5 913 / 6 310 (93.7%) |
| 21–50 occurrences | 265 / 273 (97.1%) | 8 629 / 8 893 (97.0%) |
| **51+ occurrences** | **158 / 169 (93.5%)** | **25 561 / 26 828 (95.3%)** |

---

## 5. POOLS RECALCULÉS LIVE

| Pool | Post-Lot 14 | Post-Lot 15 | Statut |
|---|---:|---:|---|
| C+P1 | 47 | **0** | ✅ **ÉPUISÉ** |
| C+P2 | 23 | **1** | Résidu négligeable |
| C+P3 | 4245 | **4243** | Restant |
| **Total restant** | 4315 | **4244** | |

**C+P1 est complètement épuisé.** Le pipeline a traité 100% des formes MASAQ à
haute priorité (impact ≥ 60).

---

## 6. CATÉGORISATION DES FORMES

| Catégorie | Post-Lot 14 | Post-Lot 15 | Δ |
|---|---:|---:|---:|
| **A** — Glose FR directe | 4421 | **4490** | +69 |
| **B** — Lemma FR | 167 | **167** | 0 |
| **C** — MASAQ sans glose | 4318 | **4249** | −69 |
| **D** — Reste | 12 390 | **12 390** | 0 |
| **Total** | 21 296 | **21 296** | |

---

## 7. QUALITÉ ÉDITORIALE

- **0 glose vide** — aucune anomalie
- **0 langue incorrecte** (toutes `language = "fr"`)
- **0 `is_validated ≠ true`**
- **0 divergence de provenance**

---

## 8. UNICODE

- Formes non-NFC : **1261 / 4490** (28.1%)
- Clé = `word_id`. NFC documentaire uniquement.

---

## 9. ZONES PROTÉGÉES (intactes)

| Zone | Valeur |
|---|---:|
| Fātiḥah | 29 ✅ |
| Pilote 108 | 10 ✅ |
| Pilote 112 | 15 ✅ |
| Pilote 113 | 23 ✅ |
| Pilote 114 | 20 ✅ |
| Sourate 64 MASAQ | 0 ✅ |

---

## 10. HOLDs (intacts)

| Forme | wt FR | mapping |
|---|---|---:|
| أَعْلَمُ | 0 | 0 |
| كُنَّا | 0 | 0 |
| وَإِن | 0 | 0 |

---

## 11. NON-RÉGRESSION

| Outil | Résultat |
|---|---|
| `tsc --noEmit` | PASS |
| `eslint .` | PASS |
| `vitest run` | **775/775** PASS |
| `npm run build` | PASS |

---

## 12. SÉCURITÉ

```text
DATABASE_WRITES = 0 (audit READ-ONLY)
LOT_16_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false
```

---

## 13. CONCLUSION STRATÉGIQUE

Après 15 lots (3952 insertions + 538 contributions antérieures = **4490** gloses FR) :

- **21.08%** des formes coraniques sont couvertes par une glose FR directe
- **69.32%** des occurrences du Coran sont couvertes
- Les formes les plus fréquentes (>50 occurrences) sont couvertes à **95.3%**
- Les formes 21–50 occurrences sont couvertes à **97.0%**
- Les formes 11–20 occurrences sont couvertes à **93.7%**
- Les formes 6–10 occurrences sont couvertes à **83.3%**

**Les pools C+P1 et C+P2 sont pratiquement épuisés** (1 résidu). La stratégie de
priorisation par impact (surahs×10 + occurrences) a parfaitement rempli sa mission.

Le **C+P3 restant (4243 formes)** est massivement composé de formes à très basse
fréquence. La prochaine décision humaine portera sur l'opportunité de traiter ce
pool via une approche différente (par lots thématiques, par familles de lemmas,
ou via un traitement automatisé des hapax).

**Recommandation** : passer à une stratégie C+P3, potentiellement avec un
traitement par lots de formes apparentées (même lemma, même racine) plutôt que
par fréquence. Documenter cette décision dans un prochain human gate.

---

*Audit généré le 2026-08-22. DATABASE_WRITES = 0. STOP.*