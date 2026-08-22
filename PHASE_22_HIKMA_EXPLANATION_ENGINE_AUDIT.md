# PHASE 22 — HIKMA EXPLANATION ENGINE & LINGUISTIC DATA AUDIT

STATUS = READ_ONLY
DATABASE_WRITES = 0
CODE_WRITES = 0
IMPORTS = 0
MIGRATIONS = 0
SEEDS = 0
VALIDATIONS = 0

## 1. Executive Summary

Le système d'explication post-erreur **fonctionne** et reste strictement
honnête : il affiche uniquement des données réellement disponibles (glose,
lemme, contexte, audio) et annonce explicitement « explication indisponible »
sans rien inventer.

L'audit établit que les **Niveaux 1–3** du modèle cible (sens, contexte,
identité lexicale) sont **déjà couverts partiellement ou totalement**, mais
que les **Niveaux 4–6** (décomposition, grammaire, famille lexicale) sont
**bloqués par l'absence de données linguistiques** : `root = 0`, aucune table
de morphologie/POS, aucune segmentation structurée.

Transformer « mot → traduction » en « mot → compréhension → structure →
contexte → connexions » ne nécessite **pas une refonte de l'architecture**,
mais **l'acquisition d'une source morphologique/racine légitime**.

Décision : **B — LINGUISTIC_DATA_SOURCE_REQUIRED**.

## 2. Le système existant (audit)

| Composant | Rôle |
|---|---|
| `components/ui/hikma-explanation.tsx` | Primitive de présentation (disclosure « Comprendre pourquoi ») |
| `components/learn/exercises/pedagogical-feedback.ts` | Construit `HikmaExplanationData` depuis les métadonnées d'exercice |
| `components/ui/exercise.tsx` | `ExerciseFeedback` → `HikmaExplanation` après erreur |
| `lib/learning/language.ts` | `resolveWordMeanings` (FORME > LEMME > EN) |
| `lib/learning/lesson.ts` | `buildWordBank` (glose résolue par mot) |
| `lib/exercises/engine.ts` | `generateExercise` / `validateAnswer` |
| `lib/exercises/generators/lemma.ts` | `LEMMA_RELATION` |

`HikmaExplanation` est une **primitive de présentation** : elle ne connaît ni
le grading, ni le SRS, ni la réponse utilisateur. Elle affiche un badge de
disponibilité (`verified` / `partial` / `unavailable`) et les champs présents.

## 3. Données disponibles / transmises / affichées / perdues / non disponibles

| Donnée | Disponible ? | Affichée ? |
|---|---|---|
| Forme arabe + translittération | ✅ (21 296/21 296) | ✅ |
| Glose FORME/LEMME FR validée | ✅ (70 + 28) | ✅ (Sens) |
| Glose de lemme | ✅ (si lemme) | ✅ (Repère de la même famille) |
| Relation forme → lemme | ✅ (135 directs + 184 mapping safe) | ✅ (note famille) |
| Contexte du verset (arabe + FR Hamidullah) | ✅ | ✅ |
| Audio Muʿallim | ✅ | ✅ |
| Indices phonétiques | ✅ (exercices prononciation) | ✅ |
| **Racine** | ❌ (0) | ❌ |
| **Morphologie (POS, cas, genre, nombre, temps…)** | ❌ (aucune table) | ❌ |
| **Segmentation (proclitique/stem/suffixe)** | ❌ (aucune structure) | ❌ |
| **Sens contextuel par occurrence** | ❌ (glose globale, pas par ayah) | ❌ |

**Données perdues / non transmises** : le compteur d'occurrences globales
(`word_occurrences`), les autres sourates du mot, et le sens dans *ce* verset
spécifique ne sont pas câblés dans l'explication — alors qu'ils sont
interrogeables.

## 4. Modèle pédagogique cible (7 niveaux) — faisabilité

| Niveau | Statut | Données nécessaires |
|---|---|---|
| 1 — SENS | ✅ DISPONIBLE | glose + audio (déjà là) |
| 2 — CONTEXTE | 🟡 PARTIEL | ayah + traduction FR (déjà là) ; manque « sens du mot dans ce verset » |
| 3 — IDENTITÉ LEXICALE | 🟡 PARTIEL | forme + lemme (sparse) + occurrences (queryable, non affiché) |
| 4 — DÉCOMPOSITION | ❌ UNAVAILABLE | segmentation structurée (absente) |
| 5 — GRAMMAIRE | ❌ UNAVAILABLE | POS / cas / nombre / genre / temps / mode / personne (absents) |
| 6 — FAMILLE LEXICALE | ❌ UNAVAILABLE | racine (absente) ; siblings de lemme partiels |
| 7 — CONNEXIONS CORANIQUES | 🟡 PARTIEL | occurrences + autres formes du même lemme (queryable, non affiché) |

## 5. Règle absolue — aucune invention

- Jamais générer une racine parce qu'elle « semble évidente ».
- Jamais d'analyse morphologique manuelle, de segmentation, d'étymologie.
- Jamais présenter une hypothèse linguistique comme un fait.
- Donnée absente → `ABSENT_DATA` / `UNAVAILABLE`, non affichée.
- ROOT = FUTURE WORK ; MORPHOLOGY = FUTURE WORK.

## 6. Décomposition des mots (état réel)

La segmentation word-by-word de Quran.com **fusionne proclitiques et
enclitiques** en unités « mot » distinctes (`و، ف، ب، ل، ال` + suffixes
pronominaux). Le corpus ne fournit **aucune segmentation structurée** :

- `quran_words.normalized_text` = 0 (non renseigné) ;
- `word_occurrences.normalized_text` = 0 ;
- aucune colonne préfixe/stem/suffixe ;
- la seule « décomposition » disponible est **textuelle** : le champ
  `word_lemma_mapping.evidence` (note éditoriale humaine, ex. « و + ال + ناس »).

## 7. Cas لِلَّه / ٱللَّهِ

Forme réelle Fātiḥah : `ٱللَّهِ` (translit. `l-lahi`, EN `(of) Allah`),
avec **`lemma_id` direct → الله**. Le système distingue donc l'identité
lexicale (الله) de la forme de surface, **mais** ne décompose pas le
proclitique لِ/ل comme unité grammaticale : c'est un `quran_word` unique.
Enseigner « لِ = à / de » exige une source de segmentation (FUTURE WORK).

## 8. Cas وَٱلنَّاسِ

Forme `وَٱلنَّاسِ`, `lemma_id = null` (pas de lemme natif), reliée au lemme
نَاس via `word_lemma_mapping` (méthode `editorial`, evidence « و + ال + ناس »).
La glose « gens / hommes » est résolue par le lemme. La décomposition
و + ال + ناس n'existe que comme **texte éditorial**, pas comme données
structurées exploitables par l'UI.

## 9. Cas يَكُن

Glose validée « être », `lemma_id = null`, 24 occurrences, valeur
copule/existentielle selon le contexte (`لَمْ` négation, `إِن` conditionnel,
`فَلَا` impératif négatif, apodose). Aucune morphologie structurée. Expliquer
*pourquoi* « être » se rend différemment selon le contexte exige une couche
morphologique (MORPHOLOGY_UNAVAILABLE) — c'est aujourd'hui un simple gloss.

## 10. Explication contextuelle (4 traductions)

Les 4 traductions (Hamidullah 31, Kazimirski 9001, Sahih 20, Piccardo 153)
servent de **contexte**, jamais de glose. Une future explication pourrait
dire « dans ce verset, le mot prend tel sens… » **uniquement** à partir de
données vérifiées. Aujourd'hui l'explication affiche la traduction FR du
verset complet, sans isoler la valeur du mot dans le verset.

## 11. Explication après erreur (flux)

```
USER ANSWER → GRADING (validateAnswer) → INCORRECT
→ PEDAGOGICAL FEEDBACK (pedagogicalExplanation)
→ HikmaExplanation (données de metadata)
```

Les métadonnées disponibles au moment de l'erreur (posées par la page leçon) :
`meaning`, `lemmaMeaning`, `meaningValidated`, `context`, `lemma`,
`audioUrl`, `phoneticTrait/Hints`, `revealContent`/`expectedArabic`.
Le verdict d'erreur porte la **bonne réponse** (`explanation`), mais pas un
**diagnostic** du type d'erreur.

## 12. Variabilité des explications (10 catégories)

| Catégorie | Données utiles (disponibles ?) |
|---|---|
| A — mauvaise traduction | glose (✅) |
| B — réponse incomplète | variantes acceptées (✅) |
| C — mauvaise forme arabe | forme + translittération (✅) |
| D — confusion entre deux mots | forme vs sens des deux (✅ partiel) |
| E — confusion forme/lemme | lemme + siblings (✅ partiel) |
| F — confusion grammaticale | POS/cas (❌) |
| G — mot oublié | SRS (✅, hors explication) |
| H — erreur de contexte | contexte du verset (✅) |
| I — reconnaissance | audio + forme (✅) |
| J — production | formes attendues (✅) |

Les catégories A, B, C, H, I, J sont **explicables aujourd'hui** ; F (et
partiellement E) exige la morphologie. Aucun diagnostic d'erreur n'est
actuellement calculé.

## 13. Explication adaptative

Le système ne diagnostique pas *pourquoi* la réponse est fausse. Un modèle
`ERREUR → diagnostic → explication adaptée` est **faisable sans nouvelle
donnée** pour les catégories lexicales (A/B/C/D/H/I/J), en comparant la
réponse utilisateur aux métadonnées déjà présentes. Il ne l'est **pas** pour
les catégories grammaticales (F) sans morphologie.

## 14. Familles de mots

Arbre `racine → lemme → formes → occurrences` : **non réalisable** sans
racines. La brique `lemme → formes → occurrences` est déjà **partiellement**
réalisée (`getWordLemmaRelations` fournit les siblings d'un lemme).

## 15. Sources linguistiques (audit documentaire)

| Source | Données | Licence | Statut Hikma |
|---|---|---|---|
| QuranMorph (2025) | lemma + POS (44 tags), 77 429 tokens | CC BY 4.0 | exclu (pas de racines) |
| Qabas | racines (compagnon QuranMorph) | CC-BY-ND-4.0 | exclu (ND + provenance SAMA/LDC incertaine) |
| Quranic Arabic Corpus (corpus.quran.com) | morphologie + syntaxe | non-commercial | exclu |
| QAMAR (2026) | MSA + stem + lemma + **root** + POS | non audité | candidat futur |
| Kazimirski 1860/1869 | racines lexicographiques | domaine public | partiellement scanné (16M/16L) |

## 16. QuranMorph

- **Provenance** : corpus annoté (Akra-Hammouda et al., 2025), 77 429 tokens
  (≈ les 77 430 occurrences Hikma), lemmatisation + POS par 3 linguistes.
- **Données** : lemme + POS (44 tags) — **pas de racine**.
- **Licence** : CC BY 4.0 (commerciale compatible, attribution requise).
- **Contraintes identifiées (Phases 11–12B, 16B)** : pas de racines ; le
  compagnon racines Qabas est CC-BY-ND-4.0 avec provenance incertaine →
  **exclu**. L'alignement token↔occurrence Hikma reste à prouver (77 429 vs
  77 430).
- **Compatibilité** : la licence n'est pas un blocker ; le manque de racines
  et l'alignement le sont. Ne pas importer en production sans phase dédiée.

## 17. Explications riches mais courtes (structure progressive)

Proposition de disclosure à approfondissement volontaire :

```
Essentiel (glose + audio)
→ Comprendre (contexte)
→ Décomposer (si segmentation disponible)
→ En savoir plus (occurrences, famille — si données)
```

Aucune donnée ne doit être affichée à un niveau sans la donnée réelle.

## 18. Audio

Audio Muʿallim reste lié au `word_id` réel (une URL signée par forme). Aucun
nouvel audio. Position recommandée : niveau « Essentiel ».

## 19. Recherche coranique

« Tu retrouveras ce mot ailleurs dans le Coran » est **interrogeable
aujourd'hui** (`word_occurrences` → sourates/ayahs, count). Non câblé dans
l'UI d'explication. Aucune donnée nouvelle requise.

## 20. Connexion avec le SRS

Une erreur récurrente pourrait cibler l'explication (ex. confusion رَبّ /
رَسُول). Le SRS (`user_word_skill_progress`, `review_items`) porte déjà les
signaux de récurrence. Ne pas modifier SRS/scoring/mastery : c'est une
amélioration de présentation future, pas un changement de moteur.

## 21. Al-Fātiḥah comme laboratoire

Types de mots observables dans les 26 formes Fātiḥah (pour calibrer le futur) :

- **nom** : رَبّ, يَوْم, صِرَٰط ;
- **verbe fléchi** : نَعْبُدُ, نَسْتَعِينُ ;
- **particule** : فِي, لَا, غَيْر ;
- **forme avec proclitique fusionné** : ٱللَّهِ, بِرَبِّ ;
- **forme reliée à un lemme** : يَوْمِ → يَوْم (couverture lemme) ;
- **forme sans lemme** : cas rares (repli EN).

Ces cas montrent que le laboratoire couvre déjà la diversité nécessaire pour
tester une explication enrichie **dès que** les données manquantes existent.

## 22. Proposition UX (non implémentée)

```
❌ Pas cette fois

يَوْمِ  —  « jour »

Pourquoi ?

[Décomposer le mot]  [Voir le contexte]  [Écouter]  [Voir d'autres occurrences]
```

Simple proposition : l'UI actuelle de `HikmaExplanation` accueille déjà ces
champs optionnels ; il s'agirait d'ajouter les sections au fur et à mesure
des données, sans refonte.

## 23. Réponses aux 16 critères de succès

1. **Que sait faire HikmaExplanation ?** Afficher glose + lemme + contexte + audio après erreur, honnêtement.
2. **Que ne sait-il pas faire ?** Décomposer, expliquer la grammaire, la racine, le sens contextuel, diagnostiquer l'erreur.
3. **Pourquoi générique ?** Il ne possède que la glose + contexte : il répète la bonne réponse, sans structure linguistique.
4. **Quelles données manquent ?** Racine, morphologie (POS/cas/…), segmentation, sens contextuel.
5. **Comment les obtenir légalement ?** Source CC BY 4.0 avec racines (ex. QAMAR à auditer) ou Kazimirski (domaine public) ; jamais par déduction.
6. **Comment décomposer les mots ?** Source de segmentation fiable, alignée par token sur `word_occurrences`.
7. **Comment gérer les racines ?** Peupler la colonne `root` (déjà présente) depuis une source légitime, jamais par inférence.
8. **Comment gérer la morphologie ?** Table additive POS/features, alimentée par une source validée.
9. **Comment expliquer les particules ?** Fonction grammaticale (nécessite POS/segmentation).
10. **Comment expliquer les formes fléchies ?** Lemme + features (nécessite morphologie).
11. **Comment expliquer le contexte ?** Déjà partiel (verset) ; enrichir avec le sens-du-mot-dans-ce-verset.
12. **Comment varier selon l'erreur ?** Diagnostic d'erreur (faisable pour les catégories lexicales sans nouvelle donnée).
13. **Comment éviter les hallucinations ?** Garde-fous actuels : n'afficher que du stocké, `ABSENT_DATA` sinon.
14. **Comment intégrer progressivement ?** Champs optionnels de `HikmaExplanation`, niveau par niveau.
15. **Modèle de données recommandé ?** Table additive morphologie + peuplement `root`, sans refonte.
16. **Prochaine phase ?** Audit + validation d'une source morphologique/racine légitime, puis import contrôlé.

## 24. Modèle de données recommandé

- **Maintenant** : rien de nouveau (word_lemma_mapping + gloses suffisent pour les niveaux 1–3).
- **Morphologie** : table additive (token → affixes/POS/features), si une source fiable est validée (proposition « C » de Phase 21B-B, différée).
- **Racines** : peupler `quran_words.root` / `lemmas.root` depuis une source légitime.

## 25. Prochaine phase recommandée

Phase dédiée **READ_ONLY** : auditer QAMAR et toute source morphologique/racine
commercialement compatible, vérifier l'alignement token ↔ `word_occurrences`,
puis planifier un import contrôlé racine/segmentation/POS selon le standard
lexical Phase 22 (revue humaine, idempotence, non-régression Fātiḥah).

## 26. Décision

**B — LINGUISTIC_DATA_SOURCE_REQUIRED**

L'architecture d'explication est prête (champs optionnels, garde-fous
anti-invention) ; ce qui manque pour passer des niveaux 1–3 aux niveaux 4–6
est une **source de données linguistiques** (racine + morphologie +
segmentation) légitime et alignée — non une refonte.

---

DATABASE_WRITES = 0
CODE_WRITES = 0
IMPORTS = 0
MIGRATIONS = 0
SEEDS = 0
VALIDATIONS = 0

FATIHAH_REFERENCE_LOCKED = PRESERVED
grading / scoring / SRS / mastery / progression / curriculum = PRESERVED

FIN PHASE 22
