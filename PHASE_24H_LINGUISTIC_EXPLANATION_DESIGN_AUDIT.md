# PHASE 24H — CONCEPTION DU MOTEUR D'EXPLICATION LINGUISTIQUE MASAQ → PÉDAGOGIQUE

**STATUT : AUDIT READ-ONLY TERMINÉ** · 0 écriture DB · 0 code produit modifié · 0 migration · 0 import.

---

## DÉCISION FINALE

### `A — READY_FOR_LINGUISTIC_EXPLANATION_IMPLEMENTATION`

Les données MASAQ importées en 24G (29/29 occurrences d'Al-Fātiḥah : segmentation, stem, POS, cas, syntaxe, gloss EN) sont **suffisantes** pour construire une explication post-erreur sensiblement plus riche que l'actuelle — à condition de respecter la règle absolue **AVAILABLE ≠ INFERABLE** et de ne jamais présenter comme disponible une donnée absente (racine, schème, état construit). L'architecture cible s'appuie sur `HikmaExplanationData` existant, par ajouts optionnels **additifs**, sans toucher au grading / SRS / mastery / curriculum.

---

## 1. AUDIT DU MOTEUR ACTUEL

### 1.1 Chaîne de résolution

```
lesson_words
  → buildWordBank (lib/learning/lesson.ts)
      → resolveWordMeanings (lib/learning/language.ts) — FORME > LEMME > EN
  → generateLessonExercises (lib/exercises)
  → GeneratedExercise.metadata (lib/exercises/types.ts)
  → pedagogicalExplanation (components/learn/exercises/pedagogical-feedback.ts)
  → HikmaExplanationData (components/ui/hikma-explanation.tsx)
  → HikmaExplanation (UI « Comprendre pourquoi »)
```

### 1.2 Déclenchement

L'explication n'est produite qu'après une réponse **incorrecte ou ambiguë** : `FeedbackPanel` (`options-exercise.tsx`) appelle `pedagogicalExplanation(exercise)` puis la transmet à `ExerciseFeedback` (`components/ui/exercise.tsx`), qui rend `HikmaExplanation`. Le bouton « Comprendre pourquoi » est un `<details>` replié par défaut.

### 1.3 Données actuellement disponibles / utilisées

| Donnée | Source | Utilisée ? |
|---|---|---|
| Sens (FR validé sinon EN) | `metadata.meaning` | OUI |
| Sens du lemme | `metadata.lemmaMeaning` | OUI (LEMMA_RELATION + sens) |
| Relation forme→lemme | `metadata.lemma` (`WordLemmaData`) | OUI |
| Contexte verset + Hamidullah FR | `metadata.context` (`WordContextData`) | OUI |
| Audio Muʿallim | `metadata.audioUrl` | OUI |
| Arabe / translittération | `metadata.arabic` / `.transliteration` | OUI |
| Traits phonétiques | `phoneticTrait` / `phoneticHints` / `phoneticMarks` | OUI (types phonétiques) |

### 1.4 Données disponibles mais NON utilisées

**La couche linguistique MASAQ entière** (`linguistic_occurrences` + `linguistic_segments`), importée en Phase 24G, n'est lue par **aucun** code runtime. C'est la matière première de cette phase.

### 1.5 Données absentes

- racine (`linguistic_roots` vide) ;
- schème / pattern (aucune colonne) ;
- genre / voix / personne structurelles ;
- lemme explicite MASAQ (MASAQ fournit un stem, pas un lemme) ;
- glose lexicale française mot-à-mot générique (seules les gloses éditoriales Hikma existent).

### 1.6 Ce que `exercise.metadata` transporte déjà

`targetWordId, arabic, transliteration, meaning, showArabic, revealContent, freeText, freeTextLang, acceptedAnswers, expectedArabic, context, lemma, audioUrl, lemmaMeaning, meaningValidated, answerLanguage, translationExposure` + champs phonétiques (index signature). **Aucun champ MASAQ** n'y figure encore — c'est le point d'extension.

---

## 2. AUDIT DE LA COUCHE MASAQ IMPORTÉE (Al-Fātiḥah)

### 2.1 Colonnes réellement importées

- `linguistic_occurrences` : `masaq_word`, `masaq_stem`, `masaq_gloss_en`, `pos` (**= Morph_Tag**, 22 tags), `case_mood` (Case_Mood), `syntactic_roles` (Syntactic_Role), `alignment_status`, `lemma_mapping_status`, `hikma_lemma_id`, `source_record_id`.
- `linguistic_segments` : `segment_no`, `segment_text`, `morph_type` (Prefix/Stem/Suffix), `morph_tag`, `segment_kind` (classification Hikma dérivée : ARTICLE/PARTICLE/STEM/INFLECTIONAL_SUFFIX/PRONOMINAL_SUFFIX/OTHER).

### 2.2 Colonnes du CSV source NON importées

`Without_Diacritics`, `Punctuation_Mark`, `Invariable_Declinable`, `Possessive_Construct`, `Case_Mood_Marker`, `Phrase`, `Phrasal_Function`.

> ⚠️ Conséquence d'honnêteté : la « morphologie » disponible dans la couche = **Case_Mood** (cas / invariance). L'**état construit**, l'**invariabilité/déclinaison** et la **marque de cas** sont présents dans le CSV mais **pas en base** ; ils resteront donc `ABSENT_DATA` tant qu'un import additif dédié n'aura pas été décidé.

### 2.3 Vue structurée des 29 occurrences

`pos` = tags Morph_Tag ; `case` = Case_Mood ; `syntax` = Syntactic_Role ; `segments` = `texte[kind]`.

| # | Clé | Forme Hikma | Stem | Segments (texte[kind]) | Cas | Syntaxe | Lemme Hikma↔MASAQ |
|---|---|---|---|---|---|---|---|
| 1 | 1:4:1 | مَـٰلِكِ | مالك | مالك[STEM] | GENITIVE | ADJ | UNMAPPED |
| 2 | 1:5:1 | إِيَّاكَ | إياك | إياك[STEM] | ACCUSATIVE | OBJ | UNMAPPED |
| 3 | 1:6:1 | ٱهْدِنَا | اهد | اهد[STEM] + نا[PRONOMINAL_SUFFIX] | INVARIABLE/ACCUSATIVE | CV/OBJ | UNMAPPED |
| 4 | 1:7:1 | صِرَٰطَ | صراط | صراط[STEM] | ACCUSATIVE | APPOS | UNMAPPED |
| 5 | 1:1:1 | بِسْمِ | اسم | ب[PARTICLE] + اسم[STEM] | INVARIABLE/GENITIVE | PREP/PREP_OBJ | NORMALIZATION_DIFFERENCE |
| 6 | 1:2:1 | ٱلْحَمْدُ | حمد | ال[ARTICLE] + حمد[STEM] | NOMINATIVE | SUBJ | PARTIAL |
| 7 | 1:3:1 | ٱلرَّحْمَـٰنِ | رحمن | ال[ARTICLE] + رحمن[STEM] | GENITIVE | ADJ | LEXICAL_LEVEL_DIFFERENCE |
| 8 | 1:3:2 | ٱلرَّحِيمِ | رحيم | ال[ARTICLE] + رحيم[STEM] | GENITIVE | ADJ | PARTIAL |
| 9 | 1:2:2 | لِلَّهِ | له | ل[PARTICLE] + له[STEM] | INVARIABLE/GENITIVE | PREP/PREP_OBJ | NORMALIZATION_DIFFERENCE |
| 10 | 1:1:2 | ٱللَّهِ | له | ال[ARTICLE] + له[STEM] | GENITIVE | GEN_CONS | NORMALIZATION_DIFFERENCE |
| 11 | 1:4:2 | يَوْمِ | يوم | يوم[STEM] + (null)[INFLECTIONAL_SUFFIX] | GENITIVE | GEN_CONS | EXACT |
| 12 | 1:5:2 | نَعْبُدُ | عبد | ن[PARTICLE] + عبد[STEM] | NOMINATIVE | IV | UNMAPPED |
| 13 | 1:6:2 | ٱلصِّرَٰطَ | صراط | ال[ARTICLE] + صراط[STEM] | ACCUSATIVE | OBJ | UNMAPPED |
| 14 | 1:7:2 | ٱلَّذِينَ | الذين | الذين[STEM] | GENITIVE | GEN_CONS | UNMAPPED |
| 15 | 1:2:3 | رَبِّ | رب | رب[STEM] | GENITIVE | ADJ | EXACT |
| 16 | 1:1:3 | ٱلرَّحْمَـٰنِ | رحمن | ال[ARTICLE] + رحمن[STEM] | GENITIVE | ADJ | LEXICAL_LEVEL_DIFFERENCE |
| 17 | 1:4:3 | ٱلدِّينِ | دين | ال[ARTICLE] + دين[STEM] | GENITIVE | GEN_CONS | UNMAPPED |
| 18 | 1:5:3 | وَإِيَّاكَ | إياك | و[PARTICLE] + إياك[STEM] | INVARIABLE/ACCUSATIVE | CONJ/OBJ | UNMAPPED |
| 19 | 1:6:3 | ٱلْمُسْتَقِيمَ | مستقيم | ال[ARTICLE] + مستقيم[STEM] + (null)[INFLECTIONAL_SUFFIX] | ACCUSATIVE | ADJ | UNMAPPED |
| 20 | 1:7:3 | أَنْعَمْتَ | أنعم | أنعم[STEM] + ت[OTHER] | INVARIABLE/NOMINATIVE | AGNT | UNMAPPED |
| 21 | 1:5:4 | نَسْتَعِينُ | ستعين | ن[PARTICLE] + ستعين[STEM] | NOMINATIVE | IV | UNMAPPED |
| 22 | 1:7:4 | عَلَيْهِمْ | علي | علي[STEM] + هم[PRONOMINAL_SUFFIX] | INVARIABLE/GENITIVE | PREP/PREP_OBJ | UNMAPPED |
| 23 | 1:1:4 | ٱلرَّحِيمِ | رحيم | ال[ARTICLE] + رحيم[STEM] | GENITIVE | ADJ | PARTIAL |
| 24 | 1:2:4 | ٱلْعَـٰلَمِينَ | عالم | ال[ARTICLE] + عالم[STEM] + ين[INFLECTIONAL_SUFFIX] | GENITIVE | GEN_CONS | PARTIAL |
| 25 | 1:7:5 | غَيْرِ | غير | غير[STEM] + (null)[INFLECTIONAL_SUFFIX] | GENITIVE | ADJ | UNMAPPED |
| 26 | 1:7:6 | ٱلْمَغْضُوبِ | مغضوب | ال[ARTICLE] + مغضوب[STEM] | GENITIVE | GEN_CONS | UNMAPPED |
| 27 | 1:7:7 | عَلَيْهِمْ | علي | علي[STEM] + هم[PRONOMINAL_SUFFIX] | INVARIABLE/GENITIVE | PREP/PREP_OBJ | UNMAPPED |
| 28 | 1:7:8 | وَلَا | لا | و[PARTICLE] + لا[STEM] | INVARIABLE | CONJ/NON_INFLECT | UNMAPPED |
| 29 | 1:7:9 | ٱلضَّآلِّينَ | ضال | ال[ARTICLE] + ضال[STEM] + ين[INFLECTIONAL_SUFFIX] | GENITIVE | CONJ_N | UNMAPPED |

> Détail machine-lectible complet : `tmp/phase24h-occurrences-structured.json`.

---

## 3. CONVERSION PÉDAGOGIQUE (technique → français)

Règle : **jamais de tag brut** (« POS = NOUN ») ; toujours une reformulation pédagogique, **uniquement** si le tag est réellement importé.

| Donnée importée | Formulation pédagogique |
|---|---|
| Prefix + DET | « l'article défini الـ (le/la/les) » |
| Prefix + PREP | « la préposition بِـ (avec/par) / لِـ (à/pour) » selon le préfixe réel |
| Prefix + CONJ | « la conjonction وَ (et) » |
| Prefix + IMPERF_PREF | « le préfixe نَـ de l'inaccompli (marque « nous ») » |
| Stem + NOUN_* | « un nom » |
| Stem + GERUND | « un nom verbal (maṣdar) » |
| Stem + NOUN_PROP | « un nom propre / nom divin » |
| Stem + NOUN_ACTIVE_PART | « un participe actif (celui qui fait l'action) » |
| Stem + NOUN_PASSIVE_PART | « un participe passif (celui qui subit l'action) » |
| Stem + IV / PV / CV | « un verbe à l'inaccompli / l'accompli / l'impératif » |
| Stem + PRON / REL_PRON | « un pronom / un pronom relatif » |
| Stem + NEG_PART | « la particule de négation لَا » |
| Suffix + OBJ_PRON / PRON_3MP | « un suffixe pronominal (complément : nous/vous/eux) » |
| Suffix + NSUFF_MASC_PL_GEN | « la marque du pluriel masculin » |
| Suffix + CASE_DEF_* | « une désinence de cas » |
| case INVARIABLE / NOMINATIVE / ACCUSATIVE / GENITIVE | « invariable / au nominatif (sujet) / à l'accusatif (complément) / au génitif (après préposition ou complément du nom) » |
| syntax SUBJ / OBJ / PREP / PREP_OBJ / ADJ / APPOS / GEN_CONS / CONJ / AGNT | « sujet / complément d'objet / préposition / complément de préposition / qualificatif / apposition / complément du nom (annexion) / conjonction / agent » |

---

## 4. DÉCOMPOSITION DES MOTS (qui en bénéficie réellement)

| Catégorie | Mots | Décomposition possible ? |
|---|---|---|
| Article défini | الْحَمْدُ، الرَّحْمَٰنِ (×2)، الرَّحِيمِ (×2)، اللَّهِ، الصِّرَاطَ، الدِّينِ، الْمُسْتَقِيمَ، الْعَالَمِينَ، الْمَغْضُوبِ، الضَّالِّينَ | OUI (ال + stem) |
| Préposition préfixe | بِسْمِ (بِ)، لِلَّهِ (لِ) | OUI |
| Conjonction préfixe | وَإِيَّاكَ، وَلَا (وَ) | OUI |
| Préfixe d'inaccompli | نَعْبُدُ، نَسْتَعِينُ (نَـ) | OUI |
| Suffixe pronominal | ٱهْدِنَا (نَا)، عَلَيْهِمْ (هُمْ, ×2) | OUI |
| Suffixe flexionnel | الْعَالَمِينَ، الضَّالِّينَ (يْنَ) | OUI |
| Désinence « (null) » | يَوْمِ، الْمُسْتَقِيمَ، غَيْرِ | PARTIELLE (segment vide « (null) » → ne pas afficher comme un mot) |
| Segment unique (stem) | مَالِكِ، إِيَّاكَ، صِرَاطَ، الَّذِينَ، رَبِّ | NON (rien à décomposer) — afficher identité + sens |

> **Jamais fabriquer une segmentation absente** : un mot à segment unique n'a pas de « décomposition ».

---

## 5. PARTICULES ET CLITIQUES (distinction stricte)

| Type | Exemple réel | Présentation pédagogique |
|---|---|---|
| Article défini | ال (DET) | « l'article الـ » — jamais « le mot "al" » |
| Particule/préfixe | ب (PREP), ل (PREP), و (CONJ), ن (IMPERF_PREF) | « la préposition/conjonction attachée » — jamais un mot indépendant |
| Suffixe pronominal | نَا, هُمْ | « le suffixe pronominal attaché ("nous"/"eux") » |
| Suffixe flexionnel | يْنَ (pluriel masc.) | « la marque du pluriel » |
| Désinence de cas | « (null) » (CASE_DEF_*) | « une désinence de cas » (texte vide → ne pas afficher un faux segment) |
| Stem lexical | اسم, حمد, عبد… | « le noyau du mot (stem) » |

**Règle** : un segment **n'est jamais présenté comme un mot autonome**. On parle de « préfixe attaché » / « suffixe attaché », pas de « mots » و / بِ / لِ / ال pris isolément.

---

## 6. LEMME (classes documentées, 0 mapping créé)

| Classe | Nb (29) | Exploitable dans une explication ? |
|---|---|---|
| EXACT | 2 | OUI — « relié à la même famille que le lemme X » (sans modifier le mapping) |
| PARTIAL | 4 | OUI — « le noyau est Y ; l'article الـ est un affixe de surface » |
| NORMALIZATION_DIFFERENCE | 3 | PRUDENCE — « la forme Hikma et le stem MASAQ diffèrent par une normalisation » (ne pas affirmer une équivalence) |
| LEXICAL_LEVEL_DIFFERENCE | 2 | PRUDENCE — « nom propre avec article vs stem nu » (ne pas fusionner) |
| UNMAPPED | 18 | Ne rien affirmer sur la famille ; s'appuyer sur sens + décomposition seulement |

**Règle** : `lemma_mapping_status` est **documentaire**. L'explication peut le lire pour décider quoi dire, mais ne crée **jamais** de mapping.

---

## 7. RACINE ET SCHÈME

- **Racine** : absente de MASAQ importé → `linguistic_roots` = 0. **Aucune racine inventée.**
- **Schème / pattern** : absent → `PATTERN = FUTURE_WORK`. **Aucun schème inventé.**
- Architecture d'accueil déjà posée (24F) : `linguistic_roots` (rattachée au lemme, avec `source_id`, `confidence`, `evidence`) ; le champ `pattern` sera ajouté **quand une source fiable existera**. Aucune colonne à créer maintenant.

---

## 8. EXEMPLES D'EXPLICATIONS (12 cas, structure A–H)

Légende : **A** réponse utilisateur · **B** bonne réponse · **C** données linguistiques disponibles · **D** explication actuelle · **E** explication proposée (MASAQ) · **F** données utilisées · **G** données volontairement non utilisées · **H** raison pédagogique.

### Exemple 1 — mot simple : رَبِّ (1:2:3)
- **A** « le jour » · **B** « le Seigneur »
- **C** stem رب · POS NOUN_CONCRETE · GENITIVE · ADJ · gloss EN « the-lord » · glose FR validée « le Seigneur » · mapping EXACT
- **D** « Le mot signifie "le Seigneur". »
- **E** « رَبِّ est un **nom** (au génitif, ici qualificatif). Il signifie **« le Seigneur »**. Dans ce verset, le mot précède عَالَمِينَ pour désigner le Seigneur des mondes. »
- **F** sens FR validé · POS (nom) · cas · syntaxe · contexte verset
- **G** racine (absente) · schème (absent)
- **H** un mot simple → sens + contexte, sans forcer une décomposition inexistante.

### Exemple 2 — mot avec article : الْحَمْدُ (1:2:1)
- **A** « le Seigneur » · **B** « la louange »
- **C** ال[ARTICLE] + حمد[GERUND] · NOMINATIVE · SUBJ · gloss « all-praises-and-thanks »
- **D** « Le mot signifie "la louange". »
- **E** « الْحَمْدُ = **الـ** (l'article défini) + **حَمْد** (un nom verbal). C'est donc **« la louange »**, au nominatif, ici **sujet** de la phrase. »
- **F** segmentation (article + stem) · POS (GERUND→nom verbal) · cas · syntaxe
- **G** racine (حمد absente) — ne pas l'annoncer
- **H** l'article éclaire le sens et la structure, sans jargon.

### Exemple 3 — mot avec préfixe préposition : بِسْمِ (1:1:1)
- **A** « le nom » · **B** « au nom (de) »
- **C** ب[PARTICLE=PREP] + اسم[STEM] · gloss « in-(the)-name » · mapping NORMALIZATION_DIFFERENCE (بِسْم vs اسم)
- **D** « Le mot signifie "au nom". »
- **E** « بِسْمِ = **بِـ** (la préposition « par/avec/dans ») + **اسْم** (le nom). L'ensemble se traduit par **« au nom (de) »**. Le بِـ est un préfixe attaché, pas un mot séparé. »
- **F** segmentation (PREP + stem) · sens · gloss EN comme évidence
- **G** mapping NORMALIZATION_DIFFERENCE (ne pas affirmer « بِسْم = اسم ») · racine
- **H** expliquer le clitique rend la préposition transparente.

### Exemple 4 — mot avec suffixe pronominal : عَلَيْهِمْ (1:7:4)
- **A** « sur moi » · **B** « sur eux »
- **C** علي[STEM=PREP] + هم[PRONOMINAL_SUFFIX] · INVARIABLE/GENITIVE · PREP/PREP_OBJ · gloss « on-them »
- **D** « Le mot signifie "sur eux". »
- **E** « عَلَيْهِمْ = **عَلَيْ** (la préposition « sur ») + **هُمْ** (le suffixe pronominal « eux »). C'est donc **« sur eux »**. Le -هُمْ est un suffixe attaché qui porte le complément. »
- **F** segmentation (stem + suffixe pronominal) · sens
- **G** genre/voix (absents) · racine
- **H** le suffixe pronominal est un vrai levier pédagogique (reconnaître « eux »).

### Exemple 5 — mot multi-segments : الْعَالَمِينَ (1:2:4)
- **A** « les mondes » · **B** « des mondes / de l'univers »
- **C** ال[ARTICLE] + عالم[STEM] + ين[INFLECTIONAL_SUFFIX] · GENITIVE · GEN_CONS · gloss « of-the-universe »
- **D** « Le mot signifie "des mondes". »
- **E** « الْعَالَمِينَ = **الـ** (article) + **عَالَم** (monde) + **يْنَ** (marque du pluriel masculin). Au génitif, c'est **« des mondes »** — ici complément du nom. »
- **F** segmentation (3 segments) · POS · cas · syntaxe · sens
- **G** racine · schème
- **H** la triple décomposition montre comment « des mondes » se construit.

### Exemple 6 — lemme Hikma/MASAQ non parfait : الرَّحْمَٰنِ (1:1:3)
- **A** « le Très Miséricordieux » confondu avec الرَّحِيمِ · **B** « الرَّحْمَٰنِ (le Tout Miséricordieux) »
- **C** ال[ARTICLE] + رحمن[NOUN_PROP] · mapping LEXICAL_LEVEL_DIFFERENCE · gloss « the-most-gracious »
- **D** « Le mot signifie "le Tout Miséricordieux". »
- **E** « الرَّحْمَٰنِ est un **nom divin** avec l'article الـ. Il désigne la miséricorde **par essence**, distincte de الرَّحِيمِ (la miséricorde en acte). Attention : ces deux noms se ressemblent mais ne sont pas interchangeables. »
- **F** sens FR validé · POS (nom propre) · article · distinction contextuelle avec le sibling
- **G** mapping LEXICAL_LEVEL_DIFFERENCE (ne pas fusionner الرَّحْمَٰن et رحمن) · racine رحم (absente, ne pas l'annoncer)
- **H** la confusion الرحمن/الرحيم est une erreur réelle fréquente → différencier les deux noms.

### Exemple 7 — mot sans segmentation : إِيَّاكَ (1:5:1)
- **A** « nous » · **B** « Toi (seul) »
- **C** إياك[STEM=PRON] · ACCUSATIVE · OBJ · gloss « you-alone » · pas de segmentation
- **D** « Le mot signifie "Toi seul". »
- **E** « إِيَّاكَ est un **pronom** (à l'accusatif, complément d'objet). Il signifie **« Toi »**, avec une insistance exclusive ("Toi seul"). Ici il n'y a pas de préfixe ni de suffixe à décomposer. »
- **F** sens · POS (pronom) · cas · syntaxe
- **G** segmentation (inexistante) — ne rien afficher
- **H** honnêteté : pas de décomposition fabriquée.

### Exemple 8 — morphologie seule utile : يَوْمِ (1:4:2)
- **A** « jour » (nominatif supposé) · **B** « du jour »
- **C** يوم[STEM] + « (null) »[CASE_DEF_ACC] · GENITIVE · GEN_CONS · mapping EXACT (يَوْم)
- **D** « Le mot signifie "jour". »
- **E** « يَوْمِ est le nom **« jour »**, ici **au génitif** : il est complément du nom (مَالِكِ يَوْمِ الدِّينِ = « Maître du Jour du jugement »). »
- **F** sens · cas (GENITIVE) · syntaxe (GEN_CONS) · contexte
- **G** le segment « (null) » (désinence vide) — ne pas afficher un segment factice
- **H** le cas explique le « du » du français.

### Exemple 9 — conjonction + négation : وَلَا (1:7:8)
- **A** « ou » · **B** « et non / ni »
- **C** و[CONJ] + لا[NEG_PART] · INVARIABLE · CONJ/NON_INFLECT · gloss « and-not »
- **D** « Le mot signifie "et non". »
- **E** « وَلَا = **وَ** (la conjonction « et ») + **لَا** (la négation « non / ne…pas »). L'ensemble = **« et non »**, soit « ni ». Les deux éléments sont attachés. »
- **F** segmentation (conjonction + négation) · sens
- **G** racine · schème
- **H** transparence de la négation coordonnée.

### Exemple 10 — préfixe d'inaccompli : نَعْبُدُ (1:5:2)
- **A** « nous adorons » vs « il adore » · **B** « nous adorons »
- **C** ن[IMPERF_PREF] + عبد[IV] · NOMINATIVE · IV · gloss « we-worship »
- **D** « Le mot signifie "nous adorons". »
- **E** « نَعْبُدُ = **نَـ** (le préfixe de l'inaccompli qui marque « nous ») + **عَبَدَ/عَبْد** (le verbe « adorer »). C'est un verbe à l'inaccompli : **« nous adorons »**. »
- **F** segmentation (préfixe + verbe) · POS (IV)
- **G** racine عبد (absente) — ne pas l'annoncer
- **H** le préfixe نَـ explique la personne « nous ».

### Exemple 11 — verbe accompli + sujet : أَنْعَمْتَ (1:7:3)
- **A** « nous avons comblé » · **B** « Tu as comblé (de bienfaits) »
- **C** أنعم[PV] + ت[OTHER=SUBJ_PRON] · INVARIABLE/NOMINATIVE · AGNT · gloss « you-have-bestowed-(your)-favors »
- **D** « Le mot signifie "Tu as comblé". »
- **E** « أَنْعَمْتَ est un verbe à l'**accompli** : **« Tu as comblé (de bienfaits) »**. La terminaison -تَ marque le sujet « tu ». »
- **F** POS (PV) · sens · suffixe -تَ (sujet « tu »)
- **G** racine نعم (absente) · genre/voix (absents)
- **H** le suffixe -تَ est le repère de la personne.

### Exemple 12 — participe passif : الْمَغْضُوبِ (1:7:6)
- **A** « ceux qui se mettent en colère » · **B** « ceux qui ont encouru la colère »
- **C** ال[ARTICLE] + مغضوب[NOUN_PASSIVE_PART] · GENITIVE · GEN_CONS · gloss « those-who-earned-(your)-wrath »
- **D** « Le mot signifie "ceux qui ont encouru la colère". »
- **E** « الْمَغْضُوبِ = **الـ** + **مَغْضُوب** (un **participe passif** : "celui qui subit la colère"). D'où **« ceux qui ont encouru la colère »**. »
- **F** segmentation (article + participe passif) · sens
- **G** racine غضب (absente) · schème مَفْعُول (absent)
- **H** le participe passif explique le sens « subir » (vs « se mettre en colère »).

---

## 9. ADAPTATION SELON LE TYPE D'ERREUR

| Type d'erreur | Niveaux à produire | Exemple |
|---|---|---|
| Erreur de sens | Sens + Contexte (+ Identité) | « non, c'est "la louange" » |
| Mot composé / clitique | Décomposition + Sens | expliquer بِـ + اسم |
| Forme grammaticale (cas/personne) | Morphologie + Syntaxe + Sens | « au génitif → "du jour" » |
| Relation de lemme | Famille/forme UNIQUEMENT si donnée fiable | siblings LEMMA_RELATION |
| Réponse partielle | Uniquement le segment/manque | « il manque le suffixe -هُمْ ("eux") » |
| Bonne orthographe + mauvais sens | Sens uniquement (pas de décomposition inutile) | — |
| Mauvaise orthographe + bon sens | Feedback « proche », sans explication lourde | statut AMBIGUOUS |

---

## 10. SYSTÈME DE NIVEAUX (sélection par disponibilité réelle)

1. **Sens** — `metadata.meaning` (FR validé sinon EN) + `lemmaMeaning`
2. **Identité du mot** — arabe / translittération / catégorie (nom, verbe, pronom…)
3. **Contexte** — verset + Hamidullah FR
4. **Décomposition** — segments (si ≥ 2 segments réels)
5. **Morphologie** — cas (état construit/invariance = non importés → ABSENT)
6. **Syntaxe** — rôle syntaxique
7. **Racine / famille** — ABSENT (racine) / PARTIAL (famille via lemme)
8. **Nuance contextuelle** — gloss EN vs glose FR vs verset (prudence)

Le moteur **sélectionne uniquement les niveaux réellement disponibles** ; les autres sont omis (jamais grisés avec un faux texte).

---

## 11. ANTI-RÉPÉTITION

Génération par **profil** à partir des propriétés réellement disponibles :

| Profil | Structure |
|---|---|
| mot simple | Sens → Contexte |
| mot segmenté | Décomposition → Sens |
| suffixe pronominal | Décomposition → rôle du suffixe → Sens |
| morphologie riche | Forme → fonction grammaticale → Sens |
| ambiguïté contextuelle | Sens de base → nuance (prudence) |

Chaque bloc est une phrase générée par une fonction dédiée (`buildSegmentationExplanation`, etc.), pas un patron unique « le mot signifie X ».

---

## 12. AUDIO

L'audio Muʿallim reste **complémentaire** : placé en fin d'explication (« Écouter le mot »), relié à la forme ou au stem décomposé. Pas de répétition mécanique d'un lecteur déjà présent dans l'exercice.

---

## 13. UX PROPOSÉE (« Comprendre pourquoi »)

```
Pourquoi ?
  [Bonne réponse]

  Décomposition        وَ + ال + نَاس

  Sens                 « gens / hommes »

  Dans ce verset       …

  Écouter              ▶ Audio Muʿallim

  En savoir plus       (morphologie · syntaxe · famille)
```

- Niveaux 1→3 ouverts par défaut ; niveaux 4+ repliés derrière « En savoir plus ».
- Chaque bloc affiche sa **provenance** (`verified` / `partial` / `unavailable`), comme aujourd'hui.

---

## 14. ARCHITECTURE (conceptuelle — ne pas créer)

Fonctions proposées (phase suivante) :
- `getLinguisticEvidence(wordOccurrenceId)` → `LinguisticEvidence | ABSENT_DATA`
- `buildLinguisticExplanation(exercise, evidence, errorKind)` → `HikmaExplanationData` v2
- `buildSegmentationExplanation(segments)` → composition + notes de clitiques | `ABSENT_DATA`
- `buildMorphologyExplanation(caseMood, syntax)` → texte cas + rôle | `ABSENT_DATA`
- `buildIdentityExplanation(posTags)` → catégorie (nom/verbe/pronom) | `ABSENT_DATA`
- `buildContextualNuance(glossEn, glossFr, verseFr)` → nuance | `ABSENT_DATA`
- `selectLevels(evidence, errorKind)` → niveaux disponibles

Types proposés : `LinguisticEvidence`, `ExplanationLevel` (1–8), `DataProvenance` (`AVAILABLE | ABSENT_DATA | AMBIGUOUS_DATA | UNVERIFIED_DATA`).

---

## 15. SÉCURITÉ DES DONNÉES (règle absolue)

- **AVAILABLE ≠ INFERABLE** : donnée absente → `ABSENT_DATA`, jamais une supposition.
- donnée ambiguë → `AMBIGUOUS_DATA`, jamais une affirmation.
- donnée disponible non validée → `UNVERIFIED_DATA`.
- Aucune racine déduite par intuition · aucun schème inventé · aucune traduction de verset utilisée comme glose lexicale · aucun mapping lemme↔stem créé automatiquement.

---

## 16. NON-RÉGRESSION

Cet audit est **strictement READ_ONLY** : aucune modification de code produit, de migration, d'import, de seed, ni de base. Aucun test modifié. `FATIHAH_REFERENCE_LOCKED = TRUE` préservé.

---

## 17. RECOMMANDATIONS POUR LA PHASE SUIVANTE

1. Implémenter `getLinguisticEvidence` (lecture seule `linguistic_occurrences` + `linguistic_segments`).
2. Construire `buildLinguisticExplanation` v2 **adossé** à `HikmaExplanationData` existant (nouveaux champs optionnels `composition` / `morphology` / `syntax`), sans modifier grading/SRS/mastery/curriculum.
3. Ajouter les niveaux 4/5/6 (décomposition/morpho/syntaxe) **uniquement** quand les données existent.
4. Niveau 7 (racine) et schèmes : rester `ABSENT_DATA` tant qu'aucune source auditée n'est importée.
5. Si une morphologie plus riche est voulue (état construit / invariance / marque de cas) : migration **additive** dédiée pour importer `Invariable_Declinable`, `Possessive_Construct`, `Case_Mood_Marker` — sans toucher au corpus.
6. Ne **pas** brancher MASAQ au grading : la couche reste une **explication**, pas une notation.

---

**FIN PHASE 24H**
