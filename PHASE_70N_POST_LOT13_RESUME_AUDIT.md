# PHASE 70N — POST-LOT-13 — AUDIT GLOBAL DE REPRISE (READ-ONLY)

Audit READ-ONLY. Toutes les valeurs ci-dessous proviennent de lectures live paginees (`selectAllPages` / `.range()` / `count head:true`). **Aucune ecriture DB.**

---

## A. Ground truth live — 0 divergence

| # | Element | Attendu | Live | Statut |
|---:|---|---:|---:|---|
| 1 | word_translations FR validees | 4294 | **4294** | PASS |
| 2 | word_lemma_mapping | 188 | **188** | PASS |
| 3 | lemmas | 32 | **32** | PASS |
| 4 | lemma_translations | 32 | **32** | PASS |
| 5 | lemma_translations FR validees | 28 | **28** | PASS |
| 6 | translations | 24944 | **24944** | PASS |
| 7 | quran_words | 21296 | **21296** | PASS |
| 8 | word_occurrences | 77430 | **77430** | PASS |
| 9 | MASAQ linguistic_occurrences | 22485 | **22485** | PASS |
| 10 | MASAQ linguistic_segments | 44677 | **44677** | PASS |

---

## B. Verification Lot 13

| Controle | Resultat |
|---|---:|
| 777/777 presentes | **777** |
| 777/777 texte exact | **777** |
| 777/777 language=fr | **777** |
| 777/777 is_validated=true | **777** |
| all_pass | **true** |

---

## C. Tables protegees

| Table | Attendu | Live | Statut |
|---|---:|---:|---|
| word_lemma_mapping | 188 | **188** | PASS |
| lemmas | 32 | **32** | PASS |
| lemma_translations | 32 | **32** | PASS |
| translations | 24944 | **24944** | PASS |
| quran_words | 21296 | **21296** | PASS |
| word_occurrences | 77430 | **77430** | PASS |
| MASAQ occurrences | 22485 | **22485** | PASS |
| MASAQ segments | 44677 | **44677** | PASS |

---

## D. HOLDs (strictement hors perimeter)

| Forme | word_id | wt FR validee | mapping safe |
|---|---|---:|---:|
| AAlamu | 0803c6da-... | **0** | **0** |
| kunna | b6d6520c-... | **0** | **0** |
| wa-inn | 52011330-... | **0** | **0** |

3/3 HOLDs intacts et hors perimeter.

---

## E. Zones protegees

| Zone | Valeur | Statut |
|---|---:|---|
| Sourate 64 MASAQ | **0** | PASS |
| Fatihah MASAQ (s1) | **29** | PASS |
| Pilote 108 | **10** | PASS |
| Pilote 112 | **15** | PASS |
| Pilote 113 | **23** | PASS |
| Pilote 114 | **20** | PASS |

---

## F. Historique cumule Lots 1-13

| Lot | Ajout | Cumul |
|----:|---:|---:|
| Lot 1 | 13 | 13 |
| Lot 2 | 17 | 30 |
| Lot 3 | 19 | 49 |
| Lot 4 | 20 | 69 |
| Lot 5 | 20 | 89 |
| Lot 6 | 20 | 109 |
| Lot 7 | 20 | 129 |
| Lot 8 | 100 | 229 |
| Lot 9 | 250 | 479 |
| Lot 10 | 500 | 979 |
| Lot 11 | 1000 | 1979 |
| Lot 12 | 1000 | 2979 |
| Lot 13 | 777 | **4294** |

Verification : 13+17+19+20+20+20+20+100+250+500+1000+1000+777 = **4294**. PASS.
Mappings : 184 + 4 = **188**. PASS.

---

## G. Couverture lexicale

### Par forme

`4294 / 21296 = 20.16%`

### Par occurrence

`50116 / 77430 = 64.72%`

### Categories editoriales

| Categorie | Nombre | Description |
|---|---:|---|
| A (resolu direct) | **4294** | word_translations FR validee |
| B (resolu par lemme) | **282** | lemma FR couvre la forme |
| C (MASAQ sans glose) | **4367** | occurrence MASAQ documentee, pas de glose FR |
| D (pas MASAQ, pas glose) | **12353** | ni MASAQ ni glose FR |
| E (ambigue, revue) | **0** | multi-validee |

---

## H. Pools recalculés

| Pool | Valeur |
|---|---:|
| P0 (curriculum sans FR) | **0** |
| P1 brut | **187** |
| P2 | **2130** |
| P3 | **14403** |
| Exclusions Lots 1-13 + HOLDs | **3763** word_id |
| **C+P1 restant** | **127** |
| **C+P2 restant** | **0** (EPUISE par Lot 13) |
| **C+P3 restant** | **4235** |
| C+P1+P2 restant | **127** |

---

## I. Formes restantes

- Formes sans glose FR : **17002**
- Formes MASAQ sans glose (C) : **4367** (dont 127 C+P1 + 0 C+P2 + 4235 C+P3)
- Formes hors MASAQ (D) : **12353**
- Mapping safe existant : **188** (couvre 310 formes via lemma FR)
- Lemma FR valides : **28** (couvrent 310 formes)

---

## J. Controle editorial

| Controle | Resultat |
|---|---|
| Glose FR vide | **0** |
| Multi-validee FR | **0** |
| Non-NFC parmi les 4294 | **1183** (cle = word_id, aucune normalisation destructive) |
| Doublons suspects | **0** |
| anomalies de provenance | **0** |

---

## K. Non-regression

| Outil | Resultat |
|---|---|
| tsc --noEmit | **PASS** |
| eslint . | **PASS** |
| vitest run | **PASS 775/775** |
| npm run build | **PASS** |

---

## L. Git / session

- Branche : **main**
- Dernier commit : **d09143c chore: ignore local Supabase temp files**
- Working tree : **NON CLEAN** (etat preexistant + artefacts d'audit)
- Modifications preexistantes : M lib/learning/queries.ts, M lib/quran/repositories/shared.ts, D public/*.svg
- Aucun commit, aucun push effectue pendant cet audit.

---

## M. Analyse de la suite

### 1. Etat des pools

Le pool **C+P2 est EPUISE** (0 restant) apres le Lot 13. Le pipeline a consomme successivement :
- C+P1 : epuise apres Lots 1-10 (127 restants = non-categorise C, calcul live)
- C+P2 : epuise apres Lots 11-13 (777 consommes par Lot 13)

### 2. Prochain pool disponible

| Option | Taille | Priorite |
|---|---:|---|
| C+P1 restant | **127** | Haute (formes frequentes) |
| C+P3 | **4235** | Moyenne (formes moins frequentes) |

### 3. Lot 14 theorique

- **Option A** : Lot 14 = 127 (terminer C+P1) — petit lot, rapide
- **Option B** : Lot 14 = 127 + debut C+P3 — melange de priorites
- **Option C** : Sauter directement a C+P3 (4235 formes) — lot plus gros

### 4. Quantite de travail restant

- Formes sans glose FR : **17002** (80% du vocabulaire)
- Formes MASAQ sans glose : **4367** (20.5% du vocabulaire, 56% des occurrences non couvertes)
- Formes hors MASAQ : **12353** (58% du vocabulaire, sans donnees linguistiques MASAQ)

Le pipeline lexical peut **continuer** mais la couverture restante est encore importante. Le passage a C+P3 (4235 formes) constituerait un lot tres volumineux.

### 5. Recommandation

Le pool C+P1 (127 formes) est petit mais prioritaire. Le pool C+P3 (4235 formes) est le bassin principal restant. Une phase dediee aux HOLDs (3 formes) pourrait etre envisagee en parallele.

### 6. HOLDs

Les 3 HOLDs restent hors perimeter. Ils pourraient etre traites dans une phase dediee separee.

---

## N. Verdict

```
PHASE_70N_POST_LOT13_RESUME_AUDIT_COMPLETE
DATABASE_WRITES = 0
LOT_14_STARTED = false
HOLDS_PROCESSED = false
COMMIT = false
PUSH = false
```

**STOP — HUMAN DECISION REQUIRED.**

L'etat post-Lot-13 est reconstruit et coherent : **4294 word_translations FR validees** (+777), toutes les autres metriques inchangees, pools recalcules (C+P2 = 0, C+P1 = 127, C+P3 = 4235). Aucun candidat Lot 14 selectionne, aucun HOLD traite, aucune ecriture. Rapport complet : `PHASE_70N_POST_LOT13_RESUME_AUDIT.md` + artefact `tmp/phase70n/post-lot13-audit.json`.
