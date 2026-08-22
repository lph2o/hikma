# PHASE 16A — RAPPORT ÉDITORIAL

**PROPOSAL ONLY — NOT VALIDATED — NOT IMPORTED.** Aucune écriture en base. Aucune modification de `lemmas` ni de `word_translations`. Aucune racine, aucun POS, aucune morphologie, aucun QuranMorph/Qabas.

---

## A. Baseline vérifiée (lecture seule)

| Mesure | Valeur | Attendu | Statut |
|---|---|---|---|
| lemmas | 22 | 22 | ✅ |
| validated | 8 | 8 | ✅ |
| proposed | 14 | 14 | ✅ |
| rejected | 0 | 0 | ✅ |
| quran_words.lemma_id renseigné | 135 | 135 | ✅ |
| quran_words.root renseigné | 0 | 0 | ✅ |
| word_translations | 8 | 8 | ✅ |
| sources | 2 | 2 | ✅ |

**Aucune divergence.** Les 8 gloses validées restent intactes.

## B. Sources examinées

| Source | Type | Rôle pour cette phase | Licence |
|---|---|---|---|
| **Quran.com — glosse mot-à-mot (EN)** (`quran_words.meaning`) | lexicale **EN** | unique source lexicale du projet → repère de travail | **UNKNOWN** pour les gloses mot-à-mot (la licence enregistrée couvre le texte uthmani Tanzil + les traductions, pas explicitement les gloses) |
| **Hamidullah** (`translations`) | traduction de **verset** (FR) | **contexte uniquement** — exclue comme définition lexicale (§5) | droits du traducteur (source « Quran.com API v4 ») |
| **Hikma — lexique éditorial** (`word_translations`) | éditoriale FR | les 8 gloses validées (protégées, non source de nouvelles propositions) | interne |

**→ Aucune source lexicale FR autorisée n'est disponible dans le projet.** Les propositions FR ci-dessous sont des **transpositions dérivées de la glosse EN**, marquées PROPOSAL, jamais validées.

## C. 14 fiches éditoriales

> Convention : **FACT** = mesuré en base · **SOURCE** = glosse EN (Quran.com) · **PROPOSITION** = candidate éditoriale (non validée) · **DÉCISION** = requise humainement.

### 1. يَوْم — 217 occ / 211 versets
- **lemma_id** : `aadb9c24-063c-4f8d-8c40-e527dd866a28` · **formes** : 10 (يَوْمَ 131, يَوْمِ 31, يَوْمُ 16, يَوْمٍ 16, …)
- **SOURCE (EN)** : « Day / (on the) Day / a day »
- **PROPOSITION FR** : « **jour** » · confiance HIGH
- **DÉCISION** : ✅ ACCEPTABLE POUR VALIDATION HUMAINE

### 2. عَبْد — 5 occ / 5 versets
- **lemma_id** : `77747cb5-2306-43a9-ac13-67d67f3539b9` · **formes** : 3 (عَبْدُ 2, عَبْدٍ 2, عَبْدٌ 1)
- **SOURCE (EN)** : « slave / a slave »
- **PROPOSITION FR** : « **serviteur** » · confiance MEDIUM
- **AMBIGUÏTÉ** : EN « slave » = « esclave » ; le contexte coranique (عبد الله) = « serviteur de Dieu ».
- **DÉCISION** : ⚠️ À REVOIR PAR UN SPÉCIALISTE (nuance esclave/serviteur, portée théologique)

### 3. رَسُول — 52 occ / 52 versets
- **lemma_id** : `6449da99-8a5b-4bcc-99ed-14b5169629a8` · **formes** : 13
- **SOURCE (EN)** : « Messenger / (the) Messenger »
- **PROPOSITION FR** : « **messager** » · confiance HIGH
- **DÉCISION** : ✅ ACCEPTABLE POUR VALIDATION HUMAINE

### 4. نَاس — 182 occ / 172 versets
- **lemma_id** : `d8d52703-f5f8-47a9-b6f0-33cfcc8d55f8` · **formes** : 7 (ٱلنَّاسِ 84, ٱلنَّاسَ 47, ٱلنَّاسُ 42, …)
- **SOURCE (EN)** : « the people / the mankind »
- **PROPOSITION FR** : « **les gens** » · confiance HIGH (collectif/pluriel, pas de singulier usuel)
- **DÉCISION** : ✅ ACCEPTABLE POUR VALIDATION HUMAINE

### 5. قَوْم — 79 occ / 73 versets
- **lemma_id** : `f706fd3c-df4e-4ecb-ba60-f34e2c15b1dc` · **formes** : 8
- **SOURCE (EN)** : « a people / a group / the people »
- **PROPOSITION FR** : « **peuple** » · confiance MEDIUM
- **RISQUE** : confusion pédagogique ناس / قَوْم (deux mots ≠ deux unités distinctes — à distinguer à l'écran)
- **DÉCISION** : ✅ ACCEPTABLE POUR VALIDATION HUMAINE

### 6. عَذَاب — 150 occ / 145 versets
- **lemma_id** : `04ef3735-1eb7-4506-a87e-febed2c1968e` · **formes** : 7 (عَذَابٌ 48, عَذَابَ 37, عَذَابِ 14, …)
- **SOURCE (EN)** : « punishment / the punishment »
- **PROPOSITION FR** : « **châtiment** » · confiance HIGH
- **DÉCISION** : ✅ ACCEPTABLE POUR VALIDATION HUMAINE

### 7. رَحْمَة — 34 occ / 34 versets
- **lemma_id** : `bfa97e6e-6c3c-4947-9a52-892cb9beb0c6` · **formes** : 11
- **SOURCE (EN)** : « mercy / Mercy »
- **PROPOSITION FR** : « **miséricorde** » · confiance HIGH
- **DÉCISION** : ✅ ACCEPTABLE POUR VALIDATION HUMAINE

### 8. نَبِيّ — 30 occ / 28 versets
- **lemma_id** : `aa87a728-43f3-4f2b-bc4f-8fdd62f41258` · **formes** : 4 (alif maqsura ى conservé)
- **SOURCE (EN)** : « the Prophet / [the] Prophet »
- **PROPOSITION FR** : « **prophète** » · confiance HIGH
- **DÉCISION** : ✅ ACCEPTABLE POUR VALIDATION HUMAINE

### 9. فِي — 1098 occ / 937 versets
- **lemma_id** : `e34c8427-5e9a-4505-bb7a-fe4fa2f92bc3` · **formes** : 1 (فِى)
- **SOURCE (EN)** : « In »
- **PROPOSITION FR** : « **dans** » · confiance HIGH (préposition, mot-outil)
- **DÉCISION** : ✅ ACCEPTABLE POUR VALIDATION HUMAINE

### 10. لَا — 749 occ / 689 versets
- **lemma_id** : `1c991295-1848-41ab-bf00-6d2f29137c79` · **formes** : 3 (لَا 616, لَّا 131, ۞ لَّا 2)
- **SOURCE (EN)** : « no / not / (There is) no »
- **PROPOSITION FR** : « **non / ne… pas** » · confiance HIGH (particule de négation)
- **DÉCISION** : ✅ ACCEPTABLE POUR VALIDATION HUMAINE

### 11. أَرْض — 291 occ / 278 versets
- **lemma_id** : `2ccaa3d6-a1d6-44ec-8829-728d7be639c7` · **formes** : 10 (ٱلْأَرْضِ 178, ٱلْأَرْضَ 45, ٱلْأَرْضُ 23, أَرْضُ/أَرْضِ/أَرْضٍ 4, …)
- **SOURCE (EN)** : « the earth / land »
- **PROPOSITION FR** : « **terre** » (sens principal) · confiance MEDIUM
- **AMBIGUÏTÉ** : EN « earth » vs « land » → terre / terrain (polysémie)
- **DÉCISION** : ✅ ACCEPTABLE POUR VALIDATION HUMAINE (sens principal « terre » ; secondaire « terrain » à documenter)

### 12. كِتَاب — 47 occ / 46 versets
- **lemma_id** : `7a4f0fe4-15dd-434c-aa01-7538484c5232` · **formes** : 10
- **SOURCE (EN)** : « Book / Record / prescribed »
- **PROPOSITION FR** : « **livre** » · confiance MEDIUM
- **AMBIGUÏTÉ** : EN « Book / Record / prescribed » → livre / écrit / décret / registre ; 1 forme glossée « prescribed » (registre/décret)
- **DÉCISION** : ⚠️ À REVOIR PAR UN SPÉCIALISTE (polysémie)

### 13. كَان — 323 occ / 297 versets
- **lemma_id** : `903ca0ff-d797-4b39-ad90-dfd49ef09437` · **formes** : 1 (كَانَ)
- **SOURCE (EN)** : « (there) has been »
- **PROPOSITION FR** : « **être** » (copule/verbe d'existence) · confiance LOW
- **AMBIGUÏTÉ** : mot-outil grammatical, pas de glose nominale unique.
- **DÉCISION** : ⚠️ À REVOIR PAR UN SPÉCIALISTE (formatage pédagogique d'un mot-outil)

### 14. كَفَر — 18 occ / 18 versets
- **lemma_id** : `20ad9d00-8c8a-45ea-9dfb-e6859a221c59` · **formes** : 3 (كَفَرَ 16, كَفَرَ ۚ 1, كَفَرَ ۗ 1)
- **SOURCE (EN)** : « disbelieved / denied »
- **PROPOSITION FR** : « **mécroire / renier** » · confiance MEDIUM
- **RISQUE** : sens coranique spécifique ; « mécroire » archaïque.
- **DÉCISION** : ⚠️ À REVOIR PAR UN SPÉCIALISTE

## D. Propositions de significations (récapitulatif)

| Unité | Proposition FR | Confiance |
|---|---|---|
| يَوْم | jour | HIGH |
| عَبْد | serviteur | MEDIUM |
| رَسُول | messager | HIGH |
| نَاس | les gens | HIGH |
| قَوْم | peuple | MEDIUM |
| عَذَاب | châtiment | HIGH |
| رَحْمَة | miséricorde | HIGH |
| نَبِيّ | prophète | HIGH |
| فِي | dans | HIGH |
| لَا | non / ne… pas | HIGH |
| أَرْض | terre | MEDIUM |
| كِتَاب | livre | MEDIUM |
| كَان | être (copule) | LOW |
| كَفَر | mécroire / renier | MEDIUM |

## E. Sources et provenance

- **Nom** : Quran.com — glosse mot-à-mot (anglais)
- **Type** : lexical gloss — **English (non-FR)**
- **Référence** : `quran_words.meaning` (source_id « Quran.com API v4 », table `sources`)
- **Licence** : **UNKNOWN** pour les gloses mot-à-mot (à clarifier juridiquement avant tout import VALIDATED)
- **retrieved_at** : 2026-08-14
- **Note éditoriale** : glosse EN = repère de travail ; la proposition FR est une transposition **NON validée**.

## F. Cas ambigus

- **أَرْض** (terre/terrain) — polysémie légère, sens principal retenu.
- **كِتَاب** (livre/écrit/décret/registre) — polysémie réelle + 1 forme glossée « prescribed ».
- **كَان** (copule) — pas de glose nominale unique.

## G. Cas nécessitant un spécialiste

**4** : عَبْد (esclave/serviteur), كِتَاب (polysémie), كَان (mot-outil), كَفَر (sens coranique).

## H. Sources insuffisantes

**0** fiche `SOURCE_REQUIRED` (glosse EN disponible pour les 14). **MAIS** : **14/14** manquent d'une **source lexicale FR autorisée** — la glosse EN est un repère, pas une source FR de PRIORITÉ 1. Aucune proposition ne peut être validée sur la seule base EN.

## I. Contrôles de sécurité

| Contrôle | Résultat |
|---|---|
| lemmas = 22 · validated 8 · proposed 14 · rejected 0 | ✅ |
| lemma_id = 135 · root = 0 | ✅ |
| word_translations = 8 (intactes) | ✅ |
| sources = 2 (aucune source créée) | ✅ |
| aucune écriture `lemmas` / `word_translations` | ✅ |

## J. Tests

`npm test` **172/172** · `tsc --noEmit` ✅ · `lint` ✅ (0 erreur) · `build` ✅ · `verify:persistence` **13/13** · `verify:rls` **27/27**.

## K. État final de la base

Identique à la baseline A (aucune écriture). Fichier `tmp/phase16-editorial-proposals.json` créé localement (PROPOSAL ONLY).

## L. Recommandation Phase 16B

1. **Autoriser/identifier une source lexicale FR licenciée** (PRIORITÉ 1) pour transformer les propositions EN-dérivées en définitions FR sourcées — sans cela, toute validation reposerait sur la glosse EN seule.
2. **Validation humaine** des 10 propositions « ACCEPTABLE » (une par une, action explicite : `proposed → validated`).
3. **Revue spécialisée** des 4 cas (عَبْد, كِتَاب, كَان, كَفَر).
4. **Clarifier la licence** des gloses mot-à-mot Quran.com avant tout import.
5. Aucune écriture avant décision explicite.

## M. ARRÊT

⏸️ **PHASE 16A — ARRÊT.** Aucune signification appliquée. Aucun `proposed → validated`. Aucune écriture `lemmas`/`word_translations`. Aucune racine/POS/morphologie. Aucun QuranMorph/Qabas. Aucune donnée inventée.
