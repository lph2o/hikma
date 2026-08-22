# PHASE 44A — AUDIT + CONCEPTION DE LA COUCHE D'EXPLICATIONS PÉDAGOGIQUES HIKMA

Statut : **`PHASE_44A_READY_FOR_EDITORIAL_DESIGN`**

Nature : **READ-ONLY — audit + design uniquement. Aucune écriture DB, aucun fichier produit modifié.**

---

## A. Executive Summary

Hikma dispose **déjà d'une couche d'explication partielle** : l'explication « Comprendre ce mot » (`HikmaExplanation`) combine la glose FR validée, la décomposition MASAQ normalisée, la catégorie grammaticale, la morphologie, la syntaxe, le repère de famille (lemme), le contexte du verset et l'audio. **Ce qui manque n'est pas le conteneur : c'est la couche « EXPLICATION PÉDAGOGIQUE DE SENS »** — le niveau C/D du brief (sens réel + adaptation contextuelle), distinct de la glose lexicale (A) et de l'information linguistique MASAQ (B).

**Chiffres clés (DB réelle, revérifiés) :**

| Métrique | Valeur |
|---|---:|
| Catalogue | 18 sourates (1 REFERENCE · 16 READY · 1 IN_PREPARATION = 107) |
| Formes distinctes du catalogue | **330** |
| Formes avec FR validé | **322** (97,6 %) |
| Formes EN-only restantes | **8** |
| Formes couvertes par MASAQ | **311** (94,2 %) |
| Formes avec clitiques (MASAQ) | **234** |
| Formes grammaticales/fonctionnelles | **135** |
| `word_translations` FR validées | 335 |
| `lemma_translations` FR validées | **28** (de 32 lemmas) |
| Lemmas directs + mappés (safe) | 135 direct + 184 mappés |

**Recommandation centrale** : stocker l'explication pédagogique de sens à la granularité **FORME** (`word_explanations`) avec un **override contextuel optionnel** (`word_explanation_contexts`), en capitalisant sur le modèle existant (FORME > LEMME > EN) et en réutilisant la phrase-type « Comprendre ce mot ». Les lemmes (32 seulement) ne couvrent pas suffisamment les formes du catalogue pour être la clé primaire ; MASAQ reste un **enrichissement passif** (jamais une autorité de sens).

**Verdict** : `PHASE_44A_READY_FOR_EDITORIAL_DESIGN` — aucun blocage structurel. La Phase 44B (création des tables + rédaction éditoriale pilote) est recommandée mais **non lancée automatiquement**.

---

## B. État réel des données

Vérifié par requêtes réelles (snapshot `tmp/phase44a-state.json`) :

| Table | Valeur |
|---|---:|
| quran_words | 21 296 |
| word_occurrences | 77 430 |
| ayahs | 6 236 |
| translations | 24 944 |
| word_translations (FR validées) | 335 |
| lemma_translations (FR validées) | 28 |
| lemmas | 32 |
| word_lemma_mapping (safe) | 184 |
| sources | 6 |
| linguistic_occurrences | 413 |
| linguistic_segments | 796 |
| linguistic_lemmas / roots | 0 / 0 |

**Catalogue réel** (`getSurahCatalog`, code produit) :

| Sourate | État | Leçons | Formes | FR effectif |
|---:|---|---:|---:|---:|
| 1 Al-Fātiḥah | REFERENCE | 8 | 26 | 26/26 (100 %) |
| 93 Ad-Duhaa | READY | 11 | 36 | 100 % |
| 94 Ash-Sharh | READY | 8 | 24 | 100 % |
| 97 Al-Qadr | READY | 5 | 27 | 100 % |
| 101 Al-Qāriʿah | READY | 11 | 29 | 100 % |
| 102 At-Takathur | READY | 8 | 20 | 100 % |
| 103 Al-ʿAṣr | READY | 3 | 13 | 100 % |
| 104 Al-Humazah | READY | 9 | 32 | 100 % |
| 105 Al-Fil | READY | 5 | 22 | 100 % |
| 106 Quraysh | READY | 4 | 17 | 100 % |
| **107 Al-Maʿūn** | **IN_PREPARATION** | 7 | 23 | **22/23 (96 %)** |
| 108 Al-Kawthar | READY | 3 | 10 | 100 % |
| 109 Al-Kāfirūn | READY | 6 | 19 | 100 % |
| 110 An-Naṣr | READY | 3 | 18 | 100 % |
| 111 Al-Masad | READY | 5 | 22 | 100 % |
| 112 Al-Ikhlāṣ | READY | 4 | 13 | 100 % |
| 113 Al-Falaq | READY | 5 | 17 | 100 % |
| 114 An-Nās | READY | 6 | 17 | 100 % |

*Note : 107 possède un parcours et 96 % FR mais n'est pas READY (une forme EN-only).*

---

## C. Nombre exact de formes / lemmes / occurrences concernés

- **330 formes distinctes** dans les 18 parcours (somme des formes par sourate = 404 en comptant les partages, 330 en UNION).
- **29 249 occurrences** dans ces sourates (somme par sourate ; les formes partagées comptées par sourate).
- **32 lemmas** ; **135** formes ont un `lemma_id` direct, **184** un mapping `safe` (`word_lemma_mapping`) — chevauchement partiel.
- **8 formes EN-only** dans le catalogue (dont celle qui bloque 107).

## D. Couverture actuelle des gloses

- **322/330 formes** résolues en FR validé (FORME 322 dont certaines via LEMME) — le resolver `resolveWordMeanings` applique FORME → LEMME → fallback EN (documenté Phase 17C).
- 8 EN-only restent (forme enseignée sans glose FR ni lemme FR validé).
- 335 lignes `word_translations` FR validées (source « Hikma — lexique éditorial »).
- 28 lignes `lemma_translations` FR validées.

## E. Couverture MASAQ

- **311/330 formes** (94,2 %) du catalogue ont au moins une occurrence analysée MASAQ ;
- **234 formes** ont au moins un clitique (segment non-Stem : préfixe/suffixe) ;
- la couverture MASAQ couvre **17 sourates sur 18** (107 non couverte) + Al-Fātiḥah ;
- POS/cas/mod 100 % · syntaxe 91,8 % · racines/schèmes 0 (FUTURE_WORK).

---

## F. Classification pédagogique des formes

Classification READ-ONLY calculée depuis la DB (`tmp/phase44a-explanation-classification.csv`, 330 lignes) :

| Catégorie | Formes | Exemples réels |
|---|---:|---|
| **A — SIMPLE LEXICAL** | 57 | مَـٰلِكِ, صِرَٰطَ, رَبِّ, سَجَىٰ, قَلَىٰ |
| **B — MULTICONTEXTE** (plusieurs sourates) | 10 | ٱلَّذِينَ, ٱلَّذِىٓ, إِنَّ, مِّن |
| **C — GRAMMATICAL / FONCTIONNEL** | 135 | مَا, مَن, فِى, وَلَا, أَنْعَمْتَ (verbe+clitique) |
| **D — CLITIQUE** (≥1 segment non-Stem) | 128 | يَوْمِ, ٱلدِّينِ, نَعْبُدُ, فَأُمُّهُۥ, مَوَٰزِينُهُۥ |

*La catégorisation D inclut les désinences casuelles (suffixes flexionnels) que MASAQ segmente — à distinguer des vrais clitiques prépositionnels/pronominaux au moment de la rédaction.*

Règle de valeur pédagogique (H) : pour les formes de catégorie A dont la glose est mono-sémantique et stable, **l'explication n'apporte pas de valeur** → aucune à écrire (économie : ~40 formes sur 57 ; les 17 restantes nécessitent un arbitrage éditorial fin).

---

## G. Cas nécessitant une explication

1. **Idiomatiques / contextuels** : فَأُمُّهُۥ (« sa mère » = demeure en 101:9), هَاوِيَة (nom de l'Enfer), ٱلْقَارِعَةُ (épithète du Jour).
2. **Polysémiques** : ٱلْقَدْرِ (destin/décret/puissance — arbitré en 41B), نَار (feu, contexte 101 vs 111).
3. **Noms propres / termes spécifiques** : لَهَب (Abū Lahab), مَّسَد.
4. **Duels / marques rares** : يَدَا (les deux mains), مَوَٰزِينُهُۥ (ses balances).
5. **Verbes contextuels** : أَنزَلْنَـٰهُ, تَبَّتْ, خَفَّتْ, ثَقُلَتْ, يَكُونُ, وَتَكُونُ.
6. **Pronoms relatifs doublés** : مَن / مَنْ (2 word_id distincts, même glose).

## H. Cas où la glose suffit

- Formes mono-sémantiques stables (ex. جِبَال → montagnes) dont la glose couvre le noyau ;
- formes déjà couvertes par un bloc linguistique MASAQ informatif (décomposition) ;
- mots grammaticaux transparents (فِى, عَلَى) : la glose + contexte du verset suffisent.

**Principe : jamais d'explication artificielle.** On écrit uniquement quand la glose laisse une ambiguïté réelle ou quand le contexte change le sens perçu.

---

## I. Analyse forme vs lemme

Cas mesurés :

| Forme | Occurrences | FR forme | FR lemme | MASAQ | Constat |
|---|---|---|---:|---:|---|
| نَارٌ (101:11) | 1 | un feu | — | 1 | FR forme existe |
| نَارًا (18:29…) | 3 | **absent** | — | 0 | même lexème, FR manque |
| مَن | 223 | celui qui | — | 1 | FR forme existe |
| مَنْ | 72 | celui qui | — | 1 | **forme distincte, même glose** |
| يَدَا (111:1) | 1 | les deux mains | — | 1 | duel → glose précise |

**Constat** : le lemme ne peut pas être la clé primaire (32 lemmas seulement ; 135 formes directes + 184 mappées). Mais les **patterns de réutilisation** sont réels : نَارٌ / نَارًا / نَارٍ partagent un noyau sémantique, مَن / مَنْ aussi. → **l'explication générique se mutualise au niveau LEMME/FAMILLE quand un mapping sûr existe ; sinon FORME** (décision M).

---

## J. Analyse générique vs contextuelle

Le modèle doit supporter : **explication générique réutilisable + override contextuel optionnel**.

| Forme | Explication générique | Besoin contextuel |
|---|---|---|
| نَار | « un feu » | 101:11 (feu de l'Enfer, pas un feu ordinaire) → nuance |
| ٱلْقَدْرِ | « destin / destinée » | 97 — nuit du décret → suffisante (glose déjà contextualisée) |
| فَأُمُّهُۥ | — | 101:9 — « sa mère » trompeur → **override obligatoire** |
| هَاوِيَة | « l'abîme » | 101:9 — Al-Hāwiya = nom de l'Enfer → note utile |
| مَن / مَنْ | « celui qui / quiconque » | aucun (stable) |

**Forme de la règle** : l'UI affiche l'explication générique par défaut ; si un override contextuel (surah+ayah) existe pour l'occurrence rencontrée, il remplace (avec mention « dans ce verset »). Aucune logique d'inférence : l'override est une donnée éditoriale explicite.

---

## K. Analyse de la contribution MASAQ

Ce que MASAQ apporte **déjà** (couche passive, `lib/linguistic/explanation.ts`) : décomposition pédagogique (clitiques), catégorie du noyau, cas/mode, rôle syntaxique — **déjà affiché** dans « Comprendre ce mot ».

Ce que MASAQ **n'apporte pas** : racines, schèmes (FUTURE_WORK), et surtout **aucune autorité de sens** (gloss EN MASAQ = evidence, jamais glose FR).

**Règle pour la 44B** : la couche d'explication pédagogique de sens **ne dépend pas de MASAQ** — elle s'écrit sur les formes réelles (word_id) et n'utilise MASAQ que pour *informer* la rédaction (composition, catégorie), jamais pour la générer automatiquement. Pas de transformation de Hikma en cours de morphologie.

---

## L. Trois propositions de modèle de données

*(Design uniquement — aucune table créée.)*

### Option A — `word_explanations` (FORME)

- 1 ligne par forme (`word_id`) + langue `fr` + `text` + source + statut.
- Avantages : simple, aligné sur le resolver FORME > LEMME, pas de mapping.
- Inconvénients : duplication possible (نَارٌ / نَارًا), pas de niveau contextuel intégré.
- Cardinalité : 1 générique par forme + 0..N contextuels (colonne ou table dédiée).

### Option B — `lemma_explanations` + `word_explanation_overrides`

- Explication au LEMME (mutualisation) + override FORME + override CONTEXTE.
- Avantages : réutilisation maximale ; les 32 lemmas + mapping safe couvrent une grande part du catalogue.
- Inconvénients : couverture lemme incomplète (dépend du mapping sûr) ; deux-trois tables.

### Option C — `pedagogical_explanations` + `pedagogical_explanation_contexts`

- Clef sémantique (stem MASAQ / famille) + contextes (surah, ayah) séparés.
- Avantages : prêt pour polysémie/idiomes, aligné MASAQ.
- Inconvénients : dépend de la stabilité du stem ; plus lourd à auditer ; MASAQ non nécessaire pour le sens.

## M. Recommandation finale

**Option B simplifiée, adaptée au modèle existant :**

> **`word_explanations`** (FORME — clé `(word_id, language)` unique, `text`, `source_id`, `is_validated`, `validated_at`, `editorial_notes`) **+ `word_explanation_contexts`** (override optionnel — clé `(word_id, surah_number, ayah_number)`, texte contextuel).

Justification :
1. **Le resolver existant est FORME-prioritaire** (FORME > LEMME > EN) — une couche FORME s'intègre sans nouvelle logique.
2. **La mutualisation par famille** se fait par la rédaction éditoriale (même texte pour نَارٌ/نَارًا) sans table de lemme supplémentaire, **ou** en réutilisant les `lemma_translations` existantes comme source de la rédaction.
3. **L'override contextuel** couvre exactement les cas sensibles (فَأُمُّهُۥ, هَاوِيَة, ٱلْقَارِعَةُ) sans polluer la glose générique.
4. **Métadonnées identiques à `word_translations`** : `source_id` (« Hikma — lexique éditorial »), `is_validated` (workflow proposed → validated), `editorial_notes` — **cohérence totale avec le modèle déjà validé en 40C/41B/42B**.
5. **Extensibilité langue** : colonne `language` (fr aujourd'hui) → extension future sans migration destructrice.

Rejet explicite : Option C (surcharge MASAQ inutile pour le sens), stockage au lemme comme clé primaire unique (couverture insuffisante), génération automatique (interdite).

---

## N. Cas tests détaillés (16 formes)

| # | Forme | Niveau lexical | Niveau linguistique (MASAQ) | Niveau pédagogique | Niveau contextuel | Mutualiser | Spécifique |
|---|---|---|---|---|---|---|---|
| 1 | نَارٌ | « un feu » | 1 segment (Stem) | glose suffit | 101:11 = feu de l'Enfer | avec نَارًا (famille نار) | nuance 101:11 |
| 2 | ٱلْقَدْرِ | « destin/destinée » | 2 segments (clitique) | expliquer décret/puissance | 97 — Nuit du décret | — | glose déjà contextuelle |
| 3 | فَأُمُّهُۥ | « sa mère » | 3 segs (ف+أم+ه) | **idiome : demeure/refuge** | 101:9 | — | **override obligatoire** |
| 4 | هَاوِيَةٌۭ | « l'abîme » | 4 segs | Al-Hāwiya = Enfer | 101:9 | — | note contextuelle |
| 5 | مَن | « celui qui » | 1 seg | relative | stable | avec مَنْ | aucune |
| 6 | مَنْ | « celui qui » | 1 seg | relative | stable | avec مَن | aucune |
| 7 | مَا | « ce que / ce qui » | 1 seg | relative indéterminée | stable | — | aucune |
| 8 | فِيهَا | « y / en elle » | 2 segs (في+ها) | clitique | stable | avec les فِي+pronom | aucune |
| 9 | كَٱلْفَرَاشِ | « comme les papillons » | 3 segs (كَ+ال+فراش) | comparaison | 101:4 | — | composition كَ |
| 10 | مَوَٰزِينُهُۥ | « ses balances » | 2 segs (نoyau+ـه) | possessif | 101:6/8 | — | suffixe ـهُ |
| 11 | أَنزَلْنَـٰهُ | « nous l'avons fait descendre » | 3 segs | révélation | 97:1 | — | verbe conjugué |
| 12 | لَهَبٍۢ | « Lahab » | 1 seg | nom propre (Abū Lahab) | 111:1/3 | — | nom propre |
| 13 | يَدَآ | « les deux mains » | 2 segs (duel) | duel | 111:1 | — | duel |
| 14 | مَّسَدٍۭ | « fibres (de palmier) » | 1 seg | objet réel | 111:5 | — | aucune |
| 15 | يَكُونُ | « sera » | 2 segs | verbe copule | 101:4 | avec وَتَكُونُ | aucune |
| 16 | وَتَكُونُ | « et seront » | 3 segs (وَ+تكون) | verbe + و | 101:5 | avec يَكُونُ | و |

*Toutes les 16 formes vérifiées dans la DB (word_id, occurrences, FR validé, MASAQ) — `tmp/phase44a-cases.json`.*

---

## O. Risques

1. **Duplication sémantique** : éviter d'écrire 3 explications pour نَارٌ/نَارًا/نَارٍ → rédaction par famille, contrôle éditorial.
2. **Override qui contredit la glose** : l'override contextuel doit **compléter**, jamais contredire la glose validée.
3. **Confusion editorial_notes vs pedagogical_explanation** : les notes éditoriales (40C/41B/42B) documentent l'éditeur ; l'explication est un texte apprenant — champs distincts.
4. **Inflation** : 330 formes → écrire uniquement les ~50-80 formes à valeur réelle, sinon coût éditorial hors de contrôle.
5. **MASAQ comme autorité de sens** : interdit — MASAQ informe, ne décide jamais.

## P. Non-régression

- **Aucune donnée DB modifiée** (vérifié : compteurs identiques avant/après la phase).
- **Aucun fichier de production modifié** (tsc ✅ · `git status` : aucune modification nouvelle).
- Aucun test modifié ; aucun curriculum/progression touché.
- Artefacts READ-ONLY : `tmp/phase44a-*.cjs` (SELECT uniquement), supprimables.

**Livrables** : `tmp/phase44a-state.json`, `tmp/phase44a-explanation-audit.json`, `tmp/phase44a-explanation-classification.csv` (330 lignes), `tmp/phase44a-explanation-candidates.csv` (330 lignes), `tmp/phase44a-schema-options.json`, `tmp/phase44a-cases.json` (16 cas tests).

---

## Q. Proposition de Phase 44B

1. **Migration additive** : `word_explanations` + `word_explanation_contexts` (source_id, is_validated, workflow proposed→validated — identique à `word_translations`).
2. **Pilote éditorial** : rédiger les explications des ~15 formes sensibles du catalogue (فَأُمُّهُۥ, هَاوِيَة, ٱلْقَارِعَةُ, يَدَا, مَّسَد, لَهَب, مَوَٰزِينُهُۥ, أَنزَلْنَـٰهُ, يَكُونُ/وَتَكُونُ, مَن/مَنْ, كَٱلْفَرَاشِ, ٱلْقَدْرِ, نَارٌ) via le workflow 4 traductions (Hamidullah + Kazimirski FR, Sahih EN + Piccardo IT contrôles).
3. **Intégration UI** : afficher l'explication dans `HikmaExplanation` (niveau « Sens ») quand `word_explanations` la fournit — sans toucher au resolver ni aux moteurs.
4. **Aucun moteur** : SRS, mastery, coverage, Daily Plan, onboarding, curriculum **inchangés**.
5. **Idempotence** : clé unique `(word_id, language)` + override `(word_id, surah, ayah)`.

---

## R. STOP explicite

**La Phase 44B n'est PAS lancée.** Aucune table créée, aucune explication écrite, aucun runtime modifié, MASAQ non connecté au produit. Le présent rapport décide de la direction ; l'implémentation fera l'objet d'une validation explicite.

---

## Réponses aux 10 questions du critère de succès

1. **Qu'est-ce qu'une explication pédagogique Hikma ?** Un texte court (1-3 phrases) répondant « que signifie ce mot ici et que retenir ? », distinct de la glose, des notes éditoriales et de l'analyse MASAQ.
2. **Quand en créer une ?** Quand la glose laisse une ambiguïté réelle (polysémie, idiome, contexte, nom propre, duel) — jamais pour les formes mono-sémantiques stables.
3. **À quel niveau ?** FORME (word_id), avec override contextuel (surah, ayah).
4. **Réutilisation ?** Par famille lexicale via la rédaction (نَارٌ/نَارًا) et par forme partagée (مَن/مَنْ) ; le lemme sert de source, pas de clé.
5. **Contextes différents ?** Override contextuel éditorial explicite.
6. **MASAQ ?** Infra passive : informe la rédaction (composition, catégorie), jamais affichée comme sens ni génératrice.
7. **Polysémie, idiomes, clitiques, grammaticaux ?** Override contextuel (idiomes/polysémie), glose + décomposition MASAQ existante (clitiques), aucune explication pour les particules pures.
8. **Structure DB recommandée ?** `word_explanations` + `word_explanation_contexts` (Option B simplifiée).
9. **Premiers mots ?** Les ~15 formes sensibles listées en Q.
10. **Éviter l'inflation ?** Seuil éditorial : on écrit uniquement quand la valeur pédagogique est démontrée (~50-80 formes max sur 330).
