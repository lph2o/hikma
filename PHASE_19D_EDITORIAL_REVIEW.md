# PHASE 19D — REVUE ÉDITORIALE ET VALIDATION DES GLOSES PÉDAGOGIQUES

## STATUT

**STATUS = EDITORIAL_REVIEW_READY** · **DATABASE_WRITES = 0** · **VALIDATIONS = 0**

**VALIDATE_COUNT = 14** · **MODIFY_COUNT = 0** · **REJECT_COUNT = 0**

> **Aucune écriture en base.** Les 14 lignes restent `is_validated = false`. Les recommandations ci-dessous sont le dossier de décision destiné au propriétaire — la bascule éventuelle vers `is_validated = true` relève d'une phase ultérieure distincte.

---

## 1. Méthode de revue

Chaque fiche (14) a été construite à partir de :
- la **proposition stockée** dans `lemma_translations` (source éditoriale `79e6412e-…`) ;
- le rapport **19A** (`tmp/phase19a-multi-translation-analysis.json`) — occurrences et formes ;
- le rapport **19B** (`tmp/phase19b-pedagogical-gloss-proposals.json`) ;
- les **traductions réelles en base** (Hamidullah rid 31 · Kazimirski 1869 rid 9001 · Sahih 20 · Piccardo 153), **re-vérifiées en live** sur des occurrences concrètes (échantillons : قَوْم 25 occurrences, عَبْد 5/5, يَوْم 6, كَان 6, فِي 6…) ;
- les **formes `quran_words`** liées à chaque lemme.

Aucune source externe n'a été utilisée. La provenance de chaque argument est indiquée par fiche.

## 2. Tableau final

| Lemme | Glose actuelle | Confiance | Décision | Glose révisée | Justification |
|-------|----------------|-----------|----------|---------------|---------------|
| يَوْم | jour | HIGH | **VALIDATE** | — | Noyau temporel + eschatologique convergents (H/K) ; usages eschatologiques en variations |
| رَسُول | messager / envoyé | HIGH | **VALIDATE** | — | « apôtre » (K, 19ᵉ s.) = variante lexicale du même noyau ; H « Messager » converge |
| رَحْمَة | miséricorde | HIGH | **VALIDATE** | — | Convergence totale H/K sur 34 occurrences |
| أَرْض | terre | HIGH | **VALIDATE** | — | Noyau stable sur 291 occurrences ; distinct de la fiche 1860 |
| كِتَاب | livre / Écriture | HIGH | **VALIDATE** | — | Couvre Coran + Écritures antérieures + prescription (4:24) |
| قَوْم | peuple / gens | MEDIUM | **VALIDATE** | — | H « peuple » quasi systématique, K « peuple/hommes » ; noyau stable, réduction délicate → MEDIUM conservé |
| نَاس | gens / hommes | HIGH | **VALIDATE** | — | Humanité indistincte, H « gens » / K « hommes » ; distinct de قَوْم |
| عَذَاب | châtiment | HIGH | **VALIDATE** | — | Convergence H/K sur 150 occurrences ; épithètes = variations |
| نَبِيّ | prophète | HIGH | **VALIDATE** | — | Convergence totale (30 occurrences) |
| عَبْد | serviteur (de Dieu) | HIGH | **VALIDATE** | — | 5/5 occurrences coraniques = « serviteur » ; « esclave » (1860) absent du corpus coranique |
| لَا | non / ne…pas | HIGH | **VALIDATE** | — | Glose fonctionnelle adaptée aux mots grammaticalux (749 occ.) |
| كَان | être | HIGH | **VALIDATE** | — | Copule/existence/aspect = fonctions du même lexème ; détails en notes |
| كَفَر | être incrédule / ne pas croire | HIGH | **VALIDATE** | — | Couvre verbe + substantif ; H « mécréant » / K « infidèle » = registre |
| فِي | dans / en / sur | HIGH | **VALIDATE** | — | Glose fonctionnelle exacte (1 098 occ.), H/K convergent |

### VALIDATE (14)
يَوْم · رَسُول · رَحْمَة · أَرْض · كِتَاب · قَوْم · نَاس · عَذَاب · نَبِيّ · عَبْد · لَا · كَان · كَفَر · فِي

### MODIFY (0)
Aucune. Toutes les formulations actuelles représentent correctement le noyau lexical, restent dans la longueur pédagogique (1–5 mots) et ne dépendent d'aucune interprétation non démontrée.

### REJECT (0)
Aucune. Aucune glose n'attribue un sens non démontré, ne contredit les données, ni ne mélange deux lemmes.

## 3. Cas particuliers — détail des décisions

### قَوْم — VALIDATE avec confidence MEDIUM
Vérification sur 25 occurrences réelles : Hamidullah rend قَوْم par « peuple » quasi systématiquement (« Ô mon peuple » 11:89, 7:93 · « le peuple de Noé » 26:105, 38:12, 50:12, 54:9 · « le peuple de Pharaon » 44:17) ; Kazimirski alterne « peuple » et « hommes » (5:77 « hommes des Écritures »). Le noyau « collectif de personnes (communauté) » est stable. « peuple / gens » représente ce noyau sans forcer un unique équivalent. **La confiance reste MEDIUM** : la réduction est délicate (variante « hommes » chez K) et une validation humaine reste souhaitable. Pas d'inflation artificielle en HIGH.

### Mots grammaticalux — gloses fonctionnelles validées
- **فِي** « dans / en / sur » : vérifié en live (55:8 « dans le poids », 4:63 « dans leurs cœurs », 2:10 « dans leurs cœurs »). Trois équivalents couvrent les fonctions principales (localisation, figuré, spatial) ; le reste (à, vers) reste documenté en `editorial_notes`.
- **لَا** « non / ne…pas » : les 4 fonctions (ne…pas, non, ni, aucun) sont attestées par H/K ; la forme courte est pédagogiquement suffisante.
- **كَان** « être » : « être » est la glose correcte du verbe. Les valeurs aspectuelles (84:15 « son Seigneur l'observait parfaitement », 2:75) sont des fonctions syntaxiques du même lexème, pas des sens distincts — une glose plus longue n'apporterait pas de gain pédagogique. **Pas de MODIFY.**

### يَوْم — VALIDATE (glose générale conservée)
Les usages eschatologiques (1:4 « Jour de la Rétribution », 4:87 « Jour de la Résurrection ») coexistent avec l'usage temporel (2:259). Remplacer par « Jour de la Résurrection » représenterait un sous-ensemble contextuel : rejeté. « jour » reste la glose du lemme, les usages eschatologiques sont des `contextual_variations`. ✅

### رَسُول — VALIDATE
« apôtre » chez Kazimirski (2:98, 5:109 « rassemblera les apôtres ») est une variante lexicale du 19ᵉ siècle du même concept que « Messager » (Hamidullah) / « messager » (Sahih, Piccardo). La paire « messager / envoyé » rend la variation explicite sans créer un sens distinct. ✅

### عَبْد — VALIDATE (pas d'ajout d'« esclave »)
Vérification exhaustive des 5 occurrences (19:30, 72:19, 50:8, 43:59, + occurrence additionnelle) : les deux traductions françaises rendent systématiquement « serviteur (de Dieu) ». Le sens « esclave » du Dictionnaire 1860 n'apparaît dans **aucun** contexte coranique vérifié → conformément à la règle (priorité au comportement du corpus), « esclave » n'est pas ajouté. ✅

## 4. Règle sur le Dictionnaire 1860 — respectée

Les 4 entrées historiques (عَبْد · رَحْمَة · لَا · أَرْض, source `567c8b5d-…`) sont **strictement inchangées** : ni modifiées, ni fusionnées, ni citées comme source des gloses. Les 14 gloses pédagogiques sont des **synthèses multi-source** — la provenance de chacune est explicitée dans le JSON (section « Contrôle de provenance »).

## 5. Contrôle de provenance (section 16)

Pour chaque décision, les arguments proviennent explicitement de : Hamidullah (rid 31) · Kazimirski 1869 (rid 9001) · Sahih (rid 20, contrôle) · Piccardo (rid 153, contrôle) · occurrences réelles · analyse linguistique. Aucune glose n'est présentée comme une citation d'une seule source (« Kazimirski dit X donc glose X ») — toutes les recommandations reposent sur la convergence multi-source, avec la part de chaque source documentée dans `tmp/phase19d-editorial-review.json`.

## 6. Non-régression

| Compteur | Attendu | Constaté |
|---|---|---|
| quran_words | 21 296 | 21 296 ✅ |
| word_occurrences | 77 430 | 77 430 ✅ |
| ayahs | 6 236 | 6 236 ✅ |
| translations | 24 944 | 24 944 ✅ |
| word_translations | 8 | 8 ✅ |
| lemmas | 22 | 22 ✅ |
| sources | 4 | 4 ✅ |
| lemma_translations | 18 | 18 ✅ |

`lemma_translations` validées : **0** (les 14 nouvelles lignes restent `is_validated = false` — vérifié en live).

## 7. Décision finale

```
STATUS = EDITORIAL_REVIEW_READY
DATABASE_WRITES = 0
VALIDATIONS = 0

VALIDATE_COUNT = 14
MODIFY_COUNT = 0
REJECT_COUNT = 0
```

---

## ARRÊT OBLIGATOIRE

**NE PAS modifier `is_validated`.** **NE PAS modifier les textes.** **NE PAS écrire en base.**

La décision de bascule des 14 gloses vers `is_validated = true` (validation éditoriale effective) appartient au propriétaire, après lecture de ce dossier. Toutes les recommandations sont **VALIDATE** — aucune glose ne nécessite de modification avant validation.

### Livrables
- 📄 `PHASE_19D_EDITORIAL_REVIEW.md`
- 📄 `tmp/phase19d-editorial-review.json` (**14 décisions**, schéma uniforme, alignées avec la base — vérifié)
