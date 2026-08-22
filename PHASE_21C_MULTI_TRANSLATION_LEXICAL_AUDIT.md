# PHASE 21C — AUDIT LEXICAL MULTI-TRADUCTIONS

**STATUS = READ_ONLY · DATABASE_WRITES = 0 · CODE_WRITES = 0 · IMPORTS = 0 · MIGRATIONS = 0 · SEEDS = 0 · VALIDATIONS = 0**

## 1. Executive Summary

Le doute soulevé (« le système retombe-t-il implicitement sur une seule source,
notamment Hamidullah, pour produire les gloses ? ») est **levé** : le système ne
fait **jamais** cela.

- Une **glose de mot** est lue exclusivement dans `word_translations` (forme) et
  `lemma_translations` (lemme), toutes deux **validées éditorialement**, avec
  repli sur `quran_words.meaning` (word-by-word **anglais**, marqué `isFallback`).
- La table `translations` (les 4 sources : Hamidullah 31, Kazimirski 9001,
  Sahih 20, Piccardo 153) n'est **jamais** utilisée comme glose de mot — elle
  sert uniquement de **contexte de verset** (`getWordAyahContexts`,
  `getLessonAyahContext`, fiche mot).
- La production des gloses est un **workflow éditorial hors-ligne** (Phases
  19A → 19E → 21B-E/21B-F), pas un pipeline runtime.

Le constat réel pour les pilotes : **0 glose de forme, 4 gloses de lemme
héritées des 14 lemmes Phase 19A, 53 replis EN**. Aucune analyse
multi-traductions n'a encore été appliquée aux mots pilotes.

**Décision : `C — DATA_INSUFFICIENT`** (les données éditoriales FR manquent pour
les pilotes ; l'architecture, elle, est correcte et ne détourne aucune source).

## 2. Cartographie réelle de la résolution de glose

`lib/learning/language.ts` — `resolveWordMeanings(word, french, lemmaFrench)` :

```
1. FORME  : word_translations  (langue fr, is_validated = true)   ← prioritaire
2. LEMME  : lemma_translations (langue fr, is_validated = true)
            — lemme direct (quran_words.lemma_id)
            — puis surcouche word_lemma_mapping (confidence = safe)
3. EN     : quran_words.meaning (word-by-word Quran.com, isFallback = true)
```

| Question de cartographie (§16) | Réponse exacte |
|---|---|
| Glose de FORME recherchée où ? | `getValidatedFrenchMeanings` → `word_translations` (fr, validé) |
| Glose de LEMME recherchée où ? | `getValidatedFrenchLemmaMeanings` → `lemma_translations` (fr, validé) ; `getValidatedFrenchLemmaMeaningsByWord` résout le lemme (direct puis mapping safe) |
| Stockage | `word_translations(word_id, language, source_id, is_validated)` ; `lemma_translations(lemma_id, language, source_id, is_validated)` |
| Sélection | `resolveWordMeanings` : FORME > LEMME > EN (une seule valeur) |
| isFallback déterminé comment ? | `resolveWordMeaning` marque `isFallback=true` dès que la langue résolue ≠ `fr` (i.e. repli EN) |
| Anglais devient fallback quand ? | quand ni FORME ni LEMME validées ne sont disponibles |
| Hamidullah = source implicite ? | **NON.** `translations` (rid 31) n'entre jamais dans `resolveWordMeanings` |

**Lecture du code vérifiée :** les seuls lecteurs de `translations` sont
`lib/quran/provider.ts` (fournisseur de traduction d'ayah), `getWordAyahContexts`
(contexte), `getLessonAyahContext` (contexte), `getWordOccurrencesPage` (contexte
d'occurrence). Aucun n'alimente une glose de mot.

## 3. Origine exacte des 25 gloses de forme Al-Fātiḥah

Les gloses de Fātiḥah **ne sont pas produites par un pipeline runtime**. Elles
sont le résultat d'un **workflow éditorial** réparti sur plusieurs phases, avec
source `« Hikma — lexique éditorial »` et validation humaine (`is_validated`):

| Phase | Script / étape | Apport |
|---|---|---|
| 7 | `seed-word-translations.ts` | 8 PROPOSITIONS (`is_validated=false`) |
| 17C | `seed-lemma-translations.ts` | gloses Kazimirski 1860 (`is_validated=false`) |
| 19A | analyse multi-traductions (14 lemmes) | méthodologie + convergence FR (offline, evidence JSON) |
| 19E / 23E / 23F-D | validations + imports incrémentaux | 25 gloses de forme FR validées + 1 via lemme |
| 21B-F | `seed-priority-lemma-glosses.ts` | 4 gloses de lemme prioritaires validées (رَبّ, الله, الرَّحْمَـٰن, الْحَمْد) |

Chaque glose validée porte des `editorial_notes` qui **documentent** la
convergence multi-traductions (ex. رَبّ : Hamidullah « Seigneur », Kazimirski
« Seigneur / maître », Sahih « Lord », Piccardo « Signore » → « Seigneur / maître »).

**Conclusion §17** : la comparaison multi-traductions a bien eu lieu, mais
**hors-ligne**, une seule fois par lemme/forme, enregistrée dans les notes
éditoriales — jamais recalculée à l'exécution.

## 4. État des 4 pilotes (comparaison §18)

| Sourate | Formes | Occurrences | Gloses forme | Gloses lemme | Repli EN | Sans glose |
|---|---:|---:|---:|---:|---:|---:|
| 112 — Al-Ikhlāṣ | 13 | 15 | 0 | 1 | 12 | 0 |
| 113 — Al-Falaq | 17 | 23 | 0 | 1 | 16 | 0 |
| 114 — An-Nās | 17 | 20 | 0 | 2 | 15 | 0 |
| 108 — Al-Kawthar | 10 | 10 | 0 | 0 | 10 | 0 |
| **Total** | **57** | **68** | **0** | **4** | **53** | **0** |

Les 4 gloses de lemme présentes (héritées de Phase 19A) :

| Sourate | Forme | Lemme | Glose actuelle |
|---|---|---|---|
| 112 | ٱللَّهُ | الله | « Allah » |
| 113 | فِى | فِي | « dans / en / sur » |
| 114 | فِى | فِي | « dans / en / sur » |
| 114 | ٱلنَّاسِ | نَاس | « gens / hommes » |

Les 53 autres formes replient sur `quran_words.meaning` (EN, `isFallback=true`).

## 5. Tableau central (échantillon — 57 lignes complètes dans le JSON)

| Sourate | Forme arabe | Lemma | Occ. | Hamidullah | Kazimirski | Sahih | Piccardo | Glose actuelle | Source actuelle | Glose justifiée |
|---|---|---|---:|---|---|---|---|---|---|---|
| 112 | قُلْ | — | 1 | « Dis : Il est Allah, Unique » | « Dis : Dieu est un » | « Say, He is Allāh… » | « Di' : Egli Allah è Unico » | (EN) « Say » | EN fallback | NULL |
| 112 | هُوَ | — | 1 | (même ayah) | (même ayah) | (même ayah) | (même ayah) | (EN) « He » | EN fallback | NULL |
| 112 | أَحَدٌ | — | 1 | (même ayah) | (même ayah) | (même ayah) | (même ayah) | (EN) « One » | EN fallback | NULL |
| 112 | ٱللَّهُ | الله | 1 | (même ayah) | (même ayah) | (même ayah) | (même ayah) | **« Allah »** | lemma_translation (validée) | NULL |
| 112 | وَلَمْ | — | 1 | « Et nul n'est égal à Lui » | « Il n'a point d'égal… » | « Nor is there… » | « e nessuno è uguale… » | (EN) « and not » | EN fallback | NULL |

> **« Glose justifiée » = NULL** pour toutes les formes : cette phase est un
> AUDIT READ_ONLY ; produire une glose serait un acte éditorial hors périmètre
> (§21). Les traductions d'ayah ci-dessus sont des **évidences**, jamais des
> gloses de mot.

## 6. Réponses aux six questions (§20)

**QUESTION 1 — Les gloses des pilotes proviennent-elles d'une analyse
multi-traductions ?** — **NON.** 0 glose de forme ; 4 gloses de lemme héritées
des 14 lemmes Phase 19A ; 53 replis EN. Aucune analyse multi-traductions n'a été
exécutée sur les mots pilotes.

**QUESTION 2 — Hamidullah est-il utilisé comme source automatique de gloses ?**
— **NON.** La table `translations` (dont Hamidullah) n'entre jamais dans
`resolveWordMeanings` ; elle n'alimente que le contexte de verset. Vérifié dans
le code (`lib/learning/queries.ts`, `lib/learning/language.ts`).

**QUESTION 3 — Le pipeline compare-t-il réellement Hamidullah + Kazimirski ?**
— **PAS à l'exécution.** La comparaison FR a eu lieu **hors-ligne** (Phase 19A),
une fois, et son résultat est enregistré dans `editorial_notes` des gloses
validées. Il n'existe **aucun** code runtime qui compare les traductions pour
dériver une glose.

**QUESTION 4 — Les sources EN et IT servent-elles de contrôle ?** — **PAS à
l'exécution.** Sahih (EN) est le texte de repli `quran_words.meaning`
(`isFallback=true`), pas un « contrôle ». Piccardo (IT) est présent dans
`translations` mais jamais lu pour une glose. Le « contrôle » EN/IT n'existe que
dans l'analyse éditoriale hors-ligne Phase 19A.

**QUESTION 5 — La glose finale est-elle dérivée du mot arabe ou d'une traduction
d'ayah ?** — Pour les gloses validées : du **mot/lemme arabe**, via l'analyse
éditoriale hors-ligne, stockée dans `word_translations`/`lemma_translations`.
Jamais extraite automatiquement d'une traduction d'ayah. Pour les pilotes sans
glose éditoriale : la valeur affichée est `quran_words.meaning` (glose
word-by-word **anglaise** stockée au niveau du mot), pas une traduction d'ayah.

**QUESTION 6 — Pourquoi Phase 21B rapporte « gloses FR de forme = 0 » alors que
les traductions existent ?** — Parce que **glose de mot ≠ traduction de verset** :
les gloses vivent dans `word_translations`/`lemma_translations` (validées
éditorialement), tandis que les 4 traductions vivent dans `translations`
(niveau ayah). Les pilotes disposent bien des 4 traductions d'ayah (12/16/20/24
lignes), mais d'**aucune** glose éditoriale FR de mot. Le repli EN est le
comportement **correct** (aucune glose inventée, aucune traduction d'ayah
détournée en glose).

## 7. Décision

```
C — DATA_INSUFFICIENT

STATUS = READ_ONLY
DATABASE_WRITES = 0
CODE_WRITES = 0
IMPORTS = 0
MIGRATIONS = 0
SEEDS = 0
VALIDATIONS = 0
```

L'architecture est **correcte** : le système ne détourne aucune source (pas de
raccourci « Hamidullah → glose »), et distingue strictement traduction d'ayah et
glose de mot. Le problème est **donnée** : les 53 mots pilotes n'ont pas encore
reçu de glose FR éditoriale (analyse multi-traductions + validation humaine), et
le système les laisse donc honnêtement en repli EN.

## 8. Recommandation

Appliquer aux 53 mots pilotes sans glose FR le **workflow éditorial existant**
(Phase 19A : analyser les 4 traductions alignées par `ayah_id` ; formuler une
glose courte et traçable ; valider humainement ; importer dans
`word_translations`/`lemma_translations`). **Ne pas** construire de pipeline
runtime qui dériverait automatiquement une glose depuis une traduction d'ayah
(interdit §4 et §25).

La prochaine phase (décision éditoriale des gloses pilotes) ne sera engagée
qu'après lecture de ce rapport.

---

**Livrables**

- 📄 `PHASE_21C_MULTI_TRANSLATION_LEXICAL_AUDIT.md`
- 📄 `tmp/phase21c-multi-translation-lexical-audit.json` (57 formes · 57 évidences · 57 analyses)
- 📄 `tmp/phase21c-evidence.json` (évidences brutes alignées par ayah)
