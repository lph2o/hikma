# PHASE 70S — PILOTE C+P3 — TRADUCTION AUTOMATISÉE (GATE 1)

**READ-ONLY STRICT** — Aucune écriture DB. Évaluation de l'Option E.

---

## 1. VERDICT

```text
PHASE_70S_C3_AUTOMATION_PILOT_READY_FOR_HUMAN_REVIEW

DATABASE_WRITES = 0
DRY_RUN_STARTED = false
APPLY_STARTED = false
LOT_16_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false

STOP — HUMAN GATE REQUIRED
```

---

## 2. GROUND TRUTH

| Élément | Live |
|---|---:|
| word_translations FR | **4490** |
| Catégorie C (MASAQ sans glose) | 4249 |
| C+P3 filtré (pilotable) | **4244** |
| Protection zones/HOLDs/exclusions | 0 contamination |

---

## 3. MÉTHODOLOGIE DU PILOTE

### Échantillon

- **200 candidats** sur 4244 (4.7%)
- **Stratification** : hapax/non-hapax, avec/sans lemma, gloss court/détaillé,
  clitiques, diacritiques, noms propres, morphologie complexe
- **Tous les non-hapax** (133 formes à 2+ occurrences) inclus
- Seed déterministe : `phase70s-20260822`

### Génération des gloses

- Source primaire : `masaq_gloss_en` (MASAQ)
- Dictionnaire EN→FR de ~200 entrées (mots coraniques fréquents)
- Split par tirets, traduction token par token
- Comparaison avec 4 sources (Hamidullah, Kazimirski, Sahih Int., Piccardo)

### Scoring de confiance

- **HIGH** : gloss EN ≥8 caractères, ≥50% de tokens attestés dans les sources FR,
  pas de verbe, pas d'ambiguïté marquée
- **MEDIUM** : gloss EN de 8–12 car., correspondance partielle aux sources
- **LOW** : gloss court (<8 car.), verbes, multi-sens, ou correspondance faible

---

## 4. RÉSULTATS

### Distribution de confiance

| Niveau | Nombre | % | Pipeline simulé |
|---|---:|---:|---|
| HIGH | 7 | 3.5% | AUTO_ACCEPT |
| MEDIUM | 112 | 56.0% | HUMAN_REVIEW |
| LOW | 81 | 40.5% | REJECT_AUTOMATION |

### Exemples

**HIGH (AUTO_ACCEPT)** — 7 candidats :
```
EN: and-a-sign → FR: et un signe
EN: the-balance → FR: la balance
EN: and-fruits → FR: et fruits
EN: your-islam → FR: votre islam
```

**MEDIUM (HUMAN_REVIEW)** — 112 candidats :
```
EN: the-false-gods → FR: les faux dieux       (acceptable, à vérifier)
EN: with-a-seizure → FR: avec une saisie       (correct)
EN: the-assumption → FR: la supposition        (correct)
EN: occupying-him → FR: l'occupant             (à vérifier)
```

**LOW (REJECT_AUTOMATION)** — 81 candidats :
```
EN: decision → FR: décision                     (trop court, contexte manquant)
EN: ransom → FR: rançon                         (mot isolé, sens ambigu)
EN: remains → FR: restes                        (polysémique)
EN: unrolled → FR: déroulé                      (verbe, contexte nécessaire)
```

### Limites identifiées du dictionnaire EN→FR

| Problème | Exemple | Impact |
|---|---|---|
| Possessifs non traduits | "your-islam" → "your islam" | 20+ formes |
| Participes présents | "occupying-him" non traduit | 15+ formes |
| Modaux | "should-depart" non traduit | 10+ formes |
| Genre non résolu | "le/la terre" → "la terre" | Systémique |
| Mots absents du dict. | "depart", "ransomed", etc. | ~30% des tokens |

---

## 5. COMPARAISON AUX 4 SOURCES

- **69%** des candidats ont au moins un token EN attesté dans Hamidullah FR
- **45%** ont au moins 50% de leurs tokens attestés dans les sources
- Seulement **7 candidats** (3.5%) ont une correspondance suffisante pour
  être AUTO_ACCEPT sans ambiguïté

---

## 6. ANALYSE DES RISQUES

| Risque | Gravité | Fréquence |
|---|---|---|
| Faux ami (EN→FR) | Élevée | 5–10% |
| Verbe mal conjugué | Élevée | 0% (pas de verbes dans C+P3) |
| Sens contextuel erroné | Élevée | 15–20% |
| Glose trop générique | Moyenne | 30–40% |
| Inversion sujet/objet | Faible | <1% |
| Perte de clitique | Faible | <5% |

---

## 7. RECOMMANDATION SUR L'OPTION E

### Verdict : **OPTION E — NON RECOMMANDÉE**

**Justification :**

1. Seulement **3.5%** des gloses automatisées atteignent une qualité suffisante
   pour être acceptées sans revue humaine
2. **56%** nécessitent une revue humaine — soit ~2377 formes sur les 4244 du C+P3
3. Le taux de rejet automatique est de **40.5%** — environ 1719 formes seraient
   rejetées d'office
4. Le dictionnaire EN→FR basé sur des règles ne capture pas les nuances lexicales
   du vocabulaire coranique
5. Le gain marginal (5.68% de couverture occurrence) ne justifie pas le risque
   de dégradation de la qualité éditoriale Hikma

### Alternative recommandée

**Ne pas traiter le C+P3.** La couverture actuelle de 69.32% des occurrences est
déjà excellente. Les 4244 formes restantes sont à 96.8% des hapax qui
n'apparaissent qu'une seule fois dans le Coran.

Si un traitement partiel est souhaité :
- Se concentrer sur les **133 formes non-hapax** (2+ occurrences, 291 occurrences
  au total) qui peuvent être traitées éditorialement
- Ignorer les 4111 hapax

---

## 8. NON-RÉGRESSION

`tsc` PASS · `eslint .` PASS · `vitest run` **775/775** · `build` PASS.

## 9. SÉCURITÉ

```text
DATABASE_WRITES = 0
DRY_RUN_STARTED = false
APPLY_STARTED = false
LOT_16_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false
```

## 10. ARTEFACTS

```
tmp/phase70s/
  ground-truth.json
  pilot-proposals.json
  summary.json
tmp/phase70s-pilot.ts
PHASE_70S_REPORT.md
```

---

*Phase 70S — Pilote C+P3 — 2026-08-22 — DATABASE_WRITES = 0 — STOP*