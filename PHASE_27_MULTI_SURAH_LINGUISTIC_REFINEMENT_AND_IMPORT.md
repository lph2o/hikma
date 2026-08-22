# PHASE 27 — Raffinement linguistique multi-sourates + import contrôlé

**Décision finale : `A — MULTI_SURAH_IMPLEMENTATION_SUCCESSFUL`**

Workflow respecté : `AUDIT → FIX/REFINEMENT → READ_ONLY VALIDATION → CONTROLLED
IMPORT → POST-IMPORT VALIDATION → NON-RÉGRESSION`. Aucune décision humaine,
juridique, éditoriale ni de licence n'a été contournée : les 4 gloses FR proposées
restent **PROPOSED** (non importées, validation humaine requise).

---

## 1. État avant

- MASAQ importé pour **Al-Fātiḥah uniquement** : `linguistic_occurrences=29`,
  `linguistic_segments=56`.
- `FATIHAH_REFERENCE_LOCKED = TRUE`.
- Phase 26 (READ_ONLY) : 68/68 occurrences couvertes sur 108/112/113/114,
  0 MISSING / 0 EXTRA, mais **6 AMBIGUOUS** (variantes orthographiques bénignes
  + 1 bug latent de normalisation) et **5 emplacements sourate-forme en fallback
  EN** (en réalité 4 formes distinctes).
- Runtime `getWordLinguisticEvidence` déjà paramétré par `surahNumber` — la
  généralisation ne nécessite **aucun changement runtime**.

---

## 2. Corrections effectuées

### 2.1 Normalisation orthographique (`lib/linguistic/masaq.ts`)

| Correction | Détail |
|---|---|
| **Bug fix tatweel** | `s.replace(TATWEEL, "")` → `s.replace(/\u0640/g, "")` (ne retirait que la 1ʳᵉ occurrence). |
| **ى → ي** | alif maqṣūra (U+0649) → yā' (U+064A) — variante d'écriture finale. |
| **Marques coraniques en exposant** | suppression de `ۥ` (U+06E5, petit wāw), `ۢ` (U+06E2, iqlab), `ۣ` (U+06E3). |

**Résultat** : les 6 cas `AMBIGUOUS` de Phase 26 deviennent tous
`EXACT_ORTHOGRAPHIC` (variantes bénignes). **0 AMBIGUOUS résiduel.**

| Cas | Avant | Après |
|---|---|---|
| 114:5:1 ٱلَّذِى / الَّذِي | AMBIGUOUS | EXACT_ORTHOGRAPHIC |
| 112:4:3 لَّهُۥ / لَهُ | AMBIGUOUS | EXACT_ORTHOGRAPHIC |
| 113:4:3 ٱلنَّفَّـٰثَـٰتِ / النَّفَّاثَاتِ | AMBIGUOUS (bug) | EXACT_ORTHOGRAPHIC |
| 113:4:4 فِى / فِي | AMBIGUOUS | EXACT_ORTHOGRAPHIC |
| 114:5:3 فِى / فِي | AMBIGUOUS | EXACT_ORTHOGRAPHIC |
| 112:4:5 أَحَدٌۢ / أَحَدٌ | AMBIGUOUS | EXACT_ORTHOGRAPHIC |

**Conservatisme vérifié** : la normalisation ne fusionne jamais deux mots
réellement différents (tests anti-collision : شَرِّ ≠ غَيْرِ, نَاسِ ≠ نَعْبُدُ,
قُلْ ≠ قِيلَ).

### 2.2 Classification des segments (`classifySegment`)

- `CV_PREF` (préfixe d'impératif) → `PARTICLE`.
- `POSS_PRON` / `SUBJ_PRON` → `PRONOMINAL_SUFFIX`.
- `CASE_INDEF_*` → `INFLECTIONAL_SUFFIX` (extension `CASE_DEF` → `CASE_`).

### 2.3 Filtrage des segments vides (`masaq-plan.ts`)

Les marqueurs i3rab vides MASAQ (`Morph_Type="Other_i3rab"`, `Morph_Tag="None"`)
sont **exclus à l'import** :
- ils violent le CHECK `morph_type IN ('Prefix','Stem','Suffix')` ;
- ce sont des artefacts sans forme réelle (`AVAILABLE ≠ INFERABLE`) ;
- ils sont aussi **exclus des agrégats POS/cas/syntaxe** (sinon ils pollueraient
  le cas réel — ex. لِرَبِّكَ recevait un `NOMINATIVE` parasite depuis un `None`).

Résultat : 2 artefacts retirés sur 108:2:2 → segments 23 → **21** pour la sourate
108 (total 116 → **114** segments).

Au niveau **affichage** (`explanation.ts`), `isDisplayableSegment` exclut
`(null)` / `None` / `null` / `""` / `Other_i3rab`.

---

## 3. Nouveaux mappings pédagogiques (`lib/linguistic/explanation.ts`)

### 3.1 Mode vs cas
- `JUSSIVE` → **« au jussif (mode verbal, après لَمْ) »** — explicitement un
  MODE, jamais présenté comme un cas.

### 3.2 Rôles syntaxiques (rôles copulatifs + prédicat + explétif)
- `PRED`, `PART_COP_PRED`, `V_COP_PRED` → **« prédicat »**.
- `SUBJ_COP_PART`, `SUBJ_COP_V` → **« sujet »**.
- `EXPLET` → **« pronom de renforcement »**.
- `ADV_TIME` → **« complément de temps »**.
- Rôles de particules/verbes filtrés (jamais affichés comme « rôle du mot ») :
  `ANNUL_PART`, `PART_JUSSIVE`, `IV_COP`, `IV_PASS`, `PV_PASS`.

### 3.3 Catégories grammaticales du noyau
`NOUN_NUM` (« un nom (numéral) »), `ADJ_COMP` (« un adjectif (comparatif) »),
`ADJ_INTENS` (« un adjectif (intensif) »), `IV_PASS` / `PV_PASS` (« un verbe
passif … »), `ADV` (« un adverbe »).

### 3.4 Libellés de décomposition
`POSS_PRON` (« suffixe possessif »), `SUBJ_PRON` (« suffixe sujet »),
`OBJ_PRON` (« suffixe complément »), `NSUFF_FEM_PL` (« marque du féminin
pluriel »), `NSUFF_FEM_SG` (« marque du féminin singulier »),
`CASE_INDEF_(ACC_GEN)` (« désinence indéfinie (accusatif/génitif) »),
`CV_PREF` (« préfixe de l'impératif »), `JUSSIVE_PART` (« particule du jussif
(لَمْ) »), `ANNUL_PART`/`INF_ANNUL_PART` (« particule d'insistance (إنّ) »).

**Chaque mapping est déterministe et testé** ; aucun tag MASAQ brut n'est exposé.

---

## 4. Audit des formes sans glose FR (éditorial — PROPOSED)

Phase 26 comptait « 5 formes » ; il s'agit en réalité de **4 formes distinctes**
(فِى est compté deux fois car présent en 113 **et** 114 avec le même `word_id`
global). Toutes les propositions restent **PROPOSED** (validation humaine
obligatoire, aucune insertion).

| Forme | Sourates | Glose EN | Proposition FR | Justification |
|---|---|---|---|---|
| ٱللَّهُ | 112 | Allah | **Allah** | Nom divin ; ٱللَّهِ (génitif) déjà validé « Allah ». |
| فِى | 113, 114 | In | **dans** | Préposition ; « dans les nœuds » / « dans les poitrines ». |
| ٱلنَّاسِ | 114 | the people | **les gens** | ال + ناس ; Hamidullah « les hommes ». |
| وَٱلنَّاسِ | 114 | and the mankind | **et les gens** | و + ال + ناس, compositionnel. |

> Les traductions d'ayah sont utilisées comme **évidence contextuelle** (jamais
> copiées telles quelles) ; le point de départ est le mot arabe lui-même et ses
> occurrences. `tmp/phase27-gloss-proposals.json` conserve la trace.

---

## 5. Alignement des 68 occurrences

| Sourate | Alignées | EXACT | ORTHO | VARIANT | AMBIGUOUS | MISSING | EXTRA | Segments |
|---|---|---|---|---|---|---|---|---|
| 108 | 10/10 | 5 | 5 | 0 | **0** | 0 | 0 | 21 |
| 112 | 15/15 | 10 | 5 | 0 | **0** | 0 | 0 | 25 |
| 113 | 23/23 | 19 | 4 | 0 | **0** | 0 | 0 | 33 |
| 114 | 20/20 | 10 | 10 | 0 | **0** | 0 | 0 | 35 |
| **Total** | **68/68** | 44 | 24 | 0 | **0** | **0** | **0** | **114** |

Alignement exclusivement par `(surah, ayah, position)` — jamais la chaîne arabe.
Garde-fou `assertPlanScope` : refuse MISSING/EXTRA/AMBIGUOUS (`IMPORT_BLOCKED`).

---

## 6. Import contrôlé (idempotent, provenance)

Script : `scripts/import-masaq-multi-surah.ts` (DRY-RUN par défaut, `APPLY=1`
pour écrire, `SURAH=` pour un sous-ensemble).

- **Checksum** vérifié `777d0cc8…a900` · **source** MASAQ v2 (réutilisée,
  `sources` type=linguistic) · DOI `10.17632/9yvrzxktmr.2` · licence CC BY.
- **RUN 1** : 68 occurrences + 114 segments insérés, 0 erreur.
- **RUN 2** (idempotence) : `INSERTED=0, DUPLICATES=68, ERRORS=0`
  (10+15+23+20 doublons, 0 erreur).

| Table | Avant | Après |
|---|---|---|
| linguistic_occurrences | 29 | **97** |
| linguistic_segments | 56 | **170** |
| linguistic_lemmas | 0 | 0 (MASAQ ne fournit pas de lemme) |
| linguistic_roots | 0 | 0 (`FUTURE_WORK`) |

Provenance conservée : `Hikma occurrence → MASAQ record (source_record_id) →
version v2 → DOI → checksum → licence → attribution`.

---

## 7. Runtime

**Aucun changement runtime nécessaire.** `getWordLinguisticEvidence` est déjà
paramétré par `surahNumber` et la page leçon le transmet ; les 4 sourates
bénéficient automatiquement de l'explication MASAQ après import. Grading, SRS,
mastery, progression, curriculum : **inchangés**. Aucun statut `PARTIAL` créé.

---

## 8. Tests

- **539 tests / 42 fichiers** (baseline 24J = 525/42) : **+14 tests**.
- Nouveaux tests : normalisation multi-tatweel / ى↔ي / marques exposant /
  anti-collision ; les 6 AMBIGUOUS → variantes bénignes ; nouveaux tags (jussif=
  mode, prédicat/copule/explétif, numéral/comparatif/intensif/passif/adverbe,
  suffixes possessif/sujet/féminin/désinence indéfinie) ; filtrage des segments
  vides (`isDisplayableSegment` + import `Other_i3rab`).
- `npx tsc --noEmit` **0 erreur** · `npm run lint` **PASS** · `npm run build`
  **PASS**.

---

## 9. Validation navigateur (headless Chrome 151)

**8 leçons testées** sur les 4 sourates (2/sourate), mobile 390×844 + desktop
1280×720.

Exemples réels observés :
- **ٱلنَّفَّـٰثَـٰتِ** (113:4) → Décomposition « ال (article défini) + نفاث
  (adjectif intensif) + ات (marque du féminin pluriel) » + Identification
  « C'est un adjectif (intensif) ».
- **ٱلْأَبْتَرُ** (108) → « ال (article) + أبتر (adjectif comparatif) » +
  « C'est un adjectif (comparatif) ».
- **قُلْ** (112/113/114) → « C'est un verbe à l'impératif » + « invariable ».
- **كُفُوًا** (112) → « كفو (noyau) + ا (désinence indéfinie) ».
- **أَحَدٌ** (112) → « C'est un nom (numéral) » + « au nominatif ».

Vérifications :
- **Aucun tag MASAQ brut** affiché (`NOUN_*`, `GENITIVE`, `Morph_Tag`,
  `Other_i3rab`, etc.) → `anyRawTagLeak = false`.
- **Console** : 0 erreur · **Overflow** : 0 (mobile + desktop) · **RTL** :
  `dir="rtl"` présent.
- **Anti-répétition** : profils variés (décomposition+identité,
  identité+forme, forme seule).

**Limite documentée** : le bloc « Fonction » (syntaxe) n'apparaît pas dans le
parcours navigateur — par design, la syntaxe est la priorité la plus basse et le
plafond de 2 blocs la masque quand identité/morphologie sont disponibles. Les
mappings syntaxiques (prédicat, copule, explétif, complément de temps) sont
couverts par tests unitaires et disponibles dans les données (`syntax=[SUBJ_COP_V]`,
`[V_COP_PRED]`, etc.).

---

## 10. Non-régression

| Compteur | Valeur (avant = après) |
|---|---|
| quran_words | 21 296 ✓ |
| word_occurrences | 77 430 ✓ |
| ayahs | 6 236 ✓ |
| translations | 24 944 ✓ |
| lemmas | 32 ✓ |
| word_translations | 70 ✓ |
| lemma_translations | 32 ✓ |
| word_lemma_mapping | 184 ✓ |

Al-Fātiḥah : **8 leçons · 26 formes · 29 occurrences · 26 audios · 25 gloses FR**
— strictement identiques avant/après (`fatihah_unchanged = true`).

`translation_source_leak = false` · `raw_MASAQ_tags_visible = false`.

---

## 11. Limites restantes

1. **4 formes en fallback EN** (ٱللَّهُ, فِى, ٱلنَّاسِ, وَٱلنَّاسِ) — gloses FR
   **PROPOSED**, en attente de validation humaine (aucune insertion).
2. **Bloc syntaxe** rare en pratique (priorité basse + plafond 2 blocs) —
   comportement voulu (« syntaxe avec parcimonie »), mappings couverts par tests.
3. **JUSSIVE** correctement mappé mais souvent masqué par le couple
   décomposition+identité sur les verbes (يَلِدْ → ي + لد). Amélioration UX
   éventuelle (priorité), hors périmètre de cette phase.
4. **Couverture lemme** hors Fātiḥah toujours clairsemée → bloc « famille »
   rare (absence honnête).
5. **Racine / schème** : `ABSENT_DATA` (FUTURE_WORK) — `linguistic_roots` vide.

---

## 12. Recommandations Phase 28

1. **Valider humainement les 4 gloses FR PROPOSED** puis les importer via le
   workflow éditorial (`word_translations`, `is_validated`).
2. **Étendre la validation navigateur** aux autres sourates déjà présentes
   (93–114) une fois MASAQ importé (à décider séparément).
3. **Évaluer une priorité morphologie > décomposition** pour les verbes au
   jussif (amélioration pédagogique, hors grading).
4. **Préparer une source de racines/schèmes** (domaine public) pour enrichir
   `linguistic_roots` — jamais déduits.

---

## PROMPT PHASE SUIVANTE

```
PHASE 28 — VALIDATION ÉDITORIALE DES GLOSES FR + CONSOLIDATION MULTI-SOURATES

CONTEXTE
Phase 27 terminée : MASAQ importé pour 108/112/113/114 (68/68, 0 MISSING/EXTRA/
AMBIGUOUS, idempotent), normalisation corrigée, nouveaux mappings pédagogiques en
place, 539 tests PASS, tsc/lint/build PASS, validation navigateur PASS, Fātiḥah
strictement inchangée (FATIHAH_REFERENCE_LOCKED = TRUE).

4 gloses FR restent PROPOSED (validation humaine obligatoire) :
  - ٱللَّهُ → « Allah » (112)
  - فِى → « dans » (113, 114)
  - ٱلنَّاسِ → « les gens » (114)
  - وَٱلنَّاسِ → « et les gens » (114)

OBJECTIF
1. AUDIT READ_ONLY : relire tmp/phase27-gloss-proposals.json et vérifier chaque
   proposition contre le mot arabe, ses occurrences et les 4 traductions d'ayah
   (évidence contextuelle uniquement). Ne rien importer automatiquement.
2. VALIDATION HUMAINE : produire un dossier de revue (mot, occurrences, glose EN,
   proposition FR, traductions d'ayah comparées, décision proposée). Marquer
   chaque proposition ACCEPTED ou REJECTED. Si une décision humaine est requise :
   STOP et produire HUMAN_APPROVAL_REQUIRED — ne jamais contourner.
3. IMPORT ÉDITORIAL (UNIQUEMENT les ACCEPTED) : insérer dans word_translations
   (language='fr', is_validated=true, source_id = Hikma éditorial) en respectant
   l'invariant de validation (is_validated=true ⇔ validated_at non nul) et
   l'unicité (word_id, language, source_id). Idempotent.
4. VÉRIFIER la résolution FORME → LEMME → EN fallback : les 4 formes ne doivent
   plus tomber en fallback EN. Aucune autre glose modifiée.
5. TESTS : npm test, npx tsc --noEmit, npm run lint, npm run build (tous PASS).
6. VALIDATION NAVIGATEUR : vérifier que ٱللَّهُ / فِى / ٱلنَّاسِ / وَٱلنَّاسِ
   affichent leur glose FR (plus d'anglais), 390×844 et 1280×720, RTL, console 0
   erreur, 0 overflow, aucun tag MASAQ brut.
7. NON-RÉGRESSION : quran_words=21296, word_occurrences=77430, ayahs=6236,
   translations=24944, lemmas=32, word_translations=70 (+4), lemma_translations=32,
   word_lemma_mapping=184 ; Fātiḥah 8/26/29/26 inchangée ; linguistic 97/170 inchangée.

CONTRAINTES ABSOLUES
- Ne pas importer d'autres sourates.
- Ne pas ajouter racines/schèmes (ABSENT_DATA).
- Ne pas modifier grading/SRS/mastery/progression/curriculum.
- AVAILABLE ≠ INFERABLE ≠ VALIDATED : MASAQ reste une source linguistique, les
  gloses FR restent exclusivement éditoriales et validées humainement.
- Les traductions d'ayah restent du CONTEXTE, jamais une glose copiée.

DÉCISION FINALE ATTENDUE
A — EDITORIAL_GLOSSES_IMPORTED_SUCCESSFUL
B — PARTIAL_APPROVAL_REQUIRED
C — HUMAN_APPROVAL_REQUIRED
D — REGRESSION_DETECTED

LIVRABLES
PHASE_28_EDITORIAL_GLOSS_VALIDATION.md
tmp/phase28-editorial-gloss-validation.json

Arrêter la phase après la décision. Toujours terminer par le prompt de la phase
suivante.
```

---

**Résumé des vérifications** : normalisation corrigée (0 AMBIGUOUS) · mappings
pédagogiques étendus (mode jussif, copule/prédicat, possessif, numéral,
comparatif/intensif, passif, adverbe, suffixes féminins) · segments vides filtrés
· 68/68 importées idempotent · 539 tests / tsc / lint / build PASS · navigateur
sans tag brut ni overflow ni erreur console · Fātiḥah et corpus strictement
inchangés · 4 gloses FR PROPOSED (validation humaine requise).

**Non-régressions** : tous les compteurs corpus, la couche Fātiḥah (8/26/29/26/25)
et `FATIHAH_REFERENCE_LOCKED = TRUE` préservés.

**Prochaines étapes** : validation éditoriale des 4 gloses FR, puis consolidation
multi-sourates (prompt ci-dessus).
