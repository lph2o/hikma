# PHASE 70R — ANALYSE STRATÉGIQUE POST-LOT 15 — POOL C+P3

**READ-ONLY STRICT** — Aucune écriture DB. Recommandation stratégique uniquement.

Données brutes : `tmp/phase70r/c3-analysis.json`

---

## 1. VERDICT

```text
PHASE_70R_C3_STRATEGIC_ANALYSIS_COMPLETE

DATABASE_WRITES = 0
LOT_16_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false

STOP — HUMAN DECISION REQUIRED
```

---

## 2. GROUND TRUTH

| Élément | Live |
|---|---:|
| word_translations FR | **4490** |
| Couverture formes | 21.08% |
| Couverture occurrences | 69.32% |
| C+P1 | 0 (épuisé) |
| C+P2 | 1 (résidu) |
| C+P3 | **4243** |

---

## 3. COMPOSITION DU C+P3 (4243 FORMES, 4401 OCCURRENCES)

### Distribution par fréquence

| Fréquence | Formes | % |
|---|---:|---:|
| 1 occurrence (hapax) | **4110** | **96.8%** |
| 2–5 occurrences | 131 | 3.1% |
| 6–10 occurrences | 2 | 0.05% |
| 11+ occurrences | 0 | 0% |

Le C+P3 est écrasé par les hapax à 96.8%. Les 133 formes non-hapax
représentent environ 291 occurrences supplémentaires sur 4401.

### Distribution POS (simplifiée)

| POS | Formes | % |
|---|---:|---:|
| OTHER (non classifié) | 3931 | 92.6% |
| GRAM (particules/négations) | 312 | 7.4% |
| VERB | **0** | 0% |
| NOUN | catégorisé sous OTHER | |
| ADJ | catégorisé sous OTHER | |

### Analyse par lemme

| Métrique | Valeur |
|---|---|
| Groupes de lemmes distincts | **6** |
| Formes par lemme (moyenne) | ~707 |
| Familles partiellement couvertes | **0** |
| Hapax avec lemma FR existant | **8 / 4110** (0.2%) |

**Constat fondamental :** le C+P3 est un océan de formes isolées. Il n'existe
pratiquement aucune famille de lemme partiellement couverte qui permettrait un
traitement par lots thématiques. Seuls 8 hapax sur 4110 ont un lemme déjà
traduit en français.

### Unicode

- Formes non-NFC : **1290 / 4243** (30.4%)

---

## 4. COMPARAISON DES STRATÉGIES

### Stratégie A — Fréquence pure

Trier les 4243 formes par fréquence décroissante, traiter les 131 formes à
2–5 occurrences en priorité.

| Scénario | Formes | Occs gagnées | Gain couverture |
|---|---:|---:|---:|
| Top 131 (2–5 occs) | 131 | ~291 | +0.38% |
| Top 4243 (toutes) | 4243 | 4401 | +5.68% |

**Rendement :** 2.2 occs/forme pour les non-hapax, 1.0 pour les hapax.

### Stratégie B — Familles de lemmes

**Impossible en l'état.** Seuls 6 groupes de lemmes existent, aucun n'a de
forme FR déjà couverte. Il n'y a pas de « famille partiellement couverte »
exploitable.

### Stratégie C — Regroupement morphologique

Nécessiterait l'extraction des stems/racines MASAQ pour regrouper les formes.
Les 312 formes GRAM pourraient être traitées en bloc.

### Stratégie D — Par sourate

Les formes C+P3 sont dispersées sur de nombreuses sourates. Aucune sourate
ne concentre significativement le pool.

### Stratégie E — Traitement automatisé des hapax

Pour les 4110 hapax : utiliser le gloss MASAQ existant (masaq_gloss_en) comme
base, le faire traduire automatiquement, et appliquer une validation humaine
par échantillonnage plutôt que forme par forme.

---

## 5. RECOMMANDATION

### Option recommandée : **E — Traitement automatisé avec validation par échantillonnage**

**Raisonnement :**

1. Le C+P3 est composé à **96.8% de hapax** — des formes qui n'apparaissent
   qu'une seule fois dans tout le Coran
2. Il n'existe **aucune famille de lemme partiellement couverte** qui
   permettrait un traitement éditorial groupé efficace
3. Chaque forme hapax couvre exactement **1 occurrence** — le gain marginal
   est de 1 occurrence par glose produite
4. Produire manuellement 4243 gloses pour gagner 5.68% de couverture
   représenterait un coût éditorial disproportionné
5. Le gloss MASAQ (masaq_gloss_en) fournit déjà une glose anglaise pour
   chaque occurrence — une traduction automatique FR + validation par
   échantillonnage serait un compromis acceptable

**Mise en œuvre suggérée :**

1. Extraire le `masaq_gloss_en` pour les 4243 formes C+P3
2. Traduire automatiquement en français
3. Valider manuellement un échantillon représentatif (5–10%, soit ~200–400 formes)
4. Appliquer en bloc avec un flag `confidence = "auto"` distinct
5. Les 133 formes non-hapax (2–5 occurrences) peuvent être traitées
   éditorialement si le temps le permet

### Alternative : **Ne pas traiter le C+P3**

Les 4243 formes ne représentent que **5.68%** des occurrences et **19.9%** des
formes. La couverture actuelle de 69.32% des occurrences est déjà excellente
pour une application pédagogique. L'effort pour gagner 5.68 points supplémentaires
pourrait être redéployé vers d'autres priorités (curriculum, audio, exercices).

---

## 6. TABLEAU DE DÉCISION

| Critère | Traiter C+P3 | Ne pas traiter |
|---|---|---|
| Formes produites | 4243 | 0 |
| Gain couverture occs | +5.68% (69.32→75.0%) | 0 |
| Gain couverture formes | +19.9% (21.1→41.0%) | 0 |
| Coût éditorial | Très élevé (4243 gloses) | Nul |
| Risque éditorial | Élevé (validation hapax difficile) | Nul |
| Valeur pédagogique | Faible (1 occ/forme, mots rares) | — |

---

## 7. SÉCURITÉ

```text
DATABASE_WRITES = 0
LOT_16_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false
```

## 8. NON-RÉGRESSION

`tsc` PASS · `eslint .` PASS · `vitest run` **775/775** · `build` PASS.

---

*Phase 70R — Analyse stratégique C+P3 — 2026-08-22 — DATABASE_WRITES = 0 — STOP*