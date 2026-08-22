# PHASE 55 — DÉBLOCAGE ÉDITORIAL CANONIQUE D'ASH-SHAMS (91)

**Verdict : `PHASE_55_ASH_SHAMS_READY`**

> Workflow : READ-ONLY → AUDIT → PROPOSITION → VALIDATION → ÉCRITURE CONTRÔLÉE.
> Le workflow éditorial lexical canonique d'Al-Fātiḥah (Phases 40C/41B/42B) a
> été reproduit **à l'identique** : aucune nouvelle méthode, aucune traduction
> d'ayah copiée comme glose, aucune auto-validation, aucune écriture hors
> périmètre. Aucun commit, aucun push.

---

## A. Audit initial réel (revalidé en Phase 55, DB réelle)

| Élément | Phase 54 | Phase 55 (revalidation) | Statut |
|---|---:|---:|---|
| Ayahs importés | 15 | 15 | ✅ identique |
| Occurrences | 54 | 54 | ✅ identique |
| Formes distinctes | 48 | 48 | ✅ identique |
| Formes déjà FR (glose/lemme) | 9 | 9 (7 glose FORME + 1 lemme direct + 1 mapping) | ✅ identique |
| Formes EN-only / manquantes | 39 | 39 | ✅ identique |
| Formes non résolues | 0 | 0 | ✅ identique |
| Parcours existant | aucun | aucun (avant Phase 55) | ✅ identique |
| Formes manquantes dans le catalogue | 0 | 0 | ✅ identique |
| 4 références sur les ayahs des 39 formes | 39/39 | 39/39 | ✅ identique |

Chemin de résolution utilisé : **FORME → LEMME direct → LEMME via
`word_lemma_mapping` → fallback EN** (jamais `quran_words.lemma_id` seul),
vérifié forme par forme contre `resolveWordMeanings` — 0 incohérence. Toute
divergence vs Phase 54 aurait **STOP** avant écriture.

## B. Nombre exact de formes — 48

## C. Nombre exact de formes déjà FR — 9
(7 gloses FORME + 1 lemme direct + 1 lemme via mapping — comptées via le chemin
réel, mapping inclus.)

## D. Nombre exact de formes manquantes — 39

## E. Liste des formes manquantes (39)

| Ayah | Formes |
|---|---|
| 91:1 | وَٱلشَّمْسِ · وَضُحَىٰهَا |
| 91:2 | وَٱلْقَمَرِ · تَلَىٰهَا |
| 91:3 | وَٱلنَّهَارِ · جَلَّىٰهَا |
| 91:4 | يَغْشَىٰهَا |
| 91:5 | وَٱلسَّمَآءِ · بَنَىٰهَا |
| 91:6 | وَٱلْأَرْضِ · طَحَىٰهَا |
| 91:7 | وَنَفْسٍۢ · سَوَّىٰهَا |
| 91:8 | فَأَلْهَمَهَا · فُجُورَهَا · وَتَقْوَىٰهَا |
| 91:9 | قَدْ · أَفْلَحَ · زَكَّىٰهَا |
| 91:10 | وَقَدْ · خَابَ · دَسَّىٰهَا |
| 91:11 | كَذَّبَتْ · ثَمُودُ · بِطَغْوَىٰهَآ |
| 91:12 | إِذِ · ٱنۢبَعَثَ · أَشْقَىٰهَا |
| 91:13 | فَقَالَ · لَهُمْ · نَاقَةَ · وَسُقْيَـٰهَا |
| 91:14 | فَكَذَّبُوهُ · فَعَقَرُوهَا · فَدَمْدَمَ · بِذَنۢبِهِمْ · فَسَوَّىٰهَا |
| 91:15 | يَخَافُ · عُقْبَـٰهَا |

## F. Formes partagées (19/39 — aucune dans le catalogue)

Partagées avec d'autres sourates **hors catalogue** (effet naturel du modèle,
documenté) : `قَدْ` (41 sourates), `لَهُمْ` (56), `وَٱلْأَرْضِ` (36), `فَقَالَ`
(19), `وَقَدْ` (23), `كَذَّبَتْ` (7), `ثَمُودُ` (5), `إِذِ` (8), `وَٱلْقَمَرِ`
(74, 84 — serments), `وَٱلسَّمَآءِ` (51, 85, 86), `وَٱلنَّهَارِ`
(2, 3, 10, 21, 30, 34, 41, 45, 92), `فَكَذَّبُوهُ` (7, 10, 16, 26, 29, 37),
`فَعَقَرُوهَا` (11, 26), `بَنَىٰهَا` (79), `فَسَوَّىٰهَا` (79), `أَفْلَحَ`
(20, 23, 87), `خَابَ` (20), `بِذَنۢبِهِمْ` (67), `يَخَافُ` (20, 27, 50, 72).

**0 forme partagée avec les 21 parcours existants** : aucune modification
indirecte du catalogue pré-existant. La donnée est attachée au `word_id` selon
le modèle existant — **aucun doublon créé, aucune glose existante écrasée**
(0 ligne `word_translations` pré-existante pour ces 39 word_ids, vérifié).

## G. Dossier éditorial par forme

Artefact : `tmp/phase55-dossier.json` (pour chaque forme : word_id, forme arabe,
occurrences, ayahs, **les 4 traductions des MÊMES ayahs**, lemma direct/mapping,
autres sourates, lignes `word_translations` existantes).
Artefact : `tmp/phase55-proposals.json` (39 propositions complètes).
Artefact : `tmp/phase55-validated.json` (décision de validation).

## H. Comparaison des 4 traductions (principe)

Pour chaque forme, les 4 traductions de **ses propres ayahs** ont été lues
(Hamidullah FR 31 · Kazimirski FR 9001 · Sahih EN 20 · Piccardo IT 153). La
traduction d'ayah sert de **contexte** — jamais de glose lexicale. Exemple
canonique respecté : aucun découpage mécanique d'une phrase française.

## I. Noyau sémantique retenu

Pour chaque forme, le noyau est établi par **convergence des références et sens
lexical** (pas un vote majoritaire). Exemples : `زَكَّىٰهَا` → « purifier »
(Hamidullah/Kazimirski/Sahih/Piccardo identiques) ; `دَسَّىٰهَا` → « corrompre »
(3 références convergentes, la glose WBW EN « buries it » documentée en note) ;
`فُجُورَهَا` → « immoralité » (2 FR + EN + IT convergent).

## J. Glose Hikma proposée — les 39, toutes VALIDATED (HIGH confidence)

| Ayah | Forme | Glose Hikma | Noyau |
|---:|---|---|---|
| 91:1 | وَٱلشَّمْسِ | par le soleil | soleil |
| 91:1 | وَضُحَىٰهَا | et sa clarté | clarté du matin |
| 91:2 | وَٱلْقَمَرِ | par la lune | lune |
| 91:2 | تَلَىٰهَا | l'a suivie / lui succède | suivre |
| 91:3 | وَٱلنَّهَارِ | le jour | jour |
| 91:3 | جَلَّىٰهَا | l'éclaire / la manifeste | éclairer |
| 91:4 | يَغْشَىٰهَا | la couvre / l'enveloppe | couvrir |
| 91:5 | وَٱلسَّمَآءِ | le ciel | ciel |
| 91:5 | بَنَىٰهَا | l'a bâtie / l'a construite | bâtir |
| 91:6 | وَٱلْأَرْضِ | la terre | terre |
| 91:6 | طَحَىٰهَا | l'a étendue / l'a déployée | étendre |
| 91:7 | وَنَفْسٍۢ | par l'âme | âme |
| 91:7 | سَوَّىٰهَا | l'a façonnée / l'a proportionnée | façonner |
| 91:8 | فَأَلْهَمَهَا | et lui a inspiré | inspirer |
| 91:8 | فُجُورَهَا | son immoralité / sa perversité | immoralité |
| 91:8 | وَتَقْوَىٰهَا | et sa piété | piété |
| 91:9 | قَدْ | certes / vraiment | emphase |
| 91:9 | أَفْلَحَ | a réussi / a prospéré | réussir |
| 91:9 | زَكَّىٰهَا | la purifie | purifier |
| 91:10 | وَقَدْ | et certes | et + emphase |
| 91:10 | خَابَ | a échoué / est perdu | échouer |
| 91:10 | دَسَّىٰهَا | la corrompt | corrompre |
| 91:11 | كَذَّبَتْ | a traité de mensonge / a démenti | accuser de mensonge |
| 91:11 | ثَمُودُ | Thamoud / les Thamūd (peuple) | nom propre |
| 91:11 | بِطَغْوَىٰهَآ | par leur transgression / leur rébellion | transgression |
| 91:12 | إِذِ | quand / lorsque | quand (passé) |
| 91:12 | ٱنۢبَعَثَ | s'est levé / a surgi | se lever |
| 91:12 | أَشْقَىٰهَا | le plus misérable d'entre eux / le plus scélérat | le pire |
| 91:13 | فَقَالَ | et il dit / il a dit | dire |
| 91:13 | لَهُمْ | à eux / pour eux | à eux |
| 91:13 | نَاقَةَ | la chamelle | chamelle |
| 91:13 | وَسُقْيَـٰهَا | et son abreuvement / son droit de boire | abreuvement |
| 91:14 | فَكَذَّبُوهُ | et ils l'ont démenti / traité de menteur | démentir |
| 91:14 | فَعَقَرُوهَا | l'ont frappée / mutilée | frapper (la chamelle) |
| 91:14 | فَدَمْدَمَ | et les a anéantis / détruits | anéantir |
| 91:14 | بِذَنۢبِهِمْ | pour leur péché | péché |
| 91:14 | فَسَوَّىٰهَا | et a tout nivelé / a égalisé | égaliser le châtiment |
| 91:15 | يَخَافُ | craint / redoute | craindre |
| 91:15 | عُقْبَـٰهَا | ses conséquences / sa suite | conséquence |

## K. Cas sensibles et arbitrages

- **Formes grammaticales** (traitées séparément, jamais de sens artificiel) :
  particules `قَدْ` / `وَقَدْ` (emphase), `إِذِ` (quand passé), `لَهُمْ`
  (préposition + pronom), conjonctions de serment `وَ` (rendues « par … » ou
  laissées implicites selon le noyau nominal).
- **Serments 91:1-7** : noyau nominal conservé ; la lecture « par … » est
  documentée dans `editorial_notes`. Pour les formes partagées non-serment
  (`ٱلنَّهَارِ`, `ٱلسَّمَآءِ`, `ٱلْأَرْضِ`), seule la valeur nominale est
  retenue (valable dans tous les contextes).
- **`فَسَوَّىٰهَا` (91:14)** : le référent du suffixe (-ها = le châtiment rendu
  commun) est ambigu — **note de prudence enregistrée**, glose « et a tout
  nivelé / a égalisé » fondée sur Hamidullah (« étendit Son châtiment sur
  tous »), Kazimirski (idem), Sahih (« made it equal upon all of them »).
  VALIDATED avec la note ; aucun arbitrage bloquant.
- **Polysémie** : aucune forme ne présente de valeurs divergentes entre les
  contextes réels de 91 (chaque forme n'apparaît qu'une fois dans la sourate).
  Les 19 formes partagées gardent leur noyau stable (vérifié sur les autres
  sourates).

## L. Nombre de gloses validées — 39 (0 REJECTED, 0 NEEDS_REVIEW)

## M. Nombre d'écritures réellement effectuées — 39
`word_translations` : 39 lignes insérées (language `fr`, source
« Hikma — lexique éditorial », `is_validated = true`, `validated_at` renseigné,
`editorial_notes` avec référence 91:x + convergence). **Aucune autre écriture.**

## N. Vérification d'idempotence
Ré-exécution de l'écriture : **0 nouvelle ligne, 39 ignorées** (contrainte
d'unicité `(word_id, language, source_id)`). Ré-exécution du seed : stable.

## O. Résultat resolveWordMeanings (code réel)
**48/48 formes de 91 en FR validé (100 %), 0 fallback EN, 0 non résolu.**

## P. Résultat classifySurahReadiness
`classifySurahReadiness(91, 100)` → **READY** (vérifié via le code réel).

## Q. Résultat seed
`seed:multisurah -- --surahs=91` : ✅ 1 parcours (`quran-surah-91`,
« Parcours · Ash-Shams »), 1 unité, **15 leçons publiées** (15 versets).
Intégrité : 102 `lesson_words` — **0 doublon de position, 0 mot étranger,
0 forme de la sourate absente du curriculum (48/48)**.

## R. Compteurs DB avant / après

| Table | Phase 54 / avant | Après Phase 55 | Delta |
|---|---:|---:|---:|
| word_translations | 415 | 454 | **+39** (les 39 gloses) |
| learning_paths | 21 | 22 | +1 (91) |
| units | 21 | 22 | +1 (91) |
| lessons | 138 | 153 | +15 (91) |
| lesson_words | 933 | 1 035 | +102 (91) |
| quran_words | 21 296 | 21 296 | 0 |
| word_occurrences | 77 430 | 77 430 | 0 |
| translations | 24 944 | 24 944 | 0 |
| lemma_translations / lemmas | 32 / 32 | 32 / 32 | 0 |
| word_lemma_mapping | 184 | 184 | 0 |
| sources | 6 | 6 | 0 |

**Aucune table verrouillée n'a changé** (quran_words, occurrences, traductions
d'ayah, lemmas, mapping, sources, linguistic_*, word_explanations, SRS,
mastery, Daily Plan, coach, onboarding, MASAQ, resolver — intacts).

## S. Tests

| Validation | Résultat |
|---|---|
| `npx tsc --noEmit` | ✅ 0 erreur |
| `npx eslint .` | ✅ 0 erreur |
| `npx vitest run` | ✅ **743/743** (56 fichiers) |
| `npm run build` | ✅ (Next.js 16.3.0, routes complètes) |

## T. Absence de régression

- 743/743 tests identiques à la baseline Phase 53/54 — aucun test modifié.
- Catalogue : **22 parcours** = 1 REFERENCE + 21 READY + 0 IN_PREPARATION ;
  `getSurahCatalog()` → 91 **READY** (48 formes, 100 % FR) ; **aucun
  changement d'état hors 91** (les 21 sourates existantes inchangées).
- Compteurs : seuls les 5 compteurs attendus (+39/+1/+1/+15/+102) ont changé.

## U. Effets des formes partagées (documentés, jamais « volontaires »)

19 gloses de 91 sont attachées à des word_ids présents dans d'autres sourates
**hors catalogue** (ex. `قَدْ`, `لَهُمْ`, `وَٱلْأَرْضِ`, `فَقَالَ`, `وَقَدْ`,
`ثَمُودُ`, `إِذِ`, …). Conséquence naturelle du modèle : ces formes ne
tomberont plus en fallback EN dans ces sourates, réduisant mécaniquement leur
futur backlog éditorial. **0 effet sur le catalogue existant.** Effet mesuré
au niveau données (attribué au `word_id`), aucun changement volontaire d'une
autre sourate.

## V. Verdict final

**`PHASE_55_ASH_SHAMS_READY`**

Ash-Shams (91) est **débloquée** : 48 formes, 100 % FR effectif via le resolver
réel, 39 gloses Hikma validées écrites dans `word_translations`, curriculum
seedé (15 leçons), catalogue à 22 parcours, aucune régression, aucune écriture
hors périmètre.

**STOP.** Aucune Phase 56 n'est lancée automatiquement. Aucun commit, aucun push.
