# PHASE 43A — AUDIT READ-ONLY — EXTENSION MASAQ AUX SOURATES READY

## A. Executive Summary

Audit **100 % read-only** terminé : l'extension de la couche linguistique MASAQ
aux 12 sourates `READY` non encore couvertes est **parfaitement réalisable** —
**alignement 100 %**, **0 anomalie bloquante**, source vérifiée (checksum SHA-256
conforme), idempotence démontrée en simulation, réversibilité documentée.

Chiffres clés :

- **Périmètre candidat (C = READY − déjà MASAQ) : 12 sourates** — 93, 94, 97,
  101, 102, 103, 104, 105, 106, 109, 110, 111.
- **316 occurrences Hikma reconstruites, 316 retrouvées dans MASAQ (100 %)**.
- Alignement : **135 EXACT · 177 EXACT_ORTHOGRAPHIC · 4 VARIANT_ORTHOGRAPHY_DOCUMENTED ·
  0 AMBIGUOUS · 0 MISSING · 0 EXTRA**.
- Segmentation : **635 segments** (moyenne 2,01/occurrence) ; **136 formes
  clitiquées** (43 %).
- Couverture linguistique : **POS 100 % · Cas/Modus 100 % · Syntaxe 91,8 %** ·
  Racines 0 / Schèmes 0 (`FUTURE_WORK`, MASAQ v2 ne les fournit pas).
- **Idempotence** : 316 clés `UNIQUE(source_id, source_record_id)` planifiées,
  0 collision avec l'existant → 2ᵉ passage = 0 insertion / 316 doublons.
- **Aucune écriture, aucune modification, aucun commit.**

**Verdict : `PHASE_43A_READY_FOR_IMPORT`** — une Phase 43B d'import contrôlé
(séparé, couche linguistique uniquement) peut être lancée après validation
explicite de ce rapport.

## B. Snapshot DB (tmp/phase43a-pre-audit-snapshot.json)

| Table | Lignes |
|---|---:|
| quran_words | 21 296 |
| word_occurrences | 77 430 |
| ayahs | 6 236 |
| translations | 24 944 |
| word_translations | 335 |
| lemma_translations | 32 |
| lemmas | 32 |
| word_lemma_mapping | 184 |
| sources | 6 |
| linguistic_occurrences | 97 |
| linguistic_segments | 170 |
| linguistic_lemmas | 0 |
| linguistic_roots | 0 |
| learning_paths | 18 |
| units | 18 |
| lessons | 111 |
| lesson_words | 742 |

## C. Sourates READY (A)

16 sourates `READY` (catalogue réel `getSurahCatalog`) :
93, 94, 97, 101, 102, 103, 104, 105, 106, 108, 109, 110, 111, 112, 113, 114.
Al-Fātiḥah (1) reste `REFERENCE` et est **protégée**.

## D. Sourates déjà couvertes MASAQ (B)

5 sourates (97 occurrences linguistiques, 170 segments) : **1, 108, 112, 113, 114**.
Ce sont des `EXISTING_MASAQ_SCOPE` — jamais réimportées.

## E. Nouveau périmètre candidat (C = A − B)

**12 sourates** : 93, 94, 97, 101, 102, 103, 104, 105, 106, 109, 110, 111.

Scope guard actif : `ALLOWED_SURAH_IDS = C` ; toute tentative hors périmètre
déclencherait `SCOPE_VIOLATION` et STOP. Vérifié : **aucun scope violation**,
Al-Fātiḥah intacte, sourates B intactes.

## F. Alignement détaillé (par surah/ayah/position)

| Sourate | Ayahs | Occ. Hikma | Formes | EXACT | ORTHO | VARIANT | AMBIGUOUS | Segments | Clitiques |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 93 Ad-Duhaa | 11 | 40 | 36 | 23 | 17 | 0 | 0 | 89 | 26 |
| 94 Ash-Sharh | 8 | 27 | 24 | 17 | 10 | 0 | 0 | 53 | 11 |
| 97 Al-Qadr | 5 | 30 | 27 | 10 | 20 | 0 | 0 | 59 | 9 |
| 101 Al-Qari'ah | 11 | 36 | 29 | 14 | 22 | 0 | 0 | 74 | 18 |
| 102 At-Takathur | 8 | 28 | 20 | 19 | 8 | 1 | 0 | 63 | 12 |
| 103 Al-'Asr | 3 | 14 | 13 | 3 | 10 | 1 | 0 | 33 | 9 |
| 104 Al-Humazah | 9 | 33 | 32 | 8 | 24 | 1 | 0 | 61 | 11 |
| 105 Al-Fil | 5 | 23 | 22 | 12 | 11 | 0 | 0 | 44 | 11 |
| 106 Quraysh | 4 | 17 | 17 | 3 | 13 | 1 | 0 | 35 | 6 |
| 109 Al-Kafirun | 6 | 26 | 19 | 9 | 17 | 0 | 0 | 47 | 9 |
| 110 An-Nasr | 3 | 19 | 18 | 9 | 10 | 0 | 0 | 37 | 9 |
| 111 Al-Masad | 5 | 23 | 22 | 8 | 15 | 0 | 0 | 40 | 5 |
| **TOTAL** | **78** | **316** | **279** | **135** | **177** | **4** | **0** | **635** | **136** |

Alignement par clé **`(surah_id, ayah_number, position)`** — jamais par chaîne
arabe seule. **316/316 retrouvées (100 %)**, 0 MISSING, 0 EXTRA.

## G. Segmentation

- **635 segments** pour 316 occurrences (moyenne **2,01**, min 1, max 8).
- **136 formes clitiquées** (43 %) : préfixes CONJ/PREP/DET + suffixes
  pronominaux, conformes au modèle `linguistic_segments`
  (Prefix/Stem/Suffix). Aucun mapping clitique→lemme créé.
- Aucun segment orphelin ni doublon détecté (cohérence 1:N occurrence→segments).

## H. POS / Morphologie / Syntaxe

| Champ MASAQ | Couverture | Notes |
|---|---|---:|
| POS (Morph_Tag par segment) | **316/316 = 100 %** | agrégé par occurrence (ex. `PREP,NOUN_ABSTRACT`) |
| Cas/Modus (Case_Mood) | **316/316 = 100 %** | ex. `INVARIABLE,GENITIVE` |
| Rôles syntaxiques (Syntactic_Role) | **290/316 = 91,8 %** | 26 occurrences sans rôle renseigné |
| Racines | **0 — FUTURE_WORK** | MASAQ v2 ne fournit pas de racine |
| Schèmes | **0 — FUTURE_WORK** | idem — aucune dérivation externe |

## I. Analyse des lemmes (audit, aucun mapping créé)

Comparaison documentaire lemme Hikma ↔ stem MASAQ sur les 316 occurrences :
- 15 occurrences ont un `lemma_id` Hikma ; **301 sans lemme Hikma** (le
  modèle Hikma ne lemmatise que 32 lemmes / 21 296 formes).
- Parmi les 15 : **12 EXACT · 3 PARTIAL** · 0 NORMALIZATION_DIFFERENCE ·
  0 LEXICAL_LEVEL_DIFFERENCE.
- **Aucune modification de `word_lemma_mapping`, aucun nouveau mapping.**

## J. Variantes orthographiques (documentées)

Les écarts Hikma (Quran.com Uthmani) ↔ MASAQ sont des variantes muṣḥaf
systématiques, jamais sémantiques. Règles de normalisation utilisées pour
l'audit (documentées dans `tmp/phase43a-masaq-audit.json` → `meta.notes`) :

1. suppression diacritiques/signes coraniques (ۖ ۚ ۟…) + espaces ;
2. expansion de la **shadda** puis réduction des suites identiques (les deux
   corpus écrivent la gémination différemment : `لِّ` vs `لل`) ;
3. **alif en poignard (ٰ)** → ا ou rien (dual : `مَوَازِينُهُ` vs `هَذَا`) ;
4. **alif maqsura (ى)** → ي (/iː/ : `فِى`/`فِي`) ou ا (/aː/ : `سَجَىٰ`/`سَجَى`) ;
5. **petit yeh ۦ → ي** (`إِۦلَـٰفِهِمْ`/`إِيلَافِهِمْ`) ; petit waw ۥ → rien ;
6. hamza : `أ إ ء ئ` → formes porteuses ou retirées (`لَتُسْـَٔلُنَّ`/
   `لَتُسْأَلُنَّ`), `آ`/`ء+ا` équivalents (`ءَامَنُوا`/`آمَنُوا`).

## K. MISSING / EXTRA / AMBIGUOUS

- **MISSING : 0** — aucune occurrence Hikma absente du fichier MASAQ.
- **EXTRA : 0** — aucune entrée MASAQ sans occurrence Hikma correspondante.
- **AMBIGUOUS : 0** — aucune divergence non documentée.
- Les **4 VARIANT_ORTHOGRAPHY_DOCUMENTED** (toutes résolues, classées B) :

| Sourate | Forme Hikma | Forme MASAQ | Nature |
|---|---|---|---|
| 102:8 | لَتُسْـَٔلُنَّ | لَتُسْأَلُنَّ | hamza signe vs lettre |
| 103:3 | ءَامَنُوا۟ | آمَنُوا | hamza+alif vs madda |
| 104:7 | ٱلْأَفْـِٔدَةِ | الْأَفْئِدَةِ | hamza signe vs ئ |
| 106:4 | وَءَامَنَهُم | وَآمَنَهُمْ | hamza+alif vs madda |

## L. Licence et provenance

- Source DB : `72d4ac84-4c73-4e02-aaa0-52d0b405eb34` — **MASAQ**, version **v2**,
  DOI **10.17632/9yvrzxktmr.2**, licence **CC BY 3.0 (page) / CC BY 4.0 (DataCite)**.
- Fichier `tmp/MASAQ.csv` : **18 650 409 octets**, SHA-256
  `777d0cc8…a900` — **MATCH avec le checksum enregistré**.
- Attribution : MASAQ — Majdi Sawalha, University of Jordan (2024), Mendeley Data.
- Chaque future ligne d'import sera reliée à `source_id` + `source_record_id`
  (ID de ligne MASAQ). Aucune autre source mélangée.

## M. Idempotence (simulation DRY-RUN, aucun write)

- Clé unique respectée : **UNIQUE(source_id, source_record_id)** — jamais
  chaîne arabe, jamais word_id seul.
- 316 clés planifiées (1 par occurrence de C) ; **0 collision** avec les 97
  occurrences existantes.
- Simulation 2ᵉ passage : **INSERTED = 0, DUPLICATES = 316** (état stable).

## N. Réversibilité

Rollback logique documenté (non exécuté) :

```
DELETE FROM linguistic_occurrences
 WHERE source_id = '72d4ac84-…' AND surah_number IN (C);
-- linguistic_segments cascadent (ON DELETE CASCADE)
```

Aucune autre table touchée : quran_words, word_occurrences, translations,
word_translations, lemma_translations, curriculum, progression, SRS, mastery.

## O. Non-régression (démontrée)

L'import MASAQ proposé n'écrit que dans `linguistic_occurrences` +
`linguistic_segments` (couche isolée, additive). Vérifié en lecture :
- `word_translations` / `lemma_translations` / `translations` : intacts ;
- `quran_words` / `word_occurrences` / `lemmas` / `word_lemma_mapping` : intacts ;
- curriculum (`learning_paths`, `units`, `lessons`, `lesson_words`) : intacts ;
- resolver FORME→LEMME→EN : intacts (MASAQ reste PASSIVE — documentaire) ;
- progression / SRS / mastery / coverage / Daily Plan / onboarding : intacts.

## P. Estimation d'import (Phase 43B)

| Sourate | Ayahs | Occurrences | Segments | Lignes `linguistic_occurrences` | Lignes `linguistic_segments` |
|---|---:|---:|---:|---:|---:|
| 93 | 11 | 40 | 89 | 40 | 89 |
| 94 | 8 | 27 | 53 | 27 | 53 |
| 97 | 5 | 30 | 59 | 30 | 59 |
| 101 | 11 | 36 | 74 | 36 | 74 |
| 102 | 8 | 28 | 63 | 28 | 63 |
| 103 | 3 | 14 | 33 | 14 | 33 |
| 104 | 9 | 33 | 61 | 33 | 61 |
| 105 | 5 | 23 | 44 | 23 | 44 |
| 106 | 4 | 17 | 35 | 17 | 35 |
| 109 | 6 | 26 | 47 | 26 | 47 |
| 110 | 3 | 19 | 37 | 19 | 37 |
| 111 | 5 | 23 | 40 | 23 | 40 |
| **TOTAL** | **78** | **316** | **635** | **316** | **635** |

- Taux d'alignement : **100 %** · POS : **100 %** · Cas/Modus : **100 %** ·
  Syntaxe : **91,8 %**.
- Doublons potentiels : **0**. Inserts planifiés : **316 + 635 segments**.

## Q. Classification des risques

| Catégorie | Nombre | Détail |
|---|---:|---|
| A — importable sans anomalie | **312** | EXACT + EXACT_ORTHOGRAPHIC |
| B — variante orthographique documentée | **4** | listées en §K |
| C — ambiguïté / revue humaine | **0** | — |
| D — blocage | **0** | — |

Aucune anomalie masquée : les 4 cas B sont individuellement documentés
(§J/K) et retracés dans le CSV d'évidence.

## R. Recommandation Phase 43B

Si le rapport est validé, **Phase 43B proposée** :

1. **Import contrôlé** des 316 occurrences + 635 segments via le mécanisme
   existant (workflow Phase 24G), source `72d4ac84…`, idempotent
   `UNIQUE(source_id, source_record_id)`, en **dry-run puis apply**.
2. **Couche strictement passive** : aucune connexion au resolver, au moteur,
   aux exercices, au grading, au SRS, au mastery, à la coverage, au Daily Plan,
   à l'onboarding, au curriculum, à l'affichage.
3. **Post-check** : 97 + 316 = 413 occurrences linguistiques, 170 + 635 = 805
   segments, 0 doublon, non-régression pédagogique, tests verts.
4. `linguistic_lemmas` / `linguistic_roots` : **restent vides** (FUTURE_WORK).

## S. Verdict final

**`PHASE_43A_READY_FOR_IMPORT`**

- 12 sourates candidates identifiées depuis la DB réelle ;
- 5 sourates MASAQ existantes correctement exclues ; Al-Fātiḥah protégée ;
- alignement 100 % par surah/ayah/position ; 0 MISSING / 0 EXTRA / 0 AMBIGUOUS ;
- 4 variantes orthographiques documentées individuellement ;
- **0 écriture, 0 modification** (DB, schéma, curriculum, moteur) ;
- provenance MASAQ vérifiée (checksum SHA-256 conforme, licence CC BY) ;
- idempotence démontrée en DRY-RUN (2ᵉ passage : 0 insert / 316 doublons) ;
- réversibilité définie ;
- tsc ✅ · eslint ✅ · **725/725** ✅ · build ✅.

Livrables : `PHASE_43A_MASAQ_READY_SURAH_EXTENSION_AUDIT.md` (ce rapport),
`tmp/phase43a-pre-audit-snapshot.json`, `tmp/phase43a-masaq-audit.json`,
`tmp/phase43a-masaq-alignment-evidence.csv` (316 lignes, traçabilité
Hikma→MASAQ→source→version→source_record_id→statut).

**STOP — aucune Phase 43B exécutée. Aucune import. Aucun commit/push.**
