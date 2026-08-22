# PHASE 23F-D — FINALISATION DES GLOSES FRANÇAISES D'AL-FATIHA

**STATUS : `PEDAGOGICAL_DATA_COMPLETE`**

Phase **strictement limitée** à la résolution du DATA GAP P0 identifié en 23F-C
(6 formes grammaticales d'Al-Fatiha sans glose FR validée). Aucune modification
du moteur pédagogique, du curriculum, des exercices, du SRS, du player, du
resolver, de `quran_words`, de `word_audio` — aucun import audio, aucune racine,
aucune phase 23G démarrée.

Garanties : `MIGRATIONS = 0` · `STORAGE_WRITES = 0` · `PRODUCTION_CODE_CHANGES = 0` ·
`RESOLVER_CHANGES = 0` · `UI_CHANGES = 0` · `AUDIO_CHANGES = 0` ·
`CURRICULUM_CHANGES = 0` · `QURAN_WORDS_MODIFIED = false`.

---

## 1. État de référence (avant)

| Compteur | Avant | Après | Δ |
|---|---|---|---|
| quran_words | 21 296 | 21 296 | 0 |
| word_occurrences | 77 430 | 77 430 | 0 |
| lemmas | 32 | 32 | 0 |
| word_audio | 21 295 | 21 295 | 0 |
| ayah_audio | 0 | 0 | 0 |
| word_translations FR validées | 19 | **25** | **+6** |
| lemma_translations FR validées | 28 | 28 | 0 |
| word_lemma_mapping (safe) | 182 | **183** | **+1** |
| **Al-Fatiha FR** | **20/26** | **26/26** | **+6** |
| Al-Fatiha audio | 26/26 | 26/26 | 0 |

---

## 2. AUDIT AVANT ÉCRITURE (lecture seule)

Les 6 formes ont été identifiées par `word_id` **EXACT** (jamais par le texte
seul), avec contrôle croisé de la forme arabe réelle en DB. Pour chacune :
`word_id`, forme arabe, translittération, glose EN (`quran_words.meaning`),
`lemma_id` (toutes `NULL`), occurrences, verset, traductions FR existantes
(aucune), mappings existants (aucun).

| # | word_id | Forme | Ayah | Translittération | Glose EN (source) | lemma_id | FR avant |
|---|---|---|---|---|---|---|---|
| 1 | `00dd8619-…cf4` | إِيَّاكَ | 1:5 | iyyāka | « You Alone » | NULL | — |
| 2 | `cf16f0a6-…b89` | وَإِيَّاكَ | 1:5 | wa-iyyāka | « and You Alone » | NULL | — |
| 3 | `c66197bd-…1e0` | ٱلَّذِينَ | 1:7 | alladhīna | « those » | NULL | — |
| 4 | `eeeec869-…388c` | عَلَيْهِمْ | 1:7 (×2) | ʿalayhim | « on them » | NULL | — |
| 5 | `4a88b653-…de7b` | غَيْرِ | 1:7 | ghayri | « not (of) » | NULL | — |
| 6 | `77ec7ccc-…55be` | وَلَا | 1:7 | walā | « and not » | NULL | — |

**Cause exacte du DATA_GAP** (identique pour les 6) : formes **grammaticales**
(particules / pronoms / préposition), classées `REVIEW_REQUIRED` en 23C/D car il
n'existait **ni** `word_translations` FR validée **ni** `lemma_id` direct **ni**
mapping `word_lemma_mapping`. Aucun fallback FR par lemme disponible → repli EN.

Aucune donnée n'a été supposée : toutes les valeurs ci-dessus sont lues en base.

---

## 3. PROPOSITIONS DE GLOSES (6/6 — toutes `SAFE` / `HIGH`)

Règle pédagogique (23F-D §4) : glose **fidèle au contexte coranique**, courte,
précise, cohérente avec les gloses validées. Formulation Hikma propre (jamais
une traduction automatique comme preuve unique). Chaque glose converge avec la
**glose EN** (Quran.com WbW, déjà dans Hikma) **et** la **traduction Hamidullah**
du verset (déjà dans Hikma), corroborées par la lexicographie arabe standard.

| # | Forme | Glose FR validée | Contexte vérifié | Confiance |
|---|---|---|---|---|
| 1 | إِيَّاكَ | **Toi seul / c'est Toi que** | إِيَّاكَ نَعْبُدُ — Hamidullah « C'est toi que nous adorons » | HIGH |
| 2 | وَإِيَّاكَ | **et Toi seul / et c'est Toi que** | وَإِيَّاكَ نَسْتَعِينُ — Hamidullah « c'est toi dont nous implorons le secours » | HIGH |
| 3 | ٱلَّذِينَ | **ceux qui / ceux que** | الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ — Hamidullah « ceux que tu as comblés… » | HIGH |
| 4 | عَلَيْهِمْ | **sur eux** | غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ — Hamidullah « ceux qui ont encouru ta colère » | HIGH |
| 5 | غَيْرِ | **autre que / non pas de** | غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ — Hamidullah « Non pas de ceux… » | HIGH |
| 6 | وَلَا | **et non / ni** | وَلَا الضَّالِّينَ — Hamidullah « ni de ceux qui s'égarent » | HIGH |

### Cas particuliers traités (23F-D §5)

- **A. غَيْرِ** — glose contextuelle : « autre que / non pas de » (sens lexical
  « autre que, excepté » + sens du verset « non pas de »). Pas de traduction hors
  contexte.
- **B. ٱلَّذِينَ** — « ceux qui » (relatif pluriel) + variante contextuelle
  « ceux que » (objet de أَنْعَمْتَ en 1:7) → pas de contresens.
- **C. عَلَيْهِمْ** — préposition عَلَى (sur) + suffixe ـهِمْ (eux) → « sur eux ».
- **D. وَلَا** — **réutilise le lemme لَا existant** (glose FR validée
  « non / ne…pas », source Hikma) via un mapping éditorial. **Aucun nouveau lemme.**
- **E. إِيَّاكَ** — cas context-sensible (23D REVIEW_REQUIRED) résolu en glose de
  **fonction** : particule d'exclusivité إِيَّا + suffixe ـكَ antéposé en objet.
  Double formulation « Toi seul / c'est Toi que » (cohérente avec le style
  éditorial « souverain / maître », « chemin / voie »).
- **F. وَإِيَّاكَ** — vérification de contexte indépendante (et non copie) : la
  glose porte la conjonction و (« et »).

---

## 4. COHÉRENCE AVEC LES GLOSES EXISTANTES

- **Doublons** : 0 (contrôle par `UNIQUE(word_id, language, source_id)` + dry-run).
- **Synonymes incohérents / faux amis** : aucun. Les 6 gloses sont des particules
  grammaticales, disjointes des 19 gloses lexicales déjà validées.
- **Homographes protégés (inchangés, tests verts)** :
  - `عَبَدَ` (adorer) ≠ `عَبْد` (serviteur) — non touché ;
  - `دِين` (rétribution/religion) ≠ `دَيْن` (dette) — non touché ;
  - `ضَالّ` (ض) ≠ `ظِلّ` (ظ) — non touché.
- **Réutilisation abusive de lemme** : aucune. Seul وَلَا est rattaché au lemme
  لَا (relation déjà identifiée en 23C/D), qui regroupe déjà les formes directes
  لَا / لَّا / ۞ لَّا.
- **Aucune donnée existante modifiée** pour la présentation (le statut `proposed`
  du lemme لَا est préexistant ; sa glose FR « non / ne…pas » est `is_validated=true`
  et suffit à la résolution — **documenté, non modifié**, hors périmètre).

---

## 5. GLOSE VS LEMME (granularité minimale)

| Forme | Canal retenu |
|---|---|
| إِيَّاكَ | **A + C** — glose de FORME, fonction contextuelle (pas de lemme forcé) |
| وَإِيَّاكَ | **A + C** — glose de FORME, fonction contextuelle (pas de lemme forcé) |
| ٱلَّذِينَ | **A** — glose de FORME (relatif pluriel) |
| عَلَيْهِمْ | **A** — glose de FORME (préposition + pronom) |
| غَيْرِ | **A + C** — glose de FORME, contextuelle |
| وَلَا | **A + B** — glose de FORME + relation héritée du lemme لَا (mapping) |

**0 nouveau lemme** (le lemme existant لَا est correct), **0 nouvelle
lemma_translation**, **1 mapping** (وَلَا → لَا, `editorial`/`safe`, surcouche
additive — `quran_words.lemma_id` jamais modifié).

---

## 6. DRY-RUN (avant écriture)

| Élément | Valeur |
|---|---|
| Nouvelles gloses de FORME | **6** |
| Nouvelles gloses de LEMME | **0** |
| Nouveaux mappings | **1** |
| Nouveaux lemmes | **0** |
| Lemmes réutilisés | **1** (لَا) |
| Doublons | 0 |
| Conflits | 0 |
| REVIEW_REQUIRED | 0 |
| Formes restantes sans glose FR | **0** (cible 26/26) |

Le dry-run (exécuté sans `APPLY`, 0 écriture) a montré `word_translations FR
validées : 19 → 19` et aucun candidat déjà présent → **plan validé, aucune
ambiguïté**.

---

## 7. APPLICATION (`APPLY=1`)

Écritures **additives, idempotentes, ciblées, réversibles** (supprimer une ligne
suffit) :

- `word_translations` : **6** lignes FR, `is_validated = true`,
  `validated_at` horodaté, source « Hikma — lexique éditorial »,
  `editorial_notes` = justification + sources ;
- `word_lemma_mapping` : **1** ligne وَلَا → لَا (`editorial`, `safe`).

`quran_words`, `word_occurrences`, `word_audio`, resolver, curriculum,
générateurs d'exercices, mastery, SRS, UI : **inchangés**.

---

## 8. IDEMPOTENCE

Deuxième exécution (`APPLY=1`) → **0 nouvelle écriture** :
6 gloses détectées déjà validées (skip), 1 mapping déjà présent (skip).
**0 doublon, 0 glose inutile, 0 lemme inutile, 0 mapping inutile,
0 modification destructive.** → `IDEMPOTENCE_OK` (pas de
`IDEMPOTENCE_REVIEW_REQUIRED`).

---

## 9. VÉRIFICATION AL-FATIHA (26 formes)

Matrice finale (`tmp/phase23f-d-al-fatiha-final-matrix.json`) :

- **FR = 26/26** (20 FORME/LEMME existantes + 6 nouvelles) ;
- **Audio = 26/26** ;
- **Lemmes/mappings cohérents** : وَلَا → لَا (mapping), صِرَاط regroupe 2 formes,
  9 lemmes directs inchangés ;
- **Homographes protégés** ;
- Chaque forme classée **`READY`** (aucune déclarée READY via un fallback EN).

---

## 10. VÉRIFICATION DU MOTEUR PÉDAGOGIQUE

Le resolver existant (inchangé) consomme les nouvelles données — chaîne vérifiée
via les fonctions réelles (`getValidatedFrenchMeanings`,
`getValidatedFrenchLemmaMeaningsByWord`, `getWordLemmaMappingsByWordIds`) :

```
FORME → word_translations (prioritaire)     → 6/6 ✓
وَلَا → word_lemma_mapping → لَا             → 1/1 ✓
Précédence FORME > LEMME DIRECT > LEMME VIA MAPPING > EN inchangée
```

Les 6 formes nouvellement complétées passent de `EN_FALLBACK` à **glose FR
validée** dans la chaîne `forme → glose FR → exercice reconnaissance → rappel FR
→ production arabe → audio → contexte → relation de lemme` (وَلَا dispose en
plus d'une relation de lemme).

---

## 11. TESTS DE NON-CONTAMINATION

- `عَبَدَ ≠ عَبْد` · `دِين ≠ دَيْن` · `ضَالّ ≠ ظِلّ` : couverts par les tests
  existants, tous verts (278/278).
- Les 6 nouvelles gloses sont des particules grammaticales rattachées par
  `word_id` EXACT — aucune forme lexicalement indépendante modifiée (contrôle
  anti-mauvaise-identification : `word_id` ↔ forme arabe attendue vérifié à
  l'écriture).

---

## 12. NON-RÉGRESSION

| Vérification | Résultat |
|---|---|
| `npm test` | **278/278** ✓ |
| `npx tsc --noEmit` | **0 erreur** ✓ |
| `npm run lint` | clean ✓ |
| `npm run build` | OK ✓ |
| `npm run verify:persistence` | **13/13** ✓ |
| `npm run verify:rls` | **38/38** ✓ |

Aucun test supprimé, aucune assertion affaiblie.

---

## 13. COMPTEURS AVANT / APRÈS

Voir tableau §1. Synthèse : `lemmas` 32→32, `lemma_translations` 28→28,
`word_translations` FR 19→25, `word_lemma_mapping` 182→183, `quran_words` 21 296
inchangé, `word_occurrences` 77 430 inchangé, `word_audio` 21 295 inchangé,
`ayah_audio` 0 inchangé. **Al-Fatiha FR : 20/26 → 26/26.**

---

## 14. LIVRABLES

- `PHASE_23F_D_AL_FATIHA_FINAL_GLOSS_REPORT.md`
- `tmp/phase23f-d-al-fatiha-gloss-evidence.json`
- `tmp/phase23f-d-al-fatiha-gloss-summary.json`
- `tmp/phase23f-d-al-fatiha-final-matrix.json`
- `tmp/phase23f-d-al-fatiha-audit.json` (audit read-only complémentaire)

---

## 15. CRITÈRES DE SUCCÈS

| Critère | État |
|---|---|
| 26/26 formes Al-Fatiha avec glose FR pédagogique validée | ✅ |
| Aucune ambiguïté non résolue | ✅ (0 REVIEW_REQUIRED) |
| Aucun homographe contaminé | ✅ |
| Aucun doublon | ✅ |
| `quran_words` inchangé | ✅ |
| resolver inchangé | ✅ |
| `word_audio` inchangé | ✅ |
| `ayah_audio = 0` | ✅ |
| moteur pédagogique inchangé | ✅ |
| tests verts | ✅ (278/278) |
| RLS vert | ✅ (38/38) |
| idempotence vérifiée | ✅ |

**STATUS FINAL : `PEDAGOGICAL_DATA_COMPLETE`**

---

## 16. ARRÊT OBLIGATOIRE

Aucune phase suivante démarrée. **Ne pas** : démarrer 23G, implémenter un SRS
avancé, modifier le curriculum, ajouter de la gamification, étendre à 114
sourates, importer Mujawwad ou ayah_audio, modifier le player, les exercices ou
le resolver. Le propriétaire examinera ce rapport avant toute nouvelle phase.
