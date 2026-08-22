# PHASE 61 — AUDIT + PRÉPARATION MASAQ & EXPLICATIONS (91 / 87 / 96)

**Statut :** READ-ONLY strict — aucune écriture DB, aucun commit.
**Périmètre :** préparer la couverture pédagogique des sourates 91 (Ash-Shams),
87 (Al-Aʿlā), 96 (Al-ʿAlaq) — suite du verdict `PHASE_60_MASAQ_EXPLANATIONS_GAPS_FOUND`.

---

## A. Baseline vérifiée (DB réelle, re-calculée — jamais supposée)

| Compteur | Valeur DB | Attendu historique | Conformité |
|---|---:|---:|---|
| quran_words | 21 296 | 21 296 | ✅ |
| word_occurrences | 77 430 | 77 430 | ✅ |
| ayahs | 6 236 | — | ✅ |
| translations | 24 944 | 24 944 | ✅ |
| word_translations FR validées | **538** | 538 | ✅ |
| lemmas / word_lemma_mapping | 32 / 184 | 32 / 184 | ✅ |
| linguistic_occurrences | **413** | 413 | ✅ |
| linguistic_segments | **796** | 796 | ✅ |
| word_explanations validées | **13** | 13 | ✅ |
| word_explanation_contexts validés | **1** | 1 | ✅ |
| learning_paths / units | 24 / 24 | 24 / 24 | ✅ |
| lessons / lesson_words | **191 / 1 307** | (Phase 60 : 172/1 176 + Phase 59 : +19/+131) | ✅ cohérent |
| sources | 6 (dont MASAQ v2) | 6 | ✅ |
| catalogue | 1 REFERENCE + 23 READY (96 READY) | idem Phase 59 | ✅ |

Aucune divergence bloquante : la baseline Phase 61 est **exactement conforme** à la
chaîne documentée des Phases 55 → 59.

---

## B. Modèle réel MASAQ (établi en Phase 60, re-confirmé)

- **Table :** `linguistic_occurrences` (1:1 par occurrence, alignement `(surah, ayah, position)`)
  + `linguistic_segments` (1:N, `Prefix`/`Stem`/`Suffix`).
- **Consommation runtime :** `getWordLinguisticEvidence` (`lib/learning/queries.ts` l.1057) —
  filtre `linguistic_occurrences` **par `surah_number`**, joint `word_occurrences!inner(word_id)`,
  retient la 1ʳᵉ occurrence par mot, joint les segments.
- **Normalisation :** `buildLinguisticExplanation` (`lib/linguistic/explanation.ts`) —
  `AVAILABLE ≠ INFERABLE` : donnée absente/ambiguë → bloc OMIS, jamais inventé.
- **Périmètre MASAQ en base :** `{1, 93, 94, 97, 101, 102, 103, 104, 105, 106, 108, 109, 110, 111, 112, 113, 114}`
  = **17 sourates / 413 occurrences / 796 segments**. 91, 87, 96 **absents**.

## C. Modèle réel EXPLANATIONS

- **Tables :** `word_explanations` (par **forme**/word_id, FR, `is_validated=true`) +
  `word_explanation_contexts` (override par ayah, `is_validated=true`).
- **Consommation runtime :** `getValidatedWordExplanations` + `getValidatedWordExplanationContexts`
  (l.1233/1273) — batch par word_id, couche STRICTEMENT passive (affichage « après l'effort »).
- **État en base :** 13 explications validées + 1 contexte (sourate 101, `word_id dc46833f`).

---

## D. Audit MASAQ — 91 / 87 / 96 (occurrence par occurrence)

| Sourate | Ayahs | Occurrences | Formes | MASAQ runtime | CSV alignable | Ayahs couverts | Couverture ayah |
|---:|---:|---:|---:|---:|---:|---:|---:|
| **91** Ash-Shams | 15 | 54 | 48 | **0** | **54/54** | 15/15 | **0 % runtime — 100 % source** |
| **87** Al-Aʿlā | 19 | 72 | 69 | **0** | **72/72** | 19/19 | **0 % runtime — 100 % source** |
| **96** Al-ʿAlaq | 19 | 72 | 59 | **0** | **72/72** | 19/19 | **0 % runtime — 100 % source** |

**Lecture :** le runtime ne voit **aucune** occurrence MASAQ pour ces sourates
(`linguistic_occurrences` ne contient aucune ligne `surah_number ∈ {91, 87, 96}`),
mais le **fichier source** `tmp/MASAQ.csv` contient **toutes** les occurrences
attendues (alignement 100 % par `(surah, ayah, position)` — le même critère que
les imports Phase 27 / 43B). La couverture MASAQ runtime est donc 0 %, mais la
**source est intégralement disponible** pour un import futur.

## E. Provenance MASAQ (source / licence)

| Attribut | Valeur |
|---|---|
| Source | **MASAQ v2** — Majdi Sawalha, University of Jordan (2024), Mendeley Data |
| DOI | `10.17632/9yvrzxktmr.2` |
| Licence | **CC BY 3.0 (page) / CC BY 4.0 (DataCite)** |
| Fichier | `tmp/MASAQ.csv` (18 650 409 octets) |
| Checksum SHA-256 | `777d0cc8…a900` — **✅ MATCH** (vérifié à nouveau en Phase 61) |
| Source DB | `72d4ac84-4c73-4e02-aaa0-52d0b405eb34` (ligne `sources`, métadonnées complètes) |
| Imports historiques | Phase 24G (sura 1) · Phase 27 (108, 112–114) · Phase 43B (93, 94, 97, 101–106, 109–111) |
| Import 91/87/96 | **Jamais exécuté** — non bloqué par la licence, non bloqué par la source |
| Mécanisme d'import | `scripts/import-masaq-multi-surah.ts` (idempotent, `UNIQUE(source_id, source_record_id)`, scope guard, dry-run/apply) |

**Conclusion provenance :** la licence est **établie** (CC BY, attribution MASAQ,
checksum vérifié) et le mécanisme d'import existe déjà et a été exécuté 3 fois
(24G/27/43B). **Aucun obstacle légal identifié** — uniquement un choix de périmètre.

## F. Word_ids partagés

- **176 entrées partagées** auditées (formes de 91/87/96 présentes dans ≥ 1 autre sourate).
- **37 formes** (word_ids) disposent déjà d'une occurrence MASAQ **ailleurs**
  (dans les 17 sourates MASAQ existantes) — ex. `إِذَا` (93, 110, 113), `رَبِّكَ` (93, 94, 110),
  `مَا` (93, 97, 101, 104, 109, 113), `ٱللَّهِ` (1, 104, 110), `لَفِى` (103).
- **⚠️ Distinction conservée (Phase 61 §4) :** un MASAQ présent pour un word_id dans une
  autre sourate **ne rend PAS** la couverture des nouvelles sourates complète :
  `getWordLinguisticEvidence` filtre par `surah_number`, donc l'occurrence de 91:1
  reste sans MASAQ tant que la sourate 91 n'est pas importée. **Alignement occurrence par
  occurrence** (c'est ce que fait le tableau D) — 0 occurrence de 91/87/96 a de MASAQ runtime.
- Impact futur positif : 37 word_ids seront « déjà connus » de la couche documentaire
  après import (convergence des données), mais l'import reste requis pour la sourate elle-même.

## G. Audit des explications

| Sourate | Formes | Explications visibles (word_id partagés) | Spécifiques à la sourate | Manquantes |
|---:|---:|---:|---:|---:|
| 91 | 48 | 1 (`مَن` — explication générique écrite pour 101) | **0** | 47 |
| 87 | 69 | 1 (`مَن` — idem) | **0** | 68 |
| 96 | 59 | **0** | **0** | 59 |

- **Explication unique visible :** `مَن` (word_id `b3b75627`, « Celui qui, quiconque :
  pronom relatif indéfini… ») — explication **GÉNÉRIQUE de forme**, sans contexte propre,
  écrite pour la sourate 101. Elle s'affiche sur 91/87 **par effet de word_id partagé**
  (apparaît dans 59 sourates), **pas** parce qu'elle est éditoriale pour ces sourates.
- **Aucune explication spécifique** n'existe pour une forme propre de 91/87/96.
- `word_explanation_contexts` : 1 seule ligne validée (101:9, « Expression idiomatique :
  “sa mère” désigne ici l… ») — n'affecte ni 91, ni 87, ni 96.

## H. Dossier éditorial — priorisation des explications (préparation)

Règles appliquées : formes grammaticales → `LOW` (pas d'explication détaillée) ;
mots lexicaux avec MASAQ disponible ailleurs → `MEDIUM` ; mots lexicaux centraux → `HIGH` ;
explication existante → `NO_EXPLANATION_NEEDED`.

| Sourate | HIGH | MEDIUM | LOW | NO_EXPLANATION_NEEDED | Total formes |
|---:|---:|---:|---:|---:|---:|
| 91 | 37 | 4 | 6 | 1 | 48 |
| 87 | 47 | 15 | 6 | 1 | 69 |
| 96 | 40 | 10 | 9 | 0 | 59 |

Exemples HIGH : `سَبِّحِ`, `زَكَّىٰهَا`, `دَسَّىٰهَا`, `فَدَمْدَمَ` (91) ;
`سَنُقْرِئُكَ`, `فَذَكِّرْ`, `يَصْلَى`, `ٱلْأَشْقَى` (87) ; `ٱقْرَأْ`, `عَلَّمَ`,
`لَنَسْفَعًۢا`, `ٱلزَّبَانِيَةَ` (96).
Exemples LOW (grammaticaux) : `قَدْ`, `إِذِ`, `لَهُمْ`, `بَلْ`, `أَن`, `مِنْ`, `إِلَىٰ`.

**Aucune explication n'a été rédigée** — ce dossier (`tmp/phase61-editorial-priority.json`)
sert uniquement de feuille de route pour une phase d'écriture ultérieure.

## I. Audit UI / runtime (4 états, lecture de code — aucun changement)

| État | Comportement | Erreur | Texte inventé |
|---|---|---|---|
| A — MASAQ + explication présents | blocs linguistique + sens affichés | non | non |
| B — MASAQ présent, explication absente | bloc linguistique seul | non | non |
| C — MASAQ absent, explication présente | `buildLinguisticExplanation(null)` → null → bloc linguistique omis ; explication seule | non | non |
| D — MASAQ absent, explication absente | `pedagogicalExplanation` retourne null → bloc omis (`ABSENT_DATA` valide) | non | non |

Verdict runtime : **aucun état ne provoque d'erreur, de fallback incorrect, de texte
inventé, de bloc cassant l'UI ni d'exception serveur** (`components/learn/exercises/
pedagogical-feedback.ts` l.59-61/100 ; `components/ui/hikma-explanation.tsx` l.118).
L'absence de MASAQ/explications est un état silencieux et sûr.

## J. Impact produit (séparé par sourate)

| Sourate | Vocabulaire (FR) | Curriculum | MASAQ | Explications | Runtime |
|---|---|---:|---:|---:|---|
| 91 | 48/48 READY | 15 leçons seedées | **0 %** | **0 spécifique** | sûr, bloc « comprendre » absent |
| 87 | 69/69 READY | 19 leçons seedées | **0 %** | **0 spécifique** | sûr, bloc absent |
| 96 | 59/59 READY | 19 leçons seedées | **0 %** | **0 spécifique** | sûr, bloc absent |

**Distinction formelle (Phase 61 §10) :** `READY` lexical (gloses FR + curriculum) ≠
`READY` pédagogique complet (MASAQ + explications). Les trois sourates sont READY
lexicalement mais **ne disposent pas** de la couche de compréhension des sourates
équipées (1, 93, 94, 97, 101–106, 108–114 — toutes à 100 % de couverture MASAQ).

## K. Décisions pour la suite

**MASAQ : `IMPORT_READY`**
- Source disponible à 100 % (alignement 54/54, 72/72, 72/72) ;
- Licence CC BY établie + attribution + checksum vérifié ;
- Mécanisme existant réutilisable tel quel (`scripts/import-masaq-multi-surah.ts`) ;
- Aucun obstacle légal ni technique. L'import reste à **décider et exécuter dans une
  phase dédiée** (jamais ici).

**EXPLANATIONS : `EDITORIAL_PREPARATION_READY`**
- Le dossier de priorisation (H/M/L) est prêt (124 formes HIGH + 29 MEDIUM à traiter) ;
- Aucune explication n'a été rédigée ni écrite ;
- La rédaction suivra le workflow Hikma (glose validée → contexte coranique réel →
  MASAQ si disponible → explication pédagogique → validation), idéalement **après**
  l'import MASAQ (conformément à l'ordre du workflow).

## L. Tests de non-régression

- `npx tsc --noEmit` → **0 erreur** ✅
- `npx eslint .` → **0 erreur** ✅
- `npx vitest run` → **743/743** ✅ (identique à la baseline Phase 59/60)
- `npm run build` → **OK** ✅
- **DB identique avant/après** (vérifié compteur par compteur, `tmp/phase61-verification.json`) ✅

## M. Risques / limites

1. L'import MASAQ 91/87/96 ajouterait 198 occurrences + ~400 segments
   (54+72+72 occurrences) — opération additive isolée, réversible (`DELETE` par
   `source_id` + `surah_number`, comme documenté en 43A §N). **Non exécutée.**
2. Les 37 word_ids partagés avec MASAQ ailleurs ne dispensent pas de l'import
   (alignement par occurrence — §F).
3. L'explication générique `مَن` s'affiche sur 91/87 sans être spécifique :
   comportement correct du modèle (explication par forme), à documenter dans
   l'UI si besoin — **aucun changement de code proposé**.
4. Aucune divergence baseline ; aucun fichier de production modifié.

## N. Ce qui NE DOIT PAS être fait (rappel)

❌ Aucune insertion/import MASAQ · ❌ aucune rédaction d'explication ·
❌ aucun seed · ❌ aucune migration · ❌ aucun changement de moteur/resolver/SRS/
mastery/Daily Plan/coach/onboarding · ❌ aucun commit/push.

## O. Verdict final

**`PHASE_61_MASAQ_EXPLANATIONS_PREPARATION_COMPLETE`**

- Baseline DB vérifiée et conforme (538 FR, 24 parcours, 413/796 MASAQ, 13 explications) ;
- 91/87/96 analysées **occurrence par occurrence** : MASAQ runtime **0 %**, source **100 % alignable** ;
- Provenance MASAQ identifiée et licence **vérifiée** (CC BY, checksum MATCH) ;
- 37 word_ids partagés analysés (MASAQ ailleurs ≠ couverture locale) ;
- 0 explication spécifique existante ; dossier éditorial de priorisation prêt (H/M/L) ;
- Runtime UI vérifié sur les 4 états — aucun risque ;
- **Aucune écriture DB, aucun fichier de production modifié** ;
- tsc ✅ · eslint ✅ · vitest 743/743 ✅ · build ✅ · DB identique avant/après ✅.

**Décisions :** MASAQ → **`IMPORT_READY`** · EXPLANATIONS → **`EDITORIAL_PREPARATION_READY`**.

**STOP — aucune phase suivante lancée automatiquement. Aucun commit, aucun push.**
